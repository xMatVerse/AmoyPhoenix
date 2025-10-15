"""Helpers for retrieving token prices and currency conversions."""

from __future__ import annotations

from typing import Awaitable, Callable, Optional

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


async def estimate_usd_from_token_wei(
    balance_wei: str,
    price_getter: Callable[[], Awaitable[Optional[float]]],
) -> Optional[float]:
    """Convert a wei-denominated balance into USD using the provided price getter."""

    try:
        wei_int = int(balance_wei)
    except (TypeError, ValueError):
        return None

    price = await price_getter()
    if price is None:
        return None

    balance_native = wei_int / 1e18
    return balance_native * price


async def estimate_usd_from_wei(balance_wei: str) -> Optional[float]:
    return await estimate_usd_from_token_wei(balance_wei, get_eth_price_usd)


async def estimate_usd_from_matic_wei(balance_wei: str) -> Optional[float]:
    return await estimate_usd_from_token_wei(balance_wei, get_matic_price_usd)
