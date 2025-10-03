"""Project model for organizing agent sessions and workspace."""

from typing import TYPE_CHECKING, Any

from sqlalchemy import JSON, Index
from sqlmodel import Field, Relationship

from app.models.base import AuditedModel

if TYPE_CHECKING:
    from app.models.user_agent_session import UserAgentSession


class Project(AuditedModel, table=True):
    """Project model for organizing agent sessions and workspace.

    Schema (Updated to match new database schema):
    - id: Primary key (bigint)
    - name: Project name (varchar(50))
    - is_active: Project status (boolean)
    - metadata: Project metadata (jsonb) - links to GitHub Repo, Confluence, JIRA, Notion, figma etc
    - created_at: Record creation timestamp
    - updated_at: Record last update timestamp
    - created_by: Foreign key to Users
    """

    __tablename__ = "projects"
    __table_args__ = (
        Index("ix_projects_created_by", "created_by"),
        Index("ix_projects_name_created_by", "name", "created_by"),
        Index("ix_projects_active_created_by", "is_active", "created_by"),
        {"schema": None},
    )

    name: str = Field(max_length=50, description="Project name")
    is_active: bool = Field(default=True, description="Project status")
    project_metadata: dict[str, Any] = Field(
        default_factory=dict,
        sa_type=JSON,
        description="Project metadata (e.g., links to GitHub Repo, Confluence, JIRA, Notion, figma etc)",
    )

    # Relationships
    sessions: list["UserAgentSession"] = Relationship(
        back_populates="project", sa_relationship_kwargs={"cascade": "all, delete-orphan"}
    )

    def __repr__(self) -> str:
        """String representation of the project."""
        return f"<Project(id={self.id}, name='{self.name}', created_by={self.created_by})>"
