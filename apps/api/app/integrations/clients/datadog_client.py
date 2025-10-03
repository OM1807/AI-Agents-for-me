"""Datadog client for monitoring, logs, and incident data retrieval."""

from __future__ import annotations

from collections.abc import Iterable
from datetime import UTC, datetime, timedelta
from typing import Any
from urllib.parse import urlparse

import httpx
from fastapi import HTTPException

from app.integrations.clients.base import IntegrationClient, UnifiedMonitoringOps
from app.integrations.enums import IntegrationCapability
from app.schemas.monitoring import IncidentResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)


class DatadogClient(UnifiedMonitoringOps, IntegrationClient):
    """Datadog client for monitoring, logs, and incident data retrieval."""

    def __init__(self, *, credentials: dict[str, Any]) -> None:
        """Initialize Datadog client with credentials.

        Args:
            credentials: Dict containing:
                - token: Datadog API key (DD_API_KEY)
                - app_key: Datadog Application key (DD_APP_KEY)
                - site: Datadog site (optional, defaults to datadoghq.com)
        """
        self.validate_credentials(credentials=credentials)
        self._api_key = credentials["token"]
        self._app_key = credentials.get("app_key") or credentials.get("DD_APP_KEY")
        self._site = credentials.get("site", "datadoghq.com")

        if not self._app_key:
            raise ValueError("Datadog application key (app_key or DD_APP_KEY) is required")

        # Datadog API endpoints
        self._base_url = f"https://api.{self._site}"

        # Initialize HTTP client with auth headers
        self._client = httpx.AsyncClient(
            headers={
                "DD-API-KEY": self._api_key,
                "DD-APPLICATION-KEY": self._app_key,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

        logger.info(
            "Datadog client initialized",
            extra={
                "site": self._site,
                "base_url": self._base_url,
            },
        )

    def validate_credentials(self, *, credentials: dict[str, Any]) -> None:
        """Validate Datadog credentials."""
        if not credentials.get("token"):
            raise ValueError("Datadog API key is required")

    def capabilities(self) -> Iterable[IntegrationCapability]:
        """Return capabilities supported by Datadog client."""
        return [
            IntegrationCapability.SERVICES,
            IntegrationCapability.INCIDENTS,
            IntegrationCapability.METRICS,
            IntegrationCapability.LOGS,
            IntegrationCapability.ALERTS,
        ]

    async def list_services(
        self,
        *,
        search: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List services from Datadog."""
        try:
            services: list[dict[str, Any]] = []
            auth_errors: list[str] = []  # Track authentication failures

            # Primary endpoint: Service Catalog API (preferred)
            try:
                url: str = f"{self._base_url}/api/v2/services/definitions"
                response = await self._client.get(url)

                # Check for authentication/authorization errors
                if response.status_code in [401, 403]:
                    raise httpx.HTTPStatusError(
                        message=f"Authentication failed: {response.status_code}",
                        request=response.request,
                        response=response,
                    )

                if response.status_code == 200:
                    data: dict[str, Any] = response.json()
                    if "data" in data:
                        for service_data in data["data"]:
                            attributes: dict[str, Any] = service_data.get("attributes", {})
                            service_schema: dict[str, Any] = attributes.get("schema", {})

                            service = {
                                "id": service_data.get("id"),
                                "name": service_schema.get("dd-service", ""),
                                "description": service_schema.get("description", ""),
                                "last_updated": attributes.get("metadata", {}).get(
                                    "last-modified-time", datetime.now(UTC).isoformat()
                                ),
                                "type": service_data.get("type"),
                            }
                            services.append(service)

                        if services:
                            logger.info(f"Successfully retrieved {len(services)} services from service catalog")
                            return services
            except httpx.HTTPStatusError as e:
                if e.response.status_code in [401, 403]:
                    auth_errors.append(f"Service catalog: {e.response.status_code}")
                logger.debug(f"Service catalog endpoint failed: {e}")
            except Exception as e:
                logger.debug(f"Service catalog endpoint failed: {e}")

            # Fallback: Use hosts with service tags
            try:
                url = f"{self._base_url}/api/v1/hosts"
                params = {"include_aliases": "false", "include_muted_hosts_data": "false"}
                response = await self._client.get(url, params=params)

                # Check for authentication/authorization errors
                if response.status_code in [401, 403]:
                    raise httpx.HTTPStatusError(
                        message=f"Authentication failed: {response.status_code}",
                        request=response.request,
                        response=response,
                    )

                if response.status_code == 200:
                    data = response.json()
                    host_list = data.get("host_list", [])
                    service_set: set[str] = set()

                    for host in host_list:
                        tags = host.get("tags_by_source", {})
                        for source, tag_list in tags.items():
                            for tag in tag_list:
                                if tag.startswith("service:"):
                                    service_name = tag.split(":", 1)[1]

                                    # Apply search filter
                                    if search and search.lower() not in service_name.lower():
                                        continue

                                    if service_name not in service_set:
                                        service_set.add(service_name)
                                        services.append(
                                            {
                                                "id": f"service-{service_name}",
                                                "name": service_name,
                                                "description": f"Service from host tags (source: {source})",
                                                "last_updated": datetime.now(UTC).isoformat(),
                                                "type": "host_service",
                                            }
                                        )

                    if services:
                        logger.info(f"Successfully retrieved {len(services)} services from host tags")
                        return services
            except httpx.HTTPStatusError as e:
                if e.response.status_code in [401, 403]:
                    auth_errors.append(f"Host tags: {e.response.status_code}")
                logger.debug(f"Host tags endpoint failed: {e}")
            except Exception as e:
                logger.debug(f"Host tags endpoint failed: {e}")

            # Check if all endpoints failed due to authentication
            if len(auth_errors) >= 2:  # All 2 endpoints failed with auth errors
                raise ValueError(f"Authentication failed for all Datadog endpoints: {', '.join(auth_errors)}")

            # No fallback to default services - return empty if nothing found
            if not services:
                logger.info("No Datadog services found with current credentials and search criteria")

            logger.info(
                "Successfully fetched Datadog services",
                extra={"count": len(services), "search": search},
            )

            return services

        except Exception as e:
            logger.error(
                "Unexpected error fetching Datadog services",
                extra={"error": str(e), "search": search},
            )
            # Re-raise the exception so the caller knows there was an authentication/API issue
            raise

    async def list_projects(
        self,
        *,
        search: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List projects from Datadog (using teams/organizations)."""
        try:
            # In Datadog, "projects" can be represented as teams or service groups
            url = f"{self._base_url}/api/v2/team"

            response = await self._client.get(url)
            response.raise_for_status()
            data = response.json()

            projects: list[dict[str, Any]] = []
            if "data" in data:
                for team_data in data["data"]:
                    attributes = team_data.get("attributes", {})
                    team_name = attributes.get("name", "")

                    # Apply search filter if provided
                    if search and search.lower() not in team_name.lower():
                        continue

                    project = {
                        "id": team_data.get("id", ""),
                        "name": team_name,
                    }
                    projects.append(project)

            logger.info(
                "Successfully fetched Datadog projects",
                extra={"count": len(projects)},
            )

            return projects

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Datadog projects",
                extra={"status_code": e.response.status_code, "response": e.response.text},
            )
            # Return default project on error
            return []
        except Exception as e:
            logger.error(
                "Unexpected error fetching Datadog projects",
                extra={"error": str(e)},
            )
            # Return default project on error
            return []

    async def list_incidents(
        self,
        *,
        start_time: str | None = None,
        end_time: str | None = None,
        search: str | None = None,
        environment: str | None = None,
        limit: int = 100,
        **kwargs: Any,
    ) -> list[IncidentResponse]:
        """List incidents from Datadog using the new incidents search API."""
        try:
            # Parse additional kwargs
            now: datetime = datetime.now(UTC)
            since: datetime = now - timedelta(days=365)
            until: datetime = now
            timezone = kwargs.get("timeZone", "Asia/Calcutta")  # Default timezone
            offset = kwargs.get("offset", 0)

            # Calculate proper time range with timezone handling

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

                except ValueError as ve:
                    logger.warning(f"Failed to parse provided timestamps: {ve}. Using fallback range.")

            # Convert to Unix timestamps
            created_after = int(since.timestamp())
            created_before = int(until.timestamp())

            # Build query string for flexible parameter handling
            query_parts = [f"created_after:{created_after}", f"created_before:{created_before}", "state:active"]

            # Add any additional search terms
            if search:
                query_parts.append(search)

            # Add environment filter if provided
            if environment:
                query_parts.append(f"env:{environment}")

            # Construct the API URL and parameters
            url = f"{self._base_url}/api/v2/incidents/search"

            # Build flexible parameters dict
            params: dict[str, Any] = {
                "query": " ".join(query_parts),
                "timeZone": timezone,
                "page[offset]": offset,
                "page[limit]": min(limit, 100),
                "filter[field_type]": "all",
                "with_facets": "true",
            }

            # Allow any additional kwargs to be passed as parameters
            for key, value in kwargs.items():
                if key not in ["last_days", "status", "timeZone", "offset"] and not key.startswith("_"):
                    # Handle nested parameters like filter[something]
                    params[key] = value

            logger.info(
                "Fetching Datadog incidents",
                extra={
                    "url": url,
                    "query": params["query"],
                    "limit": params["page[limit]"],
                    "timezone": timezone,
                },
            )

            response = await self._client.get(url, params=params)
            response.raise_for_status()
            data: dict[str, Any] = response.json()

            incidents: list[IncidentResponse] = []
            res_incidents_data: list[dict[str, Any]] = data.get("data", {}).get("attributes", {}).get("incidents", [])
            if res_incidents_data:
                for incident_data in res_incidents_data:
                    attributes = incident_data.get("data", {}).get("attributes", {})
                    incident_title = attributes.get("title", "")

                    incident = IncidentResponse(
                        id=incident_data.get("data", {}).get("id"),
                        title=incident_title,
                        type=incident_data.get("data", {}).get("type", "incident"),
                        link=f"https://app.{self._site}/incidents/{attributes.get('public_id', '')}",
                        last_seen=attributes.get("modified", attributes.get("created", now.isoformat())),
                        status=attributes.get("state", "unknown"),
                        created=attributes.get("created", now.isoformat()),
                        incident_public_id=str(attributes.get("public_id", "")),
                        agent_payload=incident_data,
                    )
                    incidents.append(incident)

            logger.info(
                "Successfully fetched Datadog incidents",
                extra={
                    "count": len(incidents),
                    "time_range": f"{since.isoformat()} to {until.isoformat()}",
                    "query": params["query"],
                },
            )

            return incidents

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Datadog incidents",
                extra={
                    "status_code": e.response.status_code,
                    "response": e.response.text if e.response else None,
                },
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error fetching Datadog incidents",
                extra={"error": str(e)},
            )
            raise

    async def get_incident(
        self,
        *,
        incident_url: str | None = None,
        **kwargs: Any,
    ) -> IncidentResponse:
        """Get a specific incident by ID from Datadog."""
        try:
            if not incident_url:
                raise HTTPException(
                    status_code=400,
                    detail="Incident URL is required",
                )
            incident_id = self._parse_incident_url(url=incident_url)["incident_id"]
            if not incident_id:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid URL: {incident_url}, expected path: /incidents/",
                )
            # Use Datadog's incidents API to get specific incident
            url = f"{self._base_url}/api/v2/incidents/{incident_id}"

            response = await self._client.get(url)
            response.raise_for_status()
            data: Any = response.json()

            if "data" in data:
                incident_data = data["data"]
                attributes = incident_data.get("attributes", {})

                # Map Datadog incident to our standard format
                incident = IncidentResponse(
                    id=incident_data.get("id", ""),
                    title=attributes.get("title", ""),
                    type="incident",
                    created=attributes.get("created", datetime.now(UTC).isoformat()),
                    link=f"https://app.{self._site}/incidents/{attributes.get('public_id', '')}",
                    last_seen=attributes.get("modified", attributes.get("created", datetime.now(UTC).isoformat())),
                    incident_public_id=str(attributes.get("public_id", "")),
                    agent_payload=attributes,
                )

                logger.info(
                    "Successfully fetched Datadog incident",
                    extra={"incident_id": incident_id},
                )

                return incident
            else:
                raise HTTPException(
                    status_code=404,
                    detail=f"Incident {incident_id} not found",
                )

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Datadog incident",
                extra={"status_code": e.response.status_code, "incident_id": incident_id},
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error fetching Datadog incident",
                extra={"error": str(e), "incident_id": incident_id},
            )
            raise

    async def list_environments(
        self,
        *,
        project_id: str,
        search: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List environments for Datadog (using tags or service environments)."""
        try:
            # In Datadog, environments are typically represented as service tags
            # We'll try to get environment information from service catalog or tags
            url = f"{self._base_url}/api/v1/tags/hosts"

            response = await self._client.get(url)
            response.raise_for_status()
            data: Any = response.json()

            environments: list[dict[str, Any]] = []
            env_set: set[str] = set()

            # Extract environment tags from host tags
            if "tags" in data:
                for _, tags in data["tags"].items():
                    for tag in tags:
                        if tag.startswith("env:") or tag.startswith("environment:"):
                            env_name = tag.split(":", 1)[1]

                            # Apply search filter if provided
                            if search and search.lower() not in env_name.lower():
                                continue

                            if env_name not in env_set:
                                env_set.add(env_name)
                                environments.append(
                                    {
                                        "id": f"env-{env_name}",
                                        "name": env_name,
                                        "description": f"Datadog environment: {env_name}",
                                    }
                                )

            # If no environments found from tags, provide default environments
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
                "Successfully fetched Datadog environments",
                extra={"count": len(environments), "project_id": project_id},
            )

            return environments

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Datadog environments",
                extra={"status_code": e.response.status_code, "project_id": project_id},
            )
            return []
        except Exception as e:
            logger.error(
                "Unexpected error fetching Datadog environments",
                extra={"error": str(e), "project_id": project_id},
            )
            return []

    async def aclose(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
        logger.debug("Datadog client closed")

    def _parse_incident_url(self, url: str) -> dict[str, Any]:
        """Parse incident URL and return incident ID."""
        path = urlparse(url).path
        host = urlparse(url).netloc

        if self._site not in host:
            raise HTTPException(status_code=400, detail=f"Invalid URL: {url}, expected domain: {self._site}")
        if "/incidents/" not in path:
            raise HTTPException(status_code=400, detail=f"Invalid URL: {url}, expected path: /incidents/")
        incident_id = path.split("/incidents/")[-1].split("/")[0]

        return {"provider": "datadog", "incident_id": incident_id}
