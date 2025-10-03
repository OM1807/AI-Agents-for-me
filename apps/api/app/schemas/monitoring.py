"""Monitoring schemas for unified provider responses."""

from typing import Any

from pydantic import BaseModel, Field


class ServiceResponse(BaseModel):
    """Generic service response schema for monitoring providers."""

    id: str = Field(..., description="Unique service identifier")
    name: str = Field(..., description="Service name")
    description: str = Field(default="", description="Service description")
    last_updated: str = Field(..., description="Last updated timestamp (ISO format)")


class ProjectResponse(BaseModel):
    """Generic project response schema for monitoring providers."""

    id: str = Field(..., description="Unique project identifier")
    name: str = Field(..., description="Project name")


class IncidentResponse(BaseModel):
    """Generic incident response schema for monitoring providers."""

    id: str = Field(..., description="Unique incident identifier")
    title: str = Field(..., description="Incident title")
    type: str = Field(default="incident", description="Incident type (alert, error, etc.)")
    link: str = Field(default="", description="URL link to incident details")
    last_seen: str = Field(..., description="Last seen timestamp (ISO format)")
    status: str = Field(default="unknown", description="Incident status")
    created: str = Field(..., description="Incident creation timestamp (ISO format)")
    incident_public_id: str = Field(default="", description="Incident public identifier")
    agent_payload: dict[str, Any] = Field(default_factory=dict, description="Agent payload")
    description: str = Field(default="", description="Incident description")


class MonitoringFilters(BaseModel):
    """Generic filters for monitoring provider queries."""

    # Service filters
    logs_last_range: str | None = Field(None, description="Time range for logs (e.g., '7d', '24h')")

    # Project filters
    project_id: str | None = Field(None, description="Project identifier")

    # Incident filters
    last_days: int | None = Field(None, description="Number of days to look back for incidents")
    status: str | None = Field(None, description="Incident status filter")
    severity: str | None = Field(None, description="Incident severity filter")
    since: str | None = Field(None, description="Start time for incident search")
    until: str | None = Field(None, description="End time for incident search")
    limit: int | None = Field(100, description="Maximum number of results")

    # Generic filters that can be provider-specific
    extra_params: dict[str, Any] = Field(default_factory=dict, description="Provider-specific additional parameters")
