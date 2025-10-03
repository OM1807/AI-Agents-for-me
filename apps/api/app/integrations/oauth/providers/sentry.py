"""Sentry OAuth provider for API token authentication."""

from __future__ import annotations

from typing import Any

import httpx

from app.integrations.enums import IntegrationProvider
from app.integrations.oauth.providers.base import OAuthProvider, TokenResult


class SentryProvider(OAuthProvider):
    """OAuth provider for Sentry API token authentication."""

    provider = IntegrationProvider.SENTRY

    async def validate_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        """Validate Sentry credentials by testing API connectivity.

        Args:
            credentials: Dict containing:
                - token: Sentry API token (PAT or OAuth token)
                - organization: Sentry organization slug (optional)
                - base_url: Sentry instance URL (optional, defaults to sentry.io)

        Returns:
            Validated credentials (may include enriched data)

        Raises:
            ValueError: If credentials are invalid
        """
        token = credentials.get("token")
        organization = credentials.get("organization")
        base_url = credentials.get("base_url", "https://sentry.io/api/0")

        if not token:
            raise ValueError("Sentry API token is required")

        # Clean up base URL
        base_url = base_url.rstrip("/")

        # Test API connectivity
        headers = {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json",
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test with organizations endpoint
            try:
                response = await client.get(
                    f"{base_url}/organizations/",
                    headers=headers,
                )

                if response.status_code == 401:
                    raise ValueError("Invalid Sentry API token")
                elif response.status_code == 403:
                    raise ValueError("Sentry API token lacks required permissions")
                elif response.status_code != 200:
                    raise ValueError(f"Sentry API returned unexpected status: {response.status_code}")

                # If organization is specified, validate it exists
                if organization:
                    org_response = await client.get(
                        f"{base_url}/organizations/{organization}/",
                        headers=headers,
                    )

                    if org_response.status_code == 404:
                        raise ValueError(f"Sentry organization '{organization}' not found or no access")
                    elif org_response.status_code != 200:
                        raise ValueError(f"Unable to access Sentry organization '{organization}'")

            except httpx.RequestError as e:
                raise ValueError(f"Unable to connect to Sentry API: {e!s}")

        # Return validated credentials with normalized base_url
        validated_creds = credentials.copy()
        validated_creds["base_url"] = base_url

        return validated_creds

    async def generate_access_token(self, credentials: dict[str, Any]) -> TokenResult:
        """Generate access token for Sentry (API token based).

        For API token based authentication, we just return the token as-is.
        """
        token = credentials.get("token")
        if not token:
            return TokenResult(access_token=None)

        return TokenResult(access_token=token)
