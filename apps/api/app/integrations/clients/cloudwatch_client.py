"""AWS CloudWatch client for monitoring, logs, and metrics data retrieval (Unified version)."""

from __future__ import annotations

import hashlib
import hmac
import json
import urllib.parse
from collections.abc import Iterable
from datetime import UTC, datetime
from typing import Any

import httpx

from app.integrations.clients.base import IntegrationClient, UnifiedMonitoringOps
from app.integrations.enums import IntegrationCapability
from app.schemas.monitoring import IncidentResponse
from app.utils.logger import get_logger

logger = get_logger(__name__)


class CloudWatchClient(UnifiedMonitoringOps, IntegrationClient):
    """AWS CloudWatch client for monitoring, logs, and metrics data retrieval (Unified version)."""

    def __init__(self, *, credentials: dict[str, Any]) -> None:
        """Initialize CloudWatch client with credentials.

        Args:
            credentials: Dict containing:
                - access_key: AWS access key ID (stored as token for consistency)
                - secret_key: AWS secret access key
                - region: AWS region (optional, defaults to us-east-1)
                - session_token: AWS session token (optional, for temporary credentials)
        """
        self.validate_credentials(credentials=credentials)
        self._access_key = credentials["access_key"]
        self._secret_key = credentials["secret_key"]
        self._region = credentials.get("region", "us-east-1")
        self._session_token = credentials.get("session_token")

        # AWS CloudWatch API endpoints
        self._logs_base_url = f"https://logs.{self._region}.amazonaws.com"
        self._cloudwatch_base_url = f"https://monitoring.{self._region}.amazonaws.com"

        # Initialize HTTP client
        self._client = httpx.AsyncClient(
            timeout=30.0,
        )

        logger.info(
            "CloudWatch client initialized",
            extra={
                "region": self._region,
                "logs_url": self._logs_base_url,
                "cloudwatch_url": self._cloudwatch_base_url,
            },
        )

    def _sign_request(
        self, *, method: str, url: str, payload: str = "", headers: dict[str, str] | None = None
    ) -> dict[str, str]:
        """Generate AWS Signature Version 4 signed headers for request.

        Args:
            method: HTTP method (GET, POST, etc.)
            url: Full URL for the request
            payload: Request body/payload
            headers: Additional headers to include

        Returns:
            Dictionary of headers including AWS signature
        """
        if headers is None:
            headers = {}

        # Parse URL components
        parsed = urllib.parse.urlparse(url)
        host = parsed.netloc
        canonical_uri = parsed.path or "/"
        canonical_querystring = parsed.query or ""

        # Get current timestamp
        t = datetime.now(UTC)
        amz_date = t.strftime("%Y%m%dT%H%M%SZ")
        date_stamp = t.strftime("%Y%m%d")

        # Standard headers
        headers.update(
            {
                "Host": host,
                "X-Amz-Date": amz_date,
            }
        )

        if self._session_token:
            headers["X-Amz-Security-Token"] = self._session_token

        # Create canonical headers string
        canonical_headers = ""
        signed_headers = ""
        header_names = sorted(headers.keys())
        for header_name in header_names:
            canonical_headers += f"{header_name.lower()}:{headers[header_name]}\n"
            if signed_headers:
                signed_headers += ";"
            signed_headers += header_name.lower()

        # Create payload hash
        payload_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        # Create canonical request
        canonical_request = (
            f"{method}\n{canonical_uri}\n{canonical_querystring}\n{canonical_headers}\n{signed_headers}\n{payload_hash}"
        )

        # Create string to sign
        algorithm = "AWS4-HMAC-SHA256"
        credential_scope = f"{date_stamp}/{self._region}/monitoring/aws4_request"
        string_to_sign = f"{algorithm}\n{amz_date}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()}"

        # Calculate signature
        def _sign(key: bytes, msg: str) -> bytes:
            return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

        k_date = _sign(f"AWS4{self._secret_key}".encode(), date_stamp)
        k_region = _sign(k_date, self._region)
        k_service = _sign(k_region, "monitoring")
        k_signing = _sign(k_service, "aws4_request")
        signature = hmac.new(k_signing, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()

        # Create authorization header
        authorization = f"{algorithm} Credential={self._access_key}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"
        headers["Authorization"] = authorization

        return headers

    def _sign_logs_request(
        self, *, method: str, url: str, payload: str = "", headers: dict[str, str] | None = None
    ) -> dict[str, str]:
        """Generate AWS Signature Version 4 signed headers for CloudWatch Logs request."""
        if headers is None:
            headers = {}

        # Parse URL components
        parsed = urllib.parse.urlparse(url)
        host = parsed.netloc
        canonical_uri = parsed.path or "/"
        canonical_querystring = parsed.query or ""

        # Get current timestamp
        t = datetime.now(UTC)
        amz_date = t.strftime("%Y%m%dT%H%M%SZ")
        date_stamp = t.strftime("%Y%m%d")

        # Standard headers for Logs
        headers.update(
            {
                "Host": host,
                "X-Amz-Date": amz_date,
            }
        )

        if self._session_token:
            headers["X-Amz-Security-Token"] = self._session_token

        # Create canonical headers string
        canonical_headers = ""
        signed_headers = ""
        header_names = sorted(headers.keys())
        for header_name in header_names:
            canonical_headers += f"{header_name.lower()}:{headers[header_name]}\n"
            if signed_headers:
                signed_headers += ";"
            signed_headers += header_name.lower()

        # Create payload hash
        payload_hash = hashlib.sha256(payload.encode("utf-8")).hexdigest()

        # Create canonical request
        canonical_request = (
            f"{method}\n{canonical_uri}\n{canonical_querystring}\n{canonical_headers}\n{signed_headers}\n{payload_hash}"
        )

        # Create string to sign
        algorithm = "AWS4-HMAC-SHA256"
        credential_scope = f"{date_stamp}/{self._region}/logs/aws4_request"
        string_to_sign = f"{algorithm}\n{amz_date}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()}"

        # Calculate signature
        def _sign(key: bytes, msg: str) -> bytes:
            return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

        k_date = _sign(f"AWS4{self._secret_key}".encode(), date_stamp)
        k_region = _sign(k_date, self._region)
        k_service = _sign(k_region, "logs")
        k_signing = _sign(k_service, "aws4_request")
        signature = hmac.new(k_signing, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()

        # Create authorization header
        authorization = f"{algorithm} Credential={self._access_key}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"
        headers["Authorization"] = authorization

        return headers

    def validate_credentials(self, *, credentials: dict) -> None:
        """Validate CloudWatch credentials."""
        if not credentials.get("access_key"):
            raise ValueError("AWS access key ID is required")
        if not credentials.get("secret_key"):
            raise ValueError("AWS secret access key is required")

    def capabilities(self) -> Iterable[IntegrationCapability]:
        """Return capabilities supported by CloudWatch client."""
        return [
            IntegrationCapability.SERVICES,
            IntegrationCapability.METRICS,
            IntegrationCapability.LOGS,
        ]

    async def list_services(self, *, search: str | None = None, **kwargs: Any) -> list[dict]:
        """List services from CloudWatch log groups."""
        try:
            # Use CloudWatch Logs DescribeLogGroups API
            url = self._logs_base_url + "/"

            payload = {"Action": "DescribeLogGroups"}

            if search:
                payload["logGroupNamePrefix"] = search

            payload_json = json.dumps(payload)

            headers = {
                "X-Amz-Target": "Logs_20140328.DescribeLogGroups",
                "Content-Type": "application/x-amz-json-1.1",
            }

            signed_headers = self._sign_logs_request(method="POST", url=url, payload=payload_json, headers=headers)

            response = await self._client.post(url, content=payload_json, headers=signed_headers)

            if response.status_code != 200:
                logger.error(
                    "AWS API error",
                    extra={
                        "status_code": response.status_code,
                        "response_text": response.text,
                        "url": url,
                    },
                )
                response.raise_for_status()

            response_data = response.json()
            log_groups = response_data.get("logGroups", [])

            services = []
            for log_group in log_groups:
                log_group_name = log_group.get("logGroupName", "")
                creation_time = log_group.get("creationTime")

                # Convert creation time from Unix timestamp to ISO format
                last_updated = datetime.now(UTC).isoformat()
                if creation_time:
                    last_updated = datetime.fromtimestamp(creation_time / 1000, tz=UTC).isoformat()

                # Extract service name from log group name
                service_name = log_group_name.split("/")[-1] if log_group_name else "unknown"

                service = {
                    "id": log_group_name,
                    "name": service_name,
                    "description": f"CloudWatch Log Group: {log_group_name}",
                    "last_updated": last_updated,
                }
                services.append(service)

            logger.info(
                "Successfully fetched CloudWatch log groups",
                extra={"count": len(services)},
            )

            return services

        except Exception as e:
            logger.error("Unexpected error fetching CloudWatch services", extra={"error": str(e)})
            raise

    async def list_projects(self, *, search: str | None = None, **kwargs: Any) -> list[dict]:
        """List projects from CloudWatch (using namespaces/regions).
        For CloudWatch, we don't need to list projects
        """
        return []

    async def list_incidents(
        self,
        **kwargs: Any,
    ) -> list[IncidentResponse]:
        """List incidents from CloudWatch (using alarms as incidents). For CloudWatch, we don't need to list incidents"""
        return []

    async def get_incident(
        self,
        *,
        incident_url: str | None = None,
        **kwargs: Any,
    ) -> IncidentResponse:
        """Get a specific incident by ID from CloudWatch. For CloudWatch, we don't need to get an incident"""
        return IncidentResponse(
            id="",
            title="",
            type="",
            link="",
            last_seen="",
            status="",
            created="",
        )

    async def list_environments(
        self,
        *,
        project_id: str,
        search: str | None = None,
        **kwargs: Any,
    ) -> list[dict[str, Any]]:
        """List environments for a CloudWatch project. For CloudWatch, we don't need to list environments"""
        return []

    async def aclose(self) -> None:
        """Close the HTTP client."""
        await self._client.aclose()
        logger.debug("CloudWatch client closed")
