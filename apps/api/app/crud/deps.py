"""CRUD dependency injection utilities."""

from typing import Annotated

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.auth import get_current_user
from app.core.database import get_db_session
from app.crud.project import ProjectCRUD
from app.models.user import User

# Type alias for session dependency
AsyncSessionDep = Annotated[AsyncSession, Depends(get_db_session)]


async def get_project_crud(
    session: AsyncSessionDep,
    current_user: Annotated[User, Depends(get_current_user)],
) -> ProjectCRUD:
    """
    Dependency to get ProjectCRUD instance with session and user scoping.

    Args:
        session: Database session
        current_user: Current authenticated user

    Returns:
        ProjectCRUD: Project CRUD operations instance with session and user scoping
    """
    assert current_user.id is not None, "Authenticated user must have an ID"
    return ProjectCRUD(session=session, user_id=current_user.id)
