"""OAuth Providers Manager using Factory Pattern for handling different integration providers."""

from typing import Any

from app.integrations.enums import IntegrationProvider
from app.integrations.oauth.providers import OAuthProvider
from app.integrations.oauth.providers.base import TokenResult


class OAuthProvidersManager:
    """Factory and manager for OAuth providers using Factory Pattern."""

    def __init__(self) -> None:
        """Initialize OAuth providers manager."""
        self._providers: dict[IntegrationProvider, OAuthProvider] = {}
        self._initialize_providers()

    def _initialize_providers(self) -> None:
        """Dynamically initialize all OAuth providers using subclasses."""

        self._providers = {}
        for subclass in OAuthProvider.__subclasses__():
            provider_enum = getattr(subclass, "provider", None)
            if provider_enum is not None:
                cls: type[OAuthProvider] = subclass  # type: ignore
                self._providers[provider_enum] = cls()

    def get_provider(self, provider: IntegrationProvider) -> OAuthProvider:
        """
        Get OAuth provider instance using Factory Pattern.

        Args:
            provider: Integration provider type

        Returns:
            OAuth provider instance

        Raises:
            ValueError: If provider is not supported
        """
        if provider not in self._providers:
            raise ValueError(f"Unsupported provider: {provider}")
        return self._providers[provider]

    async def get_access_token(self, integration_type: IntegrationProvider, credentials: dict[str, Any]) -> TokenResult:
        """
        Get access token for integration based on type and auth type.
        """
        provider = self.get_provider(integration_type)
        return await provider.generate_access_token(credentials)

    async def validate_credentials(
        self, integration_type: IntegrationProvider, credentials: dict[str, Any]
    ) -> dict[str, Any] | None:
        """Validate and possibly enrich credentials for integration based on type.

        Returns potentially updated credentials (e.g., adding `cloud_id`).
        """
        provider = self.get_provider(integration_type)
        return await provider.validate_credentials(credentials)
