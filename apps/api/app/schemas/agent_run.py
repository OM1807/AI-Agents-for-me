"""Schemas for Agent Run and Continue requests."""

from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field

from app.integrations.enums import IntegrationProvider


class AgentRunRequest(BaseModel):
    """Request schema to start a new agent session and stream results.

    Notes:
    - messages: raw message dicts as sent by FE. We will persist only user messages server-side.
    - mcps: optional subset of integration providers to render MCP configs for.
    - project_name: if provided, we will create or use a project with this name; otherwise a default is used.
    - custom_properties: flexible per agent identifier (e.g., for code_analysis: github_repos, docs, contents_to_include, analysis_type, etc.).
    """

    messages: list[dict[str, Any]] = Field(default_factory=list, description="Conversation messages")
    mcps: list[IntegrationProvider] = Field(default_factory=list, description="Requested MCP providers")
    project_name: str | None = Field(default=None, description="Optional project name for session")
    custom_properties: dict[str, Any] = Field(default_factory=dict, description="Agent-specific properties")
