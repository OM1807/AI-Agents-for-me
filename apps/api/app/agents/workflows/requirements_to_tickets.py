"""Requirements to tickets agent workflow implementation."""

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


@register(AgentIdentifier.REQUIREMENTS_TO_TICKETS)
class RequirementsToTicketsWorkflow(AgentWorkflow):
    """Workflow for converting requirements documents to structured tickets using Claude orchestrator."""

    identifier = AgentIdentifier.REQUIREMENTS_TO_TICKETS

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

        Ensures an `artifacts/` directory exists and pre-creates ticket type
        subfolders (epics/, stories/, tasks/) for organized output structure.
        """
        logger.info(f"Preparing workspace {self.workspace_dir} for requirements to tickets conversion")

        try:
            artifacts_dir = self.workspace_dir / "artifacts"
            artifacts_dir.mkdir(parents=True, exist_ok=True)

            # Create subdirectories for each ticket type
            (artifacts_dir / "epics").mkdir(parents=True, exist_ok=True)
            (artifacts_dir / "stories").mkdir(parents=True, exist_ok=True)
            (artifacts_dir / "tasks").mkdir(parents=True, exist_ok=True)

            logger.info("Workspace prepared for filesystem outputs", extra={"artifacts_dir": str(artifacts_dir)})
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

    async def run(self, *, session: UserAgentSession, messages: list[dict[str, Any]]) -> AsyncIterator[dict[str, Any]]:
        """Run the requirements to tickets conversion workflow."""
        try:
            logger.info("Starting requirements to tickets conversion workflow")

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
            logger.info("Invoking Claude orchestrator for requirements to tickets conversion")
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
            logger.info("Requirements to tickets conversion completed")

        except Exception as exc:
            logger.error(f"Requirements to tickets workflow failed: {exc}")
            yield {"type": "finish", "data": {"finishReason": "error", "error": str(exc)}}

    async def finalize(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Finalize workflow (no-op)."""
        logger.info(f"Finalizing requirements to tickets workflow in {self.workspace_dir}")
        for _ in ():
            yield {}

    def _extract_artifact_metadata(self, *, file_path: str, content_str: Any) -> dict[str, Any] | None:
        """Extract artifact metadata from a ticket file.

        Returns a dict with the following keys:
        - artifact_type: "epic", "story", or "task"
        - actual_file_path: actual file path
        - file_path: normalized path relative to workspace
        - filename: filename
        - content_type: "json"
        - artifact_id: ticket ID
        - content: parsed ticket content
        """
        normalized_path = self._relativize_to_workspace(file_path, anchor="artifacts/")
        if not normalized_path.startswith("artifacts/"):
            return None

        path_obj = Path(normalized_path)
        filename = path_obj.name
        parent_dir = path_obj.parent.name
        content_type = "json" if filename.endswith(".json") else "md"

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

        # Determine artifact type based on parent directory
        artifact_type = None
        if parent_dir == "epics":
            artifact_type = "epic"
        elif parent_dir == "stories":
            artifact_type = "story"
        elif parent_dir == "tasks":
            artifact_type = "task"
        else:
            return None

        parsed_content = try_parse_json_content(content_str)
        if not parsed_content:
            logger.warning(f"Failed to parse JSON content from {file_path}")
            return None

        # Extract artifact ID from filename or content
        artifact_id = path_obj.stem
        if isinstance(parsed_content, dict) and "id" in parsed_content:
            artifact_id = parsed_content["id"]

        artifact = {
            "artifact_type": artifact_type,
            "actual_file_path": file_path,
            "file_path": normalized_path,
            "filename": filename,
            "content_type": content_type,
            "artifact_id": artifact_id,
            "content": parsed_content,
        }
        return artifact
