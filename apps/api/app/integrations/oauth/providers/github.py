"""GitHub integration provider."""

from typing import Any

import httpx

from app.integrations.enums import IntegrationProvider
from app.integrations.oauth.providers import OAuthProvider
from app.integrations.oauth.providers.base import TokenResult


class GitHubProvider(OAuthProvider):
    """GitHub integration provider implementation."""

    provider: IntegrationProvider = IntegrationProvider.GITHUB
    api_base: str = "https://api.github.com"

    def get_token_generation_url(self) -> str:
        """Get GitHub token generation URL."""
        return "https://github.com/login/oauth/access_token"

    async def validate_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        """Validate GitHub credentials."""
        # make sure we have 'token' in credentials
        if "token" not in credentials:
            raise ValueError("GitHub credentials must contain a 'token'")
        # try to get user info
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(
                f"{self.api_base}/user", headers={"Authorization": f"Bearer {credentials['token']}"}
            )
            # check if the response is 200
            if response.status_code != 200:
                raise ValueError("GitHub credentials are invalid")
        return credentials

    async def generate_access_token(self, credentials: dict[str, Any]) -> TokenResult:
        """Generate GitHub access token."""
        token = credentials.get("token")
        access_token = token if isinstance(token, str) else None
        return TokenResult(access_token=access_token)
