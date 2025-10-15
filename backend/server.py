from fastapi import FastAPI, APIRouter, HTTPException, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import asyncio
from functools import lru_cache
import hashlib
import hmac


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Environment variables
ETHERSCAN_API_KEY = os.environ.get('ETHERSCAN_API_KEY', '')
PHOENIX_WEBHOOK_SECRET = os.environ.get('PHOENIX_WEBHOOK_SECRET', 'change-me-in-production')

# In-memory cache with TTL
cache_store = {}
CACHE_TTL = 30  # 30 seconds


# Define Models
class StatusCheck(BaseModel):
    model_config = ConfigDict(extra="ignore")
    
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    client_name: str
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StatusCheckCreate(BaseModel):
    client_name: str

class EthBalance(BaseModel):
    address: str
    balance_wei: str
    balance_eth: float
    balance_usd: Optional[float] = None
    last_updated: datetime

class EthTransaction(BaseModel):
    hash: str
    from_address: str
    to_address: str
    value_eth: float
    timestamp: datetime
    block_number: str
    gas_used: str

class PhoenixWebhookPayload(BaseModel):
    event_type: str
    case_id: Optional[str] = None
    evidence_id: Optional[str] = None
    data: Dict[str, Any]
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# Cache helper
def get_cache_key(key: str) -> str:
    return f"cache:{key}"

def is_cache_valid(cache_entry: dict) -> bool:
    if not cache_entry:
        return False
    age = (datetime.now(timezone.utc) - cache_entry['cached_at']).total_seconds()
    return age < CACHE_TTL


# Etherscan API functions
async def fetch_etherscan_balance(address: str) -> dict:
    """Fetch balance from Etherscan API"""
    cache_key = get_cache_key(f"balance:{address}")
    
    # Check in-memory cache first
    if cache_key in cache_store and is_cache_valid(cache_store[cache_key]):
        return cache_store[cache_key]['data']
    
    # Check MongoDB cache
    cached = await db.eth_cache.find_one({'type': 'balance', 'address': address})
    if cached and is_cache_valid({'cached_at': cached['cached_at']}):
        data = {
            'balance_wei': cached['balance_wei'],
            'balance_eth': cached['balance_eth'],
            'balance_usd': cached.get('balance_usd')
        }
        cache_store[cache_key] = {'data': data, 'cached_at': cached['cached_at']}
        return data
    
    # Fetch from Etherscan
    url = f"https://api.etherscan.io/api?module=account&action=balance&address={address}&tag=latest&apikey={ETHERSCAN_API_KEY}"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        result = response.json()
        
        if result['status'] != '1':
            raise HTTPException(status_code=400, detail=result.get('message', 'Etherscan API error'))
        
        balance_wei = result['result']
        balance_eth = float(balance_wei) / 1e18
        
        # Get ETH price from CoinGecko
        balance_usd = None
        try:
            price_response = await client.get('https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd')
            if price_response.status_code == 200:
                eth_price = price_response.json()['ethereum']['usd']
                balance_usd = balance_eth * eth_price
        except:
            pass
        
        data = {
            'balance_wei': balance_wei,
            'balance_eth': balance_eth,
            'balance_usd': balance_usd
        }
        
        # Update caches
        now = datetime.now(timezone.utc)
        cache_store[cache_key] = {'data': data, 'cached_at': now}
        
        # Update MongoDB
        await db.eth_cache.update_one(
            {'type': 'balance', 'address': address},
            {'$set': {
                'balance_wei': balance_wei,
                'balance_eth': balance_eth,
                'balance_usd': balance_usd,
                'cached_at': now,
                'updated_at': now
            }},
            upsert=True
        )
        
        return data


