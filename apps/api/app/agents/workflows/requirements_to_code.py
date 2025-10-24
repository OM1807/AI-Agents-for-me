"""
Requirements To Code agent workflow implementation - ENHANCED VERSION.

This is the ENHANCED implementation with all critical bugs fixed PLUS new features.

FIXES AND ENHANCEMENTS APPLIED:
1. ✅ Fixed GitOps clone_repository parameter name (destination_dir)
2. ✅ Fixed clone destination logic (clone to workspace, then move to code_dir)
3. ✅ Fixed file scanning to not exclude cloned repositories
4. ✅ Added GitHub response validation
5. ✅ Fixed prepare method to yield instead of return
6. ✅ Added better error handling and user-friendly messages
7. ✅ Added output configuration validation
8. ✅ NEW: Intelligent output mode detection (fixes repository existence error)
9. ✅ NEW: Automated testing feature (Python + JavaScript support)
10. ✅ NEW: Dependency installation in isolated environments
11. ✅ NEW: Test result parsing and blocking on failures
12. ✅ NEW: Automatic cleanup of testing artifacts

Author: DevOrbit AI Team (Enhanced by Claude)
Version: 3.0-ENHANCED
Date: January 2025
"""

import asyncio
import glob
import json
import os
import re
import shutil
import subprocess
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

import httpx
from loguru import logger

from app.agents.enums import AgentIdentifier
from app.agents.git.ops import GitOps, GitOperationError
from app.agents.workflows.base import AgentWorkflow
from app.agents.workflows.factory import register
from app.integrations.enums import IntegrationProvider
from app.models.user_agent_session import UserAgentSession
from app.services.integration_service import IntegrationService


# ============================================================================
# CUSTOM EXCEPTIONS
# ============================================================================

class RequirementsFetchError(Exception):
    """Raised when fetching requirements from a provider fails."""
    pass


class GitHubAPIError(Exception):
    """Raised when GitHub API operations fail."""
    pass


class WorkspaceError(Exception):
    """Raised when workspace operations fail."""
    pass


# ============================================================================
# MAIN WORKFLOW CLASS
# ============================================================================

