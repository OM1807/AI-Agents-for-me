"""Atlassian client using Atlassian MCP tools via FastMCP.

Replaces direct REST calls with MCP tool invocations while preserving
the public API: projects, issues, spaces, and pages.
"""

from __future__ import annotations

import json
from collections.abc import Iterable
from typing import Any

# from fastmcp import Client  # TODO: Fix MCP compatibility issue - mcp.types missing
# from fastmcp.exceptions import ToolError  # TODO: Fix MCP compatibility issue
from app.integrations.clients.base import DocsOps, IntegrationClient, IssuesOps, ProjectsOps
from app.integrations.enums import IntegrationCapability

# Canonical tool names used by Atlassian MCP
TOOL = {
    "accessible_resources": "getAccessibleAtlassianResources",
    "jira_projects": "getVisibleJiraProjects",
    "jira_search": "searchJiraIssuesUsingJql",
    "jira_issue": "getJiraIssue",
    "jira_create": "createJiraIssue",
    "confluence_spaces": "getConfluenceSpaces",
    "confluence_pages_in_space": "getPagesInConfluenceSpace",
    "confluence_search": "searchConfluenceUsingCql",
    "confluence_page": "getConfluencePage",
}

MCP_URL_DEFAULT = "https://mcp.atlassian.com/v1/sse"


