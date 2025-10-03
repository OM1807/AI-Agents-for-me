"""Agent seeding utilities.

Provides functions to seed AI agents from in-memory data or a JSON file.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.models.ai_agent import AIAgent
from app.utils import get_logger

logger = get_logger(__name__)


async def seed_agents_data(session: AsyncSession, agents_data: list[dict[str, Any]]) -> dict[str, int]:
    """Seed agents into the database from a list of dictionaries.

    Args:
        session: Active async database session.
        agents_data: List of agent dictionaries.

    Returns:
        Summary dictionary with counts: {"created", "skipped", "errors"}.
    """

    result = {"created": 0, "skipped": 0, "errors": 0}

    try:
        # Bulk upsert using ON CONFLICT
        stmt = insert(AIAgent).values(agents_data)
        stmt = stmt.on_conflict_do_update(
            index_elements=["identifier"],
            set_={
                "name": stmt.excluded.name,
                "description": stmt.excluded.description,
                "module": stmt.excluded.module,
                "tags": stmt.excluded.tags,
                "is_active": stmt.excluded.is_active,
                "custom_properties_schema": stmt.excluded.custom_properties_schema,
            },
        )

        # Execute and get result
        result_proxy = await session.execute(stmt)
        await session.commit()

        result["created"] = result_proxy.rowcount
        result["skipped"] = len(agents_data) - result_proxy.rowcount

    except Exception as exc:
        logger.error(f"Failed to bulk upsert agents: {exc}")
        await session.rollback()
        result["errors"] += len(agents_data)
        result["created"] = 0
        result["skipped"] = 0

    return result


async def seed_agents_from_file(file_path: Path) -> dict[str, int]:
    """Seed agents from a JSON file path.

    The file must contain a JSON array of agent objects.

    Args:
        file_path: Path to a JSON file with agents.

    Returns:
        Summary dictionary with counts: {"created", "skipped", "errors"}.
    """

    if not file_path.exists():
        logger.error(f"Seed file not found: {file_path}")
        return {"created": 0, "skipped": 0, "errors": 1}

    try:
        with open(file_path, encoding="utf-8") as f:
            agents_data = json.load(f)
    except json.JSONDecodeError as exc:
        logger.error(f"Invalid JSON in seed file {file_path}: {exc}")
        return {"created": 0, "skipped": 0, "errors": 1}

    if not isinstance(agents_data, list):
        logger.error(f"Seed file must contain a JSON array: {file_path}")
        return {"created": 0, "skipped": 0, "errors": 1}

    async with get_async_session() as session:
        return await seed_agents_data(session, agents_data)
