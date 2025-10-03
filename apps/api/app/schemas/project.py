"""Project schemas for read-only response models."""

from datetime import datetime
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, computed_field

from app.schemas.agent import AgentCompact
from app.schemas.user_agent_session import SessionCompact, SessionResponse


class ProjectResponse(BaseModel):
    """Schema for Project response (read-only)."""

    model_config = ConfigDict(
        from_attributes=True,
        json_encoders={datetime: lambda v: v.isoformat()},
    )

    id: int = Field(..., description="Project ID")
    name: str = Field(..., description="Project name")
    is_active: bool = Field(..., description="Project status")
    created_at: datetime = Field(..., description="Project creation timestamp")
    updated_at: datetime = Field(..., description="Last update timestamp")
    created_by: int = Field(..., description="User ID who created the project")
    updated_by: int = Field(..., description="User ID who updated the project")
    sessions: list[SessionCompact] = Field(..., description="List of sessions for this project", exclude=True)

    @computed_field  # type: ignore
    @property
    def agent(self) -> AgentCompact | None:
        """Return the first session if it exists, otherwise None."""
        return self.sessions[0].agent if self.sessions else None


class ProjectDetailResponse(ProjectResponse):
    """Schema for Project detail response with session listings."""

    project_metadata: dict[str, Any] = Field(..., description="Project metadata")
    sessions: list[SessionResponse] = Field(..., description="List of sessions for this project")  # type: ignore


class ProjectListResponse(BaseModel):
    """Schema for paginated project list response."""

    model_config = ConfigDict(from_attributes=True)

    results: list[ProjectResponse] = Field(..., description="List of projects with agent information")
    total: int = Field(..., description="Total number of projects")
    skip: int = Field(..., description="Number of projects skipped")
    limit: int = Field(..., description="Maximum number of projects returned")
    has_more: bool = Field(..., description="Whether there are more projects available")
