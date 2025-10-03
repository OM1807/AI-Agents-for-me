"""Code documentation agent workflow implementation."""

from collections.abc import AsyncIterator
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


@register(AgentIdentifier.CODE_ANALYSIS)
class CodeAnalysisWorkflow(AgentWorkflow):
    """Code documentation workflow using Claude orchestrator."""

    # Used by base to select templates folder: app/agents/templates/code_analysis/*
    identifier = AgentIdentifier.CODE_ANALYSIS

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
        self.git_ops = GitOps()

    async def _get_github_token(self) -> str | None:
        """Get the GitHub token for the session."""
        integration = await self.integration_service.crud.get_by_provider(provider=IntegrationProvider.GITHUB)
        if integration:
            return await self.integration_service.get_access_token(integration_id=integration.id)  # type: ignore
        return None

    async def _prepare_followup_system_prompt(self) -> str:
        """Prepare the followup system prompt for the code documentation workflow."""
        return await self.prompt_renderer.render(
            template_name=f"{self.identifier.value}/system_followup.md",
            context={},
        )

    async def _prepare_system_prompt(self, session: UserAgentSession, **extra: Any) -> str:
        """
        Choose the correct template for system prompt:
        - If continuing an existing LLM session → render followup template via base helper
        - Else → render system template via base helper
        """
        if self.llm_session_id:
            return await self._prepare_followup_system_prompt()
        return await super()._prepare_system_prompt(session=session)

    async def prepare(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Prepare workspace for code documentation by cloning repositories."""
        # check if session already exists
        if session.llm_session_id:
            logger.info(f"Session {session.id} already has an LLM session ID: {session.llm_session_id}")
            logger.info("Skipping prepare and running directly")

            return
        logger.info(f"Preparing workspace {self.workspace_dir} for code documentation")

        # Extract repository URLs from messages'
        properties = session.custom_properties
        repo_urls = properties.get("github_repos", [])

        if not repo_urls:
            logger.info("No repositories specified for cloning")
            raise ValueError("No repositories specified for cloning")

        try:
            repos_dir = self.workspace_dir
            repos_dir.mkdir(parents=True, exist_ok=True)

            # Resolve provider tokens once per host (V1: only GitHub)
            github_token: str | None = await self._get_github_token()

            # Clone each repository
            for repo_data in repo_urls:
                repo_url = repo_data.get("url")
                repo_branch = repo_data.get("branch", "main")
                logger.info(f"Cloning repository: {repo_url}")
                host = urlparse(repo_url).netloc.lower()
                access_token = github_token if "github.com" in host else None

                tool_call_id = f"git_clone_{hash(str(repo_url))}"
                # Git clone operations
                yield {
                    "type": "tool_call",
                    "toolCallId": tool_call_id,
                    "toolName": "git_clone",
                    "args": {
                        "url": repo_url,
                        "prompt": f"Cloning repository {repo_url}...",
                    },
                }
                # Add
                await self.git_ops.clone_repository(
                    url=repo_url,
                    destination_dir=repos_dir,
                    branch=repo_branch,
                    access_token=access_token,
                )
                yield {
                    "type": "tool_result",
                    "toolCallId": tool_call_id,
                    "result": f"Repository {repo_url} successfully cloned to: {repos_dir}/{repo_url.split('/')[-1]}",
                }

            logger.info(f"Successfully cloned {len(repo_urls)} repositories into {repos_dir}")

        except GitOperationError as e:
            logger.error(f"Failed to clone repositories: {e}")
            raise
        except Exception as e:
            logger.error(f"Unexpected error during repository preparation: {e}")
            raise

    async def run(self, *, session: UserAgentSession, messages: list[dict[str, Any]]) -> AsyncIterator[dict[str, Any]]:
        """Run the code documentation workflow."""
        try:
            logger.info("Starting code documentation workflow")

            # call prepare
            async for event in self.prepare(session=session, messages=messages):
                yield event

            system_prompt = await self._prepare_system_prompt(session=session)

            if session.llm_session_id is None:
                user_prompt = await super()._prepare_user_prompt(session=session, messages=messages)
                messages[0]["content"] = user_prompt

            # Stream responses from Claude Code SDK directly
            logger.info(f"Invoking Claude Code SDK with system prompt: {system_prompt}")
            async for response in self.orchestrator.run(messages, system_prompt=system_prompt):
                yield response
            logger.info("Claude Code SDK invocation completed")

        except Exception as e:
            logger.error(f"Code documentation workflow failed: {e}")
            yield {"type": "finish", "data": {"finishReason": "error", "error": str(e)}}

    async def finalize(
        self, *, session: UserAgentSession, messages: list[dict[str, Any]]
    ) -> AsyncIterator[dict[str, Any]]:
        """Finalize code documentation workflow by organizing artifacts."""
        logger.info(f"Finalizing code documentation workflow in {self.workspace_dir}")
        # No-op finalize for now: yield nothing but keep async generator type
        for _ in ():  # empty iterator keeps this as an async generator without unreachable code
            yield {}
