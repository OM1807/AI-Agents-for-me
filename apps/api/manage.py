#!/usr/bin/env python3

import asyncio
import importlib
import os
import sys
from pathlib import Path
from typing import Optional

import typer

from alembic import command
from alembic.config import Config
from alembic.util import CommandError
from app.core.config import Paths, get_settings
from app.core.database import MODEL_PATHS
from app.db.utils import acquire_advisory_lock, release_advisory_lock, wait_for_database
from app.utils import get_logger
from app.utils.crypto import decrypt_text, encrypt_text
from seeds.seed_agents import seed_agents_from_file
from seeds.seed_users import seed_users_from_file

cli = typer.Typer()
logger = get_logger(__name__)


@cli.command()
def run(
    host: str = typer.Option("0.0.0.0", "--host", "-h", help="Host to bind to"),
    port: int = typer.Option(None, "--port", "-p", help="Port to bind to (defaults to settings.PORT)"),
    reload: bool = typer.Option(False, "--reload", "-r", help="Enable auto-reload on code changes"),
    workers: int = typer.Option(1, "--workers", "-w", help="Number of worker processes"),
    log_level: str = typer.Option("info", "--log-level", "-l", help="Log level (debug, info, warning, error)"),
):
    """Run the FastAPI application with uvicorn"""
    import uvicorn

    settings = get_settings()
    port = port or settings.PORT

    typer.echo(f"🚀 Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    typer.echo(f"📍 Environment: {settings.ENVIRONMENT}")
    typer.echo(f"🌐 Server: http://{host}:{port}")
    typer.echo(f"📚 Documentation: http://{host}:{port}/docs")
    typer.echo(f"🔧 Debug mode: {settings.DEBUG}")
    typer.echo(f"🔄 Auto-reload: {reload}")
    typer.echo(f"👥 Workers: {workers}")
    typer.echo("─" * 50)
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload,
        workers=workers,
        log_level=log_level,
        access_log=True,
    )


@cli.command()
def upgrade(rev: str = "head", config_file: Path = Path("alembic.ini")):
    """Apply database migrations"""
    typer.echo(f"🔄 Migrating to revision {rev}")
    config = Config(config_file)
    try:
        command.upgrade(config, rev)
        typer.echo(f"✅ Successfully migrated to revision {rev}")
    except CommandError as exc:
        typer.echo(f"❌ Error: {exc}")
        raise typer.Exit(code=1) from exc


@cli.command()
def downgrade(rev: str = "head", config_file: Path = Path("alembic.ini")):
    """Downgrade to the given revision"""
    typer.echo(f"⚠️  Downgrading to revision {rev}")
    config = Config(config_file)
    try:
        command.downgrade(config, rev)
        typer.echo(f"✅ Successfully downgraded to revision {rev}")
    except CommandError as exc:
        typer.echo(f"❌ Error: {exc}")
        raise typer.Exit(code=1) from exc


@cli.command()
def show(config_file: Path = Path("alembic.ini"), rev: str = "head"):
    """Show the revision"""
    config = Config(config_file)
    try:
        command.show(config, rev)
    except CommandError as exc:
        typer.echo(f"❌ Error: {exc}")
        raise typer.Exit(code=1) from exc


@cli.command()
def revision(
    message: Optional[str] = None,
    config_file: Path = Path("alembic.ini"),
    autogenerate: bool = True,
    head: str = "head",
    splice: bool = False,
):
    """Create a new Alembic revision"""
    # Import all the models to be able to autogenerate migrations
    for model_path in MODEL_PATHS:
        importlib.import_module(model_path)
        logger.debug(f"✅ Loaded models: {model_path}")

    config = Config(config_file)
    try:
        command.revision(
            config,
            message=message,
            autogenerate=autogenerate,
            head=head,
            splice=splice,
        )
        typer.echo("✅ Revision created successfully")
    except CommandError as exc:
        typer.echo(f"❌ Error: {exc}")
        raise typer.Exit(code=1) from exc


@cli.command()
def current(config_file: Path = Path("alembic.ini")):
    """Show the current database revision"""
    config = Config(config_file)
    try:
        command.current(config)
    except CommandError as exc:
        typer.echo(f"❌ Error: {exc}")
        raise typer.Exit(code=1) from exc


@cli.command()
def history(config_file: Path = Path("alembic.ini"), rev_range: Optional[str] = None, verbose: bool = False):
    """Show migration history"""
    config = Config(config_file)
    try:
        command.history(config, rev_range=rev_range, verbose=verbose)
    except CommandError as exc:
        typer.echo(f"❌ Error: {exc}")
        raise typer.Exit(code=1) from exc


@cli.command()
def stamp(revision: str, config_file: Path = Path("alembic.ini"), purge: bool = False):
    """Mark the database as being at a specific revision without running migrations"""
    config = Config(config_file)
    try:
        command.stamp(config, revision, purge=purge)
        typer.echo(f"✅ Successfully stamped database to revision {revision}")
    except CommandError as exc:
        typer.echo(f"❌ Error: {exc}")
        raise typer.Exit(code=1) from exc


@cli.command()
def check(config_file: Path = Path("alembic.ini")):
    """Check if there are any pending migrations"""
    config = Config(config_file)
    try:
        # Get current revision
        current = command.current(config)
        # Get head revision
        head = command.head(config)

        if current == head:
            typer.echo("✅ Database is up to date")
        else:
            typer.echo(f"⚠️  Database is behind. Current: {current}, Head: {head}")
            typer.echo("ℹ️  Run 'python manage.py upgrade' to apply pending migrations")

    except CommandError as exc:
        typer.echo(f"❌ Error: {exc}")
        raise typer.Exit(code=1) from exc


