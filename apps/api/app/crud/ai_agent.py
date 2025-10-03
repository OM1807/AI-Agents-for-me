"""AI Agent CRUD operations (read-only)."""

from sqlalchemy import desc, or_
from sqlalchemy.sql.selectable import Select

from app.agents.enums import AgentIdentifier, AgentModule
from app.crud.base import BaseCRUD
from app.models.ai_agent import AIAgent


class AIAgentCRUD(BaseCRUD[AIAgent, None, None]):
    """Read-only CRUD operations for AI Agent model."""

    def get_query(self) -> Select:
        """Get base query ordered by created_at desc."""
        return super().get_query().order_by(desc(self.model.created_at))  # type: ignore[arg-type]

    async def list_agents(
        self,
        *,
        identifier: AgentIdentifier | None = None,
        module: AgentModule | None = None,
        is_active: bool | None = None,
        search: str | None = None,
        tags: list[str] | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[AIAgent]:
        """List agents with optional filtering.

        Args:
            identifier: Filter by identifier
            module: Filter by agent module
            is_active: Filter by active status
            search: Search in name and description
            tags: Filter by tags (agents having any of the specified tags)
            skip: Number of records to skip for pagination
            limit: Maximum number of records to return

        Returns:
            list[AIAgent]: Filtered agents
        """
        # If no filters are applied, use the base get_multi method for better performance
        if not any([identifier, module, is_active, search, tags]):
            return await self.get_multi(skip=skip, limit=limit)

        # Apply custom filtering when filters are provided
        query = self.get_query()

        # Apply filters
        if identifier:
            query = query.where(self.model.identifier == identifier)  # type: ignore[arg-type]
        if module:
            query = query.where(self.model.module == module)  # type: ignore[arg-type]
        if is_active is not None:
            query = query.where(self.model.is_active == is_active)  # type: ignore[arg-type]

        # Search in name and description
        if search:
            search_term = f"%{search}%"
            query = query.where(
                or_(self.model.name.ilike(search_term), self.model.description.ilike(search_term))  # type: ignore
            )

        # Filter by tags (PostgreSQL JSON array operations)
        if tags:
            for tag in tags:
                query = query.where(self.model.tags.op("@>")(f'["{tag}"]'))  # type: ignore

        # Apply pagination
        query = query.offset(skip).limit(limit)
        result = await self.session.execute(query)
        return list(result.scalars().all())

    async def get_agent_by_id(self, agent_id: int) -> AIAgent | None:
        """Get a specific agent by ID.

        Args:
            agent_id: The agent ID to retrieve

        Returns:
            AIAgent | None: The agent if found, None otherwise
        """
        return await self.get(agent_id)

    async def get_agent_by_identifier(self, identifier: AgentIdentifier) -> AIAgent | None:
        """Get a specific agent by identifier.

        Args:
            identifier: The agent identifier to retrieve

        Returns:
            AIAgent | None: The agent if found, None otherwise
        """
        query = self.get_query().where(
            self.model.identifier == identifier,  # type: ignore
            self.model.is_active == True,  # type: ignore # noqa
        )
        result = await self.session.execute(query)
        return result.scalars().first()
