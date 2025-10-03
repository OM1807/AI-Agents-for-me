"""Integration utility endpoints powered by provider clients and capabilities."""

from __future__ import annotations

from typing import Annotated, Any

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.deps import get_integration_service
from app.integrations.clients.registry import resolve_client
from app.integrations.enums import IntegrationCapability, IntegrationProvider
from app.schemas.monitoring import IncidentResponse, ServiceResponse
from app.services.integration_service import IntegrationService
from app.utils.helpers import parse_github_pr_url
from app.utils.logger import get_logger

logger = get_logger(__name__)

router = APIRouter()


def _ensure_capability(client: Any, required: IntegrationCapability) -> None:
    if required not in set(client.capabilities()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "capability_not_supported",
                "available": [cap.value for cap in client.capabilities()],
                "message": f"Capability {required.value} is not supported",
            },
        )


def _map_upstream_error(exc: Exception) -> HTTPException:
    if isinstance(exc, httpx.HTTPStatusError):
        status_code = exc.response.status_code
        if status_code in (401, 403):
            return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "provider_unauthorized",
                    "message": "Unauthorized",
                },
            )
        if status_code == 404:
            return HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "provider_resource_not_found",
                    "message": "Resource not found",
                },
            )
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "provider_error",
                "message": "Upstream provider error",
            },
        )
    if isinstance(exc, HTTPException):
        return exc
    if isinstance(exc, httpx.RequestError):
        return HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={
                "code": "provider_unreachable",
                "message": "Upstream provider unreachable",
            },
        )
    if isinstance(exc, ValueError):
        # Known client precondition errors (e.g., missing cloud_id/domain/token)
        message = str(exc)
        if "cloud_id_required" in message or "token_required" in message:
            return HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "credential_missing",
                    "message": "Credential missing",
                },
            )
        return HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "code": "provider_error",
                "message": message,
            },
        )
    return HTTPException(
        status_code=status.HTTP_502_BAD_GATEWAY,
        detail={
            "code": "provider_error",
            "message": str(exc),
        },
    )


