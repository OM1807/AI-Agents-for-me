"""Integration model for managing third-party service integrations."""

from typing import Any

from sqlalchemy import JSON
from sqlalchemy.schema import UniqueConstraint
from sqlmodel import Field

from app.integrations.enums import AuthType, IntegrationProvider
from app.models.base import AuditedModel


class Integration(AuditedModel, table=True):
    """Integration model for managing third-party service integrations.

    Schema (inherited from AuditedModel which includes BaseModel):
    - id: Primary key (from BaseModel)
    - created_at: Record creation timestamp (from BaseModel)
    - updated_at: Record last update timestamp (from BaseModel)
    - created_by: Foreign key to Users (from AuditedModel)
    - updated_by: Foreign key to Users (from AuditedModel)

    Schema (specific to Integration):
    - name: Integration name (max 100 chars)
    - auth_type: Authentication type (OAuth/API Key/PAT)
    - credentials: JSONB field for integration configuration
    - is_active: Integration status
    - type: Integration type

    Business Rules:
    - Each user can only have ONE integration per type (Atlassian, Notion, GitHub)
    - This is enforced by the unique constraint on (type, created_by)
    """

    __tablename__ = "integrations"
    __table_args__ = (
        # Business rule: Only one integration per type per user
        UniqueConstraint("type", "created_by", name="uq_integration_type_user"),
        # Legacy constraint for backward compatibility (can be removed in future migration)
        UniqueConstraint("type", "is_active", "created_by", name="uq_integration_type_active_created"),
        {"schema": None},
    )

    name: str = Field(max_length=100, description="Integration name")
    auth_type: AuthType = Field(description="Authentication type (OAuth/API Key/PAT)")
    credentials: dict[str, Any] = Field(
        default_factory=dict, sa_type=JSON, description="Integration configuration JSONB"
    )
    is_active: bool = Field(default=True, description="Integration status")
    type: IntegrationProvider = Field(description="Integration type")
