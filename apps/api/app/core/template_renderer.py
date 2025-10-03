"""Unified Jinja2 template renderer for the application."""

import json
from collections.abc import Mapping
from datetime import datetime, timedelta
from enum import Enum
from typing import Any

from jinja2 import Environment, FileSystemLoader

from app.core.config import Paths


class TemplateType(Enum):
    """Template types supported by the renderer."""

    AGENT = "agents"
    MCP = "mcp"


class TemplateRenderer:
    """Unified Jinja2 renderer for all template types."""

    def __init__(self, template_type: TemplateType) -> None:
        """
        Initialize template renderer for a specific template type.

        Args:
            template_type: The type of templates to render
        """
        self.template_type = template_type

        # Set template directory based on type
        templates_dir = Paths.APP_DIR / template_type.value / "templates"

        # Create Jinja environment
        self.env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=False,  # We're dealing with JSON and prompts, not HTML
            trim_blocks=True,
            lstrip_blocks=True,
            enable_async=True,
        )

        # Add custom functions for MCP templates
        if template_type == TemplateType.MCP:
            self.env.globals["now"] = datetime.now
            self.env.globals["timedelta"] = timedelta

    async def render(self, *, template_name: str, context: Mapping[str, Any]) -> str:
        """
        Render a template with the given context.

        Args:
            template_name: Name of the template file
            context: Variables to pass to the template

        Returns:
            Rendered template as string
        """
        template = self.env.get_template(template_name)
        return await template.render_async(**context)

    async def get_template_json(self, *, template_name: str) -> dict[str, Any]:
        """
        Get a template by name and return it as parsed JSON.

        This method is primarily used for MCP templates that are JSON files.

        Args:
            template_name: Name of the template file

        Returns:
            Parsed JSON content of the template

        Raises:
            json.JSONDecodeError: If template content is not valid JSON
        """
        source, _, _ = self.env.loader.get_source(self.env, template_name)  # type: ignore
        return json.loads(source)  # type: ignore


# Convenience factory functions
def create_agent_renderer() -> TemplateRenderer:
    """Create a template renderer for agent prompts."""
    return TemplateRenderer(TemplateType.AGENT)


def create_mcp_renderer() -> TemplateRenderer:
    """Create a template renderer for MCP configurations."""
    return TemplateRenderer(TemplateType.MCP)
