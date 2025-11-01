import os
from typing import Dict, Any
from fastapi import Header, HTTPException, status
import secrets
import logging

logger = logging.getLogger(__name__)


def get_api_key_to_user_mapping() -> [str, Dict[str, Any]]:
    allowed_keys = os.getenv("ALLOWED_API_KEYS", "").strip()
    if not allowed_keys:
        raise ValueError("ALLOWED_API_KEYS environment variable not set")

    keys = [key.strip() for key in allowed_keys.split(",") if key.strip()]
    if not keys:
        raise ValueError("No valid API keys found in ALLOWED_API_KEYS")

    if len(keys) != 2:
        raise ValueError("Expected exactly 2 API keys")

    return {
        keys[0]: {"user_id": 1, "name": "Alex"},
        keys[1]: {"user_id": 2, "name": "Sydney"},
    }


async def verify_api_key(
    x_api_key: str = Header(..., alias="X-API-Key"),
) -> Dict[str, Any]:
    try:
        api_key_mapping = get_api_key_to_user_mapping()
    except ValueError as e:
        logger.error(f"API key configuration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Authentication service unavailable",
        )

    if x_api_key not in api_key_mapping:
        logger.warning(f"Invalid API key attempt: {x_api_key[:8]}***")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )

    user_info = api_key_mapping[x_api_key]
    logger.info(f"Authenticated user {user_info['user_id']} ({user_info['name']})")
    return user_info


def get_user_id_from_api_key(api_key: str) -> int | None:
    try:
        api_key_mapping = get_api_key_to_user_mapping()
        user_data = api_key_mapping.get(api_key)
        if user_data:
            return user_data.get("user_id")
        return None
    except Exception:
        return None


def generate_api_key() -> str:
    return secrets.token_urlsafe(32)
