"""User CRUD operations."""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.crud.base import BaseCRUD
from app.models.user import User
from app.schemas.auth import UserCreate, UserUpdate


class UserCRUD(BaseCRUD[User, UserCreate, UserUpdate]):
    """CRUD operations for User model."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize CRUD with User model and session."""
        super().__init__(User, session)

    async def get_by_email(self, email: str) -> User | None:
        """Get user by email."""
        result = await self.session.execute(select(self.model).where(self.model.email == email))  # type: ignore[arg-type]
        return result.scalar_one_or_none()

    async def exists_by_email(self, *, email: str) -> bool:
        """Check if user exists by email."""
        result = await self.session.execute(select(self.model).where(self.model.email == email))  # type: ignore[arg-type]
        return result.scalar_one_or_none() is not None

    async def authenticate(self, *, email: str, password: str) -> User | None:
        """Authenticate user with email and password."""
        user = await self.get_by_email(email=email)
        if not user:
            return None
        if not user.is_active:
            return None
        # For SQLAlchemy Utils encrypted fields, we need to compare the raw values
        # The encrypted field automatically decrypts when accessed
        if not user.password or user.password != password:
            return None
        return user