async def fetch_etherscan_transactions(address: str, limit: int = 3) -> list:
    """Fetch recent transactions from Etherscan API"""
    cache_key = get_cache_key(f"txs:{address}")
    
    # Check in-memory cache
    if cache_key in cache_store and is_cache_valid(cache_store[cache_key]):
        return cache_store[cache_key]['data']
    
    # Check MongoDB cache
    cached = await db.eth_cache.find_one({'type': 'transactions', 'address': address})
    if cached and is_cache_valid({'cached_at': cached['cached_at']}):
        data = cached['transactions'][:limit]
        cache_store[cache_key] = {'data': data, 'cached_at': cached['cached_at']}
        return data
    
    # Fetch from Etherscan
    url = f"https://api.etherscan.io/api?module=account&action=txlist&address={address}&startblock=0&endblock=99999999&page=1&offset={limit}&sort=desc&apikey={ETHERSCAN_API_KEY}"
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        result = response.json()
        
        if result['status'] != '1':
            # If no transactions, return empty list
            if result.get('message') == 'No transactions found':
                return []
            raise HTTPException(status_code=400, detail=result.get('message', 'Etherscan API error'))
        
        transactions = []
        for tx in result['result'][:limit]:
            transactions.append({
                'hash': tx['hash'],
                'from_address': tx['from'],
                'to_address': tx['to'],
                'value_eth': float(tx['value']) / 1e18,
                'timestamp': datetime.fromtimestamp(int(tx['timeStamp']), tz=timezone.utc),
                'block_number': tx['blockNumber'],
                'gas_used': tx['gasUsed']
            })
        
        # Update caches
        now = datetime.now(timezone.utc)
        cache_store[cache_key] = {'data': transactions, 'cached_at': now}
        
        # Update MongoDB
        await db.eth_cache.update_one(
            {'type': 'transactions', 'address': address},
            {'$set': {
                'transactions': transactions,
                'cached_at': now,
                'updated_at': now
            }},
            upsert=True
        )
        
        return transactions


# Routes
@api_router.get("/")
async def root():
    return {"message": "Ethereum Dashboard API v1.0"}

@api_router.post("/status", response_model=StatusCheck)
async def create_status_check(input: StatusCheckCreate):
    status_dict = input.model_dump()
    status_obj = StatusCheck(**status_dict)
    
    doc = status_obj.model_dump()
    doc['timestamp'] = doc['timestamp'].isoformat()
    
    _ = await db.status_checks.insert_one(doc)
    return status_obj

@api_router.get("/status", response_model=List[StatusCheck])
async def get_status_checks():
    status_checks = await db.status_checks.find({}, {"_id": 0}).to_list(1000)
    
    for check in status_checks:
        if isinstance(check['timestamp'], str):
            check['timestamp'] = datetime.fromisoformat(check['timestamp'])
    
    return status_checks


# Ethereum endpoints
@api_router.get("/eth/balance/{address}", response_model=EthBalance)
async def get_eth_balance(address: str):
    """Get Ethereum balance for an address"""
    try:
        data = await fetch_etherscan_balance(address)
        return EthBalance(
            address=address,
            balance_wei=data['balance_wei'],
            balance_eth=data['balance_eth'],
            balance_usd=data.get('balance_usd'),
            last_updated=datetime.now(timezone.utc)
        )
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"Etherscan API unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@api_router.get("/eth/txs/{address}", response_model=List[EthTransaction])
async def get_eth_transactions(address: str, limit: int = 3):
    """Get recent transactions for an address"""
    try:
        transactions = await fetch_etherscan_transactions(address, limit)
        return [EthTransaction(**tx) for tx in transactions]
    except httpx.HTTPError as e:
        raise HTTPException(status_code=503, detail=f"Etherscan API unavailable: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Phoenix webhook endpoint
@api_router.post("/webhook/phoenix")
async def phoenix_webhook(
    payload: Dict[str, Any],
    x_signature: Optional[str] = Header(None)
):
    """Receive webhooks from Phoenix Forense system"""
    
    # Validate signature if provided
    if x_signature and PHOENIX_WEBHOOK_SECRET:
        import json
        payload_str = json.dumps(payload, sort_keys=True)
        expected_signature = hmac.new(
            PHOENIX_WEBHOOK_SECRET.encode(),
            payload_str.encode(),
            hashlib.sha256
        ).hexdigest()
        
        if not hmac.compare_digest(x_signature, expected_signature):
            raise HTTPException(status_code=401, detail="Invalid signature")
    
    # Store raw payload in MongoDB
    doc = {
        'type': 'phoenix_webhook',
        'payload': payload,
        'signature': x_signature,
        'received_at': datetime.now(timezone.utc)
    }
    
    result = await db.phoenix_webhooks.insert_one(doc)
    
    return {
        'status': 'received',
        'id': str(result.inserted_id),
        'timestamp': doc['received_at'].isoformat()
    }


@api_router.get("/webhook/phoenix/recent")
async def get_recent_phoenix_webhooks(limit: int = 10):
    """Get recent Phoenix webhooks"""
    webhooks = await db.phoenix_webhooks.find(
        {'type': 'phoenix_webhook'},
        {'_id': 0}
    ).sort('received_at', -1).limit(limit).to_list(limit)
    
    return webhooks


# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