@router.get(
    "/github/repos",
    summary="List GitHub repositories",
    description="List repositories for the current authenticated GitHub integration user",
)
async def list_github_repos(
    *,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[dict[str, Any]]:
    try:
        client = await resolve_client(provider=IntegrationProvider.GITHUB, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.REPOSITORIES)
        return await client.list_repos()  # type: ignore[attr-defined,no-any-return]
    except Exception as exc:  # map upstream errors consistently
        raise _map_upstream_error(exc)


@router.get(
    "/github/branches",
    summary="List GitHub branches",
    description="List branches for a repository identified by owner/repo",
)
async def list_github_branches(
    *,
    owner: Annotated[str, Query(min_length=1)],
    repo: Annotated[str, Query(min_length=1)],
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[dict[str, Any]]:
    try:
        client = await resolve_client(provider=IntegrationProvider.GITHUB, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.BRANCHES)
        return await client.list_branches(owner=owner, repo=repo)  # type: ignore[attr-defined,no-any-return]
    except Exception as exc:
        raise _map_upstream_error(exc)


@router.get(
    "/github/pull-requests",
    summary="List GitHub pull requests",
    description="List pull requests for a repository with pagination support",
)
async def list_github_pull_requests(
    *,
    owner: Annotated[str, Query(min_length=1, description="Repository owner")],
    repo: Annotated[str, Query(min_length=1, description="Repository name")],
    state: Annotated[str | None, Query(regex="^(open|closed|all)$", description="Pull request state")] = None,
    sort: Annotated[
        str | None, Query(regex="^(created|updated|popularity|long-running)$", description="Sort field")
    ] = None,
    direction: Annotated[str | None, Query(regex="^(asc|desc)$", description="Sort direction")] = None,
    page: Annotated[int, Query(ge=1, description="Page number for pagination")] = 1,
    per_page: Annotated[int, Query(ge=1, le=100, description="Number of results per page")] = 30,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> dict[str, Any]:
    """List pull requests for a GitHub repository with comprehensive pagination support.

    Args:
        owner: Repository owner/organization name
        repo: Repository name
        state: Filter by pull request state (open, closed, all). Default: open
        sort: Sort pull requests by created, updated, popularity, or long-running. Default: created
        direction: Sort direction (asc, desc). Default: desc
        page: Page number for pagination (starts at 1). Default: 1
        per_page: Number of results per page (1-100). Default: 30
        integration_service: Integration service dependency

    Returns:
        Paginated list of pull requests with metadata

    Raises:
        HTTPException: For various error conditions (400, 404, 502)
    """
    client = None
    try:
        client = await resolve_client(provider=IntegrationProvider.GITHUB, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.PULL_REQUESTS)

        result: dict[str, Any] = await client.list_pull_requests(  # type: ignore[attr-defined]
            owner=owner,
            repo=repo,
            state=state,
            sort=sort,
            direction=direction,
            page=page,
            per_page=per_page,
        )
        return result
    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()


@router.get(
    "/github/pull-request/validate",
    summary="Validate GitHub pull request",
    description="Check if a GitHub pull request is accessible with current integration token or publicly available",
)
async def validate_github_pull_request(
    *,
    url: Annotated[str, Query(min_length=1, description="GitHub pull request URL")],
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> dict[str, Any]:
    """Validate if a GitHub pull request is accessible.

    Checks if the PR is accessible with the current GitHub integration token.
    If not accessible with authentication, checks if it's publicly available.

    Args:
        url: GitHub pull request URL (e.g., https://github.com/owner/repo/pull/123)
        integration_service: Integration service dependency

    Returns:
        Dictionary with accessibility information and PR data if accessible

    Raises:
        HTTPException: For invalid URL format or various error conditions
    """
    client = None
    try:
        # Parse the GitHub PR URL
        try:
            owner, repo, pr_number = parse_github_pr_url(url)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "code": "invalid_url_format",
                    "message": str(exc),
                },
            )

        # Get GitHub client
        client = await resolve_client(provider=IntegrationProvider.GITHUB, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.PULL_REQUESTS)
        # Check PR accessibility
        result = await client.get_pull_request(owner=owner, repo=repo, pr_number=pr_number)  # type: ignore[attr-defined]
        return result  # type: ignore[no-any-return]
    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()


@router.get(
    "/atlassian/pages",
    summary="List Atlassian Confluence pages",
    description="List Confluence pages, optionally filtered by space key",
)
async def list_atlassian_pages(
    *,
    space: Annotated[str | None, Query(min_length=1)] = None,
    space_key: Annotated[str | None, Query(min_length=1)] = None,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[dict[str, Any]]:
    client = None
    try:
        client = await resolve_client(provider=IntegrationProvider.ATLASSIAN, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.PAGES)
        return await client.list_pages(space=space, space_key=space_key)  # type: ignore[attr-defined,no-any-return]
    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()


@router.get(
    "/atlassian/projects",
    summary="List Atlassian Jira projects",
    description="List Jira projects available for the authenticated user",
)
async def list_atlassian_projects(
    *,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[dict[str, Any]]:
    client = None
    try:
        client = await resolve_client(provider=IntegrationProvider.ATLASSIAN, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.PROJECTS)
        return await client.list_projects()  # type: ignore[attr-defined,no-any-return]
    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()


@router.get(
    "/atlassian/issues",
    summary="List Atlassian Jira issues",
    description="List Jira issues, optionally filtered by a project key, issue type, and/or search query",
)
async def list_atlassian_issues(
    *,
    project_key: Annotated[str | None, Query(min_length=1)] = None,
    issue_type: Annotated[str | None, Query(min_length=1)] = None,
    search_query: Annotated[str | None, Query(min_length=1)] = None,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[dict[str, Any]]:
    client = None
    try:
        client = await resolve_client(provider=IntegrationProvider.ATLASSIAN, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.ISSUES)
        return await client.list_issues(project_key=project_key, issue_type=issue_type, search_query=search_query)  # type: ignore[attr-defined,no-any-return]
    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()


@router.get(
    "/atlassian/spaces",
    summary="List Atlassian Confluence spaces",
    description="List Confluence spaces, optionally filtered by space keys",
)
async def list_atlassian_spaces(
    *,
    keys: Annotated[list[str] | None, Query(min_length=1)] = None,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[dict[str, Any]]:
    client = None
    try:
        client = await resolve_client(provider=IntegrationProvider.ATLASSIAN, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.SPACES)
        return await client.list_spaces(space_keys=keys)  # type: ignore[attr-defined,no-any-return]
    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()


@router.get(
    "/notion/pages",
    summary="List Notion pages",
    description="List Notion pages, optionally filtered by search query",
)
async def list_notion_pages(
    *,
    query: Annotated[str | None, Query(min_length=1)] = None,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[dict[str, Any]]:
    try:
        client = await resolve_client(provider=IntegrationProvider.NOTION, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.PAGES)
        return await client.list_pages(query=query)  # type: ignore[attr-defined,no-any-return]
    except Exception as exc:
        raise _map_upstream_error(exc)


# Unified Monitoring Endpoints


@router.get(
    "/{integration_provider}/services",
    response_model=list[ServiceResponse],
    summary="List integration services",
    description="List services from any supported integration provider",
)
async def list_integration_services(
    *,
    integration_provider: IntegrationProvider,
    search: Annotated[str | None, Query(description="Search query to filter services")] = None,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[ServiceResponse]:
    """List services from any integration provider with search filtering."""
    client = None
    try:
        client = await resolve_client(provider=integration_provider, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.SERVICES)

        services: list[dict[str, Any]] = await client.list_services(search=search)  # type: ignore[attr-defined]

        # Convert to response models
        return [ServiceResponse.model_validate(service) for service in services]
    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()


@router.get(
    "/{monitoring_provider}/incidents",
    response_model=list[IncidentResponse],
    summary="List monitoring incidents",
    description="List incidents from any monitoring provider with time range and search filtering",
)
async def list_monitoring_incidents(
    *,
    monitoring_provider: IntegrationProvider,
    start_time: Annotated[str | None, Query(description="Start time (ISO format)")] = None,
    end_time: Annotated[str | None, Query(description="End time (ISO format)")] = None,
    search: Annotated[str | None, Query(description="Search query to filter incidents")] = None,
    # Provider-specific parameters
    environment: Annotated[str | None, Query(description="Environment (Sentry: development, production)")] = None,
    project_id: Annotated[str | None, Query(description="Project ID")] = None,
    service_id: Annotated[str | None, Query(description="Service ID (Datadog, PagerDuty)")] = None,
    entity_name: Annotated[str | None, Query(description="Entity name (New Relic)")] = None,
    limit: Annotated[int, Query(ge=1, le=1000, description="Maximum number of results")] = 100,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[IncidentResponse]:
    """List incidents from a monitoring provider with flexible filtering."""
    client = None
    try:
        client = await resolve_client(provider=monitoring_provider, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.INCIDENTS)

        incidents: list[IncidentResponse] = await client.list_incidents(  # type: ignore[attr-defined]
            start_time=start_time,
            end_time=end_time,
            search=search,
            environment=environment,
            project_id=project_id,
            service_id=service_id,
            entity_name=entity_name,
            limit=limit,
        )
        return incidents

    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()


@router.get(
    "/incidents/from-url",
    summary="Parse incident from URL",
    description="Parse incident details from a monitoring provider URL",
)
async def parse_incident_from_url(
    *,
    url: Annotated[str, Query(description="Incident URL from monitoring provider")],
    provider: Annotated[IntegrationProvider, Query(description="Monitoring Provider")],
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> IncidentResponse:
    """Parse incident details from a monitoring provider URL."""
    client = None
    try:
        client = await resolve_client(provider=provider, integration_service=integration_service)

        incident: IncidentResponse = await client.get_incident(incident_url=url)  # type: ignore[attr-defined]

        return incident
    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()


@router.get(
    "/{project_id}/environments",
    summary="List environments",
    description="List environments for a specific project",
)
async def list_environments(
    *,
    project_id: str,
    search: Annotated[str | None, Query(description="Search query to filter environments")] = None,
    provider: Annotated[IntegrationProvider, Query(description="Monitoring Provider")],
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[dict[str, Any]]:
    """List environments for a project."""
    client = None
    try:
        client = await resolve_client(provider=provider, integration_service=integration_service)

        environments = await client.list_environments(  # type: ignore[attr-defined]
            project_id=project_id,
            search=search,
        )

        return environments  # type: ignore[no-any-return]
    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()


# Dynamic integration endpoints


@router.get(
    "/{integration_provider}/data-sources",
    response_model=list[dict[str, Any]],
    summary="List integration data sources",
    description="List data sources from any supported integration provider",
)
async def list_integration_data_sources(
    *,
    integration_provider: IntegrationProvider,
    search: Annotated[str | None, Query(description="Search query to filter data sources")] = None,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[dict[str, Any]]:
    """List data sources from any integration provider.

    Returns all configured data sources from the specified integration provider
    with detailed information including type, access mode, and configuration status.
    """
    client = None
    try:
        client = await resolve_client(provider=integration_provider, integration_service=integration_service)
        _ensure_capability(client, IntegrationCapability.DATA_SOURCES)

        data_sources: list[dict[str, Any]] = await client.list_data_sources(search=search)  # type: ignore[attr-defined]

        return data_sources
    except Exception as exc:
        raise _map_upstream_error(exc)
    finally:
        if client is not None:
            await client.aclose()
