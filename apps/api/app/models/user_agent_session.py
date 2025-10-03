"""User Agent Session model for tracking agent interactions."""

from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Index
from sqlmodel import Field, Relationship

from app.models.base import AuditedModel

if TYPE_CHECKING:
    from app.models.ai_agent import AIAgent
    from app.models.project import Project


class UserAgentSession(AuditedModel, table=True):
    """User Agent Session model for tracking agent interactions.

    Schema (Updated to match new database schema):
    - id: Primary key (bigint)
    - project_id: Foreign key to Projects (bigint)
    - agent_id: Foreign key to AIAgents (bigint)
    - messages: Session conversation history (jsonb)
    - is_active: Session status (boolean)
    - mcps: MCP names array (jsonb)
    - created_at: Record creation timestamp
    - updated_at: Record last update timestamp
    - custom_properties: Custom properties values e.g. analysis_type (jsonb)
    - created_by: Foreign key to Users (bigint)
    """

    __tablename__ = "user_agent_sessions"
    __table_args__ = (
        Index("ix_sessions_user_project", "created_by", "project_id"),
        Index("ix_sessions_user_agent", "created_by", "agent_id"),
        {"schema": None},
    )

    project_id: int = Field(foreign_key="projects.id", description="Foreign key to Projects")
    agent_id: int = Field(foreign_key="ai_agents.id", description="Foreign key to AIAgents")
    messages: list[dict[str, Any]] = Field(
        default_factory=list, sa_type=JSON, description="Session conversation history"
    )
    is_active: bool = Field(default=True, description="Session status")
    mcps: list[str] = Field(default_factory=list, sa_type=JSON, description="MCP names array")
    custom_properties: dict[str, Any] = Field(
        default_factory=dict, sa_type=JSON, description="Custom properties values e.g. analysis_type"
    )
    llm_session_id: str | None = Field(default=None, description="LLM Provider session id")

    # Relationships
    project: "Project" = Relationship(back_populates="sessions")
    agent: "AIAgent" = Relationship()

    def __repr__(self) -> str:
        """String representation of the session."""
        return f"<UserAgentSession(id={self.id}, user_id={self.created_by}, agent_id={self.agent_id}, is_active={self.is_active})>"

    @property
    def message_count(self) -> int:
        """Get count of messages in the session."""
        return len(self.messages) if self.messages else 0

    @property
    def mcp_count(self) -> int:
        """Get count of MCPs in the session."""
        return len(self.mcps) if self.mcps else 0
