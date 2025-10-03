"""GitHub client exposing repository capabilities using httpx."""

from __future__ import annotations

from collections.abc import Iterable
from typing import Any

import httpx

from app.integrations.clients.base import IntegrationClient, RepositoryOps
from app.integrations.enums import IntegrationCapability


class GitHubClient(IntegrationClient, RepositoryOps):
    """Minimal GitHub client implementing repository-related operations."""

    def __init__(self, *, credentials: dict | None = None, api_base: str = "https://api.github.com") -> None:
        # Store credentials first
        credentials = credentials or {}

        self.validate_credentials(credentials=credentials)
        self.access_token = credentials.get("token")

        # Initialize HTTP client with base URL and default headers
        headers = {"Accept": "application/vnd.github+json"}

        # Only add authorization header if we have a token
        if self.access_token:
            headers["Authorization"] = f"Bearer {self.access_token}"

        self._http = httpx.AsyncClient(
            base_url=api_base.rstrip("/"),
            headers=headers,
            timeout=30.0,
        )

        # Default pagination parameters
        self._default_params = {"per_page": "100"}

    def validate_credentials(self, *, credentials: dict) -> None:
        # For GitHub, we allow operation without credentials for public access
        # If credentials are provided, ensure they contain a token
        if credentials and not credentials.get("token"):
            raise ValueError("token_required")

    def capabilities(self) -> Iterable[IntegrationCapability]:
        return [
            IntegrationCapability.REPOSITORIES,
            IntegrationCapability.BRANCHES,
            IntegrationCapability.PULL_REQUESTS,
        ]

    async def list_repos(self, *, visibility: str | None = None) -> list[dict]:
        params = self._default_params.copy()
        if visibility:
            params["visibility"] = visibility

        response = await self._http.get("/user/repos", params=params)
        response.raise_for_status()
        data = response.json()
        return data if isinstance(data, list) else []

    async def list_branches(self, *, owner: str, repo: str) -> list[dict]:
        response = await self._http.get(f"/repos/{owner}/{repo}/branches", params=self._default_params)
        response.raise_for_status()
        data = response.json()
        return data if isinstance(data, list) else []

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
        """List pull requests in a repository with pagination support.

        Args:
            owner: Repository owner
            repo: Repository name
            state: State of pull requests to retrieve. Can be 'open', 'closed', or 'all'. Default: 'open'
            sort: Sort pull requests by 'created', 'updated', 'popularity', or 'long-running'. Default: 'created'
            direction: Direction to sort. Can be 'asc' or 'desc'. Default: 'desc'
            page: Page number for pagination. Default: 1
            per_page: Number of results per page (1-100). Default: 30

        Returns:
            Dictionary containing paginated pull request data
        """
        # Validate pagination parameters
        page = max(1, page)
        per_page = min(max(1, per_page), 100)  # GitHub API limits per_page to 100

        params = {
            "state": state or "open",
            "sort": sort or "created",
            "direction": direction or "desc",
            "page": str(page),
            "per_page": str(per_page),
        }

        # Make request to GitHub API
        response = await self._http.get(f"/repos/{owner}/{repo}/pulls", params=params)
        response.raise_for_status()
        data = response.json()

        if not isinstance(data, list):
            data = []

        # Get total count from Link header for pagination
        link_header = response.headers.get("Link", "")
        total_pages = 1
        has_next = False
        has_prev = page > 1

        if link_header:
            # Parse Link header to determine pagination info
            links = {}
            for link in link_header.split(","):
                if ";" in link:
                    url_part, rel_part = link.strip().split(";", 1)
                    url = url_part.strip().strip("<>")
                    rel = rel_part.split("=", 1)[1].strip().strip('"')
                    links[rel] = url

            if "last" in links:
                # Extract page number from last page URL
                last_url = links["last"]
                if "page=" in last_url:
                    try:
                        total_pages = int(last_url.split("page=")[1].split("&")[0])
                    except (ValueError, IndexError):
                        total_pages = 1

            has_next = "next" in links

        # Calculate total count estimate
        if has_next:
            total = total_pages * per_page
        elif len(data) < per_page:
            # If we got fewer results than requested and no next page, calculate exact total
            total = ((page - 1) * per_page) + len(data)
        else:
            # If we got a full page but no pagination info, estimate
            total = page * per_page

        return {
            "results": data,
            "total": total,
            "page": page,
            "per_page": per_page,
            "total_pages": total_pages,
            "has_next": has_next,
            "has_prev": has_prev,
        }

    async def get_pull_request(self, *, owner: str, repo: str, pr_number: int) -> dict[str, Any]:
        """Check if a pull request is accessible with current token.

        First tries with authentication, then falls back to public access if needed.

        Args:
            owner: Repository owner
            repo: Repository name
            pr_number: Pull request number

        Returns:
            Dictionary with accessibility info and PR data if accessible

        Raises:
            httpx.HTTPStatusError: If PR is not accessible at all
        """
        try:
            # Try with authentication first
            response = await self._http.get(f"/repos/{owner}/{repo}/pulls/{pr_number}")
            response.raise_for_status()
            return response.json()  # type: ignore[no-any-return]
        except httpx.HTTPStatusError as exc:
            raise ValueError(
                f"Pull request is not accessible with current github token or publicly: HTTP {exc.response.status_code}"
            ) from exc

    async def aclose(self) -> None:
        await self._http.aclose()
