"""Notion integration provider for authentication and API operations."""

from typing import Any

import httpx

from app.integrations.enums import IntegrationProvider
from app.integrations.oauth.providers import OAuthProvider
from app.integrations.oauth.providers.base import TokenResult


class NotionProvider(OAuthProvider):
    """Notion integration provider."""

    provider: IntegrationProvider = IntegrationProvider.NOTION
    api_base: str = "https://api.notion.com"
    token_url: str = f"{api_base}/v1/oauth/token"

    async def validate_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        """Validate Notion credentials using the /users/me endpoint."""
        token = credentials.get("token")
        if not isinstance(token, str) or not token:
            raise ValueError("Notion credentials must contain a valid 'token'")

        try:
            await self._validate_token(token)
            return credentials
        except Exception as e:
            raise ValueError("Invalid Notion access token") from e

    async def generate_access_token(self, credentials: dict[str, Any]) -> TokenResult:
        """Generate Notion access token from refresh token."""
        token = credentials.get("token")
        access_token = token if isinstance(token, str) else None
        return TokenResult(access_token=access_token)

    async def _validate_token(self, token: str) -> dict[str, Any]:
        """Validate token using Notion's /users/me endpoint."""
        url = f"{self.api_base}/v1/users/me"
        headers = {"Authorization": f"Bearer {token}", "Notion-Version": "2022-06-28"}
        async with httpx.AsyncClient(timeout=30.0) as client:
            resp = await client.get(url, headers=headers)
            resp.raise_for_status()
            payload: dict[str, Any] = resp.json()
        return payload
