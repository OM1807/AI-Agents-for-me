"""Base protocol for agent workflow implementations."""

import shutil
from abc import ABC, abstractmethod
from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from loguru import logger

from app.agents.claude.orchestrator import ClaudeOrchestrator
from app.agents.enums import AgentIdentifier
from app.core.template_renderer import create_agent_renderer
from app.models.user_agent_session import UserAgentSession
from app.services.integration_service import IntegrationService


class AgentWorkflow(ABC):
    """
    Protocol for agent workflow implementations.
    All agent workflows must adhere to this interface.

    Based on backend-technical-design.md
    """

    # Subclasses should set this to the appropriate AgentIdentifier (e.g., AgentIdentifier.CODE_ANALYSIS)
    identifier: AgentIdentifier | None = None

    def __init__(
        self,
        *,
        workspace_dir: Path,
        mcp_configs: dict[str, Any],
        integration_service: IntegrationService,
        system_prompt: str | None = None,
        llm_session_id: str | None = None,
    ) -> None:
        """Initialize the agent workflow."""
        self.workspace_dir = workspace_dir
        self.mcp_configs = mcp_configs
        self.integration_service = integration_service
        self.system_prompt = system_prompt
        self.llm_session_id = llm_session_id
        self.orchestrator = self._create_orchestrator()
        self.prompt_renderer = create_agent_renderer()

        # Initialize directory paths
        # workspace_dir structure: {root_dir}/{user_id}/{project_id}/{session_id}
        # user_dir: {root_dir}/{user_id}
        # files_dir: {root_dir}/{user_id}/files
        self.user_dir = self.workspace_dir.parent.parent
        self.files_dir = self.user_dir / "files"

    def _create_orchestrator(self) -> ClaudeOrchestrator:
        """Create the orchestrator for the agent workflow."""
        return ClaudeOrchestrator(
            system_prompt=self.system_prompt,
            base_dir=self.workspace_dir,
            mcp_configs=self.mcp_configs,
            resume_session_id=self.llm_session_id,
        )

    async def _build_context(self, *, session: UserAgentSession, **extra: Any) -> dict[str, Any]:
        """Construct rendering context from session data."""
        # Merge mcps and custom_properties into a single context object
        custom_properties: dict[str, Any] = session.custom_properties or {}
        return {"mcps": session.mcps or [], **custom_properties, **extra}

    async def _prepare_system_prompt(self, *, session: UserAgentSession, **extra: Any) -> str:
        """
        Default Jinja2-based system prompt renderer.
        Looks for `app/agents/templates/<identifier>/system.md`.
        """
        context = await self._build_context(session=session, **extra)

        return await self.prompt_renderer.render(
            template_name=f"{self.identifier.value}/system.md",  # type: ignore
            context=context,
        )

    async def _prepare_user_prompt(self, *, session: UserAgentSession, **extra: Any) -> str:
        """Render user prompt for initial test generation from template."""
        context = await self._build_context(session=session, **extra)
        try:
            return await self.prompt_renderer.render(
                template_name=f"{self.identifier.value}/user.md",  # type: ignore
                context=context,
            )
        except Exception as e:
            logger.error(f"Error rendering user prompt for {self.identifier.value}: {e}")  # type: ignore
            return ""

    async def _prepare_user_followup_prompt(self, *, session: UserAgentSession, feedback: str, **extra: Any) -> str:
        """Render user followup prompt for test case generation from template."""
        extra.update({"user_feedback": feedback})
        context = await self._build_context(session=session, **extra)
        return await self.prompt_renderer.render(
            template_name=f"{self.identifier.value}/user_followup.md",  # type: ignore
            context=context,
        )

    @abstractmethod
    def run(self, *, session: UserAgentSession, messages: list[dict[str, Any]]) -> AsyncIterator[dict[str, Any]]:
        """
        Execute the agent workflow and stream responses.

        Args:
            session: The session for the agent
            messages: The messages for the agent

        Yields:
            dict: Agent events in internal format
        """
        ...

    @abstractmethod
    def prepare(self, *, session: UserAgentSession, messages: list[dict[str, Any]]) -> AsyncIterator[dict[str, Any]]:
        """
        Optional hook: Perform pre-steps in workspace before orchestration.
        E.g., cloning repositories, setting up environment.

        Args:
            session: The session for the agent
            messages: The messages for the agent

        Yields:
            dict: Agent events in internal format
        """
        ...

    @abstractmethod
    def finalize(self, *, session: UserAgentSession, messages: list[dict[str, Any]]) -> AsyncIterator[dict[str, Any]]:
        """
        Optional hook: Post-steps after orchestration.
        E.g., saving artifacts, cleaning up temporary files.

        Args:
            session: The session for the agent
            messages: The messages for the agent

        Yields:
            dict: Agent events in internal format
        """
        ...

    # helper methods
    def _relativize_to_workspace(self, path_str: str | Path, anchor: str) -> str:
        """Return a POSIX-style path relative to the workflow workspace.

        Falls back to searching for anchor segment (e.g., "tests/" or "docs/")
        if normal relativization fails.
        """
        try:
            abs_path = Path(path_str) if isinstance(path_str, str) else path_str
            ws = self.workspace_dir
            return abs_path.resolve().relative_to(ws.resolve()).as_posix()
        except Exception:
            s = str(path_str).replace("\\", "/")
            # Prefer trimming to anchor segment if present
            idx = s.find(anchor)
            if idx != -1:
                return s[idx:].lstrip("/")
            return s.lstrip("/")

    async def _read_file_content(self, file_path: str) -> str | None:
        """Read file content from filesystem for edit operations.

        Args:
            file_path: File path (relative to workspace or absolute)

        Returns:
            File content as string, or None if file doesn't exist or can't be read
        """
        try:
            # Handle both absolute and relative paths
            if Path(file_path).is_absolute():
                full_path = Path(file_path)
            else:
                full_path = self.workspace_dir / file_path

            # Check if file exists and read content
            if full_path.exists() and full_path.is_file():
                return full_path.read_text(encoding="utf-8")
            else:
                logger.warning(f"File not found for edit operation: {full_path}")
                return None

        except Exception as exc:
            logger.warning(f"Failed to read file content for edit operation: {file_path}. Error: {exc}")
            return None

    async def _copy_file_to_workspace(self, file_name: str) -> None:
        """Copy a file from user's file storage to the workspace.

        Args:
            file_name: Name of the file to copy
        """
        try:
            source_file = self.files_dir / file_name

            if source_file.exists() and source_file.is_file():
                # Copy to workspace root for easy access
                target_file = self.workspace_dir / file_name
                shutil.copy2(source_file, target_file)
                logger.info(f"Copied file {file_name} from user storage to workspace", extra={"file": file_name})
            else:
                logger.warning(f"File {file_name} not found in user file storage", extra={"file": file_name})
        except Exception as e:
            logger.warning(f"Failed to copy file {file_name}: {e}", extra={"file": file_name})
