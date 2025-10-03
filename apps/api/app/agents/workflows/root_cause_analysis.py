"""Root Cause Analysis agent workflow implementation."""

from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from app.agents.enums import AgentIdentifier
from app.agents.workflows.base import AgentWorkflow
from app.agents.workflows.factory import register
from app.models.user_agent_session import UserAgentSession
from app.services.integration_service import IntegrationService
from app.utils.helpers import try_parse_json_content
from app.utils.logger import get_logger

logger = get_logger(__name__)


@register(AgentIdentifier.ROOT_CAUSE_ANALYSIS)
class RootCauseAnalysisWorkflow(AgentWorkflow):
    """Root Cause Analysis workflow using Claude orchestrator with monitoring integrations."""

    # Used by base to select templates folder: app/agents/templates/root_cause_analysis/*
    identifier = AgentIdentifier.ROOT_CAUSE_ANALYSIS

    def __init__(
        self,
        *,
        workspace_dir: Path,
        mcp_configs: dict[Any, Any],
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
        # Track file-op tool calls until their corresponding tool_result arrives
        self._pending_artifact_ops: dict[str, dict[str, Any]] = {}

    async def _prepare_system_prompt(self, *, session: UserAgentSession, **extra: Any) -> str:
        """
        Prepare the system prompt for RCA workflow.
        RCA only uses the main system template, no followup system prompt.
        """
        return await super()._prepare_system_prompt(session=session, **extra)

    async def prepare(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Prepare workspace for RCA by setting up integrations and collecting data sources."""
        # Check if session already exists
        if session.llm_session_id:
            logger.info(f"Session {session.id} already has an LLM session ID: {session.llm_session_id}")
            logger.info("Skipping prepare and running directly")
            return

        logger.info(f"Preparing workspace {self.workspace_dir} for root cause analysis")

        # Extract incident and related data from session properties
        properties = session.custom_properties or {}
        incident_data = properties.get("incident")
        logs_data = properties.get("logs", [])
        source_code_data = properties.get("source_code", [])
        docs_data = properties.get("docs", [])

        if not incident_data:
            logger.error("No incident data provided for RCA analysis")
            raise ValueError("Incident data is required for Root Cause Analysis")

        try:
            # Create workspace directory structure for RCA artifacts
            rca_dir = self.workspace_dir / "artifacts"
            rca_dir.mkdir(parents=True, exist_ok=True)
            solutions_dir = rca_dir / "solutions"
            solutions_dir.mkdir(parents=True, exist_ok=True)

            # Yield preparation events
            yield {
                "type": "tool_call",
                "toolCallId": "rca_prepare",
                "toolName": "rca_preparation",
                "args": {
                    "incident_id": incident_data.get("id", "unknown"),
                    "prompt": "Preparing workspace for Root Cause Analysis...",
                },
            }

            # Log the available data sources for context
            logger.info(
                "RCA data sources available",
                extra={
                    "incident_provider": incident_data.get("provider"),
                    "logs_count": len(logs_data),
                    "repos_count": len(source_code_data),
                    "docs_count": len(docs_data),
                },
            )

            yield {
                "type": "tool_result",
                "toolCallId": "rca_prepare",
                "result": f"Workspace prepared for incident {incident_data.get('id', 'unknown')}. "
                f"Data sources: {len(logs_data)} log sources, {len(source_code_data)} repositories, "
                f"{len(docs_data)} documentation sources.",
            }

            logger.info("RCA workspace preparation completed successfully")

        except Exception as e:
            logger.error(f"Failed to prepare RCA workspace: {e}")
            raise

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
        """Run the root cause analysis workflow."""
        try:
            logger.info("Starting Root Cause Analysis workflow")

            # Call prepare
            async for event in self.prepare(session=session, messages=messages):
                yield event

            system_prompt = await self._prepare_system_prompt(session=session)

            if session.llm_session_id is None:
                user_prompt = await super()._prepare_user_prompt(session=session, messages=messages)
                messages[0]["content"] = user_prompt

            # Stream responses from Claude Code SDK directly
            logger.info("Invoking Claude Code SDK for RCA analysis")
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

            logger.info("RCA Claude Code SDK invocation completed")

        except Exception as e:
            logger.error(f"Root Cause Analysis workflow failed: {e}")
            yield {"type": "finish", "data": {"finishReason": "error", "error": str(e)}}

    async def finalize(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Finalize RCA workflow by organizing artifacts."""
        logger.info(f"Finalizing Root Cause Analysis workflow in {self.workspace_dir}")
        # No-op finalize for now: yield nothing but keep async generator type
        for _ in ():  # empty iterator keeps this as an async generator without unreachable code
            yield {}

    def _extract_artifact_metadata(self, *, file_path: str, content_str: Any) -> dict[str, Any] | None:
        """Extract artifact metadata from an RCA file.

        Returns a dict with the following keys:
        - artifact_type: "index", "rca", or "solution"
        - actual_file_path: actual file path
        - file_path: normalized path relative to workspace
        - filename: filename
        - content_type: "json"
        - artifact_id: RCA ID or solution ID
        - content: parsed artifact content
        """
        normalized_path = self._relativize_to_workspace(file_path, anchor="artifacts/")
        if not normalized_path.startswith("artifacts/"):
            return None

        path_obj = Path(normalized_path)
        filename = path_obj.name
        parent_dir = path_obj.parent.name
        content_type = "json" if filename.endswith(".json") else "md"

        # Only process JSON files for RCA artifacts
        if not filename.endswith(".json"):
            return None

        parsed_content = try_parse_json_content(content_str)
        if not parsed_content:
            logger.warning(f"Failed to parse JSON content from {file_path}")
            return None

        artifact_id = None
        artifact_type = None
        # Determine artifact type and ID based on file location and name
        if filename == "index.json":
            artifact_id = parsed_content.get("incident_id", "incident")
            artifact_type = "index"
        elif filename == "rca.json":
            artifact_id = parsed_content.get("rca_id", "rca")
            artifact_type = "rca"
        elif parent_dir == "solutions" and filename.startswith("sol-"):
            artifact_id = parsed_content.get("solution_id")
            artifact_type = "solution"
        else:
            return None

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
