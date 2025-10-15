"""Helpers for retrieving token prices and currency conversions."""

from __future__ import annotations

from typing import Optional

import httpx

ETH_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
MATIC_PRICE_URL = "https://api.coingecko.com/api/v3/simple/price?ids=matic-network&vs_currencies=usd"


async def _fetch_price(url: str) -> Optional[float]:
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url)
        response.raise_for_status()
        payload = response.json()
    try:
        if "ethereum" in payload:
            return float(payload["ethereum"]["usd"])
        if "matic-network" in payload:
            return float(payload["matic-network"]["usd"])
    except (KeyError, TypeError, ValueError):
        pass
    return None


async def get_eth_price_usd() -> Optional[float]:
    return await _fetch_price(ETH_PRICE_URL)


async def get_matic_price_usd() -> Optional[float]:
    return await _fetch_price(MATIC_PRICE_URL)


async def estimate_usd_from_wei(balance_wei: str) -> Optional[float]:
    try:
        wei_int = int(balance_wei)
    except (TypeError, ValueError):
        return None

    price = await get_eth_price_usd()
    if price is None:
        return None

    balance_eth = wei_int / 1e18
    return balance_eth * price
