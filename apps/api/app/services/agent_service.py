"""Agent service for orchestrating agent session lifecycle and streaming."""

from __future__ import annotations

from collections.abc import AsyncIterator
from pathlib import Path
from typing import Any

from fastapi import HTTPException, status
from loguru import logger

from app.agents.catalog import AgentCatalog
from app.agents.enums import AgentIdentifier
from app.agents.workflows.factory import workflow_factory
from app.crud.ai_agent import AIAgentCRUD
from app.crud.project import ProjectCRUD
from app.crud.user_agent_session import UserAgentSessionCRUD
from app.integrations.enums import IntegrationProvider
from app.models.user_agent_session import UserAgentSession
from app.services.integration_service import IntegrationService
from app.services.mcp_service import McpService
from app.services.workspace_service import WorkspaceService


class AgentService:
    """Agent orchestration service (temporary stub for workflow execution)."""

    def __init__(
        self,
        *,
        project_crud: ProjectCRUD,
        session_crud: UserAgentSessionCRUD,
        workspace_service: WorkspaceService,
        mcp_service: McpService,
        integration_service: IntegrationService,
        agent_crud: AIAgentCRUD,
        agent_catalog: AgentCatalog,
    ) -> None:
        self.project_crud = project_crud
        self.session_crud = session_crud
        self.workspace_service = workspace_service
        self.mcp_service = mcp_service
        self.integration_service = integration_service
        self.agent_crud = agent_crud
        self.agent_catalog = agent_catalog

    async def create_session(
        self,
        *,
        user_id: int,
        agent_identifier: str,
        project_name: str | None = None,
        mcps: list[IntegrationProvider] | None = None,
        custom_properties: dict[str, Any] | None = None,
    ) -> dict[str, Any]:
        """Create a new user session with project and workspace.

        Returns:
            Dict containing session details including session_id, project_id, agent_id, and workspace_path
        """
        # Validate agent identifier
        try:
            agent_identifier_enum = AgentIdentifier(agent_identifier)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid agent identifier: {agent_identifier}",
            )

        # Get agent from catalog
        agent = await self.agent_catalog.get_agent(agent_identifier_enum)
        if not agent:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent not found: {agent_identifier_enum.value}",
            )

        # Create project for this session
        project = await self.project_crud.create_project(
            name=project_name,  # type: ignore
            project_metadata={"agent_identifier": agent_identifier_enum.value},
        )

        # Create session
        session = await self.session_crud.create_session(
            project_id=project.id,  # type: ignore
            agent_id=agent.id,  # type: ignore
            messages=[],  # Always start with empty messages
            mcps=[p.value for p in mcps] if mcps else [],
            custom_properties=custom_properties or {},
        )

        # Create workspace directory
        await self.workspace_service.create(
            user_id=user_id,
            project_id=project.id,  # type: ignore
            session_id=session.id,  # type: ignore
        )

        logger.info(
            "User session created",
            extra={
                "user_id": user_id,
                "session_id": session.id,
                "project_id": project.id,
                "agent_identifier": agent_identifier_enum.value,
            },
        )

        return {
            "session_id": session.id,
            "project_id": project.id,
            "agent_id": agent.id,
            "is_active": session.is_active,
            "mcps": session.mcps,
            "custom_properties": session.custom_properties,
            "created_at": session.created_at,
        }

    async def run(
        self,
        *,
        user_id: int,
        agent_identifier: AgentIdentifier,
        session_id: int,
        messages: list[dict[str, Any]],
    ) -> AsyncIterator[dict[str, Any]]:
        """Run an agent session - automatically determines whether to start or continue based on llm_session_id."""
        # Get existing session
        session = await self.session_crud.get_session(session_id=session_id)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={
                    "code": "session_not_found",
                    "message": f"Session {session_id} not found",
                },
            )

        # Update session messages
        await self.session_crud.update_session_messages(session_id=session_id, messages=messages)

        # Resolve workspace directory
        base_dir = self.workspace_service.resolve(
            user_id=user_id,
            project_id=session.project_id,
            session_id=session.id,  # type: ignore
        )
        logger.info("Running session", extra={"base_dir": base_dir, "session_id": session_id})

        # Generate MCP configs
        try:
            mcps = [IntegrationProvider(p) for p in session.mcps]
            mcp_configs = await self.mcp_service.generate_many(providers=mcps)
            logger.info("MCP configs prepared", extra={"count": len(mcp_configs)})
        except Exception as e:
            logger.warning(f"MCP generation failed: {e}")
            mcp_configs = {}

        # Return the async iterator directly
        return self._run_workflow(
            agent_identifier=agent_identifier,
            session=session,
            messages=messages,
            base_dir=base_dir,
            mcp_configs=mcp_configs,
        )

    async def _run_workflow(
        self,
        *,
        agent_identifier: AgentIdentifier,
        session: UserAgentSession,
        messages: list[dict[str, Any]],
        base_dir: Path,
        mcp_configs: dict[str, dict[str, Any]],
    ) -> AsyncIterator[dict[str, Any]]:
        logger.info(
            f"Running workflow session: {session.id}, dir: {base_dir}",
            extra={"messages": messages, "mcp_configs": mcp_configs},
        )
        agent = await self.agent_catalog.get_agent(agent_identifier)
        workflow_cls = workflow_factory.resolve(agent.identifier)
        workflow = workflow_cls(
            workspace_dir=base_dir,
            mcp_configs=mcp_configs,
            integration_service=self.integration_service,
            llm_session_id=session.llm_session_id,
        )

        # Run the workflow
        async for event in workflow.run(session=session, messages=messages):
            # if the workflow finishes and the session has no LLM session ID, update it
            if event["type"] == "system" and "session_id" in event["data"] and session.llm_session_id is None:
                logger.info(
                    "Updating LLM session ID",
                    extra={"session_id": session.id, "llm_session_id": event["data"]["session_id"]},
                )
                # update session with the new LLM session ID and refresh the session
                updated_session = await self.session_crud.update_llm_session_id(
                    session=session, llm_session_id=event["data"]["session_id"]
                )
                if updated_session:
                    session = updated_session
                logger.info(f"LLM session ID updated: {session.llm_session_id}")
            # Persist artifacts to project metadata for any data-* events
            try:
                if isinstance(event, dict) and isinstance(event.get("type"), str) and event["type"].startswith("data-"):
                    artifact = event.get("data") or {}
                    updated = await self.project_crud.store_project_artifact(
                        project_id=session.project_id, artifact=artifact
                    )
                    if updated:
                        logger.info(f"Project updated with artifact: {artifact.get('artifact_id')}")
            except Exception as store_exc:
                logger.warning(f"Failed to store artifact on project: {store_exc}")
            yield event
