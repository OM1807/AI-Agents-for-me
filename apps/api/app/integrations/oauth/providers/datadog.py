"""Datadog OAuth provider for API key authentication."""

from __future__ import annotations

from typing import Any

import httpx

from app.integrations.enums import IntegrationProvider
from app.integrations.oauth.providers.base import OAuthProvider, TokenResult


class DatadogProvider(OAuthProvider):
    """OAuth provider for Datadog API key authentication."""

    provider = IntegrationProvider.DATADOG

    async def validate_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        """Validate Datadog credentials by testing API connectivity.

        Args:
            credentials: Dict containing:
                - token: Datadog API key (DD_API_KEY)
                - app_key: Datadog Application key (DD_APP_KEY) or stored under DD_APP_KEY key
                - site: Datadog site (optional, defaults to datadoghq.com)

        Returns:
            Validated credentials (may include enriched data)

        Raises:
            ValueError: If credentials are invalid
        """
        api_key = credentials.get("token")
        app_key = credentials.get("app_key") or credentials.get("DD_APP_KEY")
        site = credentials.get("site", "datadoghq.com")

        if not api_key:
            raise ValueError("Datadog API key is required")
        if not app_key:
            raise ValueError("Datadog Application key is required")

        # Test API connectivity
        base_url = f"https://api.{site}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test with a simple API call to validate keys
            response = await client.get(
                f"{base_url}/api/v1/validate",
                headers={
                    "DD-API-KEY": api_key,
                    "DD-APPLICATION-KEY": app_key,
                    "Content-Type": "application/json",
                },
            )

            if response.status_code == 403:
                raise ValueError("Invalid Datadog API key or Application key")
            elif response.status_code == 400:
                raise ValueError("Malformed Datadog API request")
            elif response.status_code != 200:
                # Try a different endpoint if validate doesn't work
                try:
                    # Test with dashboard list as fallback
                    response = await client.get(
                        f"{base_url}/api/v1/dashboard",
                        headers={
                            "DD-API-KEY": api_key,
                            "DD-APPLICATION-KEY": app_key,
                            "Content-Type": "application/json",
                        },
                    )

                    if response.status_code == 403:
                        raise ValueError("Invalid Datadog API key or Application key")
                    elif response.status_code not in (200, 404):  # 404 is ok if no dashboards
                        raise ValueError(f"Datadog API returned unexpected status: {response.status_code}")
                except httpx.RequestError as e:
                    raise ValueError(f"Unable to connect to Datadog API: {e!s}")

        # Return validated credentials with normalized app_key
        validated_creds = credentials.copy()
        if "DD_APP_KEY" in validated_creds and "app_key" not in validated_creds:
            validated_creds["app_key"] = validated_creds["DD_APP_KEY"]

        return validated_creds

    async def generate_access_token(self, credentials: dict[str, Any]) -> TokenResult:
        """Generate access token for Datadog (API key based).

        For API key based authentication, we just return the API key as the token.
        """
        api_key = credentials.get("token")
        if not api_key:
            return TokenResult(access_token=None)

        return TokenResult(access_token=api_key)
