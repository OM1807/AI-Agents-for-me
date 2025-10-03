"""Integration CRUD operations."""


from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.sql.selectable import Select

from app.crud.base import BaseCRUD
from app.integrations.enums import IntegrationProvider
from app.models.integration import Integration
from app.schemas.integration import IntegrationCreate, IntegrationUpdate


class IntegrationCRUD(BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate]):
    """CRUD operations for Integration model."""

    def __init__(self, session: AsyncSession, user_id: int) -> None:
        """Initialize IntegrationCRUD with session and optional user_id for filtering."""
        super().__init__(Integration, session)
        self.user_id = user_id

    def get_query(self) -> Select:
        """Get base query with user filtering applied by default."""
        query = super().get_query()
        query = query.where(self.model.created_by == self.user_id)  # type: ignore
        return query

    async def list_integrations(
        self,
        *,
        integration_type: str | None = None,
        providers: list[str] | None = None,
        is_active: bool | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Integration]:
        """
        Get integrations with flexible filtering options.

        Args:
            integration_type: Filter by a single integration provider
            providers: Optional list of providers to include
            is_active: Filter by active status (True/False/None for all)
            skip: Number of records to skip for pagination
            limit: Maximum number of records to return

        Returns:
            list[Integration]: Filtered integrations
        """
        query = self.get_query()

        # Apply filters
        if integration_type is not None:
            query = query.where(self.model.type == integration_type)  # type: ignore
        if providers:
            query = query.where(self.model.type.in_(providers))  # type: ignore
        if is_active is not None:
            query = query.where(self.model.is_active.is_(is_active))  # type: ignore

        # Apply pagination only for list queries
        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)

        return list(result.scalars().all())

    async def get_by_provider(
        self,
        *,
        provider: IntegrationProvider,
    ) -> Integration | None:
        """Get integrations filtered by a single provider.

        Args:
            provider: Provider name to filter by
            is_active: Optional active status filter (defaults to True)
            skip: Pagination offset
            limit: Pagination limit

        Returns:
            list[Integration]: Integrations matching the provider filter
        """
        query = self.get_query().where(self.model.type == provider)  # type: ignore
        # is active
        query = query.where(self.model.is_active.is_(True))  # type: ignore
        # return single object
        result = await self.session.execute(query)
        return result.scalars().first()

    async def create_integration(self, *, obj_in: IntegrationCreate) -> Integration:
        """Create a new integration."""
        create_data = obj_in.model_dump(exclude_unset=True)
        create_data["created_by"] = self.user_id
        create_data["updated_by"] = self.user_id

        db_obj = self.model(**create_data)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def update_integration(self, *, db_obj: Integration, obj_in: IntegrationUpdate) -> Integration:
        """Update an integration."""
        update_data = obj_in.model_dump(exclude_unset=True)
        update_data["updated_by"] = self.user_id

        for field, value in update_data.items():
            setattr(db_obj, field, value)
            # Flag JSONB fields as modified so SQLAlchemy detects changes
            if field == "credentials":
                flag_modified(db_obj, field)

        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def delete_integration(self, *, integration_id: int) -> bool:
        """Delete integration (hard delete - complete removal from database)."""
        integration = await self.get(integration_id)
        if not integration:
            return False

        # Use BaseModel's remove method for hard delete
        deleted_integration = await self.remove(id=integration_id)
        return deleted_integration is not None
