"""Requirements To Code agent workflow implementation."""

import json
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


@register(AgentIdentifier.REQUIREMENTS_TO_CODE)
class RequirementsToCodeWorkflow(AgentWorkflow):
    """Workflow for building code from tickets and documents."""

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
        """Initialize workflow with required parameters."""
        super().__init__(
            workspace_dir=workspace_dir,
            mcp_configs=mcp_configs,
            integration_service=integration_service,
            system_prompt=system_prompt,
            llm_session_id=llm_session_id,
        )
        self.git_ops = GitOps()
        self.code_dir = self.workspace_dir / "code"
        self.requirements_cache: dict[str, Any] = {}
        self.generated_files: dict[str, str] = {}

    async def _get_github_token(self) -> str | None:
        """Get GitHub access token from integrations."""
        try:
            integration = await self.integration_service.crud.get_by_provider(provider=IntegrationProvider.GITHUB)
            if integration and integration.id:
                # FIX 1: Use the correct method name 'get_access_token'
                creds = await self.integration_service.get_access_token(integration_id=integration.id)

                # FIX 2: Check if 'creds' is a dictionary (as your code expects) or a string
                if isinstance(creds, dict):
                    token = creds.get("token")
                elif isinstance(creds, str):
                    token = creds # Handle if it just returns the token string
                else:
                    token = None

                logger.info(f"GitHub token retrieved: {token is not None}")
                return token
        except Exception as e:
            logger.error(f"Failed to get GitHub token: {e}")
            import traceback
            logger.error(traceback.format_exc())
        return None

    # --- START OF JIRA-ONLY UPDATE ---
    # Replace the existing _get_jira_credentials function.

    async def _get_jira_credentials(self, *, session: UserAgentSession) -> dict[str, Any] | None:
        """
        Safely get Jira credentials directly from the integration record,
        bypassing any potentially buggy refresh logic in the service layer.
        Uses the correct 'created_by' field for filtering.
        """
        integration = None  # Initialize to None
        try:
            # Get the user ID from the session object.
            user_identifier = session.created_by
            logger.info(f"Attempting to find Jira/Atlassian integration directly for user {user_identifier} using CRUD...")

            # --- Core Workaround: Direct Database Read ---
            # Use the correct 'created_by' field matching your database schema.

            # Try finding 'JIRA' provider first
            integration = await self.integration_service.crud.get_by_provider(
                provider=IntegrationProvider.JIRA, created_by=user_identifier
            )

            # If not found, try 'ATLASSIAN' provider
            if not integration:
                logger.info("No 'JIRA' integration found, trying 'ATLASSIAN' provider name.")
                integration = await self.integration_service.crud.get_by_provider(
                    provider=IntegrationProvider.ATLASSIAN, created_by=user_identifier
                )

            # Check if we found an integration and if it has valid credentials stored
            if integration and integration.credentials and isinstance(integration.credentials, dict):
                # Check for essential OAuth keys needed by _fetch_jira_ticket
                if "access_token" in integration.credentials and "cloud_id" in integration.credentials:
                    logger.info(f"✅ Directly retrieved valid credentials for integration ID: {integration.id}")
                    # Return a copy to prevent accidental modification elsewhere
                    return integration.credentials.copy()
                else:
                    logger.error(f"Integration {integration.id} found, but credentials dictionary is missing required OAuth keys (access_token, cloud_id).")
                    return None
            else:
                 # Log if no integration was found for the user or if credentials are empty/invalid
                 logger.error(f"No valid Jira or Atlassian integration with stored credentials found for user {user_identifier}.")
                 return None

        except Exception as e:
            # Catch any unexpected error during the direct fetch.
            integration_id_info = f"(Integration ID: {integration.id})" if integration else ""
            logger.error(f"Critical error fetching credentials directly {integration_id_info}: {e}", exc_info=True)
            return None

    async def _fetch_jira_ticket(self, *, ticket_key: str, session: UserAgentSession) -> dict[str, Any]:
        """Fetch and parse Jira ticket details using the REST API with OAuth 2.0."""
        logger.info(f"Fetching Jira ticket: {ticket_key}")
        # --- THIS IS THE FIX ---
        # Pass the session object when calling _get_jira_credentials
        creds = await self._get_jira_credentials(session=session)
        if not creds:
            raise ValueError("Jira integration not configured for this user. Please connect your Jira account.")

        try:
            # import httpx # Already imported at top level

            # Use the correct credentials for OAuth 2.0
            access_token = creds.get("access_token")
            cloud_id = creds.get("cloud_id")

            if not access_token or not cloud_id:
                raise ValueError("Incomplete Jira OAuth credentials. Access token and cloud ID are required.")

            # The API URL for Jira Cloud with OAuth 2.0 uses the cloud_id
            api_url = f"https://api.atlassian.com/ex/jira/{cloud_id}/rest/api/3/issue/{ticket_key}"

            logger.info(f"Fetching from Jira API: {api_url}")

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    api_url,
                    headers={
                        "Authorization": f"Bearer {access_token}", # Use Bearer token
                        "Accept": "application/json",
                    },
                )
                response.raise_for_status()
                issue_data = response.json()

            fields = issue_data.get("fields", {})
            summary = fields.get("summary", "N/A")
            description_text = self._parse_jira_description(fields.get("description"))
            acceptance_criteria = self._extract_acceptance_criteria(description_text)

            full_content = f"""Jira Ticket: {ticket_key}
Summary: {summary}
Type: {fields.get("issuetype", {}).get("name", "N/A")}
Status: {fields.get("status", {}).get("name", "N/A")}
Priority: {fields.get("priority", {}).get("name", "N/A")}

Description:
{description_text}

Acceptance Criteria:
- {'/n- '.join(acceptance_criteria) if acceptance_criteria else 'None specified'}
"""
            logger.info(f"✅ Successfully fetched and parsed Jira ticket {ticket_key}.")
            return {
                "key": ticket_key,
                "summary": summary,
                "description": description_text,
                "acceptance_criteria": acceptance_criteria,
                "content": full_content.strip(),
            }
        except httpx.HTTPStatusError as e:
            error_message = f"Jira API error ({e.response.status_code}). Check if ticket '{ticket_key}' exists and you have permission to view it."
            logger.error(f"{error_message} Response: {e.response.text}")
            raise ValueError(error_message) from e
        except Exception as e:
            logger.error(f"An unexpected error occurred while fetching Jira ticket {ticket_key}: {e}", exc_info=True)
            raise ValueError(f"Failed to fetch Jira ticket: {e}")

    def _parse_jira_description(self, description: dict | str | None) -> str:
        """
        Recursively parse Jira's Atlassian Document Format (ADF) to clean text.
        This is more robust for nested content like lists and paragraphs.
        """
        if not description:
            return "No description provided."
        if isinstance(description, str):
            return description

        # A simple recursive parser for ADF
        def parse_node(node):
            node_type = node.get("type", "")
            content_parts = []

            if node_type == "text":
                return node.get("text", "")

            if "content" in node:
                for sub_node in node["content"]:
                    content_parts.append(parse_node(sub_node))

            text_content = "".join(content_parts)

            if node_type == "paragraph":
                return text_content + "\n"
            if node_type == "bulletList":
                # Ensure list items have proper newlines
                return "".join([f"- {item.strip()}\n" for item in text_content.strip().split('\n') if item.strip()])
            if node_type == "orderedList":
                 # Ensure list items have proper newlines and numbering (simple approach)
                items = [item.strip() for item in text_content.strip().split('\n') if item.strip()]
                return "".join([f"{i+1}. {item}\n" for i, item in enumerate(items)])
            if node_type == "listItem":
                 # List item content is handled by the parent list parser now
                 return text_content # Return raw text for list parser
            if node_type == "heading":
                level = node.get("attrs", {}).get("level", 1)
                return f"\n{'#' * level} {text_content.strip()}\n"
            if node_type == "codeBlock":
                 lang = node.get("attrs", {}).get("language", "")
                 return f"\n``` {lang}\n{text_content.strip()}\n```\n"


            return text_content # Return text for unknown nodes

        # Fix: Ensure top-level parsing joins parts correctly
        parsed_parts = []
        if isinstance(description, dict) and "content" in description:
            for node in description["content"]:
                parsed_parts.append(parse_node(node))

        return "".join(parsed_parts).strip()


    def _extract_acceptance_criteria(self, description: str) -> list[str]:
        """Extract acceptance criteria from description text using a more reliable method."""
        criteria = []
        in_ac_section = False

        # Normalize line endings
        normalized_description = '\n'.join(description.splitlines())

        for line in normalized_description.splitlines():
            line_lower = line.lower().strip()

            # Check if this line is a header that starts the AC section (allow variations)
            if line.strip().startswith('#') and any(h in line_lower for h in ["acceptance criteria", "ac:", "success criteria"]):
                in_ac_section = True
                continue
            # Also check for bolded headers (common in Jira)
            if line.strip().startswith('*') and line.strip().endswith('*') and any(h in line_lower for h in ["acceptance criteria", "ac:", "success criteria"]):
                 in_ac_section = True
                 continue


            # If we are in the section, look for list items
            if in_ac_section:
                stripped_line = line.strip()
                # Check for bullet points or numbered lists more robustly
                match = re.match(r'^([\*\-•]|\d+\.)\s*(.*)', stripped_line)
                if match:
                    item_text = match.group(2).strip()
                    if item_text: # Ensure we don't add empty items
                         criteria.append(item_text)
                # If we hit a blank line or a new header/section, the AC section is over
                elif not stripped_line or stripped_line.startswith('#') or (stripped_line.startswith('*') and stripped_line.endswith('*')):
                    # Only break if it's NOT the AC header itself
                    if not any(h in line_lower for h in ["acceptance criteria", "ac:", "success criteria"]):
                        in_ac_section = False

        # If criteria list is empty, log a warning
        if not criteria:
             logger.warning("Could not automatically extract Acceptance Criteria from description.")

        return criteria
    # --- END OF JIRA-ONLY UPDATE ---


    async def _get_clickup_credentials(self) -> dict[str, str] | None:
        """Get ClickUp credentials from integrations."""
        try:
            # FIX 1: Added missing 'await'
            integration = await self.integration_service.crud.get_by_provider(provider=IntegrationProvider.CLICKUP)
            if integration and integration.id:
                # FIX 2: Use the correct method name 'get_access_token'
                creds = await self.integration_service.get_access_token(integration_id=integration.id)

                # Ensure 'creds' is a dictionary
                if isinstance(creds, dict):
                    logger.info("ClickUp credentials retrieved successfully")
                    return creds

            logger.warning("ClickUp integration not found or credentials are not a dictionary.")
            return None
        except Exception as e:
            logger.error(f"Failed to get ClickUp credentials: {e}")
        return None


    async def _fetch_clickup_task(self, task_id: str) -> dict[str, Any]:
        """Fetch ClickUp task details via REST API."""
        logger.info(f"Fetching ClickUp task: {task_id}")

        creds = await self._get_clickup_credentials()
        if not creds:
            logger.warning("ClickUp credentials not found, returning placeholder")
            return {
                "id": task_id,
                "name": f"ClickUp Task {task_id}",
                "description": f"Requirements from ClickUp task {task_id}. ClickUp integration is in development phase.",
                "content": "ClickUp integration coming soon. Configure ClickUp integration to fetch actual task data.",
            }

        try:
            # import httpx # Already imported

            # Get ClickUp API token
            api_token = creds.get("token") or creds.get("api_token")

            if not api_token:
                raise ValueError("ClickUp API token not found")

            logger.info(f"Fetching ClickUp task: {task_id}")

            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.get(
                    f"https://api.clickup.com/api/v2/task/{task_id}",
                    headers={
                        "Authorization": api_token,
                        "Content-Type": "application/json",
                    },
                )

                if response.status_code == 200:
                    task_data = response.json()

                    # Extract task information
                    name = task_data.get("name", "")
                    # ClickUp description might be plain text or markdown
                    description = task_data.get("description", "") or task_data.get("text_content", "") # Fallback
                    status = task_data.get("status", {}).get("status", "")
                    priority = task_data.get("priority", {}).get("priority", "") if task_data.get("priority") else "None"

                    # Get custom fields
                    custom_fields = task_data.get("custom_fields", [])

                    # Extract acceptance criteria from custom fields or description
                    acceptance_criteria = []
                    for field in custom_fields:
                        # Be more specific if possible, using field ID or exact name
                        if "acceptance" in field.get("name", "").lower():
                            value = field.get("value", "") # Value type depends on field type
                            if isinstance(value, str) and value:
                                # Split multi-line text fields
                                acceptance_criteria.extend([line.strip() for line in value.splitlines() if line.strip()])
                            elif isinstance(value, list): # E.g., checklist
                                acceptance_criteria.extend([str(item) for item in value])

                    # If no custom field, try to extract from description
                    if not acceptance_criteria and description:
                        acceptance_criteria = self._extract_acceptance_criteria(description)

                    logger.info(f"Successfully fetched ClickUp task: {task_id}")

                    return {
                        "id": task_id,
                        "name": name,
                        "description": description,
                        "status": status,
                        "priority": priority,
                        "acceptance_criteria": acceptance_criteria,
                        "content": f"""ClickUp Task: {task_id}
Name: {name}
Status: {status}
Priority: {priority}

Description:
{description}

Acceptance Criteria:
{chr(10).join([f"- {criterion}" for criterion in acceptance_criteria]) if acceptance_criteria else "None specified"}
""",
                    }
                else:
                    logger.error(f"Failed to fetch ClickUp task: {response.status_code} - {response.text}")
                    raise ValueError(f"Failed to fetch ClickUp task: {response.status_code}")

        except Exception as e:
            logger.error(f"Error fetching ClickUp task {task_id}: {e}")
            # Return placeholder on error
            return {
                "id": task_id,
                "name": f"Error fetching ClickUp task {task_id}",
                "description": f"Failed to fetch task details: {str(e)}. ClickUp integration is in development phase.",
                "content": f"Error: {str(e)}",
            }

    async def _process_document_file(self, file_name: str) -> dict[str, Any]:
        """Process PDF or TXT file from user storage."""
        logger.info(f"Processing document file: {file_name}")

        # Copy file to workspace
        await self._copy_file_to_workspace(file_name)

        # Read file content
        file_path = self.workspace_dir / file_name
        if not file_path.exists():
            raise ValueError(f"File not found: {file_name}")

        # Determine file type
        file_extension = file_path.suffix.lower()

        if file_extension == ".pdf":
            content = await self._extract_pdf_text(file_path)
        elif file_extension in [".txt", ".md"]:
            content = file_path.read_text(encoding="utf-8")
        else:
            raise ValueError(f"Unsupported file type: {file_extension}")

        logger.info(f"Successfully processed {file_name}, content length: {len(content)}")

        return {
            "file_name": file_name,
            "content": content,
            "type": "document",
        }

    async def _extract_pdf_text(self, file_path: Path) -> str:
        """Extract text from PDF file."""
        try:
            # Lazy import to avoid making PyPDF2 a hard dependency
            import PyPDF2

            text_content = []
            with open(file_path, "rb") as pdf_file:
                try:
                    pdf_reader = PyPDF2.PdfReader(pdf_file)
                    for page in pdf_reader.pages:
                        page_text = page.extract_text()
                        if page_text: # Avoid adding None if extraction fails for a page
                             text_content.append(page_text)
                except Exception as read_error: # Catch potential PyPDF2 errors
                     logger.error(f"Error reading PDF {file_path}: {read_error}")
                     raise ValueError(f"Failed to read PDF file: {read_error}")


            result = "\n\n".join(text_content)
            logger.info(f"Extracted {len(result)} characters from PDF")
            return result
        except ImportError:
            logger.error("PyPDF2 is required for PDF processing but not installed. Run: pip install pypdf2")
            raise ValueError("PDF processing requires PyPDF2. Please install it.")
        except Exception as e:
            logger.error(f"Unexpected error extracting PDF text: {e}")
            raise ValueError(f"Failed to parse PDF: {e}")

    async def prepare(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Prepare workspace by fetching requirements from various sources."""
        logger.info(f"Preparing workspace {self.workspace_dir} for code building")

        # Skip prepare if session already has an LLM session ID (re-run or continuation)
        if session.llm_session_id:
            logger.info("Session already initialized, skipping prepare step.")
            # Rescan workspace files in case they were modified externally
            await self._scan_workspace_files()
            # Rebuild requirements cache if empty (e.g., after server restart)
            if not self.requirements_cache:
                logger.warning("Requirements cache is empty on re-run, attempting to rebuild.")
                # This might require fetching again, depending on desired behavior.
                # For now, just log it. A more robust solution might re-fetch.
            return

        try:
            # Create code directory
            self.code_dir.mkdir(parents=True, exist_ok=True)
            logger.info(f"Ensured code directory exists: {self.code_dir}")

            # Extract inputs from custom_properties
            properties = session.custom_properties or {}
            inputs = properties.get("inputs", [])

            if not inputs:
                raise ValueError("No input sources specified for code generation")

            # Process each input source
            for idx, input_source in enumerate(inputs):
                input_type = input_source.get("type")
                provider = input_source.get("provider")
                tool_call_id = f"fetch_input_{idx}"
                identifier = input_source.get("key") or input_source.get("file_name")

                if not identifier:
                    logger.error(f"Input source {idx} missing 'key' or 'file_name'. Skipping.")
                    yield {
                        "type": "tool_result",
                        "toolCallId": tool_call_id,
                        "result": f"Error: Input source {idx} missing identifier.",
                        "isError": True,
                    }
                    continue # Skip this input


                yield {
                    "type": "tool_call",
                    "toolCallId": tool_call_id,
                    "toolName": "fetch_requirements",
                    "args": {
                        "source": provider,
                        "type": input_type,
                        "identifier": identifier,
                    },
                }

                try:
                    # Fetch based on provider
                    if provider == "jira":
                        ticket_key = input_source.get("key")
                        if not ticket_key: raise ValueError("Missing 'key' for Jira input")
                        # Pass session for context
                        requirements = await self._fetch_jira_ticket(ticket_key=ticket_key, session=session)
                    elif provider == "clickup":
                        task_id = input_source.get("key")
                        if not task_id: raise ValueError("Missing 'key' for ClickUp input")
                        requirements = await self._fetch_clickup_task(task_id)
                    elif provider == "file":
                        file_name = input_source.get("file_name")
                        if not file_name: raise ValueError("Missing 'file_name' for file input")
                        requirements = await self._process_document_file(file_name)
                    else:
                        raise ValueError(f"Unsupported provider: {provider}")

                    # Cache requirements
                    cache_key = f"{provider}_{identifier}"
                    self.requirements_cache[cache_key] = requirements

                    yield {
                        "type": "tool_result",
                        "toolCallId": tool_call_id,
                        "result": f"Successfully fetched requirements from {provider}: {identifier}",
                    }
                except Exception as fetch_error:
                    logger.error(f"Failed to fetch requirements from {provider} ({identifier}): {fetch_error}")
                    yield {
                        "type": "tool_result",
                        "toolCallId": tool_call_id,
                        "result": f"Error fetching from {provider}: {str(fetch_error)}",
                        "isError": True,
                    }
                    # Optionally raise to stop the whole process, or continue with other inputs
                    # raise # Uncomment to stop on first error


            logger.info(f"Cached {len(self.requirements_cache)} requirement sources")

             # Handle existing repository clone if output is PR (moved outside loop)
            output_config = properties.get("output_config", {})
            if output_config.get("type") == "pull_request":
                repo_url = output_config.get("repo_url")
                if repo_url:
                    github_token = await self._get_github_token()
                    if not github_token:
                         raise ValueError("GitHub integration required for pull requests, but token not found.")

                    tool_call_id = "clone_target_repo"
                    yield {
                        "type": "tool_call",
                        "toolCallId": tool_call_id,
                        "toolName": "git_clone",
                        "args": {"url": repo_url, "destination": str(self.code_dir)},
                    }

                    try:
                        # Ensure code_dir exists but is empty before cloning into it
                        if self.code_dir.exists():
                             logger.warning(f"Removing existing code directory before cloning: {self.code_dir}")
                             shutil.rmtree(self.code_dir)
                        self.code_dir.mkdir(parents=True) # Recreate after removal

                        await self.git_ops.clone_repository(
                            url=repo_url,
                            destination=self.code_dir, # Clone directly into code_dir
                            access_token=github_token,
                        )
                        logger.info(f"Successfully cloned {repo_url} into {self.code_dir}")
                        yield {
                            "type": "tool_result",
                            "toolCallId": tool_call_id,
                            "result": f"Successfully cloned repository into workspace.",
                        }
                    except GitOperationError as git_error:
                        logger.error(f"Failed to clone repository {repo_url}: {git_error}")
                        yield {
                             "type": "tool_result",
                             "toolCallId": tool_call_id,
                             "result": f"Error cloning repository: {str(git_error)}",
                             "isError": True,
                        }
                        raise # Stop if clone fails

            logger.info("Workspace preparation completed successfully")

        except Exception as e:
            logger.error(f"Failed to prepare workspace: {e}", exc_info=True)
            # Ensure the error is propagated to the run method
            raise

    async def _prepare_system_prompt(self, session: UserAgentSession) -> str:
        """Prepare system prompt for code generation, including tech stack info if available."""
        requirements_summary = ""
        if not self.requirements_cache:
             logger.warning("Requirements cache is empty when preparing system prompt!")

        for key, data in self.requirements_cache.items():
            content_preview = data.get("content", "")[:300] # Increased preview length
            requirements_summary += f"\n--- Requirements from: {key} ---\n{content_preview}...\n"

        # Extract tech stack hints from output_config if present
        properties = session.custom_properties or {}
        output_config = properties.get("output_config", {})
        tech_stack = output_config.get("tech_stack", {})
        tech_info = ""
        if tech_stack:
             lang = tech_stack.get('language')
             fw = tech_stack.get('framework')
             deps = tech_stack.get('dependencies')
             tech_info += "\n\nTechnology Stack Guidance:\n"
             if lang: tech_info += f"- Language: {lang}\n"
             if fw: tech_info += f"- Framework: {fw}\n"
             if deps: tech_info += f"- Key Dependencies: {', '.join(deps)}\n"


        prompt = f"""You are an expert AI software engineer. Your task is to generate complete, high-quality, production-ready code based *only* on the requirements provided.

CRITICAL INSTRUCTIONS - FOLLOW THESE EXACTLY:
1.  **Output Directory:** You MUST create ALL files inside the workspace directory: `{self.code_dir}`. This is mandatory.
2.  **File Paths:** Use ABSOLUTE paths starting with `{self.code_dir}` for all file operations.
    -   Example: `{self.code_dir}/src/main.py`, `{self.code_dir}/README.md`
3.  **Tools:** Use the `execute_command` tool with bash commands (like `mkdir`, `cat > file << EOF`, `echo`) to create directories and files.
    -   Example: `mkdir -p {self.code_dir}/src`
    -   Example: `cat > {self.code_dir}/src/app.py << 'EOF'`
        ```python
        # Your python code here
        ```
        `EOF`
4.  **No External Directories:** Do NOT use `/tmp/`, `/home/`, or any directory outside `{self.code_dir}`.
5.  **Completeness:** Generate a FULLY functional application, including:
    -   Source code (e.g., in `{self.code_dir}/src/`)
    -   Unit tests (e.g., in `{self.code_dir}/tests/`) achieving good coverage.
    -   Configuration files (e.g., `requirements.txt`, `package.json`, `.gitignore`) in `{self.code_dir}/`.
    -   A `README.md` in `{self.code_dir}/` with setup, usage, and contribution guidelines.
6.  **Code Quality:** Adhere to best practices, use clear variable names, add comments for complex logic, and ensure the code is well-structured and maintainable.

Requirements Summary (Preview):
{requirements_summary}
{tech_info}
Carefully review the full requirements provided in the user prompt before starting. Generate the complete project structure and all necessary files within `{self.code_dir}`.
"""
        return prompt

    async def _prepare_user_prompt(
        self,
        session: UserAgentSession,
        requirements: dict[str, Any],
    ) -> str:
        """Prepare the main user prompt containing the full requirements."""
        properties = session.custom_properties or {}
        output_config = properties.get("output_config", {})

        requirements_text = ""
        if not requirements:
             logger.error("Requirements cache is empty when preparing user prompt! Cannot generate code.")
             return "Error: Requirements data is missing. Cannot proceed."

        for key, data in requirements.items():
            content = data.get("content", "Error: Content not found.")
            # Add clear delimiters
            requirements_text += f"\n\n===== START: Requirements from {key} =====\n"
            requirements_text += content
            requirements_text += f"\n===== END: Requirements from {key} =====\n"

        output_type = output_config.get("type", "workspace_only")
        repo_info = f"Output Target: Files will be generated in the workspace: {self.code_dir}"
        if output_type == "new_repo":
            repo_name = output_config.get("repo_name", "generated-code")
            repo_info = f"Output Target: Generate code for a NEW GitHub repository named '{repo_name}'"
        elif output_type == "pull_request":
            repo_url = output_config.get("repo_url", "UNKNOWN")
            base_branch = output_config.get("base_branch", "main")
            repo_info = f"Output Target: Generate code as changes for an EXISTING repository ({repo_url}), to be submitted as a pull request against the '{base_branch}' branch."


        prompt = f"""Based *only* on the requirements detailed below, generate the complete source code, tests, configuration, and documentation for the application.

Full Requirements:
{requirements_text}

---
**ACTION:**
1.  Analyze the requirements above carefully.
2.  Plan the project structure (directories, key files).
3.  Generate all necessary files using the `execute_command` tool with bash commands.
4.  Ensure all file paths start with the mandatory workspace directory: `{self.code_dir}`.
5.  {repo_info}

Example command for creating a file:
`cat > {self.code_dir}/src/main.py << 'EOF'`
```python
# Your generated Python code here
print("Hello, World!")
```
`EOF`

Example command for creating a directory:
`mkdir -p {self.code_dir}/tests`

Begin generation now. Be comprehensive and create all required files.
"""
        # Log prompt length for debugging potential context window issues
        logger.info(f"Prepared user prompt length: {len(prompt)} characters")
        return prompt

    async def _copy_tmp_to_workspace(self) -> int:
        """
        Fallback: Copy any generated files from common /tmp locations to workspace.
        This should ideally not be needed if the LLM follows instructions.
        """
        copied_count = 0
        # More specific or configurable patterns might be better
        tmp_patterns = ["/tmp/generated-*", "/tmp/code-*", "/tmp/app-*"]

        # Use glob to find matching directories
        import glob
        potential_dirs = []
        for pattern in tmp_patterns:
            potential_dirs.extend(glob.glob(pattern))

        found_and_processed = set()

        for tmp_dir_path_str in potential_dirs:
            tmp_dir = Path(tmp_dir_path_str)
            if tmp_dir.is_dir() and str(tmp_dir) not in found_and_processed:
                logger.warning(f"Found unexpected generated code in {tmp_dir}! Attempting to copy to workspace {self.code_dir}. LLM may not be following path instructions.")

                copied_from_this_dir = 0
                try:
                    # Use shutil.copytree for potentially better handling, but careful with existing files
                    # Safer: Iterate and copy file by file
                    for item in tmp_dir.rglob("*"):
                        if item.is_file():
                            # Basic filtering
                            if any(part.startswith('.') for part in item.parts if part != '.') or '__pycache__' in str(item):
                                continue

                            relative_path = item.relative_to(tmp_dir)
                            dest = self.code_dir / relative_path

                            # Ensure destination directory exists
                            dest.parent.mkdir(parents=True, exist_ok=True)

                            # Copy file, overwriting if it exists (consider backup?)
                            shutil.copy2(item, dest)

                            # Track copied files relative to code_dir
                            self.generated_files[str(relative_path)] = str(dest)
                            copied_count += 1
                            copied_from_this_dir += 1
                            # Limit logging verbosity
                            if copied_from_this_dir <= 10:
                                 logger.info(f"Copied fallback file: {relative_path}")
                            elif copied_from_this_dir == 11:
                                 logger.info("... (suppressing further fallback copy logs for this directory)")

                    logger.info(f"Copied {copied_from_this_dir} files from fallback directory {tmp_dir}")
                    found_and_processed.add(str(tmp_dir)) # Mark as processed

                    # Clean up the temporary directory after successful copy
                    try:
                        shutil.rmtree(tmp_dir)
                        logger.info(f"Cleaned up temporary directory: {tmp_dir}")
                    except OSError as e:
                        logger.warning(f"Failed to clean up temporary directory {tmp_dir}: {e}")

                except Exception as copy_err:
                     logger.error(f"Error copying files from fallback directory {tmp_dir}: {copy_err}")


        if copied_count > 0:
             logger.warning(f"Fallback copy mechanism moved {copied_count} files. Review LLM instructions and output.")
        else:
             logger.info("No unexpected files found in /tmp fallback locations.")

        return copied_count


    async def _scan_workspace_files(self) -> int:
        """Scan workspace `code_dir` for generated files and update `self.generated_files`."""
        count = 0
        # Clear previous scan results before rescanning
        self.generated_files.clear()

        if self.code_dir.exists() and self.code_dir.is_dir():
            for file_path in self.code_dir.rglob("*"):
                if file_path.is_file():
                    # More robust filtering: skip .git directory contents
                    if '.git' in file_path.parts or '__pycache__' in file_path.parts or any(part.startswith('.') for part in file_path.relative_to(self.code_dir).parts):
                         continue

                    try:
                        relative_path = file_path.relative_to(self.code_dir)
                        self.generated_files[str(relative_path)] = str(file_path)
                        count += 1
                    except ValueError:
                         logger.warning(f"Could not determine relative path for file: {file_path}")


        logger.info(f"Scan found {count} relevant files in workspace: {self.code_dir}")
        if count == 0:
             logger.warning(f"Workspace scan found no files in {self.code_dir}. Code generation might have failed.")
        return count


    async def run(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Run the code building workflow: Prepare -> Generate -> Finalize."""
        try:
            logger.info(f"Starting Requirements-to-Code workflow for session {session.id}")

            # --- 1. Preparation ---
            # Ensure workspace exists, fetch requirements, clone repo if needed.
            yield {"type": "text", "data": {"text": "🔍 Preparing workspace and fetching requirements..."}}
            async for event in self.prepare(session=session, messages=messages):
                yield event
            yield {"type": "text", "data": {"text": "✅ Preparation complete."}}


            # --- 2. Code Generation ---
            # Prepare prompts based on fetched requirements.
            system_prompt = await self._prepare_system_prompt(session=session)

            # Use the first user message if available, otherwise construct from requirements.
            # This allows for follow-up prompts or user overrides.
            if messages and messages[0].get("role") == "user":
                 user_prompt_content = messages[0].get("content", "")
                 if not user_prompt_content or user_prompt_content == "Generate code from requirements":
                      # If generic, replace with our detailed prompt
                      user_prompt_content = await self._prepare_user_prompt(
                           session=session,
                           requirements=self.requirements_cache,
                      )
                      messages[0]["content"] = user_prompt_content
                 else:
                      logger.info("Using existing user message content as the primary prompt.")
                      # We might still want to append our structured requirements info here if needed
            else:
                 # No initial user message, create one
                 user_prompt_content = await self._prepare_user_prompt(
                      session=session,
                      requirements=self.requirements_cache,
                 )
                 # Prepend it to the message list for the orchestrator
                 messages.insert(0, {"role": "user", "content": user_prompt_content})


            # Stream LLM responses for code generation.
            logger.info("Invoking LLM orchestrator for code generation...")
            yield {"type": "text", "data": {"text": "🤖 Generating code via LLM..."}}
            async for response in self.orchestrator.run(messages, system_prompt=system_prompt):
                yield response
            yield {"type": "text", "data": {"text": "✅ LLM code generation finished."}}

            # --- 3. Post-Generation Processing ---
            # Fallback: Check for files potentially created in /tmp.
            logger.info("Checking for any files generated outside the workspace...")
            copied_count = await self._copy_tmp_to_workspace()
            if copied_count > 0:
                yield {
                    "type": "text",
                    "data": {"text": f"⚠️ Copied {copied_count} files from temporary location."},
                }

            # Scan the workspace to know exactly what was generated.
            file_count = await self._scan_workspace_files()
            if file_count > 0:
                yield {
                    "type": "text",
                    "data": {"text": f"💻 Found {file_count} generated files in workspace."},
                }
            else:
                 yield {
                    "type": "text",
                    "data": {"text": f"⚠️ No files found in workspace after generation! Check LLM output and logs."},
                }
                 # Decide whether to stop here if no files were generated
                 # raise ValueError("Code generation failed: No files were created in the workspace.")


            # --- 4. Finalization ---
            # Handle GitHub repo creation or PR preparation based on output_config.
            properties = session.custom_properties or {}
            output_config = properties.get("output_config", {})
            output_type = output_config.get("type")

            if output_type in ["new_repo", "pull_request"]:
                 if file_count == 0:
                      yield {"type": "text", "data": {"text": f"Skipping GitHub step as no files were generated."}}
                 else:
                      yield {"type": "text", "data": {"text": f"📦 Finalizing output: {output_type}..."}}
                      async for event in self.finalize(session=session, messages=messages):
                           yield event
            else:
                 yield {"type": "text", "data": {"text": f"✅ Workflow complete. Generated files are in the workspace."}}
                 # Optionally list files here if not pushing to Git

            logger.info(f"Requirements-to-Code workflow finished successfully for session {session.id}.")
            # Yield a final success message if not already done by finalize
            yield {"type": "finish", "data": {"finishReason": "stop"}}


        except Exception as e:
            # Log the full traceback for detailed debugging
            logger.error(f"Requirements-to-Code workflow failed critically: {e}", exc_info=True)
            # Send a user-friendly error message via the stream
            yield {"type": "text", "data": {"text": f"❌ Workflow Error: {e}"}}
            # Signal the end of the stream due to an error
            yield {"type": "finish", "data": {"finishReason": "error", "error": str(e)}}


    async def _run_git_command(self, command: list[str], cwd: Path | str | None = None) -> str:
         """Runs a git command using subprocess, logs output, and raises on error."""
         effective_cwd = cwd or self.code_dir
         logger.debug(f"Running git command: {' '.join(command)} in {effective_cwd}")
         try:
              result = subprocess.run(
                   command,
                   cwd=effective_cwd,
                   check=True,       # Raise CalledProcessError on non-zero exit code
                   capture_output=True,
                   text=True          # Decode stdout/stderr as text
              )
              # Log stdout only if successful and non-empty
              if result.stdout:
                   logger.debug(f"Git command output:\n{result.stdout.strip()}")
              return result.stdout.strip()
         except subprocess.CalledProcessError as e:
              # Log stderr if available, otherwise the exception itself
              error_output = e.stderr.strip() if e.stderr else str(e)
              logger.error(f"Git command failed: {' '.join(command)}\nError: {error_output}")
              # Re-raise a more specific error for the finalize step to catch
              raise GitOperationError(f"Git command failed: {error_output}") from e
         except FileNotFoundError: # Handle case where git command isn't found
              logger.error("Git command not found. Ensure git is installed and in the system PATH.")
              raise GitOperationError("Git command not found.")


    async def _initialize_and_commit(self, commit_message: str) -> None:
        """Initializes git repo if needed, adds all files, and commits."""

        # Check if .git directory exists
        if not (self.code_dir / ".git").is_dir():
            logger.info(f"Initializing new git repository in {self.code_dir}")
            await self._run_git_command(["git", "init"])
            # Set default branch name to 'main' for new repos
            try:
                await self._run_git_command(["git", "branch", "-M", "main"])
            except GitOperationError as e:
                 # Ignore error if branch 'main' already exists or other minor issues
                 logger.warning(f"Could not set default branch to 'main', possibly already exists: {e}")

        else:
             logger.info(f"Using existing git repository in {self.code_dir}")

        # Configure user info (important for commits)
        # Use placeholder values if real user info isn't available/needed
        await self._run_git_command(["git", "config", "user.email", "ai-agent@example.com"])
        await self._run_git_command(["git", "config", "user.name", "AI Code Generation Agent"])

        # Add all changes (including new files and modifications)
        logger.info("Adding all files to git staging area...")
        await self._run_git_command(["git", "add", "-A"])

        # Check git status - only commit if there are changes
        status_output = await self._run_git_command(["git", "status", "--porcelain"])
        if not status_output:
             logger.warning("No changes detected in the workspace. Nothing to commit.")
             # Depending on flow, maybe raise error or just return
             return # Nothing more to do if no changes

        logger.info(f"Committing changes with message: '{commit_message}'")
        await self._run_git_command(["git", "commit", "-m", commit_message])
        logger.info("✅ Changes committed successfully.")


    async def _create_github_repo_api(self, repo_name: str, description: str, is_private: bool) -> tuple[str, str]:
        """Create GitHub repository using REST API. Returns (html_url, username)."""
        github_token = await self._get_github_token()
        if not github_token:
            raise ValueError("GitHub token not found. Configure GitHub integration.")

        try:
            # import httpx # Already imported

            logger.info(f"Attempting to create GitHub repository: {repo_name}")
            async with httpx.AsyncClient(timeout=30.0) as client:
                # 1. Get username associated with the token
                user_response = await client.get(
                    "https://api.github.com/user",
                    headers={
                        "Authorization": f"Bearer {github_token}",
                        "Accept": "application/vnd.github.v3+json",
                    },
                )
                user_response.raise_for_status() # Check for errors
                username = user_response.json()["login"]
                logger.info(f"Authenticated as GitHub user: {username}")

                # 2. Create the repository
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
                        "auto_init": False, # We will push our own commit
                    },
                )

                # Check response status
                if create_response.status_code == 201:
                    repo_data = create_response.json()
                    html_url = repo_data["html_url"]
                    logger.info(f"✅ GitHub repository created successfully: {html_url}")
                    return html_url, username
                else:
                    # Provide more detailed error logging
                    try:
                        error_data = create_response.json()
                        error_message = error_data.get("message", "Unknown error")
                        error_details = error_data.get("errors", [])
                        logger.error(f"Failed to create GitHub repo ({create_response.status_code}): {error_message} Details: {error_details}")
                        # Raise a specific error message
                        if "name already exists" in str(error_details).lower():
                             raise ValueError(f"GitHub repository '{repo_name}' already exists.")
                        raise ValueError(f"Failed to create repository ({create_response.status_code}): {error_message}")
                    except json.JSONDecodeError:
                         logger.error(f"Failed to create GitHub repo ({create_response.status_code}): {create_response.text}")
                         raise ValueError(f"Failed to create repository ({create_response.status_code}).")


        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error during GitHub API call: {e.response.status_code} - {e.response.text}")
            raise ValueError(f"GitHub API error: {e.response.status_code}") from e
        except ImportError:
             logger.error("httpx library is required but not installed.")
             raise ValueError("httpx library not installed.")
        except Exception as e:
            logger.error(f"Unexpected error creating GitHub repository: {e}", exc_info=True)
            raise ValueError(f"Failed to create GitHub repo: {e}")


    async def _push_to_github(self, repo_name: str, username: str, branch: str = "main") -> None:
        """Adds remote and pushes the specified branch to the GitHub repository."""
        github_token = await self._get_github_token()
        if not github_token:
            raise ValueError("GitHub token not found.")

        # Construct the authenticated remote URL
        # Note: Using token in URL is less secure but often necessary in automated environments
        remote_url = f"https://{github_token}@github.com/{username}/{repo_name}.git"

        try:
            # Check if remote 'origin' already exists
            remotes = await self._run_git_command(["git", "remote"])
            if "origin" in remotes.split():
                 logger.info("Remote 'origin' already exists, setting URL.")
                 await self._run_git_command(["git", "remote", "set-url", "origin", remote_url])
            else:
                 logger.info("Adding remote 'origin'.")
                 await self._run_git_command(["git", "remote", "add", "origin", remote_url])

            logger.info(f"Pushing branch '{branch}' to remote 'origin'...")
            # Use -u to set upstream for the first push
            await self._run_git_command(["git", "push", "-u", "origin", branch])
            logger.info(f"✅ Successfully pushed code to GitHub branch '{branch}'.")

        except GitOperationError as e:
            # Catch specific git errors from our helper
            logger.error(f"Failed to push to GitHub repository '{username}/{repo_name}': {e}")
            raise ValueError(f"Failed to push to GitHub: {e}") # Re-raise for finalize step


    async def _create_github_pr_api(
        self,
        repo_url: str,
        head_branch: str,
        base_branch: str,
        title: str,
        body: str
    ) -> str:
        """Creates a pull request on GitHub using the REST API."""
        github_token = await self._get_github_token()
        if not github_token:
            raise ValueError("GitHub token not found for creating PR.")

        # Extract owner/repo from URL (basic parsing)
        match = re.search(r"github\.com/([^/]+)/([^/]+)(\.git)?$", repo_url)
        if not match:
            raise ValueError(f"Could not parse owner/repo from URL: {repo_url}")
        owner, repo = match.group(1), match.group(2)

        api_url = f"https://api.github.com/repos/{owner}/{repo}/pulls"
        logger.info(f"Creating GitHub pull request: {head_branch} -> {base_branch} in {owner}/{repo}")

        try:
            # import httpx # Already imported
            async with httpx.AsyncClient(timeout=30.0) as client:
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
                        "maintainer_can_modify": True, # Optional: Allow maintainers to edit
                    },
                )

            if response.status_code == 201:
                pr_data = response.json()
                pr_url = pr_data["html_url"]
                logger.info(f"✅ Pull request created successfully: {pr_url}")
                return pr_url
            else:
                try:
                    error_data = response.json()
                    error_message = error_data.get("message", "Unknown error")
                    error_details = error_data.get("errors", [])
                    # Specific check for common PR errors
                    if any("No commits between" in str(e) for e in error_details):
                         error_message = f"No code changes found between '{base_branch}' and '{head_branch}'. PR not created."
                         logger.warning(error_message)
                         raise ValueError(error_message) # Treat as specific non-fatal error? Or return None?
                    elif any("A pull request already exists" in str(e) for e in error_details):
                         error_message = f"A pull request already exists for {head_branch} -> {base_branch}."
                         logger.warning(error_message)
                         # Try to find the existing PR? For now, just raise.
                         raise ValueError(error_message)

                    logger.error(f"Failed to create GitHub PR ({response.status_code}): {error_message} Details: {error_details}")
                    raise ValueError(f"Failed to create PR ({response.status_code}): {error_message}")
                except json.JSONDecodeError:
                    logger.error(f"Failed to create GitHub PR ({response.status_code}): {response.text}")
                    raise ValueError(f"Failed to create PR ({response.status_code}).")

        except httpx.HTTPStatusError as e:
            logger.error(f"HTTP error creating GitHub PR: {e.response.status_code} - {e.response.text}")
            raise ValueError(f"GitHub API error creating PR: {e.response.status_code}") from e
        except ImportError:
             logger.error("httpx library is required but not installed.")
             raise ValueError("httpx library not installed.")
        except Exception as e:
            logger.error(f"Unexpected error creating GitHub PR: {e}", exc_info=True)
            raise ValueError(f"Failed to create GitHub PR: {e}")


    async def finalize(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Finalize workflow: Push code to GitHub (new repo or PR)."""
        logger.info("Finalizing Requirements-to-Code workflow...")
        properties = session.custom_properties or {}
        output_config = properties.get("output_config", {})
        output_type = output_config.get("type")

        # Ensure we have files before attempting Git operations
        if not self.generated_files and not list(self.code_dir.glob('*')): # Check disk if map empty
             logger.warning("No generated files found in workspace. Skipping finalization.")
             yield {"type": "text", "data": {"text": "⚠️ No files generated, skipping GitHub finalization."}}
             # Don't yield finish here, let the run method handle it
             return # Exit finalize early


        try:
            if output_type == "new_repo":
                repo_name = output_config.get("repo_name", f"generated-app-{session.id}")
                description = output_config.get("description", "AI-generated code")
                is_private = output_config.get("private", True) # Default to private

                yield {"type": "text", "data": {"text": f"🚀 Preparing new GitHub repository: {repo_name}..."}}

                # 1. Initialize local repo and commit
                yield {"type": "text", "data": {"text": "Committing generated code..."}}
                commit_message = f"feat: Initial code generation from requirements\n\nSession ID: {session.id}"
                await self._initialize_and_commit(commit_message)

                # 2. Create remote repo on GitHub
                yield {"type": "text", "data": {"text": f"Creating '{repo_name}' on GitHub..."}}
                repo_url, username = await self._create_github_repo_api(repo_name, description, is_private)

                # 3. Push local commits to the remote repo
                yield {"type": "text", "data": {"text": f"Pushing code to {repo_url}..."}}
                await self._push_to_github(repo_name=repo_name, username=username, branch="main")

                yield {"type": "text", "data": {"text": f"✅ Successfully created and pushed to: {repo_url}"}}
                logger.info(f"Finalization complete for new repository: {repo_url}")

            elif output_type == "pull_request":
                repo_url = output_config.get("repo_url")
                if not repo_url: raise ValueError("'repo_url' is required for pull request output.")

                base_branch = output_config.get("base_branch", "main")
                # Generate a more descriptive branch name
                input_keys = [
                     inp.get("key") or inp.get("file_name", f"input{i}")
                     for i, inp in enumerate(properties.get("inputs", []))
                ]
                # Sanitize keys for branch name
                sanitized_keys = [re.sub(r'[^a-zA-Z0-9_-]', '-', k) for k in input_keys]
                feature_suffix = "-".join(sanitized_keys)[:50] # Limit length
                head_branch = output_config.get("branch_name", f"feature/ai-generated-{feature_suffix}")

                yield {"type": "text", "data": {"text": f"🚀 Preparing pull request for {repo_url}..."}}

                # 1. Ensure repo is cloned (should happen in prepare)
                if not (self.code_dir / ".git").is_dir():
                     # Attempt to clone again as a fallback? Or just fail?
                     raise ValueError("Target repository not found in workspace. Cloning may have failed.")

                # 2. Create and checkout a new branch
                yield {"type": "text", "data": {"text": f"Creating branch '{head_branch}'..."}}
                try:
                     # Use -b to create if it doesn't exist, or just checkout if it does
                     await self._run_git_command(["git", "checkout", "-b", head_branch])
                except GitOperationError as e:
                     # If branch already exists, just check it out
                     if "already exists" in str(e):
                          logger.warning(f"Branch '{head_branch}' already exists, checking it out.")
                          await self._run_git_command(["git", "checkout", head_branch])
                     else:
                          raise # Re-raise other checkout errors

                # 3. Commit the changes generated by the AI
                yield {"type": "text", "data": {"text": "Committing generated changes..."}}
                commit_message = f"feat: Apply AI-generated changes from requirements\n\nBased on: {', '.join(input_keys)}\nSession ID: {session.id}"
                # This assumes changes were made *after* cloning
                await self._initialize_and_commit(commit_message) # Will add and commit changes on current branch

                # 4. Push the new branch to the remote repository
                yield {"type": "text", "data": {"text": f"Pushing branch '{head_branch}' to GitHub..."}}
                # Need username for push URL, parse from repo_url or get via API?
                # Assume push works with token auth setup for origin by clone
                await self._run_git_command(["git", "push", "-u", "origin", head_branch])


                # 5. Create the pull request via GitHub API
                yield {"type": "text", "data": {"text": f"Creating pull request '{head_branch}' -> '{base_branch}'..."}}
                pr_title = output_config.get("pr_title", f"AI Code Generation: Apply changes for {', '.join(input_keys)}")
                pr_body = output_config.get(
                     "pr_body",
                     f"This pull request was automatically generated by the Requirements-to-Code AI agent based on:\n"
                     f"- {chr(10)}- ".join(input_keys) +
                     f"\n\nSession ID: {session.id}"
                )
                pr_url = await self._create_github_pr_api(
                     repo_url=repo_url,
                     head_branch=head_branch,
                     base_branch=base_branch,
                     title=pr_title,
                     body=pr_body
                )

                yield {"type": "text", "data": {"text": f"✅ Pull request created successfully: {pr_url}"}}
                logger.info(f"Finalization complete for pull request: {pr_url}")

            else:
                # No GitHub output needed, just confirm files are in workspace
                file_list_preview = "\n".join([f"  - {name}" for name in sorted(list(self.generated_files.keys())[:10])])
                total_files = len(self.generated_files)
                if total_files > 10:
                    file_list_preview += f"\n  ... and {total_files - 10} more files."

                yield {
                    "type": "text",
                    "data": {"text": f"✅ Workflow finished. {total_files} files generated in workspace:\n{file_list_preview}"},
                }
                yield {"type": "text", "data": {"text": f"Location: `{self.code_dir}`"}}
                logger.info(f"Finalization complete: Files generated in workspace {self.code_dir}")

        except GitOperationError as e:
             logger.error(f"Git operation failed during finalization: {e}", exc_info=True)
             yield {"type": "text", "data": {"text": f"❌ Git Error: {e}"}}
             # Allow run method to catch and yield finish:error
             raise
        except ValueError as e: # Catch config errors (missing token, bad URL, etc.)
            logger.error(f"Configuration or API error during finalization: {e}", exc_info=True)
            yield {"type": "text", "data": {"text": f"❌ Error: {e}"}}
            raise
        except Exception as e:
            logger.error(f"Unexpected error during finalization: {e}", exc_info=True)
            yield {"type": "text", "data": {"text": f"❌ Unexpected Error: {e}"}}
            raise

        # If finalize completes without error, the 'run' method yields finish:stop
        # No need for explicit yield {} loop here
