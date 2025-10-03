"""Sentry client for incident and error data retrieval (Unified version)."""

from __future__ import annotations

from collections.abc import Iterable
from datetime import UTC, datetime
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException

from app.integrations.clients.base import IntegrationClient, UnifiedMonitoringOps
from app.integrations.enums import IntegrationCapability
from app.schemas.monitoring import IncidentResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)


class SentryClient(UnifiedMonitoringOps, IntegrationClient):
    """Sentry client for error tracking and incident data retrieval (Unified version)."""

    def __init__(self, *, credentials: dict[str, Any]) -> None:
        """Initialize Sentry client with credentials.

        Args:
            credentials: Dict containing:
                - token: Sentry API token (PAT or OAuth token)
                - organization: Sentry organization slug (optional)
                - base_url: Sentry instance URL (optional, defaults to sentry.io)
        """
        self.validate_credentials(credentials=credentials)
        self._token = credentials["token"]
        self._organization = credentials.get("organization")
        self._base_url = credentials.get("base_url", "https://sentry.io/api/0")

        # Initialize HTTP client with auth headers
        self._client = httpx.AsyncClient(
            headers={
                "Authorization": f"Bearer {self._token}",
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

        logger.info(
            "Sentry client initialized",
            extra={"base_url": self._base_url, "has_organization": bool(self._organization)},
        )

    def validate_credentials(self, *, credentials: dict[str, Any]) -> None:
        """Validate Sentry credentials."""
        if not credentials.get("token"):
            raise ValueError("Sentry token is required")

    def capabilities(self) -> Iterable[IntegrationCapability]:
        """Return capabilities supported by Sentry client."""
        return [
            IntegrationCapability.PROJECTS,
            IntegrationCapability.INCIDENTS,
            IntegrationCapability.ALERTS,
        ]

    async def list_projects(
        self,
        *,
        search: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List projects from Sentry (using projects)."""
        try:
            projects: list[dict[str, Any]] = []

            if self._organization:
                # Get projects for the organization
                url = f"{self._base_url}/organizations/{self._organization}/projects/"
                response = await self._client.get(url)
                response.raise_for_status()
                projects_response = response.json()

                for project in projects_response:
                    project_name = project.get("name", "")

                    # Apply search filter if provided
                    if search and search.lower() not in project_name.lower():
                        continue

                    project = {"id": project.get("id", ""), "name": project_name}
                    projects.append(project)
            else:
                # Get all projects if no organization specified
                url = f"{self._base_url}/projects/"
                response = await self._client.get(url)
                response.raise_for_status()
                projects_response = response.json()

                for project in projects_response:
                    project_name = project.get("name", "")

                    # Apply search filter if provided
                    if search and search.lower() not in project_name.lower():
                        continue

                    project = {"id": project.get("id", ""), "name": project_name}
                    projects.append(project)

            logger.info(
                "Successfully fetched Sentry projects",
                extra={"count": len(projects), "organization": self._organization},
            )

            return projects

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Sentry projects",
                extra={"status_code": e.response.status_code, "response": e.response.text},
            )
            raise
        except Exception as e:
            logger.error("Unexpected error fetching Sentry projects", extra={"error": str(e)})
            raise

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
        """List incidents from Sentry (using issues as incidents)."""
        try:
            incidents: list[IncidentResponse] = []

            if self._organization:
                # Get issues for the organization
                url = f"{self._base_url}/organizations/{self._organization}/issues/"
                params: dict[str, Any] = {
                    "limit": min(limit, 100),
                    "sort": "date",
                }

                # Handle time range parameters
                if start_time and end_time:
                    try:
                        # Parse ISO format with proper timezone handling
                        if start_time.endswith("Z"):
                            since = datetime.fromisoformat(start_time.replace("Z", "+00:00"))
                        elif "+" in start_time or start_time.endswith("T"):
                            since = (
                                datetime.fromisoformat(start_time)
                                if "+" in start_time
                                else datetime.fromisoformat(start_time + "+00:00")
                            )
                        else:
                            since = datetime.fromisoformat(start_time).replace(tzinfo=UTC)

                        if end_time.endswith("Z"):
                            until = datetime.fromisoformat(end_time.replace("Z", "+00:00"))
                        elif "+" in end_time or end_time.endswith("T"):
                            until = (
                                datetime.fromisoformat(end_time)
                                if "+" in end_time
                                else datetime.fromisoformat(end_time + "+00:00")
                            )
                        else:
                            until = datetime.fromisoformat(end_time).replace(tzinfo=UTC)

                        params["start"] = since.timestamp()
                        params["end"] = until.timestamp()
                    except Exception as e:
                        logger.warning(
                            "Failed to parse start_time/end_time as ISO format, using raw values",
                            extra={"start_time": start_time, "end_time": end_time, "error": str(e)},
                        )

                # Add environment filter if provided
                if environment:
                    params["environment"] = environment

                if project_id:
                    params["project"] = project_id
                else:
                    params["project"] = -1

                response = await self._client.get(url, params=params)
                response.raise_for_status()
                issues = response.json()

                for issue in issues:
                    issue_title = issue.get("title", "")

                    # Apply search filter if provided
                    if search and search.lower() not in issue_title.lower():
                        continue

                    incident = IncidentResponse(
                        id=issue.get("id", ""),
                        title=issue_title,
                        type="error",
                        link=issue.get("permalink", ""),
                        last_seen=issue.get("lastSeen", datetime.now(UTC).isoformat()),
                        status=issue.get("status", "unknown"),
                        created=issue.get("firstSeen", ""),
                        incident_public_id=issue.get("id", ""),
                        agent_payload=issue,
                    )
                    incidents.append(incident)

            logger.info(
                "Successfully fetched Sentry incidents",
                extra={
                    "count": len(incidents),
                    "project_id": project_id,
                    "start_time": start_time,
                    "end_time": end_time,
                    "search": search,
                    "environment": environment,
                },
            )

            logger.info(f"Sentry incidents {incidents}")

            return incidents

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Sentry incidents",
                extra={"status_code": e.response.status_code, "response": e.response.text},
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error fetching Sentry incidents",
                extra={"error": str(e)},
            )
            raise

    async def get_incident(
        self,
        *,
        incident_url: str | None = None,
        **kwargs: Any,
    ) -> IncidentResponse:
        """Get a specific incident by ID from Sentry."""
        try:
            incident_id = self._parse_incident_url(url=incident_url)["incident_id"]
            # Try to get the issue directly if we have organization
            if self._organization:
                # First try organization-level issue
                url = f"{self._base_url}/organizations/{self._organization}/issues/{incident_id}/"

                try:
                    response = await self._client.get(url)
                    response.raise_for_status()
                    issue = response.json()

                    incident = IncidentResponse(
                        id=issue.get("id", ""),
                        title=issue.get("title", ""),
                        type="incident",
                        link=issue.get("permalink", ""),
                        last_seen=issue.get("lastSeen", datetime.now(UTC).isoformat()),
                        created=issue.get("created", datetime.now(UTC).isoformat()),
                        agent_payload=issue,
                    )

                    logger.info(
                        "Successfully fetched Sentry incident",
                        extra={"incident_id": incident_id},
                    )

                    return incident

                except httpx.HTTPStatusError:
                    logger.info(
                        "Successfully fetched Sentry incident",
                        extra={"incident_id": incident_id},
                    )
                    raise

            else:
                raise ValueError("Organization is required to fetch specific incidents")

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Sentry incident",
                extra={"status_code": e.response.status_code, "incident_id": incident_id},
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error fetching Sentry incident",
                extra={"error": str(e), "incident_id": incident_id},
            )
            raise

    async def list_services(
        self,
        *,
        search: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List services from Sentry (using projects as services)."""
        return []

    async def list_environments(
        self,
        *,
        project_id: str,
        search: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List environments for Sentry project."""
        try:
            environments: list[dict[str, Any]] = []

            if self._organization and project_id and project_id != "default":
                # Get environments for the specific project
                url = f"{self._base_url}/projects/{self._organization}/{project_id}/environments/"

                try:
                    response = await self._client.get(url)
                    response.raise_for_status()
                    env_data = response.json()

                    for env in env_data:
                        env_name = env.get("name", "")

                        # Apply search filter if provided
                        if search and search.lower() not in env_name.lower():
                            continue

                        environments.append(
                            {
                                "id": env.get("id", env_name),
                                "name": env_name,
                                "description": f"Sentry environment: {env_name}",
                            }
                        )

                except httpx.HTTPStatusError:
                    # If project-specific environments fail, provide defaults
                    pass

            # If no environments found or no specific project, provide defaults
            if not environments:
                default_envs = ["production", "staging", "development"]
                for env_name in default_envs:
                    # Apply search filter if provided
                    if search and search.lower() not in env_name.lower():
                        continue

                    environments.append(
                        {
                            "id": f"env-{env_name}",
                            "name": env_name,
                            "description": f"Default {env_name} environment",
                        }
                    )

            logger.info(
                "Successfully fetched Sentry environments",
                extra={"count": len(environments), "project_id": project_id},
            )

            return environments

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Sentry environments",
                extra={"status_code": e.response.status_code, "project_id": project_id},
            )
            # Return default environments on error
            default_envs = ["production", "staging", "development"]
            return [
                {
                    "id": f"env-{env_name}",
                    "name": env_name,
                    "description": f"Default {env_name} environment",
                }
                for env_name in default_envs
                if not search or search.lower() in env_name.lower()
            ]
        except Exception as e:
            logger.error(
                "Unexpected error fetching Sentry environments",
                extra={"error": str(e), "project_id": project_id},
            )
            # Return default environments on error
            default_envs = ["production", "staging", "development"]
            return [
                {
                    "id": f"env-{env_name}",
                    "name": env_name,
                    "description": f"Default {env_name} environment",
                }
                for env_name in default_envs
                if not search or search.lower() in env_name.lower()
            ]

    async def aclose(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
        logger.debug("Sentry client closed")

    def _parse_incident_url(self, url: str | None = None) -> dict[str, str]:
        if not url:
            raise HTTPException(status_code=400, detail="Incident URL is required")

        path = urlparse(url).path
        host = urlparse(url).netloc

        if "sentry.io" not in host:
            raise HTTPException(status_code=400, detail=f"Invalid URL: {url}, expected domain: {self._base_url}")
        if "/issues/" not in path:
            raise HTTPException(status_code=400, detail=f"Invalid URL: {url}, expected path: /issues/")
        incident_id = path.split("/issues/")[-1].split("/")[0]

        return {"incident_id": incident_id, "provider": "sentry"}
