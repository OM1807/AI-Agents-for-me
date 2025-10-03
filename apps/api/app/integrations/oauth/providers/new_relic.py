"""New Relic OAuth provider for API key authentication."""

from __future__ import annotations

from typing import Any

import httpx

from app.integrations.enums import IntegrationProvider
from app.integrations.oauth.providers.base import OAuthProvider, TokenResult


class NewRelicProvider(OAuthProvider):
    """OAuth provider for New Relic API key authentication."""

    provider = IntegrationProvider.NEW_RELIC

    async def validate_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        """Validate New Relic credentials by testing API connectivity.

        Args:
            credentials: Dict containing:
                - token: New Relic API key (User API key or License key)
                - account_id: New Relic account ID (optional)
                - region: New Relic region (US or EU, optional, defaults to US)

        Returns:
            Validated credentials (may include enriched data)

        Raises:
            ValueError: If credentials are invalid
        """
        api_key = credentials.get("api_key")
        region = credentials.get("region", "US")
        # account_id = credentials.get("account_id")

        if not api_key:
            raise ValueError("New Relic API key is required")

        # Determine API endpoints based on region
        if region.upper() == "EU":
            graphql_url = "https://api.eu.newrelic.com/graphql"
        else:
            graphql_url = "https://api.newrelic.com/graphql"

        # Test API connectivity with a simple GraphQL query
        headers = {
            "Api-Key": api_key,
            "Content-Type": "application/json",
        }

        query = """
        {
          actor {
            accounts {
              id
              name
            }
          }
        }
        """

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(
                    graphql_url,
                    headers=headers,
                    json={"query": query},
                )

                if response.status_code == 401:
                    raise ValueError("Invalid New Relic API key")
                elif response.status_code == 403:
                    raise ValueError("New Relic API key lacks required permissions")
                elif response.status_code != 200:
                    raise ValueError(f"New Relic API returned unexpected status: {response.status_code}")

                # Check if the response contains valid data
                data = response.json()
                if "errors" in data:
                    error_msg = data["errors"][0].get("message", "Unknown error")
                    raise ValueError(f"New Relic API error: {error_msg}")

            except httpx.RequestError as e:
                raise ValueError(f"Unable to connect to New Relic API: {e!s}")

        # Return validated credentials
        validated_creds = credentials.copy()
        validated_creds["region"] = region

        return validated_creds

    async def generate_access_token(self, credentials: dict[str, Any]) -> TokenResult:
        """Generate access token for New Relic (API key based).

        For API key based authentication, we just return the API key as the token.
        """
        api_key = credentials.get("api_key")
        if not api_key:
            return TokenResult(access_token=None)

        return TokenResult(access_token=api_key)
