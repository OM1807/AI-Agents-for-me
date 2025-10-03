"""AWS CloudWatch OAuth provider for AWS credentials authentication."""

from __future__ import annotations

from typing import Any

from app.integrations.enums import IntegrationProvider
from app.integrations.oauth.providers.base import OAuthProvider, TokenResult


class CloudWatchProvider(OAuthProvider):
    """OAuth provider for AWS CloudWatch credentials authentication."""

    provider = IntegrationProvider.CLOUDWATCH

    async def validate_credentials(self, credentials: dict[str, Any]) -> dict[str, Any]:
        """Validate AWS CloudWatch credentials.

        Args:
            credentials: Dict containing:
                - access_key: AWS access key ID (stored as token for consistency)
                - secret_key: AWS secret access key
                - region: AWS region (optional, defaults to us-east-1)
                - session_token: AWS session token (optional, for temporary credentials)

        Returns:
            Validated credentials (may include enriched data)

        Raises:
            ValueError: If credentials are invalid
        """
        import hashlib
        import hmac
        import json
        from datetime import UTC, datetime

        import httpx

        access_key = credentials.get("access_key")
        secret_key = credentials.get("secret_key")
        region = credentials.get("region", "us-east-1")
        session_token = credentials.get("session_token")

        if not access_key:
            raise ValueError("AWS access key ID is required")
        if not secret_key:
            raise ValueError("AWS secret access key is required")

        # Basic format validation
        if not access_key.startswith("AKIA") and not access_key.startswith("ASIA"):
            raise ValueError("Invalid AWS access key format")

        if len(secret_key) < 20:
            raise ValueError("Invalid AWS secret key format")

        # Test credentials by making a real AWS API call
        try:
            # Create a test API call to CloudWatch Logs
            url = f"https://logs.{region}.amazonaws.com/"

            payload = {"Action": "DescribeLogGroups", "limit": 1}

            payload_json = json.dumps(payload)

            # Generate AWS Signature Version 4
            def _sign_logs_request() -> dict[str, str]:
                # Get current timestamp
                t = datetime.now(UTC)
                amz_date = t.strftime("%Y%m%dT%H%M%SZ")
                date_stamp = t.strftime("%Y%m%d")

                # Standard headers for Logs
                headers = {
                    "Host": f"logs.{region}.amazonaws.com",
                    "X-Amz-Date": amz_date,
                    "X-Amz-Target": "Logs_20140328.DescribeLogGroups",
                    "Content-Type": "application/x-amz-json-1.1",
                }

                if session_token:
                    headers["X-Amz-Security-Token"] = session_token

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
                payload_hash = hashlib.sha256(payload_json.encode("utf-8")).hexdigest()

                # Create canonical request
                canonical_request = f"POST\n/\n\n{canonical_headers}\n{signed_headers}\n{payload_hash}"

                # Create string to sign
                algorithm = "AWS4-HMAC-SHA256"
                credential_scope = f"{date_stamp}/{region}/logs/aws4_request"
                string_to_sign = f"{algorithm}\n{amz_date}\n{credential_scope}\n{hashlib.sha256(canonical_request.encode('utf-8')).hexdigest()}"

                # Calculate signature
                def _sign(key: bytes, msg: str) -> bytes:
                    return hmac.new(key, msg.encode("utf-8"), hashlib.sha256).digest()

                k_date = _sign(f"AWS4{secret_key}".encode(), date_stamp)
                k_region = _sign(k_date, region)
                k_service = _sign(k_region, "logs")
                k_signing = _sign(k_service, "aws4_request")
                signature = hmac.new(k_signing, string_to_sign.encode("utf-8"), hashlib.sha256).hexdigest()

                # Create authorization header
                authorization = f"{algorithm} Credential={access_key}/{credential_scope}, SignedHeaders={signed_headers}, Signature={signature}"
                headers["Authorization"] = authorization

                return headers

            signed_headers = _sign_logs_request()

            # Make the test API call
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(url, content=payload_json, headers=signed_headers)

                if response.status_code == 200:
                    # Credentials are valid
                    validated_creds = credentials.copy()
                    validated_creds["region"] = region
                    return validated_creds
                elif response.status_code == 403:
                    raise ValueError("AWS credentials are invalid or lack sufficient permissions")
                elif response.status_code == 401:
                    raise ValueError("AWS credentials are unauthorized")
                else:
                    # Other errors - credentials might still be valid but there's an issue
                    # Let's be lenient and just validate format for now
                    validated_creds = credentials.copy()
                    validated_creds["region"] = region
                    return validated_creds

        except httpx.TimeoutException:
            # Network timeout - assume credentials are valid format-wise
            validated_creds = credentials.copy()
            validated_creds["region"] = region
            return validated_creds
        except Exception as e:
            if "Invalid AWS credentials" in str(e) or "AWS credentials are" in str(e):
                raise
            # For other exceptions, do basic validation
            validated_creds = credentials.copy()
            validated_creds["region"] = region
            return validated_creds

    async def generate_access_token(self, credentials: dict[str, Any]) -> TokenResult:
        """Generate access token for CloudWatch (AWS access key based).
        we use AWS access key and secret key
        """
        return TokenResult(access_token=None)