@cli.command()
def reset(
    config_file: Path = Path("alembic.ini"),
    confirm: bool = typer.Option(False, "--yes", "-y", help="Skip confirmation prompt"),
):
    """Reset the database by downgrading to base and upgrading to head"""
    if not confirm:
        typer.echo("⚠️  This will reset the database. All data will be lost!")
        if not typer.confirm("Are you sure you want to continue?"):
            typer.echo("Operation cancelled.")
            return

    typer.echo("⚠️  Resetting database...")

    config = Config(config_file)
    try:
        # Downgrade to base
        command.downgrade(config, "base")
        typer.echo("✅ Downgraded to base")

        # Upgrade to head
        command.upgrade(config, "head")
        typer.echo("✅ Upgraded to head")

        typer.echo("✅ Database reset completed!")
    except CommandError as exc:
        typer.echo(f"❌ Error: {exc}")
        raise typer.Exit(code=1) from exc


@cli.command()
def prestart(
    no_migrate: bool = typer.Option(False, "--no-migrate", help="Skip database migrations"),
    no_seed: bool = typer.Option(False, "--no-seed", help="Skip database seeding"),
) -> None:
    """Run prestart routine: wait for DB, acquire lock, migrate, seed."""

    async def _run() -> None:
        # Get configuration from environment
        max_retries = int(os.getenv("DB_CONNECT_MAX_RETRIES", "20"))
        delay_seconds = float(os.getenv("DB_CONNECT_DELAY_SECONDS", "1.0"))
        lock_id = int(os.getenv("STARTUP_LOCK_ID", "424242"))

        logger.info("🚀 Starting prestart routine...")

        try:
            # Step 1: Wait for database
            logger.info("⏳ Waiting for database...")
            await wait_for_database(max_retries=max_retries, delay_seconds=delay_seconds)

            # Step 2: Acquire advisory lock
            logger.info(f"🔒 Acquiring advisory lock {lock_id}...")
            lock_acquired = await acquire_advisory_lock(lock_id)

            try:
                # Step 3: Run migrations
                if not no_migrate:
                    # Run the blocking upgrade() in a thread to avoid calling
                    # `asyncio.run()` from within an already running event loop.
                    await asyncio.to_thread(upgrade)
                else:
                    logger.info("⏭️  Skipping database migrations")

                # Step 4: Run seeding
                if not no_seed:
                    logger.info("🌱 Running database seeding...")

                    # Seed users
                    user_file_path = Paths.API_DIR / "seeds" / "data" / "users.json"
                    user_result = await seed_users_from_file(user_file_path)
                    user_total = user_result["created"] + user_result["skipped"] + user_result["errors"]
                    typer.echo(
                        f"👥 User seeding complete: {user_result['created']} created, {user_result['skipped']} skipped, {user_result['errors']} errors out of {user_total} total"
                    )

                    # Seed agents
                    agent_file_path = Paths.API_DIR / "seeds" / "data" / "agents.json"
                    agent_result = await seed_agents_from_file(agent_file_path)
                    agent_total = agent_result["created"] + agent_result["skipped"] + agent_result["errors"]
                    typer.echo(
                        f"🤖 Agent seeding complete: {agent_result['created']} created, {agent_result['skipped']} skipped, {agent_result['errors']} errors out of {agent_total} total"
                    )

                    if user_result["errors"] > 0 or agent_result["errors"] > 0:
                        raise typer.Exit(code=1)
                else:
                    logger.info("⏭️  Skipping database seeding")

            finally:
                # Step 5: Release advisory lock
                if lock_acquired:
                    await release_advisory_lock(lock_id)

            logger.info("✅ Prestart routine completed successfully")

        except Exception as e:
            logger.error(f"❌ Prestart routine failed: {e}")
            raise typer.Exit(code=1) from e

    asyncio.run(_run())


@cli.command("encrypt-password")
def cli_encrypt_password(password: str) -> None:
    """Encrypt a plaintext password using SECRET_KEY and print ciphertext.

    Example:
        python manage.py encrypt-password "MySecret!"
    """
    cipher = encrypt_text(password)
    typer.echo(cipher)


@cli.command("decrypt-password")
def cli_decrypt_password(ciphertext: str) -> None:
    """Decrypt a ciphertext password using SECRET_KEY and print plaintext.

    Example:
        python manage.py decrypt-password "<ciphertext>"
    """
    plain = decrypt_text(ciphertext)
    typer.echo(plain)


def main():
    """Main entry point"""
    try:
        cli()
    except TypeError as e:
        if "Parameter.make_metavar()" in str(e):
            # Fallback for typer compatibility issue
            print("Application Commands:")
            print("  run         - Run the FastAPI application")
            print("\nDatabase Management Commands:")
            print("  upgrade     - Apply database migrations")
            print("  downgrade   - Downgrade database migrations")
            print("  show        - Show revision details")
            print("  revision    - Create a new migration")
            print("  current     - Show current revision")
            print("  history     - Show migration history")
            print("  stamp       - Stamp database with revision")
            print("  check       - Check migration status")
            print("  init        - Initialize database")
            print("  reset       - Reset database (destructive)")
            print("\nSeeding Commands:")
            print("  prestart    - Wait for DB, migrate, and seed")
            print("\nUse: python manage.py <command> --help for more info")
        else:
            print(f"❌ Unexpected error: {e}")
            sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()
