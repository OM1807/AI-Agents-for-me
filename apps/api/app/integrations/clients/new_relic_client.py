"""New Relic client for monitoring, logs, and incident data retrieval."""

from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime, timedelta
from typing import Any

import httpx

from app.integrations.clients.base import IntegrationClient, UnifiedMonitoringOps
from app.integrations.enums import IntegrationCapability
from app.schemas.monitoring import IncidentResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)


class NewRelicClient(UnifiedMonitoringOps, IntegrationClient):
    """New Relic client for monitoring, logs, and incident data retrieval."""

    def __init__(self, *, credentials: dict[str, Any]) -> None:
        """Initialize New Relic client with credentials.

        Args:
            credentials: Dict containing:
                - token: New Relic API key (User API key or License key)
                - account_id: New Relic account ID (optional)
                - region: New Relic region (US or EU, optional, defaults to US)
        """
        self.validate_credentials(credentials=credentials)
        self._api_key = credentials["api_key"]
        self._account_id: Any | None = credentials.get("account_id")
        self._region = credentials.get("region", "US")

        # New Relic API endpoints (NerdGraph GraphQL API)
        if self._region.upper() == "EU":
            self._graphql_url = "https://api.eu.newrelic.com/graphql"
        else:
            self._graphql_url = "https://api.newrelic.com/graphql"

        # Initialize HTTP client with auth headers
        self._client = httpx.AsyncClient(
            headers={
                "Api-Key": self._api_key,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

        logger.info(
            "New Relic client initialized",
            extra={
                "region": self._region,
                "graphql_url": self._graphql_url,
                "has_account_id": bool(self._account_id),
            },
        )

    def validate_credentials(self, *, credentials: dict) -> None:
        """Validate New Relic credentials."""
        if not credentials.get("api_key"):
            raise ValueError("New Relic API key is required")

    def capabilities(self) -> Iterable[IntegrationCapability]:
        """Return capabilities supported by New Relic client."""
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
        limit: int = 100,
        offset: int = 0,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """Simplified version to get all entities without pagination complexity."""

        # Use a query that matches all entities - this gets everything
        query = """
        query {
            actor {
                entitySearch(query: "domain='APM'") {
                count
                results {
                    entities {
                    guid
                    name
                    reporting
                    entityType
                    domain
                    }
                }
                }
            }
        }
        """

        try:
            payload = {"query": query}
            response = await self._client.post(self._graphql_url, json=payload)
            response.raise_for_status()
            data = response.json()

            if "errors" in data:
                logger.error("GraphQL errors", extra={"errors": data["errors"]})
                raise ValueError(f"GraphQL errors: {data['errors']}")

            entities = (
                data.get("data", {}).get("actor", {}).get("entitySearch", {}).get("results", {}).get("entities", [])
            )

            # Convert to your format
            result = []
            for entity in entities:
                result.append(
                    {
                        "id": entity.get("guid", ""),
                        "name": entity.get("name", ""),
                        "description": f"New Relic {entity.get('domain', 'Unknown')}",
                        "type": entity.get("entityType", ""),
                        "domain": entity.get("domain", ""),
                        "alert_severity": entity.get("alertSeverity", "NOT_ALERTING"),
                        "reporting": entity.get("reporting", False),
                        "last_updated": datetime.utcnow().isoformat(),
                    }
                )

            logger.info(f"Fetched {len(result)} entities from New Relic")
            return result

        except Exception as e:
            logger.error(f"Error fetching entities: {e}")
            raise

    async def list_projects(
        self,
        *,
        search: str | None = None,
        limit: int = 100,
        offset: int = 0,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List projects from New Relic (using accounts)."""
        return []

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
        offset: int = 0,
        **kwargs: Any,
    ) -> list[IncidentResponse]:
        """
        List incidents from New Relic using aiIssues.incidents GraphQL API.

        Fetches incidents using the aiIssues.incidents query with entity filtering.
        Requires both service_id (entity_guid) and account_id to be provided.

        Args:
            start_time: Start time in ISO format (optional)
            end_time: End time in ISO format (optional)
            search: Search query to filter incidents (optional)
            service_id: Entity GUID to filter incidents (required for aiIssues query)
            limit: Maximum number of results to return
            offset: Offset for pagination
            **kwargs: Additional keyword arguments

        Returns:
            List of incidents in standard API response format
        """
        try:
            # Validate required parameters
            if not service_id:
                logger.warning("service_id is required for aiIssues incidents query, returning empty list")
                return []

            if not self._account_id:
                logger.warning("account_id is required for aiIssues incidents query, returning empty list")
                return []

            # Set default time range if not provided
            if not start_time or not end_time:
                now = datetime.utcnow()
                last_days = kwargs.get("last_days", 7)
                end_dt = now
                start_dt = now - timedelta(days=last_days)
                start_time = start_dt.strftime("%Y-%m-%dT%H:%M:%SZ")
                end_time = end_dt.strftime("%Y-%m-%dT%H:%M:%SZ")

            # Prepare headers with experimental opt-in
            headers = {
                "Api-Key": self._api_key,
                "Content-Type": "application/json",
                "nerd-graph-unsafe-experimental-opt-in": "AiIssues",
            }

            # GraphQL query for aiIssues incidents
            query = """
            query QueryIncidents($accountId: Int!, $entityGuids: [EntityGuid!]) {
              actor {
                account(id: $accountId) {
                  aiIssues {
                    incidents(filter: {entityGuids: $entityGuids}) {
                      incidents {
                        incidentId
                        title
                        description
                        priority
                        state
                        updatedAt
                        createdAt
                        closedAt
                        ... on AiIssuesNewRelicIncident {
                          policyIds
                          conditionFamilyId
                          accountIds
                        }
                      }
                    }
                  }
                }
              }
            }
            """

            variables = {"accountId": int(self._account_id), "entityGuids": [service_id]}

            # Execute GraphQL query
            payload = {"query": query, "variables": variables}
            response = await self._client.post(self._graphql_url, headers=headers, json=payload)
            response.raise_for_status()
            data = response.json()

            # Check for GraphQL errors
            if "errors" in data:
                logger.error("GraphQL errors in aiIssues incidents query", extra={"errors": data["errors"]})
                raise ValueError(f"GraphQL errors: {data['errors']}")

            # Extract raw incidents from response
            raw_incidents = (
                data.get("data", {})
                .get("actor", {})
                .get("account", {})
                .get("aiIssues", {})
                .get("incidents", {})
                .get("incidents", [])
            )

            logger.info(f"Fetched {len(raw_incidents)} incidents from aiIssues for entity {service_id}")

            # Convert to standard incidents API format
            incidents: list[IncidentResponse] = []
            for incident in raw_incidents:
                converted_incident = IncidentResponse(
                    id=incident.get("incidentId", ""),
                    title=incident.get("title", "New Relic Incident"),
                    description=incident.get("description", ""),
                    type="ai_incident",
                    link=f"https://one.newrelic.com/redirect/incidents/{incident.get('incidentId', '')}",
                    last_seen=incident.get("updatedAt", incident.get("createdAt", "")),
                    created=incident.get("createdAt", ""),
                    status=incident.get("state", "UNKNOWN"),
                    incident_public_id=str(incident.get("incidentId", "")),
                    agent_payload=incident,
                )
                incidents.append(converted_incident)

            return incidents

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching New Relic incidents",
                extra={"status_code": e.response.status_code, "response": e.response.text},
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error fetching New Relic incidents",
                extra={"error": str(e)},
            )
            raise

    async def get_incident(
        self,
        *,
        incident_url: str | None = None,
        **kwargs: Any,
    ) -> IncidentResponse:
        return IncidentResponse(
            id="",
            title="",
            type="",
            link="",
            last_seen="",
            status="",
            created="",
        )

    async def aclose(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
        logger.debug("New Relic client closed")
