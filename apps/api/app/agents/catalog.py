"""Agent catalog service for read-only access to pre-defined agents."""

from loguru import logger

from app.agents.enums import AgentIdentifier
from app.crud.ai_agent import AIAgentCRUD
from app.models.ai_agent import AIAgent


class AgentNotFoundError(Exception):
    """Raised when an agent is not found in the catalog."""

    pass


class AgentCatalog:
    """
    Service for accessing the catalog of pre-defined AI agents.

    This is NOT the user input - this provides metadata about available agents
    that users can choose from. Think of it as a "menu" of agent templates.
    """

    def __init__(self, crud: AIAgentCRUD) -> None:
        """Initialize with AI Agent CRUD instance."""
        self.crud = crud

    async def get_agent(self, identifier: AgentIdentifier) -> AIAgent:
        """
        Get agent metadata by ID.
        """
        agent = await self.crud.get_agent_by_identifier(identifier)

        if not agent:
            logger.warning(f"Agent {identifier} not found")
            raise AgentNotFoundError(f"Agent with identifier {identifier} not found")

        logger.info(f"Retrieved agent: {agent.name} (ID: {agent.id})")
        return agent
