"""Utilities for interacting with the Emergent Agent Etherscan proxy."""

from __future__ import annotations

from typing import Any, Dict, List

import httpx

DEFAULT_AGENT_URL = "https://etherscan-query.preview.emergentagent.com"


class EmergentAgentError(RuntimeError):
    """Raised when the Emergent Agent cannot return a successful response."""


async def _perform_request(
    params: Dict[str, Any],
    *,
    base_url: str = DEFAULT_AGENT_URL,
    timeout: float = 30.0,
) -> Dict[str, Any]:
    """Execute a GET request against the Emergent Agent endpoint."""

    async with httpx.AsyncClient(timeout=timeout) as client:
        response = await client.get(base_url, params=params)
        response.raise_for_status()
        payload = response.json()

    if payload.get("status") != "1":
        message = payload.get("message", "Unknown error from Emergent Agent")
        raise EmergentAgentError(message)

    return payload


async def fetch_balance(
    address: str,
    *,
    base_url: str = DEFAULT_AGENT_URL,
) -> Dict[str, Any]:
    """Fetch the raw balance payload for an address."""

    params = {
        "module": "account",
        "action": "balance",
        "address": address,
        "tag": "latest",
    }
    return await _perform_request(params, base_url=base_url)


async def fetch_transactions(
    address: str,
    *,
    limit: int = 10,
    base_url: str = DEFAULT_AGENT_URL,
) -> List[Dict[str, Any]]:
    """Fetch the raw transaction list payload for an address."""

    params = {
        "module": "account",
        "action": "txlist",
        "address": address,
        "startblock": 0,
        "endblock": 999_999_999,
        "page": 1,
        "offset": max(limit, 1),
        "sort": "desc",
    }
    payload = await _perform_request(params, base_url=base_url)
    return payload.get("result", [])[:limit]


async def health_check(*, base_url: str = DEFAULT_AGENT_URL) -> Dict[str, str]:
    """Return a lightweight health indicator for the Emergent Agent service."""

    params = {
        "module": "account",
        "action": "balance",
        "address": "0x0000000000000000000000000000000000000000",
        "tag": "latest",
    }

    try:
        await _perform_request(params, base_url=base_url)
    except (httpx.HTTPError, EmergentAgentError) as exc:
        return {"service": "emergent-agent", "status": "unhealthy", "message": str(exc)}

    return {"service": "emergent-agent", "status": "healthy", "message": "ok"}
