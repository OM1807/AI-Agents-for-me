"""Service for generating rendered MCP configurations for integrations."""

from __future__ import annotations

import json
from typing import Any

from app.core.template_renderer import TemplateRenderer
from app.integrations.enums import IntegrationProvider
from app.services.integration_service import IntegrationService
from app.utils.logger import get_logger

# Providers that don't require authentication/integration records
NON_AUTH_MCP_PROVIDERS = frozenset(
    [
        IntegrationProvider.PLAYWRIGHT,
        # Add other non-auth providers here as needed
    ]
)


class MCPError(Exception):
    """Base exception for MCP errors."""


class MCPTemplateError(MCPError):
    """Exception raised when MCP template is not valid JSON."""


class McpService:
    """
    Service for generating rendered MCP configurations for integrations.

    This service renders provider-specific MCP templates using the current
    access token for each active integration.
    """

    def __init__(self, *, integration_service: IntegrationService, renderer: TemplateRenderer) -> None:
        """
        Initialize McpService with required collaborators.

        Args:
            integration_service: Service for integration operations.
            renderer: Renderer for MCP templates.
        """
        self.integration_service = integration_service
        self.renderer = renderer
        self.logger = get_logger(__name__)

    async def _prepare_mcp_context(self, provider: IntegrationProvider) -> dict[str, Any]:
        """
        Prepare the context for MCP template rendering.

        Args:
            provider: The integration provider.

        Returns:
            Context dictionary for template rendering.

        Raises:
            MCPError: If required integration data is not found.
        """
        # Non-auth providers don't need credentials
        if provider in NON_AUTH_MCP_PROVIDERS:
            self.logger.debug(f"Preparing empty context for non-auth provider '{provider.value}'")
            return {}

        # Standard providers require integration records and tokens
        integration = await self.integration_service.crud.get_by_provider(provider=provider)
        if not integration:
            self.logger.info(f"No active integration found for provider '{provider}'")
            raise MCPError(f"No active integration found for provider '{provider}'")

        # Get access token for the integration
        token = await self.integration_service.get_access_token(integration_id=integration.id)  # type: ignore
        if not token:
            self.logger.warning(
                f"Failed to retrieve access token for provider '{provider}' integration_id={integration.id}"
            )
            raise MCPError(f"Failed to retrieve access token for provider '{provider}' integration_id={integration.id}")

        # Build context with credentials and token
        credentials = integration.credentials or {}
        credentials["token"] = token

        self.logger.debug(f"Prepared context for authenticated provider '{provider.value}'")
        return credentials

    async def _render_and_parse_config(self, provider: IntegrationProvider, context: dict[str, Any]) -> dict[str, Any]:
        """
        Render MCP template and parse as JSON configuration.

        Args:
            provider: The integration provider.
            context: Context for template rendering.

        Returns:
            Parsed JSON configuration.

        Raises:
            MCPTemplateError: If template rendering or JSON parsing fails.
        """
        template_name = f"{provider.value.lower()}.j2"
        self.logger.debug(f"Rendering MCP template '{template_name}' for provider '{provider}'")

        rendered_text = await self.renderer.render(template_name=template_name, context=context)

        try:
            rendered_config: dict[str, Any] = json.loads(rendered_text)
        except json.JSONDecodeError:
            self.logger.error(f"Rendered MCP template for provider '{provider}' is not valid JSON")
            raise MCPTemplateError(f"Rendered MCP template for provider '{provider}' is not valid JSON")

        return rendered_config

    async def generate(self, *, provider: IntegrationProvider) -> dict[str, Any]:
        """
        Render MCP config for a single active integration provider.

        Raises:
            MCPError: If no active integration is found.
            MCPTemplateError: If the rendered template is not valid JSON.
        """
        # Prepare context for the provider
        context = await self._prepare_mcp_context(provider)

        # Render template and parse configuration
        rendered_config = await self._render_and_parse_config(provider, context)

        # Log success with appropriate context
        auth_status = "no integration" if provider in NON_AUTH_MCP_PROVIDERS else "with integration"
        self.logger.info(f"Successfully rendered MCP config for provider '{provider}' ({auth_status})")

        return rendered_config

    async def generate_many(self, *, providers: list[IntegrationProvider] | None = None) -> dict[str, dict[str, Any]]:
        """
        Render MCP configs for many or all active providers.
        Returns:
            Mapping of provider -> rendered MCP configuration dict. Providers that fail are omitted.
        Raises:
            MCPError: If no active integrations are found.
            MCPTemplateError: If the rendered template is not valid JSON.
        """
        # Determine which providers to generate configs for
        if providers is None:
            # Fetch all active integrations and derive provider list
            self.logger.debug("No providers specified, fetching all active integrations")
            active_integrations = await self.integration_service.crud.list_integrations(is_active=True, limit=100)
            if not active_integrations:
                self.logger.info("No active integrations found for MCP config generation")
                return {}
            selected_providers = [integ.type for integ in active_integrations]
        else:
            selected_providers = providers

        results: dict[str, dict[str, Any]] = {}
        # Iterate over each provider and attempt to generate its MCP config
        for provider in selected_providers:
            self.logger.debug(f"Generating MCP config for provider '{provider}'")
            rendered = await self.generate(provider=provider)
            results[str(provider.value)] = rendered
        self.logger.info(f"Prepared MCP configs for {len(results)} providers")
        return results
