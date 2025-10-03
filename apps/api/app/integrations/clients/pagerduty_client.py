"""PagerDuty client for incident management and monitoring data retrieval."""

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


class PagerDutyClient(UnifiedMonitoringOps, IntegrationClient):
    """PagerDuty client for incident management and monitoring data retrieval."""

    def __init__(self, *, credentials: dict[str, Any]) -> None:
        """Initialize PagerDuty client with credentials.

        Args:
            credentials: Dict containing:
                - token: PagerDuty API token (Integration key or API token)
                - email: User email for authentication (required for some API calls)
        """
        self.validate_credentials(credentials=credentials)
        self._api_token = credentials["token"]
        self._email = credentials.get("email")

        # PagerDuty API endpoint
        self._base_url = "https://api.pagerduty.com"

        # Initialize HTTP client with auth headers
        headers = {
            "Authorization": f"Token token={self._api_token}",
            "Accept": "application/vnd.pagerduty+json;version=2",
            "Content-Type": "application/json",
        }

        if self._email:
            headers["From"] = self._email

        self._client = httpx.AsyncClient(
            headers=headers,
            timeout=30.0,
        )

        logger.info(
            "PagerDuty client initialized",
            extra={
                "base_url": self._base_url,
                "has_email": bool(self._email),
            },
        )

    def validate_credentials(self, *, credentials: dict) -> None:
        """Validate PagerDuty credentials."""
        if not credentials.get("token"):
            raise ValueError("PagerDuty API token is required")

    def capabilities(self) -> Iterable[IntegrationCapability]:
        """Return capabilities supported by PagerDuty client."""
        return [
            IntegrationCapability.SERVICES,
            IntegrationCapability.INCIDENTS,
            IntegrationCapability.ALERTS,
        ]

    async def list_services(self, **filters: Any) -> list[dict]:
        """List services from PagerDuty."""
        try:
            url = f"{self._base_url}/services"
            params = {"limit": 100, "offset": 0}

            response = await self._client.get(url, params=params)
            response.raise_for_status()
            data = response.json()

            services = []
            for service_data in data.get("services", []):
                service = {
                    "id": service_data.get("id", ""),
                    "name": service_data.get("name", ""),
                    "description": service_data.get("description", ""),
                    "last_updated": service_data.get(
                        "last_incident_timestamp", service_data.get("created_at", datetime.utcnow().isoformat())
                    ),
                }
                services.append(service)

            logger.info(
                "Successfully fetched PagerDuty services",
                extra={"count": len(services)},
            )

            return services

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching PagerDuty services",
                extra={"status_code": e.response.status_code, "response": e.response.text},
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error fetching PagerDuty services",
                extra={"error": str(e)},
            )
            raise

    async def list_projects(self, **filters: Any) -> list[dict]:
        """List projects from PagerDuty."""
        return []

    async def list_incidents(
        self,
        *,
        start_time: str | None = None,  # ISO format
        end_time: str | None = None,  # ISO format
        service_id: str | None = None,
        limit: int = 100,
        environment: str | None = None,
        project_id: str | None = None,
        entity_name: str | None = None,
        search: str | None = None,
        **filters: Any,
    ) -> list[IncidentResponse]:
        """List incidents from PagerDuty."""
        try:
            # Fallback limit
            limit = filters.get("limit", limit)
            url = f"{self._base_url}/incidents"
            params: dict[str, Any] = {
                "since": start_time,
                "until": end_time,
                "limit": min(limit, 100),  # PagerDuty max is 100
            }

            # Add service_id filter if provided
            if service_id:
                params["service_ids[]"] = [service_id]

            if not (start_time and end_time):
                params["date_range"] = "all"

            logger.info(
                "Making PagerDuty incidents API request",
                extra={
                    "url": url,
                    "params": params,
                    "service_id": service_id,
                    "time_range": f"{start_time} to {end_time}",
                },
            )

            response = await self._client.get(url, params=params)

            # Log response details before raising for status
            logger.info(
                "PagerDuty incidents API response received",
                extra={
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "response_preview": response.text[:500] if len(response.text) > 500 else response.text,
                },
            )

            response.raise_for_status()
            data = response.json()

            incidents = []
            for incident_data in data.get("incidents", []):
                # Extract required fields for IncidentResponse schema
                created_at = incident_data.get("created_at", datetime.now(UTC).isoformat())
                last_status_change = incident_data.get("last_status_change_at", created_at)

                incident = IncidentResponse(
                    id=incident_data.get("id", ""),
                    title=incident_data.get("title", ""),
                    type="incident",
                    link=incident_data.get("html_url", ""),
                    last_seen=last_status_change,
                    status=incident_data.get("status", "unknown"),  # Required field
                    created=created_at,  # Required field
                    incident_public_id=str(incident_data.get("incident_id", "")),
                    agent_payload=incident_data,
                )
                incidents.append(incident)

            logger.info(
                "Successfully fetched PagerDuty incidents",
                extra={"count": len(incidents), "since": start_time, "until": end_time},
            )

            return incidents

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching PagerDuty incidents",
                extra={
                    "status_code": e.response.status_code,
                    "response": e.response.text,
                    "request_url": str(e.request.url),
                    "request_params": params,
                },
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error fetching PagerDuty incidents",
                extra={"error": str(e)},
            )
            raise

    async def get_incident(
        self,
        *,
        incident_url: str | None = None,
        **kwargs: Any,
    ) -> IncidentResponse:
        incident_id = self._parse_incident_url(url=incident_url)["incident_id"]
        if not incident_id:
            raise HTTPException(
                status_code=400,
                detail="incidentid not present in the URL",
            )

        try:
            url = f"{self._base_url}/incidents/{incident_id}"
            response = await self._client.get(url)
            response.raise_for_status()
            data = response.json()
            incident_data = data.get("incident", {})

            incident = IncidentResponse(
                id=incident_data.get("id", ""),
                incident_public_id=incident_data.get("incident_id", ""),
                title=incident_data.get("title", ""),
                type=incident_data.get("type", "incident"),
                link=incident_data.get("html_url", ""),
                last_seen=incident_data.get(
                    "last_status_change_at", incident_data.get("created_at", datetime.now(UTC).isoformat())
                ),
                status=incident_data.get("status", "unknown"),
                created=incident_data.get("created_at", datetime.now(UTC).isoformat()),
                agent_payload=incident_data,
            )
            logger.info(
                "Successfully fetched Sentry incident",
                extra={"incident_id": incident_id},
            )

            return incident

        except Exception as e:
            logger.error(
                "Unexpected error fetching PagerDuty incident",
                extra={"error": str(e)},
            )
            raise

    async def aclose(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
        logger.debug("PagerDuty client closed")

    def _parse_incident_url(self, url: str | None = None) -> dict[str, str]:
        host = urlparse(url).netloc

        if not url:
            raise HTTPException(status_code=400, detail="Incident URL is required")

        if "pagerduty.com" not in host:
            raise HTTPException(status_code=400, detail=f"Invalid URL: {url}, expected domain: {self._base_url}")
        if "/incidents/" not in url:
            raise HTTPException(status_code=400, detail=f"Invalid URL: {url}, expected path: /incidents/")
        incident_id = url.split("/incidents/")[-1].split("/")[0]

        return {"incident_id": incident_id, "provider": "pagerduty"}
