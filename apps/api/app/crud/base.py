"""Base CRUD operations for all models."""

from typing import Any, Generic, TypeVar

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.sql.selectable import Select

from app.models.base import BaseModel

ModelType = TypeVar("ModelType", bound=BaseModel)
CreateSchemaType = TypeVar("CreateSchemaType")
UpdateSchemaType = TypeVar("UpdateSchemaType")


class BaseCRUD(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    """Base CRUD operations for all models.

    Provides common CRUD operations that can be inherited by specific model CRUD classes.
    """

    def __init__(self, model: type[ModelType], session: AsyncSession):
        """Initialize CRUD with model."""
        self.model = model
        self.session = session

    def get_query(self) -> Select:
        """Get base query with user filtering applied by default."""
        return select(self.model)

    async def get(self, id: int) -> ModelType | None:
        """Get model by ID."""
        result = await self.session.execute(self.get_query().where(self.model.id == id))  # type: ignore[arg-type]
        return result.unique().scalar_one_or_none()

    async def get_multi(self, *, skip: int = 0, limit: int = 100) -> list[ModelType]:
        """Get multiple models."""
        result = await self.session.execute(self.get_query().offset(skip).limit(limit))
        return list(result.scalars().all())

    async def create(self, *, obj_in: CreateSchemaType) -> ModelType:
        """Create a new model."""
        if isinstance(obj_in, dict):
            create_data = obj_in
        else:
            # Pydantic v2
            create_data = obj_in.model_dump(exclude_unset=True)  # type: ignore[attr-defined]

        db_obj = self.model(**create_data)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def update(self, *, db_obj: ModelType, obj_in: UpdateSchemaType | dict[str, Any]) -> ModelType:
        """Update a model."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            # Pydantic v2
            update_data = obj_in.model_dump(exclude_unset=True)  # type: ignore[attr-defined]

        for field, value in update_data.items():
            setattr(db_obj, field, value)

        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def remove(self, *, id: int) -> ModelType | None:
        """Delete a model."""
        obj = await self.session.get(self.model, id)
        if obj:
            await self.session.delete(obj)
            await self.session.commit()
        return obj

    async def exists(self, *, id: int) -> bool:
        """Check if model exists by ID."""
        result = await self.session.execute(self.get_query().where(self.model.id == id))  # type: ignore[arg-type]
        return result.unique().scalar_one_or_none() is not None
