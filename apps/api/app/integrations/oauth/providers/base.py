"""Base OAuth provider with common token generation logic."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta
from typing import Any

import httpx
from jose import jwt

from app.integrations.enums import IntegrationProvider


@dataclass
class TokenResult:
    """Result from token generation including access token and any credential updates."""

    access_token: str | None
    credentials_updated: bool = False
    updated_credentials: dict[str, Any] | None = None


class OAuthProvider(ABC):
    """Abstract base class for OAuth providers."""

    provider: IntegrationProvider

    @abstractmethod
    async def validate_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        """Validate credentials for the provider."""

    @abstractmethod
    async def generate_access_token(self, credentials: dict[str, Any]) -> TokenResult:
        """Generate access token using the provided credentials."""

    async def close(self) -> None:  # pragma: no cover - placeholder for symmetry
        """Close provider resources if any."""
        return None

    def _get_jwt_expiry(self, jwt_token: str) -> datetime | None:
        """
        Extract expiration time from JWT token.

        Args:
            jwt_token: JWT token string

        Returns:
            Expiration datetime or None if unable to decode
        """
        try:
            # Decode JWT without verification (we just need the exp claim)
            payload = jwt.decode(jwt_token, key="", options={"verify_signature": False})
            exp_timestamp = payload.get("exp")
            if exp_timestamp:
                return datetime.fromtimestamp(exp_timestamp, tz=UTC)
        except Exception:
            # If we can't decode the JWT, return None
            pass
        return None

    def _is_access_token_valid(self, credentials: dict[str, Any]) -> bool:
        """
        Check if the stored access token is still valid (not expired).

        Args:
            credentials: Dictionary containing access token

        Returns:
            True if access token exists and is not expired, False otherwise
        """
        access_token = credentials.get("access_token")
        if not access_token or not isinstance(access_token, str):
            return False

        # Try to get expiration from JWT first
        jwt_expires_at = self._get_jwt_expiry(access_token)
        if jwt_expires_at:
            # Add a 90-second buffer to avoid edge cases
            return datetime.now(UTC) < (jwt_expires_at - timedelta(seconds=90))

        # For non-JWT tokens, assume they don't expire (like GitHub/Notion PATs)
        return True

    def _store_access_token_in_credentials(self, credentials: dict[str, Any], access_token: str) -> None:
        """
        Store access token in credentials.

        Args:
            credentials: Dictionary to update with token info
            access_token: The access token to store
        """
        credentials["access_token"] = access_token

    async def _generate_oauth_access_token(self, token_url: str, refresh_token: str) -> TokenResult:
        """
        Generate OAuth access token from refresh token.

        Args:
            refresh_token: OAuth refresh token

        Returns:
            TokenResult with access token and credential update information
        """
        data = {
            "grant_type": "refresh_token",
            "refresh_token": refresh_token,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(token_url, data=data)
            response.raise_for_status()
            token_data: dict[str, Any] = response.json()

        access_token = token_data.get("access_token")
        if isinstance(access_token, str):
            return TokenResult(access_token=access_token)
        return TokenResult(access_token=None)
