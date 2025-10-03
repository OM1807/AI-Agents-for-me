import time

import typer
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.core.database import get_engine
from app.utils import get_logger

logger = get_logger(__name__)


async def wait_for_database(max_retries: int = 20, delay_seconds: float = 1.0) -> None:
    """Wait for a database to become available with exponential backoff."""
    retry_count = 0
    current_delay = delay_seconds
    engine = get_engine()

    while retry_count < max_retries:
        try:
            # Test database connection
            async with engine.begin() as conn:
                await conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection established")
            return
        except OperationalError as e:
            retry_count += 1
            if retry_count >= max_retries:
                logger.error(f"❌ Failed to connect to database after {max_retries} attempts: {e}")
                raise typer.Exit(code=1) from e

            logger.info(
                f"⏳ Database not ready, retrying in {current_delay:.1f}s... (attempt {retry_count}/{max_retries})"
            )
            time.sleep(current_delay)
            current_delay = min(current_delay * 1.5, 10.0)  # Exponential backoff, max 10s


async def acquire_advisory_lock(lock_id: int) -> bool:
    """Acquire a PostgreSQL advisory lock."""
    engine = get_engine()
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT pg_advisory_lock(:lock_id)"), {"lock_id": lock_id})
            logger.info(f"🔒 Acquired advisory lock {lock_id}")
            return True
    except Exception as e:
        # Non-PostgreSQL databases or other errors - continue without lock
        logger.warning(f"⚠️  Could not acquire advisory lock {lock_id}: {e}")
        return False


async def release_advisory_lock(lock_id: int) -> None:
    """Release a PostgreSQL advisory lock."""
    engine = get_engine()
    try:
        async with engine.begin() as conn:
            await conn.execute(text("SELECT pg_advisory_unlock(:lock_id)"), {"lock_id": lock_id})
            logger.info(f"🔓 Released advisory lock {lock_id}")
    except Exception as e:
        logger.warning(f"⚠️  Could not release advisory lock {lock_id}: {e}")
