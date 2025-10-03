"""Jinja renderer and template resolver for MCP configurations."""

import json
from collections.abc import Mapping
from datetime import datetime, timedelta
from typing import Any

from jinja2 import Environment, FileSystemLoader

from app.core.config import Paths


class McpRenderer:
    """Jinja renderer for MCP configuration templates."""

    def __init__(self) -> None:
        """Initialize MCP renderer with Jinja environment."""
        # Get the templates directory
        templates_dir = Paths.APP_DIR / "mcp" / "templates"

        # Create Jinja environment
        self.env = Environment(
            loader=FileSystemLoader(str(templates_dir)),
            autoescape=False,  # We're dealing with JSON, not HTML
            trim_blocks=True,
            lstrip_blocks=True,
            enable_async=True,
        )

        # Add custom functions
        self.env.globals["now"] = datetime.now
        self.env.globals["timedelta"] = timedelta

    async def get_template_json(self, *, template_name: str) -> dict[str, Any]:
        """Get a template by name and return it as a JSON string."""
        source, _, _ = self.env.loader.get_source(self.env, template_name)  # type: ignore
        return json.loads(source)  # type: ignore

    async def render(self, *, template_name: str, context: Mapping[str, Any]) -> str:
        """Render a template with the given context."""
        template = self.env.get_template(template_name)
        return await template.render_async(**context)
