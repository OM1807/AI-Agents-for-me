"""Grafana client for monitoring, logs, and incident data retrieval."""

from __future__ import annotations

from collections.abc import Iterable
from datetime import datetime
from typing import Any

import httpx

from app.integrations.clients.base import IntegrationClient, UnifiedMonitoringOps
from app.integrations.enums import IntegrationCapability
from app.schemas.monitoring import IncidentResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)


class GrafanaClient(UnifiedMonitoringOps, IntegrationClient):
    """Grafana client for monitoring, logs, and incident data retrieval."""

    def __init__(self, *, credentials: dict[str, Any]) -> None:
        """Initialize Grafana client with credentials.

        Args:
            credentials: Dict containing:
                - token: Grafana API key or service account token
                - base_url: Grafana instance URL (required)
                - org_id: Organization ID (optional)
        """
        self.validate_credentials(credentials=credentials)
        self._token = credentials["token"]
        self._base_url = credentials["base_url"].rstrip("/")
        self._org_id = credentials.get("org_id")

        # Initialize HTTP client with auth headers
        headers = {
            "Authorization": f"Bearer {self._token}",
            "Content-Type": "application/json",
        }

        if self._org_id:
            headers["X-Grafana-Org-Id"] = str(self._org_id)

        self._client = httpx.AsyncClient(
            headers=headers,
            timeout=30.0,
        )

        logger.info(
            "Grafana client initialized",
            extra={
                "base_url": self._base_url,
                "has_org_id": bool(self._org_id),
            },
        )

    def validate_credentials(self, *, credentials: dict) -> None:
        """Validate Grafana credentials."""
        if not credentials.get("token"):
            raise ValueError("Grafana API token is required")
        if not credentials.get("base_url"):
            raise ValueError("Grafana base URL is required")

    def capabilities(self) -> Iterable[IntegrationCapability]:
        """Return capabilities supported by Grafana client.

        Note: Grafana is primarily a monitoring and observability platform.
        We map its capabilities to our unified interface as follows:
        - SERVICES: Monitoring targets (dashboards)
        - DATA_SOURCES: Configured data sources
        - INCIDENTS: Active alerts (closest thing to incidents)
        - METRICS: Built-in capability
        - ALERTS: Built-in capability

        Note: LOGS are handled via MCP integration based on user prompts.
        """
        return [
            IntegrationCapability.SERVICES,  # Monitoring targets (dashboards)
            IntegrationCapability.DATA_SOURCES,  # Data sources
            IntegrationCapability.INCIDENTS,  # Active alerts
            IntegrationCapability.METRICS,  # Time series data
            IntegrationCapability.ALERTS,  # Alert rules and instances
        ]

    async def list_services(self, **filters: Any) -> list[dict]:
        """List monitoring services from Grafana (dashboards).

        Note: Grafana doesn't have a service concept. We return dashboards
        that represent monitoring services.
        """
        try:
            services = []

            # Get dashboards as monitoring targets
            dashboards_url = f"{self._base_url}/api/search"
            params = {"type": "dash-db"}
            response = await self._client.get(dashboards_url, params=params)
            response.raise_for_status()
            dashboards = response.json()

            for dashboard in dashboards:
                service = {
                    "id": f"dashboard-{dashboard.get('id', '')}",
                    "name": dashboard.get("title", "Untitled Dashboard"),
                    "description": f"Monitoring dashboard: {dashboard.get('type', 'Unknown')}",
                    "type": "dashboard",
                    "url": f"{self._base_url}{dashboard.get('url', '')}",
                    "last_updated": dashboard.get("updated", datetime.utcnow().isoformat()),
                }
                services.append(service)

            logger.info(
                "Successfully fetched Grafana services (dashboards)",
                extra={"count": len(services)},
            )

            return services

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Grafana services",
                extra={"status_code": e.response.status_code, "response": e.response.text},
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error fetching Grafana services",
                extra={"error": str(e)},
            )
            raise

    async def list_data_sources(self, **filters: Any) -> list[dict]:
        """List data sources from Grafana.

        Returns all configured data sources in the Grafana instance.
        """
        try:
            data_sources = []

            # Get data sources
            datasources_url = f"{self._base_url}/api/datasources"
            response = await self._client.get(datasources_url)
            response.raise_for_status()
            datasources = response.json()

            for ds in datasources:
                data_source = {
                    "id": f"datasource-{ds.get('id', '')}",
                    "name": ds.get("name", "Unknown Data Source"),
                    "description": f"Data source: {ds.get('type', 'Unknown')}",
                    "type": ds.get("type", "unknown"),
                    "url": f"{self._base_url}/datasources/edit/{ds.get('id', '')}",
                    "last_updated": ds.get("updated", datetime.utcnow().isoformat()),
                    "is_default": ds.get("isDefault", False),
                    "read_only": ds.get("readOnly", False),
                    "access": ds.get("access", "proxy"),
                    "database": ds.get("database", ""),
                    "user": ds.get("user", ""),
                    "secure_json_fields": ds.get("secureJsonFields", {}),
                }
                data_sources.append(data_source)

            logger.info(
                "Successfully fetched Grafana data sources",
                extra={"count": len(data_sources)},
            )

            return data_sources

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Grafana data sources",
                extra={"status_code": e.response.status_code, "response": e.response.text},
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error fetching Grafana data sources",
                extra={"error": str(e)},
            )
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
        """List active alerts from Grafana (alerts are the closest thing to incidents).

        Note: Grafana doesn't have true incident management. We return active alerts
        which represent ongoing issues that need attention.
        """
        try:
            # Use the provided parameters
            status = "alerting"  # Default to active alerts for Grafana
            incidents = []

            # Get active alert instances from Alertmanager
            try:
                alerts_url = f"{self._base_url}/api/alertmanager/grafana/api/v2/alerts"
                params = {}
                if status:
                    params["filter"] = f"state={status}"

                response = await self._client.get(alerts_url, params=params)
                response.raise_for_status()
                alerts = response.json()

                # Convert alerts to incident-like objects
                for alert in alerts:
                    labels = alert.get("labels", {})
                    annotations = alert.get("annotations", {})

                    incident_data = {
                        "id": alert.get("fingerprint", ""),
                        "title": labels.get("alertname", "Unknown Alert"),
                        "description": annotations.get("description", ""),
                        "status": alert.get("status", {}).get("state", "unknown"),
                        "severity": labels.get("severity", "unknown"),
                        "type": "alert",
                        "url": f"{self._base_url}/alerting/list",
                        "created_at": alert.get("startsAt", datetime.utcnow().isoformat()),
                        "updated_at": alert.get("updatedAt", datetime.utcnow().isoformat()),
                        "labels": labels,
                        "annotations": annotations,
                    }
                    incidents.append(IncidentResponse.model_validate(incident_data))

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    # Alertmanager might not be configured
                    logger.warning("Alertmanager not configured, no alerts available")
                else:
                    raise

            # Also try to get alerts from Grafana's built-in alerting
            try:
                grafana_alerts_url = f"{self._base_url}/api/alerts"
                params = {"state": status} if status else {}
                response = await self._client.get(grafana_alerts_url, params=params)
                response.raise_for_status()
                grafana_alerts = response.json()

                for alert in grafana_alerts:
                    incident_data = {
                        "id": f"grafana-{alert.get('id', '')}",
                        "title": alert.get("name", "Unknown Alert"),
                        "description": alert.get("message", ""),
                        "status": alert.get("state", "unknown"),
                        "severity": "warning",  # Grafana doesn't have severity in this API
                        "type": "grafana_alert",
                        "url": f"{self._base_url}/alerting/list",
                        "created_at": alert.get("newStateDate", datetime.utcnow().isoformat()),
                        "updated_at": alert.get("newStateDate", datetime.utcnow().isoformat()),
                    }
                    incidents.append(IncidentResponse.model_validate(incident_data))

            except httpx.HTTPStatusError as e:
                if e.response.status_code == 404:
                    logger.debug("Grafana alerts API not available")
                else:
                    raise

            # Limit results
            incidents = incidents[:limit]

            logger.info(
                "Successfully fetched Grafana alerts (incidents)",
                extra={"count": len(incidents), "status": status},
            )

            return incidents

        except httpx.HTTPStatusError as e:
            logger.error(
                "HTTP error fetching Grafana alerts",
                extra={"status_code": e.response.status_code, "response": e.response.text},
            )
            raise
        except Exception as e:
            logger.error(
                "Unexpected error fetching Grafana alerts",
                extra={"error": str(e)},
            )
            raise

    async def aclose(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
        logger.debug("Grafana client closed")
