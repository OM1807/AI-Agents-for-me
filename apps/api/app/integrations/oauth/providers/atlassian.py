"""Atlassian integration provider for MCP OAuth flow."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta
from typing import Any

import httpx

from app.integrations.clients.atlassian_client import AtlassianClient
from app.integrations.enums import IntegrationProvider
from app.integrations.oauth.providers import OAuthProvider
from app.integrations.oauth.providers.base import TokenResult


class AtlassianProvider(OAuthProvider):
    """Atlassian integration provider implementation (MCP OAuth)."""

    provider: IntegrationProvider = IntegrationProvider.ATLASSIAN
    api_base: str = "https://api.atlassian.com"
    # MCP OAuth token endpoint (form-encoded)
    token_url: str = (
        "https://atlassian-remote-mcp-production.atlassian-remote-mcp-server-production.workers.dev/v1/token"
    )

    async def validate_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        """Validate Atlassian credentials for MCP OAuth."""
        required_keys = [
            "client_id",
            "client_secret",
            "access_token",
            "refresh_token",
            "expires_at",
        ]
        for key in required_keys:
            if key not in credentials:
                raise ValueError(f"Atlassian credentials must contain a '{key}'")

        # Validate expires_at shape (epoch seconds)
        expires_at = credentials.get("expires_at")
        try:
            # Accept int|float|str and normalize to int seconds
            if isinstance(expires_at, int | float):
                pass
            elif isinstance(expires_at, str):
                int(expires_at)
            else:
                raise ValueError
        except Exception as exc:  # pragma: no cover - defensive parsing
            raise ValueError("Atlassian credentials 'expires_at' must be an epoch timestamp") from exc

        # Short-circuit if cloud_id already present and non-empty
        if isinstance(credentials.get("cloud_id"), str) and credentials["cloud_id"]:
            return credentials
        # Enrich credentials with cloud_id/site_url via AtlassianClient
        credentials = await self._enrich_cloud_context(credentials)
        return credentials

    @staticmethod
    async def _enrich_cloud_context(credentials: dict[str, Any]) -> dict[str, Any]:
        """Enrich credentials with cloud_id/site_url via AtlassianClient."""
        try:
            client = AtlassianClient(credentials=credentials)
            discovered = await client.discover_cloud_context()
            cloud_id = discovered.get("cloud_id")
            site_url = discovered.get("site_url")
            if isinstance(cloud_id, str) and cloud_id:
                credentials["cloud_id"] = cloud_id
            if isinstance(site_url, str) and site_url:
                credentials["site_url"] = site_url
        except Exception:
            raise ValueError("Failed to get cloud_id/site_url from AtlassianClient")
        return credentials

    def _is_token_expired_by_timestamp(self, credentials: dict[str, Any]) -> bool:
        """Check token expiry based on provided expires_at timestamp with safety buffer."""
        expires_at_raw = credentials.get("expires_at")
        if expires_at_raw is None:
            return True
        try:
            expires_at_ms = int(float(expires_at_raw))
            # Convert milliseconds to seconds
            expires_at_sec = expires_at_ms / 1000
        except Exception:
            return True
        # 90-second safety buffer
        return datetime.now(UTC) >= datetime.fromtimestamp(expires_at_sec, tz=UTC) - timedelta(seconds=90)

    async def generate_access_token(self, credentials: dict[str, Any]) -> TokenResult:
        """Generate or refresh Atlassian access token using MCP OAuth endpoint.

        Uses form-encoded request with client_id, client_secret, grant_type=refresh_token, refresh_token.
        If current token is still valid (by expires_at or JWT exp), returns it.
        """
        # If we have a token and it's still valid, return it
        cached_token = credentials.get("access_token")
        if isinstance(cached_token, str):
            # Prefer explicit expires_at check
            if not self._is_token_expired_by_timestamp(credentials):
                return TokenResult(access_token=cached_token)

        # Token missing or expired -> refresh
        original_refresh_token = credentials.get("refresh_token")
        if not isinstance(original_refresh_token, str):
            raise ValueError("Missing 'refresh_token' for Atlassian token refresh")

        data = {
            "client_id": credentials.get("client_id"),
            "client_secret": credentials.get("client_secret"),
            "grant_type": "refresh_token",
            "refresh_token": original_refresh_token,
        }

        headers = {"Content-Type": "application/x-www-form-urlencoded"}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(self.token_url, data=data, headers=headers)
                response.raise_for_status()
                token_data: dict[str, Any] = response.json()

        except httpx.HTTPStatusError as e:  # pragma: no cover - HTTP error path
            status = e.response.status_code
            details: str = ""
            try:
                err_json = e.response.json()
                details = err_json.get("error_description") or err_json.get("error") or ""
            except Exception:
                details = e.response.text or ""
            raise ValueError(f"Failed to refresh Atlassian access token: HTTP {status} {details}") from e
        except Exception as e:  # pragma: no cover - network error path
            raise ValueError(f"Failed to generate Atlassian access token: {e!s}") from e

        access_token = token_data.get("access_token")
        if not isinstance(access_token, str):
            return TokenResult(access_token=None)

        # Compute expires_at (epoch seconds)
        expires_at_epoch: int | None = None
        if isinstance(token_data.get("expires_in"), int | float):
            expires_at_epoch = int(datetime.now(UTC).timestamp() + float(token_data["expires_in"]) - 300)
        else:
            # Fallback: set as 45 minutes from now
            expires_at_epoch = int(datetime.now(UTC).timestamp() + 45 * 60)

        # Handle refresh token rotation
        new_refresh_token = token_data.get("refresh_token")
        if isinstance(new_refresh_token, str) and new_refresh_token and new_refresh_token != original_refresh_token:
            credentials["refresh_token"] = new_refresh_token

        # Store updated token and expiry in credentials
        credentials["access_token"] = access_token
        if expires_at_epoch is not None:
            credentials["expires_at"] = expires_at_epoch

        return TokenResult(access_token=access_token, credentials_updated=True, updated_credentials=credentials.copy())
