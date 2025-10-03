"""Grafana OAuth provider for API token authentication."""

from __future__ import annotations

from typing import Any

import httpx

from app.integrations.enums import IntegrationProvider
from app.integrations.oauth.providers.base import OAuthProvider, TokenResult

# HTTP status codes
HTTP_STATUS_UNAUTHORIZED = 401
HTTP_STATUS_FORBIDDEN = 403
HTTP_STATUS_OK = 200


class GrafanaProvider(OAuthProvider):
    """OAuth provider for Grafana API token authentication."""

    provider = IntegrationProvider.GRAFANA

    async def validate_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        """Validate Grafana credentials by testing API connectivity.

        Args:
            credentials: Dict containing:
                - token: Grafana API token or service account token
                - base_url: Grafana instance URL (required)
                - org_id: Organization ID (optional)

        Returns:
            Validated credentials (may include enriched data)

        Raises:
            ValueError: If credentials are invalid
        """
        token = credentials.get("token")
        base_url = credentials.get("base_url")
        org_id = credentials.get("org_id")

        if not token:
            raise ValueError("Grafana API token is required")
        if not base_url:
            raise ValueError("Grafana base URL is required")

        # Clean up base URL
        base_url = base_url.rstrip("/")

        # Test API connectivity
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        if org_id:
            headers["X-Grafana-Org-Id"] = str(org_id)

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test with organization info endpoint
            try:
                response = await client.get(
                    f"{base_url}/api/org",
                    headers=headers,
                )

                if response.status_code == HTTP_STATUS_UNAUTHORIZED:
                    raise ValueError("Invalid Grafana API token")
                elif response.status_code == HTTP_STATUS_FORBIDDEN:
                    raise ValueError("Grafana API token lacks required permissions")
                elif response.status_code != HTTP_STATUS_OK:
                    raise ValueError(f"Grafana API returned unexpected status: {response.status_code}")

            except httpx.RequestError as e:
                raise ValueError(f"Unable to connect to Grafana instance: {e!s}") from e

        # Return validated credentials with normalized base_url
        validated_creds = credentials.copy()
        validated_creds["base_url"] = base_url

        return validated_creds

    async def generate_access_token(self, credentials: dict[str, Any]) -> TokenResult:
        """Generate access token for Grafana (API token based).

        For API token based authentication, we just return the token as-is.
        """
        token = credentials.get("token")
        if not token:
            return TokenResult(access_token=None)

        return TokenResult(access_token=token)
