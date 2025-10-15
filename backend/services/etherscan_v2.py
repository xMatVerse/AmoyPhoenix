"""Helpers for interacting with the Etherscan API v2 across multiple chains."""

from __future__ import annotations

import os
from typing import Any, Dict, List

import httpx

ETHERSCAN_V2_URL = "https://api.etherscan.io/v2/api"
API_KEY = os.getenv("ETHERSCAN_API_KEY", "")


class EtherscanError(RuntimeError):
    """Raised when the Etherscan API returns an error payload."""


async def _perform_request(
    params: Dict[str, Any], *, chain_id: int, timeout: float = 15.0
) -> Dict[str, Any]:
    """Execute a GET request and return the decoded payload.

    Parameters
    ----------
    params:
        Request parameters excluding chain and API key information.
    chain_id:
        Numeric identifier of the target EVM chain (e.g. 1 for Ethereum,
        80002 for Polygon Amoy).
    timeout:
        Request timeout in seconds.
    """

    if not API_KEY:
        raise EtherscanError("ETHERSCAN_API_KEY is not configured")

    request_params = dict(params)
    request_params.update({
        "chainid": chain_id,
        "apikey": API_KEY,
    })

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(ETHERSCAN_V2_URL, params=request_params)
        response.raise_for_status()
        payload = response.json()

    status = payload.get("status")
    if status not in (None, "1", 1):
        message = payload.get("message", "Unknown error from Etherscan")
        raise EtherscanError(message)

    return payload


def _extract_balance(payload: Dict[str, Any]) -> str:
    result = payload.get("result")
    if isinstance(result, str):
        return result
    if isinstance(result, dict):
        if "balance" in result:
            return str(result["balance"])
        if "result" in result:
            return str(result["result"])
    raise EtherscanError("Unexpected balance response structure")


def _extract_transactions(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    result = payload.get("result")
    if isinstance(result, list):
        return result
    if isinstance(result, dict) and "transactions" in result:
        txs = result.get("transactions")
        if isinstance(txs, list):
            return txs
    raise EtherscanError("Unexpected transaction response structure")


async def get_account_balance(address: str, *, chain_id: int) -> str:
    """Return the balance (in wei) for the supplied address."""

    payload = await _perform_request(
        {
            "module": "account",
            "action": "balance",
            "address": address,
            "tag": "latest",
        },
        chain_id=chain_id,
    )
    return _extract_balance(payload)


async def get_account_transactions(
    address: str, *, chain_id: int, limit: int = 10
) -> List[Dict[str, Any]]:
    """Return the most recent transactions for the supplied address."""

    payload = await _perform_request(
        {
            "module": "account",
            "action": "txlist",
            "address": address,
            "startblock": 0,
            "endblock": 999_999_999,
            "page": 1,
            "offset": max(1, limit),
            "sort": "desc",
        },
        chain_id=chain_id,
    )
    transactions = _extract_transactions(payload)
    return transactions[:limit]
