"""AI Agent model for managing agent workflows and configurations."""

from typing import Any

from sqlalchemy import JSON, Text
from sqlmodel import Field

from app.agents.enums import AgentIdentifier, AgentModule
from app.models.base import BaseModel


class AIAgent(BaseModel, table=True):
    """AI Agent model for managing agent workflows and configurations.

    Schema:
    - id: Primary key (bigint)
    - name: Agent name (text)
    - description: Agent description (text)
    - identifier: Type of workflow to use (enum)
    - module: Category of the agent e.g. QA (enum)
    - tags: Tags to be used on agent definition (jsonb)
    - is_active: Agent status (boolean)
    - custom_properties_schema: Custom properties JSON schema (jsonb)
    """

    __tablename__ = "ai_agents"

    name: str = Field(sa_type=Text, index=True, description="Agent name")
    description: str = Field(sa_type=Text, description="Agent description")
    identifier: AgentIdentifier = Field(description="Type of workflow to use", unique=True)
    module: AgentModule = Field(description="Category of the agent e.g. QA")
    tags: list[str] = Field(default_factory=list, sa_type=JSON, description="Tags to be used on agent definition")
    is_active: bool = Field(default=True, description="Agent status")
    custom_properties_schema: dict[str, Any] = Field(
        default_factory=dict, sa_type=JSON, description="Custom properties JSON schema"
    )

    def __repr__(self) -> str:
        """String representation of the agent."""
        return f"<AIAgent(id={self.id}, name='{self.name}', identifier='{self.identifier}')>"

    @property
    def display_name(self) -> str:
        """Get display name."""
        return self.name

    @property
    def tag_list(self) -> list[str]:
        """Get tags as a list of strings."""
        return self.tags if self.tags else []
