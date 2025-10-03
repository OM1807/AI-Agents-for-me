"""Project CRUD operations with user scoping and convenience helpers."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.sql.selectable import Select

from app.agents.enums import AgentIdentifier, AgentModule
from app.crud.base import BaseCRUD
from app.models.ai_agent import AIAgent
from app.models.project import Project
from app.models.user_agent_session import UserAgentSession


class ProjectCRUD(BaseCRUD[Project, dict[str, Any], dict[str, Any]]):
    """CRUD operations for Project model, scoped to current user."""

    def __init__(self, session: AsyncSession, user_id: int) -> None:
        super().__init__(Project, session)
        self.user_id = user_id

    def get_query(self) -> Select:
        return (
            super()
            .get_query()
            .where(self.model.created_by == self.user_id)  # type: ignore
            .join(UserAgentSession, Project.id == UserAgentSession.project_id)  # type: ignore
            .join(AIAgent, UserAgentSession.agent_id == AIAgent.id)  # type: ignore
            .options(
                selectinload(Project.sessions).joinedload(UserAgentSession.agent),  # type: ignore
            )
        )

    async def create_project(self, *, name: str, project_metadata: dict[str, Any] | None = None) -> Project:
        data: dict[str, Any] = {
            "name": name,
            "is_active": True,
            "project_metadata": project_metadata or {},
            "created_by": self.user_id,
            "updated_by": self.user_id,
        }
        db_obj = self.model(**data)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def get_projects_with_filters(
        self,
        skip: int = 0,
        limit: int = 100,
        module: AgentModule | None = None,
        agent_identifier: AgentIdentifier | None = None,
    ) -> tuple[list[dict[str, Any]], int]:
        """
        Get projects with optional filtering by module and agent identifier.

        Args:
            skip: Number of projects to skip for pagination.
            limit: Maximum number of projects to return.
            module: Filter by agent module.
            agent_identifier: Filter by agent identifier.

        Returns:
            Tuple of (projects_with_agents, total_count) where each project dict includes agents.
        """
        # Build base query with joins for filtering
        query = self.get_query()

        # Add filter conditions
        if module is not None:
            query = query.where(AIAgent.module == module.name)  # type: ignore
        if agent_identifier is not None:
            query = query.where(AIAgent.identifier == agent_identifier.name)  # type: ignore

        # Get total count
        count_query = query.with_only_columns(Project.id).distinct()  # type: ignore
        count_result = await self.session.execute(count_query)
        total = len(count_result.unique().scalars().all())

        # Apply pagination and get results (without DISTINCT to avoid JSON issues)
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        projects = list(result.unique().scalars().all())

        return projects, total

    async def store_project_artifact(self, *, project_id: int, artifact: dict[str, Any]) -> bool:
        """
        Upsert artifact details into the project's project_metadata.

        Schema shape:
            {
              "<artifact_type>": [artifact_id1, artifact_id2, ...],
              "artifacts": {
                 "<artifact_id>": { ...content }
              }
            }

        Notes:
        - This method is generic and not tied to any specific workflow.
        - It maintains order by appending new IDs; duplicates are ignored.
        """
        # Validate minimal keys
        artifact_type = str(artifact.get("artifact_type") or "").strip()
        artifact_id = str(artifact.get("artifact_id") or "").strip()
        content = artifact.get("content")
        if not artifact_type or not artifact_id or content is None:
            return False

        # Get project
        project = await self.get(project_id)
        if not project:
            return False

        # Prepare metadata containers
        project_metadata = dict(project.project_metadata or {})
        type_list = list(project_metadata.get(artifact_type) or [])
        artifacts_map = dict(project_metadata.get("artifacts") or {})

        # Upsert id list per type
        if artifact_id not in type_list:
            type_list.append(artifact_id)

        # Upsert artifact content
        artifacts_map[artifact_id] = content

        # Write back
        project_metadata[artifact_type] = type_list
        project_metadata["artifacts"] = artifacts_map

        # update project metadata
        project.project_metadata = project_metadata
        project.updated_by = project.created_by
        # Flag JSONB fields as modified so SQLAlchemy detects changes
        flag_modified(project, "project_metadata")
        self.session.add(project)
        await self.session.commit()
        return True
