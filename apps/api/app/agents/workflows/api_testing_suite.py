"""API Testing Suite generation agent workflow implementation."""

import json
from collections.abc import AsyncIterator
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

from loguru import logger

from app.agents.enums import AgentIdentifier
from app.agents.git.ops import GitOperationError, GitOps
from app.agents.workflows.base import AgentWorkflow
from app.agents.workflows.factory import register
from app.integrations.enums import IntegrationProvider
from app.models.user_agent_session import UserAgentSession
from app.services.integration_service import IntegrationService
from app.utils.helpers import try_parse_json_content


@register(AgentIdentifier.API_TESTING_SUITE)
class ApiTestingSuiteWorkflow(AgentWorkflow):
    """Workflow for generating comprehensive API testing suites using Claude orchestrator."""

    identifier = AgentIdentifier.API_TESTING_SUITE

    def __init__(
        self,
        *,
        workspace_dir: Path,
        mcp_configs: dict[str, Any],
        integration_service: IntegrationService,
        system_prompt: str | None = None,
        llm_session_id: str | None = None,
    ) -> None:
        """Initialize workflow with required parameters and renderer."""
        super().__init__(
            workspace_dir=workspace_dir,
            mcp_configs=mcp_configs,
            integration_service=integration_service,
            system_prompt=system_prompt,
            llm_session_id=llm_session_id,
        )
        # Track file-op tool calls until their corresponding tool_result arrives
        self._pending_artifact_ops: dict[str, dict[str, Any]] = {}
        self.git_ops = GitOps()

    async def _get_github_token(self) -> str | None:
        """Get the GitHub token for the session."""
        integration = await self.integration_service.crud.get_by_provider(provider=IntegrationProvider.GITHUB)
        if integration:
            return await self.integration_service.get_access_token(integration_id=integration.id)  # type: ignore
        return None

    async def prepare(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Prepare the workspace for API testing suite generation.

        Creates organized directory structure: artifacts/automation/ for generated test files
        and artifacts/repo/ for cloned repository with automation branch.
        """
        logger.info(f"Preparing workspace {self.workspace_dir} for API testing suite generation")

        try:
            artifacts_dir = self.workspace_dir / "artifacts"
            artifacts_dir.mkdir(parents=True, exist_ok=True)

            # Create subdirectories for generated test files and repository
            repo_dir = artifacts_dir / "repo"
            repo_dir.mkdir(parents=True, exist_ok=True)

            # Extract repository from session properties
            properties = session.custom_properties
            repo_data = properties.get("repo", {})

            if repo_data and repo_data.get("url"):
                logger.info(f"Found repository to clone: {repo_data.get('url')}")

                # Get GitHub token for authentication
                github_token = await self._get_github_token()

                # Extract repository details
                repo_url = repo_data.get("url")
                repo_branch = repo_data.get("branch", "main")

                if not repo_url:
                    logger.warning("Repository URL not provided")
                else:
                    logger.info(f"Cloning repository: {repo_url}")
                    host = urlparse(repo_url).netloc.lower()
                    access_token = github_token if "github.com" in host else None

                    tool_call_id = f"git_clone_{hash(str(repo_url))}"

                    # Emit git clone tool call event
                    yield {
                        "type": "tool_call",
                        "toolCallId": tool_call_id,
                        "toolName": "git_clone",
                        "args": {
                            "url": repo_url,
                            "prompt": f"Cloning repository {repo_url}...",
                        },
                    }

                    try:
                        # Clone the repository
                        repo_path = await self.git_ops.clone_repository(
                            url=repo_url,
                            destination_dir=repo_dir,
                            branch=repo_branch,
                            access_token=access_token,
                        )

                        # Create automation branch with timestamp
                        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                        automation_branch = f"automation-{timestamp}"

                        logger.info(f"Creating automation branch: {automation_branch}")
                        await self.git_ops.create_branch(
                            repo_path=repo_path,
                            branch_name=automation_branch,
                            source_branch=repo_branch,
                        )

                        # Emit successful tool result
                        yield {
                            "type": "tool_result",
                            "toolCallId": tool_call_id,
                            "result": f"Repository {repo_url} successfully cloned to: {repo_path} and automation branch '{automation_branch}' created",
                        }

                        logger.info(
                            f"Successfully prepared repository {repo_url} with automation branch {automation_branch}"
                        )

                    except GitOperationError as e:
                        # Emit error tool result
                        yield {
                            "type": "tool_result",
                            "toolCallId": tool_call_id,
                            "result": f"Error cloning repository {repo_url}: {e}",
                        }
                        logger.error(f"Failed to clone repository {repo_url}: {e}")
            else:
                logger.info("No repositories specified for cloning")

            logger.info(f"mcp configs: {self.mcp_configs}")
            logger.info(
                "Workspace prepared for API testing suite generation", extra={"artifacts_dir": str(artifacts_dir)}
            )

        except Exception as exc:
            # Do not fail streaming if FS prep fails; LLM can still attempt writes
            logger.warning(f"Workspace preparation skipped or partially completed: {exc}")

        for _ in ():
            yield {}

    async def _maybe_intercept_artifact_event(self, response: dict[str, Any]) -> tuple[bool, dict[str, Any] | None]:
        """Intercept file operation tool events and emit normalized artifact events.

        Returns:
            handled: Whether the caller should suppress the original `response`.
            event: The replacement event to emit (if any). When None and handled is True,
                   the original response should be suppressed with no replacement.
        """
        try:
            rtype = response.get("type")
            if rtype == "tool_call" and response.get("toolName") in {"create_file", "edit_file"}:
                tool_call_id = str(response.get("toolCallId") or "")
                args = response.get("args") or {}
                file_path = str(args.get("file_path") or args.get("path") or "")
                if tool_call_id and file_path:
                    self._pending_artifact_ops[tool_call_id] = {
                        "file_path": file_path,
                        "tool_name": response.get("toolName"),
                        "content": args.get("content"),
                    }
                    return True, None

            if rtype == "tool_result":
                tool_call_id = str(response.get("toolCallId") or "")
                pending = self._pending_artifact_ops.pop(tool_call_id, None)
                if pending is not None:
                    content = pending.get("content")
                    if pending.get("tool_name") == "edit_file" and content is None:
                        content = await self._read_file_content(pending.get("file_path", ""))

                    artifact = self._extract_artifact_metadata(
                        file_path=str(pending.get("file_path", "")),
                        content_str=content,
                    )
                    if artifact is not None:
                        evt_type = f"data-{artifact.get('artifact_type')}"
                        return True, {"type": evt_type, "data": artifact}
                    return True, None
        except Exception as intercept_exc:
            logger.debug(f"Artifact event interception failed: {intercept_exc}")
        return False, None

    def _is_filename_in_relevant_artifacts(self, filename: str) -> bool:
        """Check if filename exists in index.json relevantArtifacts array."""
        try:
            index_path = self.workspace_dir / "artifacts" / "index.json"
            if not index_path.exists():
                return False

            with open(index_path, encoding="utf-8") as f:
                index_data = json.load(f)

            relevant_artifacts = index_data.get("relevantArtifacts", [])
            for artifact in relevant_artifacts:
                if artifact.get("filename") == filename:
                    return True

            return False
        except Exception as e:
            logger.warning(f"Failed to check filename in index.json: {e}")
            return False

    def _extract_artifact_metadata(self, *, file_path: str, content_str: Any) -> dict[str, Any] | None:
        """Extract artifact metadata from an API test file.

        Returns a dict with the following keys:
        - artifact_type: "index" or "test_file"
        - actual_file_path: actual file path
        - file_path: normalized path relative to workspace
        - filename: filename
        - content_type: "json", "js", "ts", etc.
        - artifact_id: file identifier
        - content: file content
        """
        normalized_path = self._relativize_to_workspace(file_path, anchor="artifacts/")
        if not normalized_path.startswith("artifacts/"):
            return None

        path_obj = Path(normalized_path)
        filename = path_obj.name
        content_type = self._determine_content_type(filename)

        # Handle index.json file separately
        if filename == "index.json":
            parsed_content = try_parse_json_content(content_str)
            if not parsed_content:
                logger.warning(f"Failed to parse JSON content from index file {file_path}")
                return None

            artifact: dict[str, Any] = {
                "artifact_type": "index",
                "actual_file_path": file_path,
                "file_path": normalized_path,
                "filename": filename,
                "content_type": content_type,
                "artifact_id": "index",
                "content": parsed_content,
            }
            return artifact

        # Check if filename exists in index.json relevantArtifacts
        if not self._is_filename_in_relevant_artifacts(filename):
            return None

        artifact_type = "test"

        # Extract artifact ID from filename or content
        artifact_id = path_obj.stem

        # Handle content based on type - not all test files are JSON
        content = content_str
        if content_type == "json" and content_str:
            parsed_content = try_parse_json_content(content_str)
            if parsed_content:
                content = parsed_content
                if isinstance(parsed_content, dict) and "id" in parsed_content:
                    artifact_id = parsed_content["id"]

        artifact = {
            "artifact_type": artifact_type,
            "actual_file_path": file_path,
            "file_path": normalized_path,
            "filename": filename,
            "content_type": content_type,
            "artifact_id": artifact_id,
            "content": content,
        }
        return artifact

    def _determine_content_type(self, filename: str) -> str:
        """Determine content type based on file extension."""
        filename_lower = filename.lower()
        if filename_lower.endswith((".json",)):
            return "json"
        elif filename_lower.endswith((".ts", ".spec.ts")):
            return "typescript"
        elif filename_lower.endswith((".js", ".spec.js")):
            return "javascript"
        elif filename_lower.endswith((".java",)):
            return "java"
        elif filename_lower.endswith((".py",)):
            return "python"
        else:
            return "text"

    async def run(self, *, session: UserAgentSession, messages: list[dict[str, Any]]) -> AsyncIterator[dict[str, Any]]:
        """Run the API testing suite generation workflow."""
        try:
            logger.info("Starting API testing suite generation workflow")

            # Optional pre-steps
            if session.llm_session_id is None:
                async for event in self.prepare(session=session, messages=messages):
                    yield event

            system_prompt = await self._prepare_system_prompt(session=session)

            # For new LLM sessions, construct the initial user prompt from template
            if session.llm_session_id is None and messages:
                user_prompt = await self._prepare_user_prompt(session=session)
                messages[0]["content"] = user_prompt

            # For follow-up sessions, construct the user prompt from template
            if session.llm_session_id is not None and messages:
                user_prompt = await self._prepare_user_followup_prompt(
                    session=session, feedback=messages[-1]["content"]
                )
                messages[-1]["content"] = user_prompt

            # Stream model responses
            logger.info("Invoking Claude orchestrator for API testing suite generation")
            async for response in self.orchestrator.run(messages, system_prompt=system_prompt):
                handled, event = await self._maybe_intercept_artifact_event(response)  # type: ignore
                if handled:
                    if event is not None:
                        yield event
                        logger.info(
                            f"Artifact event emitted after tool_result: {event.get('type')}",
                            extra={"artifact": (event.get("data") or {}).get("artifact_id")},
                        )
                    continue

                # Pass-through for all non-intercepted events
                yield response
            logger.info("API testing suite generation completed")

        except Exception as exc:
            logger.error(f"API testing suite workflow failed: {exc}")
            yield {"type": "finish", "data": {"finishReason": "error", "error": str(exc)}}

    async def finalize(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Finalize workflow (no-op)."""
        logger.info(f"Finalizing API testing suite workflow in {self.workspace_dir}")
        for _ in ():
            yield {}
