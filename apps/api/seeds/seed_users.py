"""User seeding utilities.

Provides functions to seed users from in-memory data or a JSON file.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_async_session
from app.models.user import User
from app.utils import get_logger
from app.utils.crypto import decrypt_text

logger = get_logger(__name__)


async def seed_users_data(session: AsyncSession, users_data: list[dict[str, Any]]) -> dict[str, int]:
    """Seed users into the database from a list of dictionaries.

    Args:
        session: Active async database session.
        users_data: List of user dictionaries.

    Returns:
        Summary dictionary with counts: {"created", "skipped", "errors"}.
    """

    result = {"created": 0, "skipped": 0, "errors": 0}

    try:
        # Normalize incoming user dicts to ensure we provide plaintext password to the DB layer
        # If an entry provides "encrypted_password", decrypt it with SECRET_KEY
        normalized: list[dict[str, Any]] = []
        for raw in users_data:
            # Copy only known fields to avoid unexpected columns
            item: dict[str, Any] = {
                k: v for k, v in raw.items() if k in {"name", "email", "provider", "password", "is_active"}
            }

            if "password" not in item:
                enc = raw.get("encrypted_password")
                if isinstance(enc, str) and enc:
                    try:
                        item["password"] = decrypt_text(enc)
                    except Exception as exc:  # pragma: no cover - defensive
                        logger.error(f"Failed to decrypt password for {raw.get('email')}: {exc}")
                        # Mark as error and skip this particular item by continuing without adding it
                        result["errors"] += 1
                        continue

            normalized.append(item)

        # Bulk upsert using ON CONFLICT
        stmt = insert(User).values(normalized)
        stmt = stmt.on_conflict_do_update(
            index_elements=["email"],
            set_={
                "name": stmt.excluded.name,
                "provider": stmt.excluded.provider,
                "password": stmt.excluded.password,
                "is_active": stmt.excluded.is_active,
            },
        )

        # Execute and get result
        result_proxy = await session.execute(stmt)
        await session.commit()

        result["created"] = result_proxy.rowcount
        result["skipped"] = len(normalized) - result_proxy.rowcount

    except Exception as exc:
        logger.error(f"Failed to bulk upsert users: {exc}")
        await session.rollback()
        result["errors"] += len(users_data)
        result["created"] = 0
        result["skipped"] = 0

    return result


async def seed_users_from_file(file_path: Path) -> dict[str, int]:
    """Seed users from a JSON file path.

    The file must contain a JSON array of user objects.

    Args:
        file_path: Path to a JSON file with users.

    Returns:
        Summary dictionary with counts: {"created", "skipped", "errors"}.
    """

    if not file_path.exists():
        logger.error(f"Seed file not found: {file_path}")
        return {"created": 0, "skipped": 0, "errors": 1}

    try:
        with open(file_path, encoding="utf-8") as f:
            users_data = json.load(f)
    except json.JSONDecodeError as exc:
        logger.error(f"Invalid JSON in seed file {file_path}: {exc}")
        return {"created": 0, "skipped": 0, "errors": 1}

    if not isinstance(users_data, list):
        logger.error(f"Seed file must contain a JSON array: {file_path}")
        return {"created": 0, "skipped": 0, "errors": 1}

    async with get_async_session() as session:
        return await seed_users_data(session, users_data)