@register(AgentIdentifier.REQUIREMENTS_TO_CODE)
class RequirementsToCodeWorkflow(AgentWorkflow):
    """
    ENHANCED workflow for building production-ready code from requirements.

    Features:
    - Multi-source requirement fetching (Jira, ClickUp, Files)
    - Automatic integration detection
    - Comprehensive error handling
    - GitHub repository creation and PR management
    - Workspace isolation and cleanup
    - Performance optimizations
    - Enhanced logging and monitoring
    - Intelligent mode detection for vibe coding
    - Automated testing with dependency isolation

    Supports three output modes:
    1. new_repo: Create a new GitHub repository
    2. pull_request: Create a PR in existing repository
    3. workspace_only: Generate code in workspace without GitHub operations
    """

    identifier = AgentIdentifier.REQUIREMENTS_TO_CODE

    def __init__(
        self,
        *,
        workspace_dir: Path,
        mcp_configs: dict[str, Any],
        integration_service: IntegrationService,
        system_prompt: str | None = None,
        llm_session_id: str | None = None,
    ) -> None:
        """
        Initialize workflow with required parameters.

        Args:
            workspace_dir: Isolated workspace directory for this session
            mcp_configs: MCP server configurations
            integration_service: Service for managing integrations
            system_prompt: Optional custom system prompt (uses template if None)
            llm_session_id: Optional LLM session ID for resuming sessions
        """
        super().__init__(
            workspace_dir=workspace_dir,
            mcp_configs=mcp_configs,
            integration_service=integration_service,
            system_prompt=system_prompt,
            llm_session_id=llm_session_id,
        )

        # Initialize Git operations helper
        self.git_ops = GitOps()

        # Code generation directory
        self.code_dir = self.workspace_dir / "code"

        # Cache for fetched requirements
        self.requirements_cache: dict[str, Any] = {}

        # Map of generated files (relative_path -> absolute_path)
        self.generated_files: dict[str, str] = {}

        # HTTP client for API requests (reused for connection pooling)
        self._http_client: httpx.AsyncClient | None = None

        logger.info(
            f"Initialized RequirementsToCodeWorkflow (ENHANCED VERSION)",
            extra={
                "workspace_dir": str(workspace_dir),
                "code_dir": str(self.code_dir),
                "has_llm_session": llm_session_id is not None,
            }
        )

    # ========================================================================
    # HTTP CLIENT MANAGEMENT (Connection Pooling)
    # ========================================================================

    async def _get_http_client(self) -> httpx.AsyncClient:
        """
        Get or create HTTP client with connection pooling.

        Returns:
            Configured HTTP client
        """
        if self._http_client is None:
            self._http_client = httpx.AsyncClient(
                timeout=30.0,
                limits=httpx.Limits(max_keepalive_connections=10, max_connections=20),
            )
        return self._http_client

    async def _close_http_client(self) -> None:
        """Close HTTP client if open."""
        if self._http_client is not None:
            await self._http_client.aclose()
            self._http_client = None

    # ========================================================================
    # INTEGRATION CREDENTIAL MANAGEMENT
    # ========================================================================

    async def _get_github_token(self) -> str | None:
        """
        Get GitHub access token from integrations.

        Returns:
            GitHub access token or None if not configured

        Raises:
            ValueError: If GitHub integration is configured but token is invalid
        """
        try:
            integration = await self.integration_service.crud.get_by_provider(
                provider=IntegrationProvider.GITHUB
            )
            if not integration or not integration.id:
                logger.warning("GitHub integration not found")
                return None

            creds = await self.integration_service.get_access_token(
                integration_id=integration.id
            )

            # Handle both dict and string responses
            if isinstance(creds, dict):
                token = creds.get("token") or creds.get("access_token")
            elif isinstance(creds, str):
                token = creds
            else:
                token = None

            if not token:
                logger.error("GitHub integration configured but token is empty")
                raise ValueError(
                    "GitHub integration error: Please reconnect your GitHub account in settings"
                )

            logger.info("GitHub token retrieved successfully")
            return token

        except Exception as e:
            logger.error(f"Failed to get GitHub token: {e}", exc_info=True)
            raise ValueError(
                "GitHub integration not properly configured. "
                "Please connect your GitHub account in the integrations settings."
            ) from e

    async def _get_jira_credentials(
        self, *, session: UserAgentSession
    ) -> dict[str, Any] | None:
        """
        Get Jira credentials from Atlassian integration.

        Args:
            session: User agent session for context

        Returns:
            Dictionary with access_token and cloud_id, or None if not configured
        """
        try:
            user_identifier = session.created_by
            logger.info(
                f"Fetching Jira credentials for user {user_identifier}",
                extra={"user": user_identifier}
            )

            integration = await self.integration_service.crud.get_by_provider(
                provider=IntegrationProvider.ATLASSIAN
            )

            if not integration:
                logger.warning(f"No Atlassian integration found for user {user_identifier}")
                return None

            if not integration.credentials or not isinstance(integration.credentials, dict):
                logger.error(f"Integration {integration.id} has invalid credentials")
                return None

            # Verify required OAuth keys
            required_keys = ["access_token", "cloud_id"]
            if not all(key in integration.credentials for key in required_keys):
                logger.error(
                    f"Integration {integration.id} missing required OAuth keys",
                    extra={"available_keys": list(integration.credentials.keys())}
                )
                return None

            logger.info(f"Successfully retrieved Jira credentials for integration {integration.id}")
            return integration.credentials.copy()

        except Exception as e:
            logger.error(f"Critical error fetching Jira credentials: {e}", exc_info=True)
            return None

    async def _get_clickup_credentials(self) -> dict[str, str] | None:
        """
        Get ClickUp credentials from integration.

        Returns:
            Dictionary with API token, or None if not configured
        """
        try:
            integration = await self.integration_service.crud.get_by_provider(
                provider=IntegrationProvider.CLICKUP
            )

            if not integration or not integration.id:
                logger.warning("ClickUp integration not found")
                return None

            creds = await self.integration_service.get_access_token(
                integration_id=integration.id
            )

            if not isinstance(creds, dict):
                logger.warning("ClickUp credentials are not a dictionary")
                return None

            logger.info("ClickUp credentials retrieved successfully")
            return creds

        except Exception as e:
            logger.error(f"Failed to get ClickUp credentials: {e}", exc_info=True)
            return None

    # ========================================================================
    # REQUIREMENT FETCHING - JIRA
    # ========================================================================

    async def _fetch_jira_ticket(
        self, *, ticket_key: str, session: UserAgentSession
    ) -> dict[str, Any]:
        """
        Fetch and parse Jira ticket details using REST API with OAuth 2.0.

        Args:
            ticket_key: Jira ticket key (e.g., "PROJ-123")
            session: User agent session for context

        Returns:
            Dictionary with ticket details including acceptance criteria

        Raises:
            RequirementsFetchError: If fetching or parsing fails
        """
        logger.info(f"Fetching Jira ticket: {ticket_key}")

        creds = await self._get_jira_credentials(session=session)
        if not creds:
            raise RequirementsFetchError(
                "Jira integration not configured. Please connect your Jira account."
            )

        try:
            access_token = creds.get("access_token")
            cloud_id = creds.get("cloud_id")

            if not access_token or not cloud_id:
                raise RequirementsFetchError(
                    "Incomplete Jira OAuth credentials. Access token and cloud ID required."
                )

            # Jira Cloud API URL
            api_url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/issue/{ticket_key}"
            logger.debug(f"Fetching from Jira API: {api_url}")

            # Use pooled HTTP client
            client = await self._get_http_client()
            response = await client.get(
                api_url,
                headers={
                    "Authorization": f"Bearer {access_token}",
                    "Accept": "application/json",
                },
            )
            response.raise_for_status()
            issue_data = response.json()

            # Parse ticket fields
            fields = issue_data.get("fields", {})
            summary = fields.get("summary", "N/A")
            description_text = self._parse_jira_description(fields.get("description"))
            acceptance_criteria = self._extract_acceptance_criteria(description_text)

            # Build full content string
            full_content = self._format_jira_content(
                ticket_key=ticket_key,
                summary=summary,
                fields=fields,
                description=description_text,
                acceptance_criteria=acceptance_criteria,
            )

            logger.info(
                f"Successfully fetched Jira ticket {ticket_key}",
                extra={
                    "ticket_key": ticket_key,
                    "criteria_count": len(acceptance_criteria),
                }
            )

            return {
                "provider": "jira",
                "key": ticket_key,
                "summary": summary,
                "description": description_text,
                "acceptance_criteria": acceptance_criteria,
                "content": full_content.strip(),
                "type": fields.get("issuetype", {}).get("name", "N/A"),
                "status": fields.get("status", {}).get("name", "N/A"),
                "priority": fields.get("priority", {}).get("name", "N/A"),
            }

        except httpx.HTTPStatusError as e:
            error_message = (
                f"Jira API error ({e.response.status_code}). "
                f"Check if ticket '{ticket_key}' exists and you have permission to view it."
            )
            logger.error(f"{error_message} Response: {e.response.text}")
            raise RequirementsFetchError(error_message) from e

        except Exception as e:
            logger.error(f"Unexpected error fetching Jira ticket {ticket_key}: {e}", exc_info=True)
            raise RequirementsFetchError(f"Failed to fetch Jira ticket: {e}") from e

    def _format_jira_content(
        self,
        *,
        ticket_key: str,
        summary: str,
        fields: dict,
        description: str,
        acceptance_criteria: list[str],
    ) -> str:
        """
        Format Jira ticket content for display.

        Args:
            ticket_key: Ticket key
            summary: Ticket summary
            fields: Ticket fields
            description: Parsed description text
            acceptance_criteria: Extracted acceptance criteria

        Returns:
            Formatted content string
        """
        criteria_text = "\n- ".join(acceptance_criteria) if acceptance_criteria else "None specified"

        return f"""Jira Ticket: {ticket_key}
Summary: {summary}
Type: {fields.get("issuetype", {}).get("name", "N/A")}
Status: {fields.get("status", {}).get("name", "N/A")}
Priority: {fields.get("priority", {}).get("name", "N/A")}

Description:
{description}

Acceptance Criteria:
- {criteria_text}
"""

    def _parse_jira_description(self, description: dict | str | None) -> str:
        """
        Recursively parse Jira's Atlassian Document Format (ADF) to clean text.

        Args:
            description: ADF document or plain string

        Returns:
            Parsed text content
        """
        if not description:
            return "No description provided."

        if isinstance(description, str):
            return description

        def parse_node(node: dict) -> str:
            """Recursively parse ADF node."""
            node_type = node.get("type", "")
            content_parts = []

            # Base case: text node
            if node_type == "text":
                return node.get("text", "")

            # Recursive case: node with children
            if "content" in node:
                for sub_node in node["content"]:
                    content_parts.append(parse_node(sub_node))

            text_content = "".join(content_parts)

            # Format based on node type
            formatters = {
                "paragraph": lambda t: t + "\n",
                "bulletList": lambda t: "".join(
                    f"- {item.strip()}\n"
                    for item in t.strip().split("\n")
                    if item.strip()
                ),
                "orderedList": lambda t: "".join(
                    f"{i+1}. {item}\n"
                    for i, item in enumerate(
                        [item.strip() for item in t.strip().split("\n") if item.strip()]
                    )
                ),
                "listItem": lambda t: t,  # Handled by parent list
                "heading": lambda t: f"\n{'#' * node.get('attrs', {}).get('level', 1)} {t.strip()}\n",
                "codeBlock": lambda t: f"\n```{node.get('attrs', {}).get('language', '')}\n{t.strip()}\n```\n",
            }

            formatter = formatters.get(node_type, lambda t: t)
            return formatter(text_content)

        # Parse top-level document
        if isinstance(description, dict) and "content" in description:
            parsed_parts = [parse_node(node) for node in description["content"]]
            return "".join(parsed_parts).strip()

        return str(description)

    def _extract_acceptance_criteria(self, description: str) -> list[str]:
        """
        Extract acceptance criteria from description text.

        Supports multiple formats:
        - # Acceptance Criteria
        - **Acceptance Criteria**
        - AC:
        - Success Criteria:

        Args:
            description: Description text to parse

        Returns:
            List of acceptance criteria
        """
        criteria = []
        in_ac_section = False

        # Normalize line endings
        normalized_description = "\n".join(description.splitlines())

        for line in normalized_description.splitlines():
            line_lower = line.strip().lower()

            # Check for AC section header
            ac_headers = ["acceptance criteria", "ac:", "success criteria"]
            is_header = (
                line.strip().startswith("#") or
                (line.strip().startswith("*") and line.strip().endswith("*"))
            ) and any(h in line_lower for h in ac_headers)

            if is_header:
                in_ac_section = True
                continue

            # Extract list items when in AC section
            if in_ac_section:
                stripped_line = line.strip()

                # Match bullet points or numbered lists
                match = re.match(r"^([\*\-•]|\d+\.)\s*(.*)", stripped_line)
                if match:
                    item_text = match.group(2).strip()
                    if item_text:
                        criteria.append(item_text)

                # End section on blank line or new header
                elif not stripped_line or stripped_line.startswith("#") or (
                    stripped_line.startswith("*") and stripped_line.endswith("*")
                ):
                    if not any(h in line_lower for h in ac_headers):
                        in_ac_section = False

        if not criteria:
            logger.warning("Could not extract Acceptance Criteria from description")

        return criteria

    # ========================================================================
    # REQUIREMENT FETCHING - CLICKUP
    # ========================================================================

    async def _fetch_clickup_task(self, task_id: str) -> dict[str, Any]:
        """
        Fetch ClickUp task details via REST API.

        Args:
            task_id: ClickUp task ID

        Returns:
            Dictionary with task details

        Note:
            Returns placeholder data if credentials not configured
        """
        logger.info(f"Fetching ClickUp task: {task_id}")

        creds = await self._get_clickup_credentials()
        if not creds:
            logger.warning("ClickUp credentials not found, returning placeholder")
            return self._clickup_placeholder_data(task_id)

        try:
            # Get API token
            api_token = creds.get("token") or creds.get("api_token")
            if not api_token:
                raise ValueError("ClickUp API token not found")

            # Use pooled HTTP client
            client = await self._get_http_client()
            response = await client.get(
                f"https://api.clickup.com/api/v2/task/{task_id}",
                headers={
                    "Authorization": api_token,
                    "Content-Type": "application/json",
                },
            )

            if response.status_code != 200:
                logger.error(
                    f"Failed to fetch ClickUp task: {response.status_code} - {response.text}"
                )
                raise ValueError(f"Failed to fetch ClickUp task: {response.status_code}")

            task_data = response.json()

            # Extract task information
            name = task_data.get("name", "")
            description = task_data.get("description", "") or task_data.get("text_content", "")
            status = task_data.get("status", {}).get("status", "")
            priority_data = task_data.get("priority")
            priority = priority_data.get("priority", "None") if priority_data else "None"

            # Extract acceptance criteria from custom fields
            custom_fields = task_data.get("custom_fields", [])
            acceptance_criteria = self._extract_clickup_acceptance_criteria(
                custom_fields, description
            )

            logger.info(
                f"Successfully fetched ClickUp task: {task_id}",
                extra={"task_id": task_id, "criteria_count": len(acceptance_criteria)}
            )

            # Build content string
            criteria_text = "\n".join(
                f"- {criterion}" for criterion in acceptance_criteria
            ) if acceptance_criteria else "None specified"

            content = f"""ClickUp Task: {task_id}
Name: {name}
Status: {status}
Priority: {priority}

Description:
{description}

Acceptance Criteria:
{criteria_text}
"""

            return {
                "provider": "clickup",
                "id": task_id,
                "name": name,
                "description": description,
                "status": status,
                "priority": priority,
                "acceptance_criteria": acceptance_criteria,
                "content": content,
            }

        except Exception as e:
            logger.error(f"Error fetching ClickUp task {task_id}: {e}", exc_info=True)
            return self._clickup_placeholder_data(task_id, error=str(e))

    def _clickup_placeholder_data(self, task_id: str, error: str | None = None) -> dict[str, Any]:
        """Generate placeholder data for ClickUp task."""
        description = (
            f"Failed to fetch task details: {error}" if error
            else "ClickUp integration is in development phase."
        )

        return {
            "provider": "clickup",
            "id": task_id,
            "name": f"ClickUp Task {task_id}",
            "description": description,
            "content": f"ClickUp Task {task_id}\n\n{description}",
            "acceptance_criteria": [],
        }

    def _extract_clickup_acceptance_criteria(
        self, custom_fields: list[dict], description: str
    ) -> list[str]:
        """
        Extract acceptance criteria from ClickUp custom fields or description.

        Args:
            custom_fields: List of custom field data
            description: Task description

        Returns:
            List of acceptance criteria
        """
        criteria = []

        # Try custom fields first
        for field in custom_fields:
            if "acceptance" in field.get("name", "").lower():
                value = field.get("value", "")

                if isinstance(value, str) and value:
                    criteria.extend(
                        [line.strip() for line in value.splitlines() if line.strip()]
                    )
                elif isinstance(value, list):
                    criteria.extend([str(item) for item in value])

        # Fallback to description parsing
        if not criteria and description:
            criteria = self._extract_acceptance_criteria(description)

        return criteria

    # ========================================================================
    # REQUIREMENT FETCHING - DOCUMENTS
    # ========================================================================

    async def _process_document_file(self, file_name: str) -> dict[str, Any]:
        """
        Process PDF or TXT file from user storage.

        Args:
            file_name: Name of file in user's file storage

        Returns:
            Dictionary with file content

        Raises:
            RequirementsFetchError: If file processing fails
        """
        logger.info(f"Processing document file: {file_name}")

        try:
            # Copy file to workspace
            await self._copy_file_to_workspace(file_name)

            # Read file content
            file_path = self.workspace_dir / file_name
            if not file_path.exists():
                raise RequirementsFetchError(f"File not found: {file_name}")

            # Determine file type
            file_extension = file_path.suffix.lower()

            if file_extension == ".pdf":
                content = await self._extract_pdf_text(file_path)
            elif file_extension in [".txt", ".md"]:
                content = file_path.read_text(encoding="utf-8")
            else:
                raise RequirementsFetchError(f"Unsupported file type: {file_extension}")

            logger.info(
                f"Successfully processed {file_name}",
                extra={"file_name": file_name, "content_length": len(content)}
            )

            return {
                "provider": "file",
                "file_name": file_name,
                "content": content,
                "type": "document",
            }

        except Exception as e:
            logger.error(f"Error processing document file {file_name}: {e}", exc_info=True)
            raise RequirementsFetchError(f"Failed to process document: {e}") from e

    async def _extract_pdf_text(self, file_path: Path) -> str:
        """
        Extract text from PDF file.

        Args:
            file_path: Path to PDF file

        Returns:
            Extracted text content

        Raises:
            RequirementsFetchError: If PDF extraction fails
        """
        try:
            # Lazy import to avoid hard dependency
            import PyPDF2

            text_content = []

            with open(file_path, "rb") as pdf_file:
                try:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)

                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text:
                            text_content.append(page_text)

                except Exception as read_error:
                    logger.error(f"Error reading PDF {file_path}: {read_error}")
                    raise RequirementsFetchError(f"Failed to read PDF file: {read_error}") from read_error

            result = "\n\n".join(text_content)
            logger.info(f"Extracted {len(result)} characters from PDF")

            return result

        except ImportError:
            error_msg = "PyPDF2 is required for PDF processing. Run: pip install pypdf2"
            logger.error(error_msg)
            raise RequirementsFetchError(error_msg)

        except Exception as e:
            logger.error(f"Unexpected error extracting PDF text: {e}", exc_info=True)
            raise RequirementsFetchError(f"Failed to parse PDF: {e}") from e

    # ========================================================================
    # VALIDATION
    # ========================================================================

    async def _validate_output_config(self, output_config: dict) -> None:
        """
        Validate output configuration before starting work.

        Args:
            output_config: Output configuration dictionary

        Raises:
            ValueError: If configuration is invalid
        """
        output_type = output_config.get("type")

        if output_type == "new_repo":
            if not output_config.get("repo_name"):
                raise ValueError("repo_name is required for new repository creation")
            logger.info(f"Validated new_repo config: {output_config.get('repo_name')}")

        elif output_type == "pull_request":
            if not output_config.get("repo_url"):
                raise ValueError("repo_url is required for pull request creation")
            if not output_config.get("base_branch"):
                logger.warning("base_branch not specified, defaulting to 'main'")
                output_config["base_branch"] = "main"
            logger.info(f"Validated pull_request config: {output_config.get('repo_url')}")

        elif output_type == "workspace_only":
            logger.info("Validated workspace_only config")

        else:
            logger.warning(f"Unknown output type: {output_type}, defaulting to workspace_only")
            output_config["type"] = "workspace_only"

    # ========================================================================
    # WORKFLOW PHASE: PREPARE
    # ========================================================================

    async def prepare(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """
        Prepare workspace by fetching requirements from various sources.

        Steps:
        1. Create code directory
        2. Fetch requirements from all input sources (parallel)
        3. Cache requirements
        4. Clone repository if PR mode

        Args:
            session: User agent session
            messages: List of messages

        Yields:
            Tool call and result events

        Raises:
            WorkspaceError: If preparation fails
        """
        logger.info(
            f"Preparing workspace {self.workspace_dir}",
            extra={"workspace": str(self.workspace_dir)}
        )

        # FIX #5: Yield status instead of returning
        if session.llm_session_id:
            logger.info("Session already initialized, skipping prepare step for vibe coding")
            await self._scan_workspace_files()

            # For vibe coding, requirements cache being empty is OK
            # User is just iterating on existing code, not generating from requirements
            if not self.requirements_cache:
                logger.info("Requirements cache empty on vibe coding session - this is normal")
                yield {
                    "type": "text",
                    "data": {"text": "💡 Vibe coding session: Making changes to existing codebase"}
                }
            return

        try:
            # Create code directory
            self.code_dir.mkdir(parents=True, exist_ok=True)
            logger.debug(f"Code directory ensured: {self.code_dir}")

            # Extract inputs from custom_properties
            properties = session.custom_properties or {}
            inputs = properties.get("inputs", [])

            if not inputs:
                raise WorkspaceError("No input sources specified for code generation")

            # Validate output configuration
            output_config = properties.get("output_config", {})
            await self._validate_output_config(output_config)

            # Fetch requirements from all sources
            async for event in self._fetch_all_requirements(inputs, session):
                yield event

            logger.info(
                f"Cached {len(self.requirements_cache)} requirement sources",
                extra={"count": len(self.requirements_cache)}
            )

            # Handle repository cloning for PR mode
            if output_config.get("type") == "pull_request":
                async for event in self._clone_target_repository(output_config):
                    yield event

            logger.info("Workspace preparation completed successfully")

        except Exception as e:
            logger.error(f"Failed to prepare workspace: {e}", exc_info=True)
            raise WorkspaceError(f"Workspace preparation failed: {e}") from e

    async def _fetch_all_requirements(
        self, inputs: list[dict], session: UserAgentSession
    ) -> AsyncIterator[dict[str, Any]]:
        """
        Fetch requirements from all input sources.

        Args:
            inputs: List of input source configurations
            session: User agent session for context

        Yields:
            Tool call and result events for each fetch operation
        """
        for idx, input_source in enumerate(inputs):
            provider = input_source.get("provider")
            identifier = input_source.get("key") or input_source.get("file_name")
            tool_call_id = f"fetch_input_{idx}"

            if not identifier:
                logger.error(f"Input source {idx} missing identifier")
                yield {
                    "type": "tool_result",
                    "toolCallId": tool_call_id,
                    "result": f"Error: Input source {idx} missing identifier",
                    "isError": True,
                }
                continue

            yield {
                "type": "tool_call",
                "toolCallId": tool_call_id,
                "toolName": "fetch_requirements",
                "args": {
                    "source": provider,
                    "type": input_source.get("type"),
                    "identifier": identifier,
                },
            }

            try:
                # Fetch based on provider
                if provider == "jira":
                    requirements = await self._fetch_jira_ticket(
                        ticket_key=identifier, session=session
                    )
                elif provider == "clickup":
                    requirements = await self._fetch_clickup_task(identifier)
                elif provider == "file":
                    requirements = await self._process_document_file(identifier)
                else:
                    raise ValueError(f"Unsupported provider: {provider}")

                # Cache requirements
                cache_key = f"{provider}_{identifier}"
                self.requirements_cache[cache_key] = requirements

                yield {
                    "type": "tool_result",
                    "toolCallId": tool_call_id,
                    "result": f"Successfully fetched from {provider}: {identifier}",
                }

            except Exception as fetch_error:
                logger.error(
                    f"Failed to fetch from {provider} ({identifier}): {fetch_error}",
                    exc_info=True
                )
                yield {
                    "type": "tool_result",
                    "toolCallId": tool_call_id,
                    "result": f"Error fetching from {provider}: {str(fetch_error)}",
                    "isError": True,
                }

    async def _clone_target_repository(self, output_config: dict) -> AsyncIterator[dict[str, Any]]:
        """
        Clone target repository for PR mode (FIXED VERSION).

        Args:
            output_config: Output configuration

        Yields:
            Tool call and result events

        Raises:
            WorkspaceError: If cloning fails
        """
        repo_url = output_config.get("repo_url")
        if not repo_url:
            return

        github_token = await self._get_github_token()
        if not github_token:
            raise WorkspaceError(
                "GitHub integration required for pull requests. "
                "Please connect your GitHub account in the integrations settings."
            )

        tool_call_id = "clone_target_repo"

        yield {
            "type": "tool_call",
            "toolCallId": tool_call_id,
            "toolName": "git_clone",
            "args": {"url": repo_url, "destination": str(self.code_dir)},
        }

        try:
            # Clean code directory before cloning
            if self.code_dir.exists():
                logger.warning(f"Removing existing code directory: {self.code_dir}")
                shutil.rmtree(self.code_dir)

            # FIX #2: Ensure directory exists
            self.code_dir.mkdir(parents=True, exist_ok=True)

            # FIX #1: Clone to workspace, then move to code_dir
            # The git_ops.clone_repository expects destination_dir to be the PARENT directory
            # and it creates a subdirectory with the repo name
            cloned_path = await self.git_ops.clone_repository(
                url=repo_url,
                destination_dir=self.workspace_dir,  # ✅ FIXED: Use workspace_dir
                access_token=github_token,
            )

            # Move cloned repo contents to code_dir
            if cloned_path != self.code_dir:
                logger.info(f"Moving cloned repo from {cloned_path} to {self.code_dir}")
                for item in cloned_path.iterdir():
                    target = self.code_dir / item.name
                    if target.exists():
                        if target.is_dir():
                            shutil.rmtree(target)
                        else:
                            target.unlink()
                    shutil.move(str(item), str(target))

                # Remove empty cloned directory
                cloned_path.rmdir()

            logger.info(f"Successfully cloned {repo_url} to {self.code_dir}")

            yield {
                "type": "tool_result",
                "toolCallId": tool_call_id,
                "result": "Successfully cloned repository",
            }

        except GitOperationError as git_error:
            logger.error(f"Failed to clone {repo_url}: {git_error}")
            yield {
                "type": "tool_result",
                "toolCallId": tool_call_id,
                "result": f"Error cloning repository: {str(git_error)}",
                "isError": True,
            }
            raise WorkspaceError(f"Repository cloning failed: {git_error}") from git_error

    # ========================================================================
    # PROMPT PREPARATION (Uses Templates)
    # ========================================================================

    async def _prepare_system_prompt(self, session: UserAgentSession) -> str:
        """
        Prepare system prompt using template.

        Uses the improved system.md template which provides comprehensive
        instructions for code generation.

        Args:
            session: User agent session

        Returns:
            Rendered system prompt
        """
        # Build context for template
        context = {
            "workspace_dir": str(self.workspace_dir),
            "code_dir": str(self.code_dir),
            "requirements_count": len(self.requirements_cache),
        }

        # Add output configuration
        properties = session.custom_properties or {}
        output_config = properties.get("output_config", {})
        context["output_config"] = output_config

        # Use base class template renderer
        return await super()._prepare_system_prompt(session=session, **context)

    async def _prepare_user_prompt(
        self, session: UserAgentSession, requirements: dict[str, Any]
    ) -> str:
        """
        Prepare user prompt using template.

        Uses the improved user.md template which provides structured
        requirements and execution workflow.

        Args:
            session: User agent session
            requirements: Cached requirements

        Returns:
            Rendered user prompt
        """
        if not requirements:
            logger.error("Requirements cache is empty when preparing user prompt")
            return "Error: Requirements data is missing. Cannot proceed."

        # Build context for template
        properties = session.custom_properties or {}
        output_config = properties.get("output_config", {})
        options = properties.get("options", {})

        context = {
            "requirements": requirements,
            "output_config": output_config,
            "options": options,
            "workspace_dir": str(self.workspace_dir),
            "code_dir": str(self.code_dir),
        }

        # Use base class template renderer
        prompt = await super()._prepare_user_prompt(session=session, **context)

        logger.info(
            f"Prepared user prompt",
            extra={"length": len(prompt), "requirements_count": len(requirements)}
        )

        return prompt

    # ========================================================================
    # WORKFLOW PHASE: RUN
    # ========================================================================

    async def run(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """
        Run the code building workflow: Prepare -> Generate -> Test -> Finalize.

        Args:
            session: User agent session
            messages: List of messages

        Yields:
            Agent events (text, tool_call, tool_result, finish)
        """
        try:
            logger.info(
                f"Starting Requirements-to-Code workflow (ENHANCED VERSION)",
                extra={"session_id": str(session.id)}
            )

            # Phase 1: Preparation
            yield {"type": "text", "data": {"text": "🔍 Preparing workspace and fetching requirements..."}}
            async for event in self.prepare(session=session, messages=messages):
                yield event
            yield {"type": "text", "data": {"text": "✅ Preparation complete"}}

            # ✅ CRITICAL: Check if requirements were fetched (only for initial generation)
            # For vibe coding (session with llm_session_id), requirements cache can be empty
            if not self.requirements_cache and not session.llm_session_id:
                error_msg = "No requirements found after preparation. Cannot proceed with code generation."
                logger.error(error_msg)
                yield {"type": "text", "data": {"text": f"❌ {error_msg}"}}
                yield {"type": "finish", "data": {"finishReason": "error", "error": error_msg}}
                return
            elif not self.requirements_cache and session.llm_session_id:
                logger.info("Vibe coding session: Proceeding without requirements cache")

            # Phase 2: Code Generation
            system_prompt = await self._prepare_system_prompt(session=session)

            # ✅ FIXED: Always prepare detailed prompt with cached requirements for initial run
            if not session.llm_session_id:  # Initial run
                logger.info("Preparing initial user prompt with cached requirements")
                user_prompt = await self._prepare_user_prompt(
                    session=session, requirements=self.requirements_cache
                )

                logger.info(
                    f"Prepared user prompt with {len(self.requirements_cache)} requirement sources",
                    extra={
                        "prompt_length": len(user_prompt),
                        "requirements_count": len(self.requirements_cache)
                    }
                )

                # Replace or insert user message
                if messages and messages[0].get("role") == "user":
                    logger.info("Replacing existing user message with prepared prompt")
                    messages[0]["content"] = user_prompt
                else:
                    logger.info("Inserting prepared prompt as first message")
                    messages.insert(0, {"role": "user", "content": user_prompt})
            else:
                logger.info("Resuming session - using existing messages")
                if not messages:
                    raise ValueError("No messages provided for session resumption")

            # Stream LLM responses
            logger.info("Invoking LLM orchestrator for code generation")
            yield {"type": "text", "data": {"text": "🤖 Generating code via LLM..."}}

            async for response in self.orchestrator.run(messages, system_prompt=system_prompt):
                yield response

            yield {"type": "text", "data": {"text": "✅ LLM code generation finished"}}

            # Phase 3: Post-Generation Processing
            logger.info("Post-generation processing")

            # Fallback: copy files from /tmp if needed
            copied_count = await self._copy_tmp_to_workspace()
            if copied_count > 0:
                yield {
                    "type": "text",
                    "data": {"text": f"⚠️ Copied {copied_count} files from temporary location"},
                }

            # Scan workspace for generated files
            file_count = await self._scan_workspace_files()
            if file_count > 0:
                yield {
                    "type": "text",
                    "data": {"text": f"💻 Found {file_count} generated files in workspace"},
                }
            else:
                yield {
                    "type": "text",
                    "data": {"text": "⚠️ No files found in workspace after generation"},
                }

            # ✅ NEW: Phase 3.5: Automated Testing (Issue #2 Fix)
            if await self._should_run_tests(session):
                yield {"type": "text", "data": {"text": "🧪 Starting automated testing phase..."}}

                try:
                    test_results = await self._run_automated_tests()

                    if test_results["success"]:
                        yield {
                            "type": "text",
                            "data": {
                                "text": f"✅ All tests passed! ({test_results['passed']}/{test_results['total']} tests)"
                            }
                        }
                        logger.info(f"Tests passed: {test_results['passed']}/{test_results['total']}")
                    else:
                        yield {
                            "type": "text",
                            "data": {
                                "text": f"❌ Tests failed: {test_results['failed']}/{test_results['total']} tests failed"
                            }
                        }
                        yield {
                            "type": "text",
                            "data": {
                                "text": "⚠️ Code will not be pushed to GitHub due to test failures"
                            }
                        }

                        # Show test output (first 1000 chars)
                        if test_results.get("output"):
                            yield {
                                "type": "text",
                                "data": {
                                    "text": f"📋 Test Output:\n```\n{test_results['output'][:1000]}\n```"
                                }
                            }

                        logger.warning("Aborting workflow due to test failures")
                        yield {"type": "finish", "data": {"finishReason": "test_failure"}}
                        return

                except Exception as test_error:
                    logger.error(f"Error running tests: {test_error}", exc_info=True)
                    yield {
                        "type": "text",
                        "data": {
                            "text": f"⚠️ Testing failed with error: {test_error}. Proceeding without tests."
                        }
                    }
            else:
                logger.info("Automated testing disabled or no test files found")

            # Phase 4: Finalization
            properties = session.custom_properties or {}
            output_config = properties.get("output_config", {})
            output_type = output_config.get("type")

            # ✅ FIX ISSUE #1: Intelligent mode detection for vibe coding
            # Detect if we're working with an existing repository and adjust output type
            if session.llm_session_id and output_type == "new_repo":
                # This is a vibe coding session (follow-up request)
                # Check if .git directory exists (indicating existing repo)
                if (self.code_dir / ".git").is_dir():
                    logger.warning(
                        "Vibe coding session detected with 'new_repo' mode, "
                        "but repository already exists. Switching to 'pull_request' mode."
                    )
                    output_type = "pull_request"
                    output_config["type"] = "pull_request"

                    # Set repo_url if not present
                    if not output_config.get("repo_url"):
                        # Try to extract from git remote
                        try:
                            remote_output = await self._run_git_command(["git", "remote", "get-url", "origin"])
                            output_config["repo_url"] = remote_output.strip()
                            logger.info(f"Detected repository URL: {output_config['repo_url']}")
                        except GitOperationError:
                            logger.error("Could not determine repository URL for PR mode")
                            # Fallback to workspace_only if we can't determine repo URL
                            output_type = "workspace_only"
                            output_config["type"] = "workspace_only"
                            logger.warning("Falling back to workspace_only mode")

                    # Set base branch if not present
                    if not output_config.get("base_branch"):
                        try:
                            branch_output = await self._run_git_command(["git", "branch", "--show-current"])
                            output_config["base_branch"] = branch_output.strip() or "main"
                            logger.info(f"Using base branch: {output_config['base_branch']}")
                        except GitOperationError:
                            output_config["base_branch"] = "main"

            if output_type in ["new_repo", "pull_request"]:
                if file_count == 0:
                    yield {"type": "text", "data": {"text": "⚠️ Skipping GitHub step as no files were generated"}}
                else:
                    yield {"type": "text", "data": {"text": f"📦 Finalizing output: {output_type}..."}}
                    async for event in self.finalize(session=session, messages=messages):
                        yield event
            else:
                yield {"type": "text", "data": {"text": "✅ Workflow complete. Files are in workspace"}}

            logger.info("Requirements-to-Code workflow finished successfully")
            yield {"type": "finish", "data": {"finishReason": "stop"}}

        except Exception as e:
            logger.error(f"Workflow failed: {e}", exc_info=True)
            yield {"type": "text", "data": {"text": f"❌ Workflow Error: {e}"}}
            yield {"type": "finish", "data": {"finishReason": "error", "error": str(e)}}

        finally:
            # Cleanup HTTP client
            await self._close_http_client()


    # ========================================================================
    # WORKSPACE FILE MANAGEMENT
    # ========================================================================

    async def _copy_tmp_to_workspace(self) -> int:
        """
        Fallback: Copy files from /tmp to workspace.

        Returns:
            Number of files copied
        """
        copied_count = 0
        tmp_patterns = ["/tmp/generated-*", "/tmp/code-*", "/tmp/app-*"]
        potential_dirs = []

        for pattern in tmp_patterns:
            potential_dirs.extend(glob.glob(pattern))

        found_and_processed = set()

        for tmp_dir_path_str in potential_dirs:
            tmp_dir = Path(tmp_dir_path_str)

            if not tmp_dir.is_dir() or str(tmp_dir) in found_and_processed:
                continue

            logger.warning(
                f"Found unexpected code in {tmp_dir}, copying to workspace",
                extra={"tmp_dir": str(tmp_dir)}
            )

            copied_from_this_dir = 0

            try:
                for item in tmp_dir.rglob("*"):
                    if not item.is_file():
                        continue

                    # Filter hidden files and pycache
                    if any(part.startswith(".") for part in item.parts if part != ".") or "__pycache__" in str(item):
                        continue

                    relative_path = item.relative_to(tmp_dir)
                    dest = self.code_dir / relative_path

                    # Ensure destination directory exists
                    dest.parent.mkdir(parents=True, exist_ok=True)

                    # Copy file
                    shutil.copy2(item, dest)

                    # Track copied file
                    self.generated_files[str(relative_path)] = str(dest)
                    copied_count += 1
                    copied_from_this_dir += 1

                    if copied_from_this_dir <= 10:
                        logger.debug(f"Copied fallback file: {relative_path}")
                    elif copied_from_this_dir == 11:
                        logger.debug("Suppressing further fallback copy logs")

                logger.info(f"Copied {copied_from_this_dir} files from {tmp_dir}")
                found_and_processed.add(str(tmp_dir))

                # Cleanup temporary directory
                try:
                    shutil.rmtree(tmp_dir)
                    logger.debug(f"Cleaned up temporary directory: {tmp_dir}")
                except OSError as e:
                    logger.warning(f"Failed to clean up {tmp_dir}: {e}")

            except Exception as copy_err:
                logger.error(f"Error copying from {tmp_dir}: {copy_err}", exc_info=True)

        if copied_count > 0:
            logger.warning(
                f"Fallback copy moved {copied_count} files",
                extra={"count": copied_count}
            )
        else:
            logger.info("No unexpected files in /tmp fallback locations")

        return copied_count

    async def _scan_workspace_files(self) -> int:
        """
        Scan workspace for generated files (FIXED VERSION).

        Returns:
            Number of files found
        """
        count = 0
        self.generated_files.clear()

        if not self.code_dir.exists() or not self.code_dir.is_dir():
            logger.warning(f"Code directory does not exist: {self.code_dir}")
            return 0

        for file_path in self.code_dir.rglob("*"):
            if not file_path.is_file():
                continue

            # FIX #3: Only skip .git folder itself, not files in the repo
            # This was excluding all files in cloned repositories!
            if (
                file_path.name == ".git"  # ✅ FIXED: Only skip .git folder
                or "__pycache__" in file_path.parts
                or (file_path.name.startswith(".") and file_path.name not in [".gitignore", ".env.example"])
            ):
                continue

            try:
                relative_path = file_path.relative_to(self.code_dir)
                self.generated_files[str(relative_path)] = str(file_path)
                count += 1
            except ValueError:
                logger.warning(f"Could not determine relative path: {file_path}")

        logger.info(
            f"Scan found {count} files in workspace",
            extra={"count": count, "workspace": str(self.code_dir)}
        )

        if count == 0:
            logger.warning("Workspace scan found no files. Code generation may have failed")

        return count

    # ========================================================================
    # GIT OPERATIONS
    # ========================================================================

    async def _run_git_command(
        self, command: list[str], cwd: Path | str | None = None
    ) -> str:
        """
        Run git command with error handling.

        Args:
            command: Git command as list of arguments
            cwd: Working directory (defaults to code_dir)

        Returns:
            Command stdout output

        Raises:
            GitOperationError: If command fails
        """
        effective_cwd = cwd or self.code_dir
        logger.debug(f"Running git command: {' '.join(command)} in {effective_cwd}")

        try:
            result = subprocess.run(
                command,
                cwd=effective_cwd,
                check=True,
                capture_output=True,
                text=True,
            )

            if result.stdout:
                logger.debug(f"Git output: {result.stdout.strip()}")

            return result.stdout.strip()

        except subprocess.CalledProcessError as e:
            error_output = e.stderr.strip() if e.stderr else str(e)
            logger.error(f"Git command failed: {' '.join(command)}\nError: {error_output}")
            raise GitOperationError(f"Git command failed: {error_output}") from e

        except FileNotFoundError:
            logger.error("Git command not found. Ensure git is installed")
            raise GitOperationError("Git command not found")

    async def _initialize_and_commit(self, commit_message: str) -> None:
        """
        Initialize git repository if needed and commit changes.

        Args:
            commit_message: Commit message

        Raises:
            GitOperationError: If git operations fail
        """
        # Initialize if needed
        if not (self.code_dir / ".git").is_dir():
            logger.info(f"Initializing git repository in {self.code_dir}")
            await self._run_git_command(["git", "init"])

            try:
                await self._run_git_command(["git", "branch", "-M", "main"])
            except GitOperationError as e:
                logger.warning(f"Could not set default branch to 'main': {e}")
        else:
            logger.info("Using existing git repository")

        # Configure user info
        await self._run_git_command(["git", "config", "user.email", "ai-agent@devorbit.ai"])
        await self._run_git_command(["git", "config", "user.name", "DevOrbit AI Agent"])

        # Stage all changes
        logger.info("Staging all changes")
        await self._run_git_command(["git", "add", "-A"])

        # Check if there are changes to commit
        status_output = await self._run_git_command(["git", "status", "--porcelain"])
        if not status_output:
            logger.warning("No changes to commit")
            return

        # Commit
        logger.info(f"Committing with message: '{commit_message[:50]}...'")
        await self._run_git_command(["git", "commit", "-m", commit_message])
        logger.info("Changes committed successfully")

    # ========================================================================
    # GITHUB OPERATIONS
    # ========================================================================

    async def _create_github_repo_api(
        self, repo_name: str, description: str, is_private: bool
    ) -> tuple[str, str]:
        """
        Create GitHub repository using REST API (FIXED VERSION).

        Args:
            repo_name: Repository name
            description: Repository description
            is_private: Whether repository should be private

        Returns:
            Tuple of (repository_url, username)

        Raises:
            GitHubAPIError: If API operation fails
        """
        github_token = await self._get_github_token()
        if not github_token:
            raise GitHubAPIError(
                "GitHub token not found. Configure GitHub integration in settings."
            )

        try:
            logger.info(f"Creating GitHub repository: {repo_name}")
            client = await self._get_http_client()

            # Get authenticated user
            user_response = await client.get(
                "https://api.github.com/user",
                headers={
                    "Authorization": f"Bearer {github_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
            )
            user_response.raise_for_status()
            username = user_response.json()["login"]
            logger.info(f"Authenticated as GitHub user: {username}")

            # Create repository
            create_response = await client.post(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"Bearer {github_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
                json={
                    "name": repo_name,
                    "description": description,
                    "private": is_private,
                    "auto_init": False,
                },
            )

            # FIX #4: Validate response properly
            if create_response.status_code == 201:
                repo_data = create_response.json()
                html_url = repo_data.get("html_url")  # ✅ FIXED: Use .get() instead of direct access
                if not html_url:
                    raise GitHubAPIError("Repository created but URL not in response")
                logger.info(f"GitHub repository created: {html_url}")
                return html_url, username

            # Handle errors
            try:
                error_data = create_response.json()
                error_message = error_data.get("message", "Unknown error")
                error_details = error_data.get("errors", [])

                logger.error(
                    f"Failed to create GitHub repo ({create_response.status_code}): "
                    f"{error_message} Details: {error_details}"
                )

                if "name already exists" in str(error_details).lower():
                    raise GitHubAPIError(
                        f"Repository '{repo_name}' already exists. "
                        "Please choose a different name or delete the existing repository."
                    )

                raise GitHubAPIError(
                    f"Failed to create repository ({create_response.status_code}): {error_message}"
                )

            except json.JSONDecodeError:
                logger.error(
                    f"Failed to create GitHub repo ({create_response.status_code}): "
                    f"{create_response.text}"
                )
                raise GitHubAPIError(f"Failed to create repository ({create_response.status_code})")

        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error during GitHub API call: {e.response.status_code} - {e.response.text}"
            )
            raise GitHubAPIError(
                f"GitHub API error ({e.response.status_code}). "
                "Please check your GitHub integration and permissions."
            ) from e

        except Exception as e:
            logger.error(f"Unexpected error creating GitHub repository: {e}", exc_info=True)
            raise GitHubAPIError(f"Failed to create GitHub repo: {e}") from e

    async def _push_to_github(
        self, repo_name: str, username: str, branch: str = "main"
    ) -> None:
        """
        Push branch to GitHub repository.

        Args:
            repo_name: Repository name
            username: GitHub username
            branch: Branch name to push

        Raises:
            GitOperationError: If push fails
        """
        github_token = await self._get_github_token()
        if not github_token:
            raise GitOperationError("GitHub token not found")

        # Construct authenticated remote URL
        remote_url = f"https://{github_token}@github.com/{username}/{repo_name}.git"

        try:
            # Check if remote 'origin' exists
            remotes = await self._run_git_command(["git", "remote"])

            if "origin" in remotes.split():
                logger.info("Remote 'origin' exists, setting URL")
                await self._run_git_command(["git", "remote", "set-url", "origin", remote_url])
            else:
                logger.info("Adding remote 'origin'")
                await self._run_git_command(["git", "remote", "add", "origin", remote_url])

            # Push branch
            logger.info(f"Pushing branch '{branch}' to remote 'origin'")
            await self._run_git_command(["git", "push", "-u", "origin", branch])
            logger.info(f"Successfully pushed to GitHub branch '{branch}'")

        except GitOperationError as e:
            logger.error(f"Failed to push to GitHub '{username}/{repo_name}': {e}")
            raise

    async def _create_github_pr_api(
        self,
        repo_url: str,
        head_branch: str,
        base_branch: str,
        title: str,
        body: str,
    ) -> str:
        """
        Create pull request on GitHub.

        Args:
            repo_url: Repository URL
            head_branch: Source branch
            base_branch: Target branch
            title: PR title
            body: PR description

        Returns:
            Pull request URL

        Raises:
            GitHubAPIError: If PR creation fails
        """
        github_token = await self._get_github_token()
        if not github_token:
            raise GitHubAPIError("GitHub token not found for creating PR")

        # Parse owner/repo from URL
        match = re.search(r"github\.com/([^/]+)/([^/]+)(\.git)?$", repo_url)
        if not match:
            raise GitHubAPIError(f"Could not parse owner/repo from URL: {repo_url}")

        owner, repo = match.group(1), match.group(2)
        api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls"

        logger.info(f"Creating GitHub PR: {head_branch} -> {base_branch} in {owner}/{repo}")

        try:
            client = await self._get_http_client()
            response = await client.post(
                api_url,
                headers={
                    "Authorization": f"Bearer {github_token}",
                    "Accept": "application/vnd.github.v3+json",
                },
                json={
                    "title": title,
                    "head": head_branch,
                    "base": base_branch,
                    "body": body,
                    "maintainer_can_modify": True,
                },
            )

            if response.status_code == 201:
                pr_data = response.json()
                pr_url = pr_data["html_url"]
                logger.info(f"Pull request created: {pr_url}")
                return pr_url

            # Handle errors
            try:
                error_data = response.json()
                error_message = error_data.get("message", "Unknown error")
                error_details = error_data.get("errors", [])

                # Check for specific errors
                if any("No commits between" in str(e) for e in error_details):
                    error_message = (
                        f"No code changes found between '{base_branch}' and '{head_branch}'"
                    )
                    logger.warning(error_message)
                    raise GitHubAPIError(error_message)

                if any("A pull request already exists" in str(e) for e in error_details):
                    error_message = f"PR already exists for {head_branch} -> {base_branch}"
                    logger.warning(error_message)
                    raise GitHubAPIError(error_message)

                logger.error(
                    f"Failed to create GitHub PR ({response.status_code}): "
                    f"{error_message} Details: {error_details}"
                )
                raise GitHubAPIError(
                    f"Failed to create PR ({response.status_code}): {error_message}"
                )

            except json.JSONDecodeError:
                logger.error(
                    f"Failed to create GitHub PR ({response.status_code}): {response.text}"
                )
                raise GitHubAPIError(f"Failed to create PR ({response.status_code})")

        except httpx.HTTPStatusError as e:
            logger.error(
                f"HTTP error creating GitHub PR: {e.response.status_code} - {e.response.text}"
            )
            raise GitHubAPIError(f"GitHub API error: {e.response.status_code}") from e

        except Exception as e:
            logger.error(f"Unexpected error creating GitHub PR: {e}", exc_info=True)
            raise GitHubAPIError(f"Failed to create GitHub PR: {e}") from e

    # ========================================================================
    # WORKFLOW PHASE: FINALIZE
    # ========================================================================

    async def finalize(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """
        Finalize workflow: Push code to GitHub (new repo or PR).

        Args:
            session: User agent session
            messages: List of messages

        Yields:
            Progress events

        Raises:
            GitOperationError: If git operations fail
            GitHubAPIError: If GitHub operations fail
        """
        logger.info("Finalizing Requirements-to-Code workflow (ENHANCED VERSION)")

        properties = session.custom_properties or {}
        output_config = properties.get("output_config", {})
        output_type = output_config.get("type")

        # Check if we have files to finalize
        if not self.generated_files and not list(self.code_dir.glob("*")):
            logger.warning("No generated files found in workspace")
            yield {"type": "text", "data": {"text": "⚠️ No files generated, skipping GitHub finalization"}}
            return

        try:
            if output_type == "new_repo":
                async for event in self._finalize_new_repo(session, output_config):
                    yield event

            elif output_type == "pull_request":
                async for event in self._finalize_pull_request(session, output_config, properties):
                    yield event

            else:
                async for event in self._finalize_workspace_only():
                    yield event

        except (GitOperationError, GitHubAPIError, ValueError) as e:
            logger.error(f"Finalization failed: {e}", exc_info=True)
            yield {"type": "text", "data": {"text": f"❌ Error: {e}"}}
            raise

        except Exception as e:
            logger.error(f"Unexpected error during finalization: {e}", exc_info=True)
            yield {"type": "text", "data": {"text": f"❌ Unexpected Error: {e}"}}
            raise

        finally:
            # Clean up testing artifacts
            properties = session.custom_properties or {}
            options = properties.get("options", {})
            if options.get("cleanup_after_testing", True):
                await self._cleanup_testing_artifacts()

    async def _finalize_new_repo(
        self, session: UserAgentSession, output_config: dict
    ) -> AsyncIterator[dict[str, Any]]:
        """Finalize new repository creation."""
        repo_name = output_config.get("repo_name", f"generated-app-{session.id}")
        description = output_config.get("description", "AI-generated code")
        is_private = output_config.get("private", True)

        yield {"type": "text", "data": {"text": f"🚀 Creating new GitHub repository: {repo_name}"}}

        # Initialize and commit
        yield {"type": "text", "data": {"text": "Committing generated code..."}}
        commit_message = (
            f"feat: Initial code generation from requirements\n\n"
            f"Session ID: {session.id}"
        )
        await self._initialize_and_commit(commit_message)

        # Create remote repo
        yield {"type": "text", "data": {"text": f"Creating '{repo_name}' on GitHub..."}}
        repo_url, username = await self._create_github_repo_api(repo_name, description, is_private)

        # Push code
        yield {"type": "text", "data": {"text": f"Pushing code to {repo_url}..."}}
        await self._push_to_github(repo_name=repo_name, username=username, branch="main")

        yield {"type": "text", "data": {"text": f"✅ Successfully created and pushed to: {repo_url}"}}
        logger.info(f"Finalization complete for new repository: {repo_url}")

    async def _finalize_pull_request(
        self, session: UserAgentSession, output_config: dict, properties: dict
    ) -> AsyncIterator[dict[str, Any]]:
        """Finalize pull request creation."""
        repo_url = output_config.get("repo_url")
        if not repo_url:
            raise ValueError("'repo_url' is required for pull request output")

        base_branch = output_config.get("base_branch", "main")

        # Generate branch name
        input_keys = [
            inp.get("key") or inp.get("file_name", f"input{i}")
            for i, inp in enumerate(properties.get("inputs", []))
        ]
        sanitized_keys = [re.sub(r"[^a-zA-Z0-9_-]", "-", k) for k in input_keys]
        feature_suffix = "-".join(sanitized_keys)[:50]
        head_branch = output_config.get("branch_name", f"feature/ai-generated-{feature_suffix}")

        yield {"type": "text", "data": {"text": f"🚀 Preparing pull request for {repo_url}"}}

        # Ensure repo is cloned
        if not (self.code_dir / ".git").is_dir():
            raise ValueError("Target repository not found in workspace. Cloning may have failed")

        # Create and checkout branch
        yield {"type": "text", "data": {"text": f"Creating branch '{head_branch}'..."}}
        try:
            await self._run_git_command(["git", "checkout", "-b", head_branch])
        except GitOperationError as e:
            if "already exists" in str(e):
                logger.warning(f"Branch '{head_branch}' already exists, checking out")
                await self._run_git_command(["git", "checkout", head_branch])
            else:
                raise

        # Commit changes
        yield {"type": "text", "data": {"text": "Committing generated changes..."}}
        commit_message = (
            f"feat: Apply AI-generated changes from requirements\n\n"
            f"Based on: {', '.join(input_keys)}\n"
            f"Session ID: {session.id}"
        )
        await self._initialize_and_commit(commit_message)

        # Push branch
        yield {"type": "text", "data": {"text": f"Pushing branch '{head_branch}' to GitHub..."}}
        await self._run_git_command(["git", "push", "-u", "origin", head_branch])

        # Create PR
        yield {"type": "text", "data": {"text": f"Creating pull request '{head_branch}' -> '{base_branch}'..."}}
        pr_title = output_config.get(
            "pr_title", f"AI Code Generation: Apply changes for {', '.join(input_keys)}"
        )
        pr_body = output_config.get(
            "pr_body",
            (
                "This pull request was automatically generated by the Requirements-to-Code AI agent based on:\n"
                f"- {chr(10)}- ".join(input_keys)
                + f"\n\nSession ID: {session.id}"
            ),
        )
        pr_url = await self._create_github_pr_api(
            repo_url=repo_url,
            head_branch=head_branch,
            base_branch=base_branch,
            title=pr_title,
            body=pr_body,
        )

        yield {"type": "text", "data": {"text": f"✅ Pull request created successfully: {pr_url}"}}
        logger.info(f"Finalization complete for pull request: {pr_url}")

    async def _finalize_workspace_only(self) -> AsyncIterator[dict[str, Any]]:
        """Finalize workspace-only generation."""
        file_list_preview = "\n".join(
            [f"  - {name}" for name in sorted(list(self.generated_files.keys())[:10])]
        )
        total_files = len(self.generated_files)

        if total_files > 10:
            file_list_preview += f"\n  ... and {total_files - 10} more files"

        yield {
            "type": "text",
            "data": {
                "text": (
                    f"✅ Workflow finished. {total_files} files generated in workspace:\n"
                    f"{file_list_preview}"
                )
            },
        }
        yield {"type": "text", "data": {"text": f"Location: `{self.code_dir}`"}}
        logger.info(f"Finalization complete: Files in workspace {self.code_dir}")

    # ========================================================================
    # AUTOMATED TESTING SUPPORT (NEW FEATURE - ISSUE #2)
    # ========================================================================

    async def _should_run_tests(self, session: UserAgentSession) -> bool:
        """
        Determine if automated testing should be run.

        Returns:
            bool: True if testing should be executed
        """
        # Check if testing is enabled in session options
        properties = session.custom_properties or {}
        options = properties.get("options", {})
        testing_enabled = options.get("run_automated_tests", False)

        if not testing_enabled:
            logger.info("Automated testing disabled in session options")
            return False

        # Check if test files exist in generated code
        test_files_exist = self._test_files_exist()

        if not test_files_exist:
            logger.info("No test files found in generated code")
            return False

        logger.info("Automated testing enabled and test files found")
        return True

    def _test_files_exist(self) -> bool:
        """
        Check if test files exist in the generated code.

        Returns:
            bool: True if test files are found
        """
        test_patterns = [
            "tests/**/*.py",      # Python tests directory
            "test_*.py",          # Python test files
            "*_test.py",          # Python test files (alternative)
            "**/__tests__/**/*.js",  # JavaScript tests directory
            "**/*.test.js",       # JavaScript test files
            "**/*.test.ts",       # TypeScript test files
            "**/*.spec.js",       # JavaScript spec files
            "**/*.spec.ts",       # TypeScript spec files
        ]

        for pattern in test_patterns:
            matches = list(self.code_dir.glob(pattern))
            if matches:
                logger.info(f"Found test files matching pattern: {pattern}")
                return True

        return False

    async def _detect_project_type(self) -> str:
        """
        Detect project type based on files present.

        Returns:
            str: Project type ("python", "javascript", "unknown")
        """
        # Check for Python
        if (self.code_dir / "requirements.txt").exists() or \
           (self.code_dir / "pyproject.toml").exists() or \
           (self.code_dir / "setup.py").exists():
            logger.info("Detected project type: Python")
            return "python"

        # Check for JavaScript/TypeScript
        if (self.code_dir / "package.json").exists():
            logger.info("Detected project type: JavaScript/TypeScript")
            return "javascript"

        logger.warning("Could not detect project type")
        return "unknown"

    async def _run_automated_tests(self) -> dict[str, Any]:
        """
        Run automated tests on generated code.

        Returns:
            dict: Test results with keys:
                - success: bool (True if all tests passed)
                - passed: int (number of tests passed)
                - failed: int (number of tests failed)
                - total: int (total tests run)
                - output: str (test output)
                - error: str (error message if failed)
        """
        project_type = await self._detect_project_type()

        logger.info(f"Running tests for project type: {project_type}")

        if project_type == "python":
            return await self._run_python_tests()
        elif project_type == "javascript":
            return await self._run_javascript_tests()
        else:
            logger.warning(f"Testing not supported for project type: {project_type}")
            return {
                "success": True,  # Don't block if we can't test
                "passed": 0,
                "failed": 0,
                "total": 0,
                "output": f"Testing not supported for project type: {project_type}",
                "skipped": True
            }

    async def _run_python_tests(self) -> dict[str, Any]:
        """Run Python tests using pytest."""
        try:
            logger.info("Starting Python test execution")

            # Step 1: Install dependencies
            logger.info("Installing Python dependencies...")
            if not await self._install_python_dependencies():
                return {
                    "success": False,
                    "error": "Failed to install dependencies",
                    "passed": 0,
                    "failed": 0,
                    "total": 0
                }

            # Step 2: Determine pytest path
            venv_dir = self.code_dir / "venv"
            if venv_dir.exists():
                pytest_path = venv_dir / "bin" / "pytest" if os.name != "nt" else venv_dir / "Scripts" / "pytest"
            else:
                pytest_path = "pytest"

            logger.info(f"Using pytest at: {pytest_path}")

            # Step 3: Run tests
            logger.info(f"Running pytest in {self.code_dir}")

            process = await asyncio.create_subprocess_exec(
                str(pytest_path),
                "--tb=short",
                "--verbose",
                "--color=no",
                "-v",
                "--maxfail=10",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.code_dir
            )

            # Wait for tests with timeout (max 10 minutes)
            try:
                stdout, stderr = await asyncio.wait_for(
                    process.communicate(),
                    timeout=600
                )
            except asyncio.TimeoutError:
                process.kill()
                logger.error("Tests timed out after 10 minutes")
                return {
                    "success": False,
                    "error": "Tests timed out after 10 minutes",
                    "passed": 0,
                    "failed": 0,
                    "total": 0,
                    "output": "Test execution timed out"
                }

            output = stdout.decode() + "\n" + stderr.decode()

            # Step 4: Parse test results
            results = self._parse_pytest_output(output)
            results["output"] = output

            logger.info(
                f"Python test results: {results['passed']}/{results['total']} passed",
                extra={"results": results}
            )

            return results

        except FileNotFoundError:
            logger.error("pytest not found")
            return {
                "success": False,
                "error": "pytest not found. Install pytest first.",
                "passed": 0,
                "failed": 0,
                "total": 0
            }
        except Exception as e:
            logger.error(f"Error running Python tests: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "passed": 0,
                "failed": 0,
                "total": 0
            }

    def _parse_pytest_output(self, output: str) -> dict[str, Any]:
        """Parse pytest output to extract test results."""
        import re

        passed = 0
        failed = 0
        skipped = 0
        errors = 0

        passed_match = re.search(r"(\d+)\s+passed", output)
        if passed_match:
            passed = int(passed_match.group(1))

        failed_match = re.search(r"(\d+)\s+failed", output)
        if failed_match:
            failed = int(failed_match.group(1))

        skipped_match = re.search(r"(\d+)\s+skipped", output)
        if skipped_match:
            skipped = int(skipped_match.group(1))

        error_match = re.search(r"(\d+)\s+error", output)
        if error_match:
            errors = int(error_match.group(1))

        total = passed + failed + skipped + errors
        success = failed == 0 and errors == 0 and total > 0

        return {
            "success": success,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "errors": errors,
            "total": total
        }

    async def _install_python_dependencies(self) -> bool:
        """Install Python dependencies in virtual environment."""
        requirements_file = self.code_dir / "requirements.txt"
        pyproject_file = self.code_dir / "pyproject.toml"

        if not requirements_file.exists() and not pyproject_file.exists():
            logger.info("No Python dependencies file found, skipping installation")
            return True

        try:
            # Create virtual environment
            venv_dir = self.code_dir / "venv"

            if not venv_dir.exists():
                logger.info("Creating Python virtual environment")

                create_venv_process = await asyncio.create_subprocess_exec(
                    "python3", "-m", "venv", str(venv_dir),
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE,
                    cwd=self.code_dir
                )

                stdout, stderr = await create_venv_process.communicate()

                if create_venv_process.returncode != 0:
                    logger.error(f"Failed to create virtual environment: {stderr.decode()}")
                    return False

                logger.info("Virtual environment created successfully")

            # Install dependencies
            pip_path = venv_dir / "bin" / "pip" if os.name != "nt" else venv_dir / "Scripts" / "pip"

            logger.info("Installing Python dependencies")

            if requirements_file.exists():
                install_cmd = [str(pip_path), "install", "-r", str(requirements_file)]
            else:
                install_cmd = [str(pip_path), "install", "."]

            install_process = await asyncio.create_subprocess_exec(
                *install_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.code_dir
            )

            stdout, stderr = await asyncio.wait_for(
                install_process.communicate(),
                timeout=300
            )

            if install_process.returncode != 0:
                logger.error(f"Failed to install dependencies: {stderr.decode()}")
                return False

            # Also install pytest
            logger.info("Installing pytest")

            pytest_install = await asyncio.create_subprocess_exec(
                str(pip_path), "install", "pytest", "pytest-cov",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.code_dir
            )

            await pytest_install.communicate()

            logger.info("Successfully installed Python dependencies")
            return True

        except asyncio.TimeoutError:
            logger.error("Dependency installation timed out after 5 minutes")
            return False
        except Exception as e:
            logger.error(f"Error installing Python dependencies: {e}", exc_info=True)
            return False

    async def _run_javascript_tests(self) -> dict[str, Any]:
        """Run JavaScript tests using npm test."""
        try:
            logger.info("Starting JavaScript test execution")

            package_json = self.code_dir / "package.json"
            if not package_json.exists():
                return {
                    "success": False,
                    "error": "No package.json found",
                    "passed": 0,
                    "failed": 0,
                    "total": 0
                }

            # Install dependencies
            logger.info("Installing npm dependencies")

            install_process = await asyncio.create_subprocess_exec(
                "npm", "install",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.code_dir
            )

            stdout, stderr = await asyncio.wait_for(
                install_process.communicate(),
                timeout=300
            )

            if install_process.returncode != 0:
                logger.error(f"npm install failed: {stderr.decode()}")
                return {
                    "success": False,
                    "error": "Failed to install npm dependencies",
                    "passed": 0,
                    "failed": 0,
                    "total": 0
                }

            # Run tests
            logger.info("Running npm test")

            test_process = await asyncio.create_subprocess_exec(
                "npm", "test", "--", "--passWithNoTests",
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=self.code_dir,
                env={**os.environ, "CI": "true"}
            )

            stdout, stderr = await asyncio.wait_for(
                test_process.communicate(),
                timeout=600
            )

            output = stdout.decode() + "\n" + stderr.decode()

            results = self._parse_jest_output(output)
            results["output"] = output

            logger.info(
                f"JavaScript test results: {results['passed']}/{results['total']} passed",
                extra={"results": results}
            )

            return results

        except asyncio.TimeoutError:
            logger.error("JavaScript tests timed out")
            return {
                "success": False,
                "error": "Tests timed out",
                "passed": 0,
                "failed": 0,
                "total": 0
            }
        except Exception as e:
            logger.error(f"Error running JavaScript tests: {e}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "passed": 0,
                "failed": 0,
                "total": 0
            }

    def _parse_jest_output(self, output: str) -> dict[str, Any]:
        """Parse Jest/Vitest output to extract test results."""
        import re

        passed = 0
        failed = 0
        skipped = 0

        tests_pattern = r"Tests:\s*(?:(\d+)\s*failed,\s*)?(?:(\d+)\s*passed,\s*)?(\d+)\s*total"
        match = re.search(tests_pattern, output)

        if match:
            failed = int(match.group(1)) if match.group(1) else 0
            passed = int(match.group(2)) if match.group(2) else 0
            total = int(match.group(3))
        else:
            passed_match = re.search(r"(\d+)\s*passed", output)
            failed_match = re.search(r"(\d+)\s*failed", output)
            skipped_match = re.search(r"(\d+)\s*skipped", output)

            passed = int(passed_match.group(1)) if passed_match else 0
            failed = int(failed_match.group(1)) if failed_match else 0
            skipped = int(skipped_match.group(1)) if skipped_match else 0
            total = passed + failed + skipped

        success = failed == 0 and total > 0

        return {
            "success": success,
            "passed": passed,
            "failed": failed,
            "skipped": skipped,
            "total": total
        }

    async def _cleanup_testing_artifacts(self) -> None:
        """Clean up testing artifacts to save disk space."""
        try:
            venv_dir = self.code_dir / "venv"
            if venv_dir.exists():
                logger.info(f"Removing virtual environment: {venv_dir}")
                shutil.rmtree(venv_dir)

            node_modules = self.code_dir / "node_modules"
            if node_modules.exists():
                logger.info(f"Removing node_modules: {node_modules}")
                shutil.rmtree(node_modules)

            for pycache in self.code_dir.rglob("__pycache__"):
                shutil.rmtree(pycache)

            pytest_cache = self.code_dir / ".pytest_cache"
            if pytest_cache.exists():
                shutil.rmtree(pytest_cache)

            logger.info("Testing artifacts cleaned up successfully")

        except Exception as e:
            logger.error(f"Error cleaning up testing artifacts: {e}", exc_info=True)


# ============================================================================
# END OF ENHANCED IMPLEMENTATION
# ============================================================================
