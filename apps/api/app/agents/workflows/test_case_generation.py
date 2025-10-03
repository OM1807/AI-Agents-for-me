"""Test case generation agent workflow implementation."""

import re
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from loguru import logger

from app.agents.enums import AgentIdentifier
from app.agents.workflows.base import AgentWorkflow
from app.agents.workflows.factory import register
from app.models.user_agent_session import UserAgentSession
from app.services.integration_service import IntegrationService
from app.utils.helpers import try_parse_json_content


@register(AgentIdentifier.TEST_CASE_GENERATION)
class TestCaseGenerationWorkflow(AgentWorkflow):
    """Workflow for generating high-quality test cases using Claude orchestrator."""

    identifier = AgentIdentifier.TEST_CASE_GENERATION

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

    async def prepare(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Prepare the workspace for filesystem-first outputs.

        Ensures a `tests/` directory exists and pre-creates source-specific
        subfolders when inputs are provided via session.custom_properties.
        Also processes file-based documents by copying them to the workspace.
        """
        logger.info(f"Preparing workspace {self.workspace_dir} for test case generation")

        try:
            tests_dir = self.workspace_dir / "tests"
            tests_dir.mkdir(parents=True, exist_ok=True)

            # Attempt to pre-create per-source folders for faster LLM writes
            custom_properties: dict[str, Any] = session.custom_properties or {}
            inputs: list[dict[str, Any]] = custom_properties.get("inputs", []) or []
            docs: list[dict[str, Any]] = custom_properties.get("docs", []) or []

            # Process inputs
            for source in inputs:
                source_key = self._compute_source_key(source)
                if not source_key:
                    continue
                (tests_dir / source_key).mkdir(parents=True, exist_ok=True)

            # Process file-based inputs and documents
            await self._process_file_documents(inputs)
            await self._process_file_documents(docs)

            logger.info("Workspace prepared for filesystem outputs", extra={"tests_dir": str(tests_dir)})
        except Exception as exc:
            # Do not fail streaming if FS prep fails; LLM can still attempt writes
            logger.warning(f"Workspace preparation skipped or partially completed: {exc}")

        for _ in ():
            yield {}

    async def _process_file_documents(self, docs: list[dict[str, Any]]) -> None:
        """Process file-based documents by copying them to the workspace.

        Args:
            docs: List of document references from custom_properties
        """
        for doc in docs:
            provider = doc.get("provider", "").lower()
            if provider == "file":
                file_name = doc.get("file_name")
                if isinstance(file_name, str) and file_name.strip():
                    await self._copy_file_to_workspace(file_name)

    def _compute_source_key(self, source: dict[str, Any]) -> str | None:
        """Compute deterministic identifier for a source.

        Convention: `[type]-[provider]-[identifier]` where identifier is
        issue key for Jira, id/url for Notion/Confluence, file names for File provider, etc.
        """
        source_type = str(source.get("type", "")).strip()
        provider = str(source.get("provider", "")).strip()

        if not source_type or not provider:
            return None

        identifier: str | None = None

        if source_type == "issue":
            identifier = str(source.get("key") or "").strip() or None
        else:
            # document-like
            if provider.lower() == "file":
                # Handle file provider with single file_name
                file_name = source.get("file_name")
                if isinstance(file_name, str) and file_name.strip():
                    # Create identifier from file name
                    identifier = file_name.replace(".", "_").lower()
            else:
                # Handle other document providers (Notion, Confluence, etc.)
                doc_id = source.get("id")
                url = source.get("url")
                if isinstance(doc_id, str) and doc_id.strip():
                    identifier = doc_id.strip()
                elif isinstance(url, str) and url.strip():
                    identifier = self._slugify(url)

        if not identifier:
            return None

        return f"{source_type}-{provider}-{identifier}".lower()

    def _slugify(self, value: str) -> str:
        """Create a filesystem-friendly slug from the given string."""
        lowered = value.strip().lower()
        # Replace non-alphanumeric with hyphens
        replaced = re.sub(r"[^a-z0-9]+", "-", lowered)
        # Collapse multiple hyphens and trim
        collapsed = re.sub(r"-+", "-", replaced).strip("-")
        return collapsed or "untitled"

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

    async def run(self, *, session: UserAgentSession, messages: list[dict[str, Any]]) -> AsyncIterator[dict[str, Any]]:
        """Run the test case generation workflow."""
        try:
            logger.info("Starting test case generation workflow")

            # Optional pre-steps
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
            logger.info("Invoking Claude orchestrator for test case generation")
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
            logger.info("Test case generation completed")

        except Exception as exc:
            logger.error(f"Test case generation workflow failed: {exc}")
            yield {"type": "finish", "data": {"finishReason": "error", "error": str(exc)}}

    async def finalize(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Finalize workflow (no-op)."""
        logger.info(f"Finalizing test case generation workflow in {self.workspace_dir}")
        for _ in ():
            yield {}

    def _extract_artifact_metadata(self, *, file_path: str, content_str: Any) -> dict[str, Any] | None:
        """Extract artifact metadata from a file.

        Returns a dict with the following keys:
        - artifact_type: "source" or "test_case"
        - actual_file_path: actual file path
        - file_path: normalized path relative to workspace
        - filename: filename
        - content_type: "json" or "md"
        - artifact_id: artifact ID
        - content: artifact content
        """
        normalized_path = self._relativize_to_workspace(file_path, anchor="tests/")
        if not normalized_path.startswith("tests/"):
            return None

        path_obj = Path(normalized_path)
        filename = path_obj.name
        folder_name = path_obj.parent.name
        content_type = "json" if filename.endswith(".json") else "md"
        # Figure out artifact type based on filename
        artifact_type = "source" if filename.lower() == "source.json" else "testcase"

        parsed_content = try_parse_json_content(content_str)
        if not parsed_content:
            logger.warning(f"Failed to parse JSON content from {file_path}")
            return None

        artifact_id = path_obj.stem
        if artifact_type == "source":
            # folder name is the source key
            artifact_id = folder_name
        elif artifact_type == "testcase":
            artifact_id = parsed_content.get("id") or artifact_id
            parsed_content["source_key"] = folder_name

        artifact: dict[str, Any] = {
            "artifact_type": artifact_type,
            "actual_file_path": file_path,
            "file_path": normalized_path,
            "filename": filename,
            "content_type": content_type,
            "artifact_id": artifact_id,
            "content": parsed_content,
        }
        return artifact
