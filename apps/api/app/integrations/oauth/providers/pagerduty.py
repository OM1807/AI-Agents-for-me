"""PagerDuty OAuth provider for API token authentication."""

from __future__ import annotations

from typing import Any

import httpx

from app.integrations.enums import IntegrationProvider
from app.integrations.oauth.providers.base import OAuthProvider, TokenResult


class PagerDutyProvider(OAuthProvider):
    """OAuth provider for PagerDuty API token authentication."""

    provider = IntegrationProvider.PAGERDUTY

    async def validate_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        """Validate PagerDuty credentials by testing API connectivity.

        Args:
            credentials: Dict containing:
                - token: PagerDuty API token (Integration key or API token)
                - email: User email for authentication (optional but recommended)

        Returns:
            Validated credentials (may include enriched data)

        Raises:
            ValueError: If credentials are invalid
        """
        api_token = credentials.get("token")
        email = credentials.get("email")

        if not api_token:
            raise ValueError("PagerDuty API token is required")

        # Test API connectivity
        headers = {
            "Authorization": f"Token token={api_token}",
            "Accept": "application/vnd.pagerduty+json;version=2",
            "Content-Type": "application/json",
        }

        if email:
            headers["From"] = email

        async with httpx.AsyncClient(timeout=30.0) as client:
            # Test with abilities endpoint (lightweight endpoint)
            try:
                response = await client.get(
                    "https://api.pagerduty.com/abilities",
                    headers=headers,
                )

                if response.status_code == 401:
                    raise ValueError("Invalid PagerDuty API token")
                elif response.status_code == 403:
                    raise ValueError("PagerDuty API token lacks required permissions")
                elif response.status_code != 200:
                    # Try services endpoint as fallback
                    response = await client.get(
                        "https://api.pagerduty.com/services",
                        headers=headers,
                        params={"limit": 1},
                    )

                    if response.status_code == 401:
                        raise ValueError("Invalid PagerDuty API token")
                    elif response.status_code == 403:
                        raise ValueError("PagerDuty API token lacks required permissions")
                    elif response.status_code != 200:
                        raise ValueError(f"PagerDuty API returned unexpected status: {response.status_code}")

            except httpx.RequestError as e:
                raise ValueError(f"Unable to connect to PagerDuty API: {e!s}")

        # Return validated credentials
        return credentials

    async def generate_access_token(self, credentials: dict[str, Any]) -> TokenResult:
        """Generate access token for PagerDuty (API token based).

        For API token based authentication, we just return the token as-is.
        """
        api_token = credentials.get("token")
        if not api_token:
            return TokenResult(access_token=None)

        return TokenResult(access_token=api_token)
