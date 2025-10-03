"""Client registry to resolve and instantiate provider clients with saved credentials."""

from __future__ import annotations

from typing import Any, cast

from fastapi import HTTPException, status

from app.integrations.clients.atlassian_client import AtlassianClient
from app.integrations.clients.base import IntegrationClient
from app.integrations.clients.cloudwatch_client import CloudWatchClient
from app.integrations.clients.datadog_client import DatadogClient
from app.integrations.clients.github_client import GitHubClient
from app.integrations.clients.grafana_client import GrafanaClient

# from app.integrations.clients.grafana_client import GrafanaClient
from app.integrations.clients.new_relic_client import NewRelicClient
from app.integrations.clients.notion_client import NotionClient
from app.integrations.clients.pagerduty_client import PagerDutyClient
from app.integrations.clients.sentry_client import SentryClient
from app.integrations.enums import IntegrationProvider
from app.services.integration_service import IntegrationService

REGISTRY: dict[IntegrationProvider, type[Any]] = {
    # Existing integrations
    IntegrationProvider.GITHUB: GitHubClient,
    IntegrationProvider.ATLASSIAN: AtlassianClient,
    IntegrationProvider.NOTION: NotionClient,
    # Monitoring integrations (all implement both IntegrationClient and UnifiedMonitoringOps)
    IntegrationProvider.DATADOG: DatadogClient,
    IntegrationProvider.GRAFANA: GrafanaClient,
    IntegrationProvider.NEW_RELIC: NewRelicClient,
    IntegrationProvider.PAGERDUTY: PagerDutyClient,
    IntegrationProvider.SENTRY: SentryClient,
    IntegrationProvider.CLOUDWATCH: CloudWatchClient,
}


async def resolve_client(
    *, provider: IntegrationProvider, integration_service: IntegrationService
) -> IntegrationClient:
    """Return an instantiated client for the current user's active integration.

    For GitHub, allows operation without an active integration.
    For other providers, raises HTTPException if no active integration is found.
    """

    # Get the client class first and validate it exists
    cls = REGISTRY.get(provider)
    if cls is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "unsupported_provider",
                "message": f"Unsupported provider '{provider.value}'",
            },
        )

    # Find active integration for provider
    integration = await integration_service.crud.get_by_provider(provider=provider)

    # For GitHub, allow operation without integration (for public repos or default token)
    if integration is None and provider == IntegrationProvider.GITHUB:
        return cast(IntegrationClient, cls(credentials=None))

    # For all other providers, require an active integration
    if integration is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "code": "integration_not_found",
                "message": f"No active integration found for provider '{provider.value}'",
            },
        )

    # Obtain a valid token (refresh/exchange as needed by OAuth manager)
    token = await integration_service.get_access_token(integration_id=integration.id)  # type: ignore
    credentials = integration.credentials or {}
    credentials["token"] = token

    return cast(IntegrationClient, cls(credentials=credentials))