class AtlassianClient(IntegrationClient, DocsOps, ProjectsOps, IssuesOps):
    """Minimal Atlassian client supporting pages, projects, and issues via MCP."""

    def __init__(
        self,
        *,
        credentials: dict,
        mcp_url: str = MCP_URL_DEFAULT,
    ) -> None:
        self.validate_credentials(credentials=credentials)

        # Store credentials
        self.token = credentials.get("token") or credentials.get("access_token")
        self.site_url = credentials.get("site_url")
        self.cloud_id = credentials.get("cloud_id")
        self.mcp_url = mcp_url

        # FastMCP single-server configuration (SSE transport)
        self._config: dict[str, Any] = {
            "mcpServers": {
                "atlassian": {
                    "transport": "sse",
                    "url": self.mcp_url,
                    "headers": {"Authorization": f"Bearer {self.token}"},
                }
            }
        }
        self._mcp = Client(self._config)
        self._connected = False

        # Defaults
        self._jira_default_max = 50
        self._confluence_default_limit = 50

    def validate_credentials(self, *, credentials: dict) -> None:
        if not credentials.get("token") and not credentials.get("access_token"):
            raise ValueError("token_required")

    async def _ensure_cloud_context(self) -> None:
        """Populate `cloud_id` and `site_url` by calling MCP if missing.

        Raises ValueError("cloud_id_required") if discovery fails to determine cloud id.
        """
        if self.cloud_id:
            return
        # Discover via MCP accessible resources
        resources = await self._call_json(TOOL["accessible_resources"], {})
        cloud_id = None
        site_url = None
        if isinstance(resources, list) and resources:
            first = resources[0]
            if isinstance(first, dict):
                cloud_id = first.get("id")
                site_url = first.get("url")
        elif isinstance(resources, dict):
            for key in ("values", "projects", "results", "items", "data"):
                val = resources.get(key)
                if isinstance(val, list) and val:
                    first = val[0]
                    if isinstance(first, dict):
                        cloud_id = first.get("id")
                        site_url = first.get("url")
                    break

        if isinstance(cloud_id, str) and cloud_id:
            self.cloud_id = cloud_id
        if isinstance(site_url, str) and site_url:
            self.site_url = site_url

        if not self.cloud_id:
            raise ValueError("cloud_id_required")

    async def discover_cloud_context(self) -> dict[str, str | None]:
        """Open a connection, ensure cloud context, then close and return it."""
        try:
            await self._ensure_cloud_context()
            return {"cloud_id": self.cloud_id, "site_url": self.site_url}
        finally:
            await self.aclose()

    def capabilities(self) -> Iterable[IntegrationCapability]:
        return [
            IntegrationCapability.PAGES,
            IntegrationCapability.PROJECTS,
            IntegrationCapability.ISSUES,
            IntegrationCapability.SPACES,
        ]

    # ---------- Connection lifecycle ----------
    async def ensure_connected(self) -> None:
        if self._connected:
            return
        await self._mcp.__aenter__()
        # Optionally: await self._mcp.ping()
        self._connected = True

    async def aclose(self) -> None:
        if self._connected:
            await self._mcp.__aexit__(None, None, None)
            self._connected = False

    # ---------- Internal helpers ----------
    async def _call_json(self, name: str, args: dict[str, Any]) -> Any:
        await self.ensure_connected()
        res = await self._mcp.call_tool(name, args)
        text = None
        if getattr(res, "content", None) and len(res.content) > 0:
            content_item = res.content[0]
            # Only TextContent has a text attribute
            text = getattr(content_item, "text", None)
        return json.loads(text) if text else None

    @staticmethod
    def _pick_list(obj: Any) -> list[dict]:
        if isinstance(obj, list):
            return obj
        if isinstance(obj, dict):
            for key in ("values", "projects", "results", "items", "data"):
                val = obj.get(key)
                if isinstance(val, list):
                    return val
        return []

    @staticmethod
    def _bounded_jql(project_key: str | None, issue_type: str | None = None) -> str:
        date_bound = "created >= -90d"

        # Build the base JQL with date bound
        if project_key:
            jql = f"project={project_key} AND {date_bound}"
        else:
            jql = date_bound

        # Add issue type filter if provided
        if issue_type:
            jql = f'issuetype="{issue_type}" AND {jql}'

        return jql + " ORDER BY created DESC"

    # ----------------------------
    # Jira (Projects / Issues)
    # ----------------------------
    async def list_projects(self) -> list[dict]:
        """List Jira projects with enhanced, relevant details only."""
        try:
            await self._ensure_cloud_context()
            resp = await self._call_json(
                TOOL["jira_projects"],
                {"cloudId": self.cloud_id, "action": "browse", "maxResults": self._jira_default_max},
            )

            raw_projects = self._pick_list(resp)

            # Transform raw projects to enhanced format with only relevant details
            enhanced_projects = []
            for project in raw_projects:
                enhanced_project = self._transform_project_to_enhanced_format(project)
                if enhanced_project:
                    enhanced_projects.append(enhanced_project)

            return enhanced_projects

        except ToolError:
            return []

    def _transform_project_to_enhanced_format(self, project: dict) -> dict | None:
        """Transform raw Jira project data to enhanced format with relevant fields only."""
        # Extract basic project information
        project_id = str(project.get("id", ""))
        project_key = project.get("key", "")
        project_name = project.get("name", "")
        # Extract simplified project URL
        project_url = f"{self.site_url}/browse/{project_key}" if self.site_url else ""
        # Build the enhanced project format with only the required fields
        enhanced_project = {
            "project_id": project_id,
            "project_key": project_key,
            "project_name": project_name,
            "project_url": project_url,
            **project,  # Include the raw project data
        }
        return enhanced_project

    async def list_issues(
        self, *, project_key: str | None = None, issue_type: str | None = None, search_query: str | None = None
    ) -> list[dict]:
        try:
            await self._ensure_cloud_context()
            if not project_key:
                projects = await self.list_projects()
                project_key = next(
                    (p.get("key") for p in projects if isinstance(p, dict) and p.get("key")),
                    None,
                )
            jql = self._bounded_jql(project_key, issue_type)
            resp = await self._call_json(
                TOOL["jira_search"],
                {"cloudId": self.cloud_id, "jql": jql, "maxResults": self._jira_default_max},
            )
            issues = resp.get("issues", []) if isinstance(resp, dict) else []
            raw_issues = issues if isinstance(issues, list) else []

            # Could not use JQL's text ~ "{search_query}" operator in _bounded_jql function because it could not search any nested field values.
            if search_query:
                filtered_issues = []
                search_query_lower = search_query.lower()
                for issue in raw_issues:
                    issue_json = json.dumps(issue).lower()
                    if search_query_lower in issue_json:
                        filtered_issues.append(issue)
                raw_issues = filtered_issues

            # Transform raw issues to enhanced format
            enhanced_issues = []
            for issue in raw_issues:
                enhanced_issue = self._transform_issue_to_enhanced_format(issue)
                if enhanced_issue:
                    enhanced_issues.append(enhanced_issue)

            return enhanced_issues

        except ToolError:
            return []

    def _transform_issue_to_enhanced_format(self, issue: dict) -> dict | None:
        """Transform raw Jira issue data to enhanced format with required fields."""
        # Extract basic issue information
        issue_key = issue.get("key", "")
        issue_id = str(issue.get("id", ""))
        # Build the enhanced issue format
        enhanced_issue = {
            "issue_id": issue_id,
            "issue_number": issue_key,
            **issue,  # Include the raw issue data
        }
        return enhanced_issue

    # ----------------------------
    # Confluence (Pages / Spaces)
    # ----------------------------
    @staticmethod
    def _normalize_page(page: dict, *, space_hint: str | None = None) -> dict:
        """Convert varying Confluence page payloads from MCP tools to legacy shape.

        Legacy shape keys we preserve:
        - parentId, spaceId, ownerId, lastOwnerId, createdAt, authorId, parentType
        - version: { number, message, minorEdit, authorId, createdAt, ncsStepVersion }
        - position, body, status, title, id, _links: { webui, self, tinyui, editui, edituiv2 }

        Missing fields are returned as None or sensible empty defaults.
        """
        content = page.get("content") if isinstance(page.get("content"), dict) else None
        # Derive core fields
        page_id = (content or page).get("id")
        title = (content or page).get("title") or page.get("name")
        status = (content or page).get("status") or page.get("state")

        # Links
        link_source = None
        if isinstance(content, dict) and isinstance(content.get("_links"), dict):
            link_source = content.get("_links")
        elif isinstance(page.get("_links"), dict):
            link_source = page.get("_links")
        links_webui = None
        links_self = None
        links_tinyui = None
        if isinstance(link_source, dict):
            links_webui = link_source.get("webui")
            links_self = link_source.get("self")
            links_tinyui = link_source.get("tinyui")
        # Some search results expose a top-level relative URL
        if not links_webui and isinstance(page.get("url"), str):
            links_webui = page.get("url")

        # Space id: prefer value from page, fallback to provided space_hint
        space_id = page.get("spaceId") or space_hint

        normalized = {
            "id": str(page_id) if page_id is not None else None,
            "parentId": page.get("parentId"),
            "spaceId": space_id,
            "ownerId": page.get("ownerId"),
            "lastOwnerId": page.get("lastOwnerId"),
            "createdAt": page.get("createdAt")
            or (page.get("lastModified") if isinstance(page.get("lastModified"), str) else None),
            "authorId": page.get("authorId"),
            "parentType": page.get("parentType"),
            "position": page.get("position"),
            "body": page.get("body"),
            "status": status,
            "title": title,
            "url": page.get("url") or links_self,
            "_links": {
                "editui": None,
                "webui": links_webui,
                "edituiv2": None,
                "tinyui": links_tinyui,
                "self": links_self,
            },
        }

        return normalized

    async def list_pages(self, *, space: str | None = None, space_key: str | None = None, **kwargs: Any) -> list[dict]:
        try:
            await self._ensure_cloud_context()
            if space:
                resp = await self._call_json(
                    TOOL["confluence_pages_in_space"],
                    {"cloudId": self.cloud_id, "spaceId": space, "limit": self._confluence_default_limit},
                )
                raw = resp.get("results", []) if isinstance(resp, dict) else []
                return [self._normalize_page(p, space_hint=space) for p in raw if isinstance(p, dict)]

            cql = "type = page order by created desc"
            if space_key:
                cql = f"space = {space_key} AND {cql}"
            resp = await self._call_json(
                TOOL["confluence_search"],
                {
                    "cloudId": self.cloud_id,
                    "cql": cql,
                    "limit": self._confluence_default_limit,
                },
            )
            raw = resp.get("results", []) if isinstance(resp, dict) else []
            return [self._normalize_page(p) for p in raw if isinstance(p, dict)]
        except ToolError:
            return []

    async def list_spaces(self, *, space_keys: list[str] | None = None, **kwargs: Any) -> list[dict]:
        try:
            await self._ensure_cloud_context()
            args: dict[str, Any] = {
                "cloudId": self.cloud_id,
                "limit": self._confluence_default_limit,
                "status": "current",
            }
            if space_keys:
                # Some MCP servers accept either spaceKeys or keys
                args["spaceKeys"] = ",".join(space_keys)
            resp = await self._call_json(TOOL["confluence_spaces"], args)
            return resp.get("results", []) if isinstance(resp, dict) else []
        except ToolError:
            return []
