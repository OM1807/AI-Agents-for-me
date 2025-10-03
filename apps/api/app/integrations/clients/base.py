"""Client capability protocols and base client contract for integrations."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any, Protocol

from app.integrations.enums import IntegrationCapability
from app.schemas.monitoring import IncidentResponse


class RepositoryOps(Protocol):
    """Repository-related operations for code hosting providers."""

    async def list_repos(self, *, visibility: str | None = None) -> list[dict]:
        """List repositories for the current authenticated user."""

    async def list_branches(self, *, owner: str, repo: str) -> list[dict]:
        """List branches in a repository owned by ``owner`` named ``repo``."""

    async def list_pull_requests(
        self,
        *,
        owner: str,
        repo: str,
        state: str | None = None,
        sort: str | None = None,
        direction: str | None = None,
        page: int = 1,
        per_page: int = 30,
    ) -> dict[str, Any]:
        """List pull requests in a repository with pagination support."""


class DocsOps(Protocol):
    """Documentation/pages operations (e.g., Confluence)."""

    async def list_pages(self, *, space: str | None = None) -> list[dict]:
        """List pages, optionally filtered by space key."""


class ProjectsOps(Protocol):
    """Project listing operations (e.g., Jira projects)."""

    async def list_projects(self) -> list[dict]:
        """List projects available to the authenticated user."""


class IssuesOps(Protocol):
    """Issue listing operations (e.g., Jira issues)."""

    async def list_issues(
        self, *, project_key: str | None = None, issue_type: str | None = None, search_query: str | None = None
    ) -> list[dict]:
        """List issues, optionally filtered by a project key, issue type, and/or search query."""


class UnifiedMonitoringOps(Protocol):
    """Unified monitoring protocol with explicit parameters for all providers."""

    async def list_services(
        self,
        *,
        search: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List services with filtering.

        Args:
            search: Search query to filter services
            **kwargs: Provider-specific additional parameters

        Expected output format:
        [
            {
                "id": "service-123",
                "name": "api-service",
                "description": "Main API service",
                "last_updated": "2024-01-01T12:00:00Z"
            },
            ...
        ]
        """
        ...

    async def list_projects(
        self,
        *,
        search: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List projects with filtering.

        Args:
            search: Search query to filter projects
            **kwargs: Provider-specific additional parameters

        Expected output format:
        [
            {
                "id": "project-456",
                "name": "Production Environment"
            },
            ...
        ]
        """
        ...

    async def list_incidents(
        self,
        *,
        start_time: str | None = None,
        end_time: str | None = None,
        search: str | None = None,
        environment: str | None = None,
        project_id: str | None = None,
        service_id: str | None = None,
        entity_name: str | None = None,
        limit: int = 100,
        **kwargs: Any,
    ) -> list[IncidentResponse]:
        """List incidents with filtering.

        Args:
            start_time: Start time (ISO format)
            end_time: End time (ISO format)
            search: Search query to filter incidents
            environment: Environment filter (Sentry)
            project_id: Project ID (Sentry)
            service_id: Service ID (Datadog, PagerDuty)
            entity_name: Entity name (New Relic)
            limit: Maximum number of results
            **kwargs: Provider-specific additional parameters

        Expected output format:
        [
            {
                "id": "incident-789",
                "title": "High CPU Usage Alert",
                "type": "alert",
                "link": "https://provider.com/incidents/789",
                "last_seen": "2024-01-01T12:00:00Z"
            },
            ...
        ]
        """
        ...

    async def get_incident(
        self,
        *,
        incident_url: str | None = None,
        **kwargs: Any,
    ) -> IncidentResponse:
        """Get a specific incident by ID.

        Args:
            incident_url: The incident URL
            **kwargs: Provider-specific additional parameters

        Returns:
            Incident details in standard format
        """
        ...

    async def list_environments(
        self,
        *,
        project_id: str,
        search: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List environments for a project.

        Args:
            project_id: Project identifier
            search: Search query to filter environments
            **kwargs: Provider-specific additional parameters

        Expected output format:
        [
            {
                "id": "env-123",
                "name": "production",
                "description": "Production environment"
            },
            ...
        ]
        """
        ...


class IntegrationClient(Protocol):
    """Base protocol for a provider client that exposes capabilities."""

    def validate_credentials(self, *, credentials: dict) -> None:
        """Validate the credentials for this client."""
        ...

    def capabilities(self) -> Iterable[IntegrationCapability]:
        """Return the capabilities supported by this client instance."""

    async def aclose(self) -> None:  # pragma: no cover - convenience for cleanup symmetry
        """Close any underlying resources or HTTP clients."""
        ...
