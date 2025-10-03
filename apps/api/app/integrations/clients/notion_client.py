"""Notion client exposing a pages-like capability using search API."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

import httpx

from app.integrations.clients.base import DocsOps, IntegrationClient
from app.integrations.enums import IntegrationCapability


class NotionClient(IntegrationClient, DocsOps):
    """Minimal Notion client using the Search API to list pages.

    Notes:
    - Notion requires the `Notion-Version` header. We use a stable version by default.
    - The `list_pages(space=...)` parameter is repurposed as an optional search `query`.
    """

    def __init__(
        self,
        *,
        credentials: dict | None = None,
        api_base: str = "https://api.notion.com",
        notion_version: str = "2022-06-28",
    ) -> None:
        # Store credentials first
        credentials = credentials or {}
        # Validate credentials
        self.validate_credentials(credentials=credentials)
        token = credentials.get("token")
        self.access_token = str(token) if isinstance(token, str) else ""
        self.notion_version = notion_version

        # Initialize HTTP client with base URL and default headers
        self._http = httpx.AsyncClient(
            base_url=api_base.rstrip("/"),
            headers={
                "Authorization": f"Bearer {self.access_token}",
                "Notion-Version": self.notion_version,
                "Content-Type": "application/json",
            },
            timeout=30.0,
        )

        # Default pagination parameters
        self._default_payload = {
            "filter": {"property": "object", "value": "page"},
            "page_size": 50,
        }

    def validate_credentials(self, *, credentials: dict) -> None:
        if not credentials.get("token"):
            raise ValueError("token_required")

    def capabilities(self) -> Iterable[IntegrationCapability]:
        return [IntegrationCapability.PAGES]

    async def list_pages(self, *, query: str | None = None, **kwargs: Any) -> list[dict]:
        """List pages using the Notion Search API.
        The optional `query` parameter is used as a generic query string.
        """
        payload = self._default_payload.copy()
        if query:
            payload["query"] = query

        response = await self._http.post("/v1/search", json=payload)
        response.raise_for_status()
        data = response.json()
        results = data.get("results", []) if isinstance(data, dict) else []
        return results if isinstance(results, list) else []

    async def aclose(self) -> None:
        await self._http.aclose()
