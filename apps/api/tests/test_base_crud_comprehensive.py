"""Comprehensive tests for base CRUD operations."""

from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import BaseCRUD
from app.models.integration import AuthType, Integration, IntegrationType
from app.schemas.integration import IntegrationCreate, IntegrationUpdate


class TestBaseCRUDComprehensive:
    """Comprehensive tests for base CRUD operations."""

    @pytest.fixture
    def base_crud(self) -> BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate]:
        """Base CRUD instance for testing."""
        return BaseCRUD(Integration)

    @pytest.fixture
    def mock_session(self) -> Any:
        """Mock async session for testing."""
        return AsyncMock(spec=AsyncSession)

    @pytest.fixture
    def sample_integration(self) -> Integration:
        """Sample integration for testing."""
        return Integration(
            id=1,
            name="Test Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            credentials='{"pat_token": "test_token"}',
            created_by=1,
            is_active=True,
            mcp_config='{"github": {"type": "http"}}',
        )

    @pytest.fixture
    def sample_integration_create(self) -> IntegrationCreate:
        """Sample integration create schema for testing."""
        return IntegrationCreate(
            name="Test Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            credentials={"pat_token": "test_token"},
        )

    @pytest.fixture
    def sample_integration_update(self) -> IntegrationUpdate:
        """Sample integration update schema for testing."""
        return IntegrationUpdate(
            name="Updated Integration",
            auth_type=None,
            credentials=None,
            is_active=None,
            mcp_config=None,
        )

    def test_init(self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate]) -> None:
        """Test base CRUD initialization."""
        assert base_crud.model == Integration

    async def test_get_success(
        self,
        base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate],
        mock_session: Any,
        sample_integration: Integration,
    ) -> None:
        """Test successful get operation."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        mock_session.execute.return_value = mock_result
        # Act
        result = await base_crud.get(mock_session, id=1)

        # Assert
        assert result == sample_integration
        mock_session.execute.assert_called_once()

    async def test_get_not_found(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test get operation when record not found."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result
        # Act
        result = await base_crud.get(mock_session, id=999)

        # Assert
        assert result is None
        mock_session.execute.assert_called_once()

    async def test_get_multi_success(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test successful get_multi operation."""
        # Arrange
        mock_integrations = [MagicMock(), MagicMock()]
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_integrations
        mock_session.execute.return_value = mock_result
        # Act
        result = await base_crud.get_multi(mock_session, skip=0, limit=10)

        # Assert
        assert result == mock_integrations
        mock_session.execute.assert_called_once()

    async def test_get_multi_empty(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test get_multi operation with empty result."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        mock_session.execute.return_value = mock_result
        # Act
        result = await base_crud.get_multi(mock_session, skip=0, limit=10)

        # Assert
        assert result == []
        mock_session.execute.assert_called_once()

    async def test_get_multi_with_pagination(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test get_multi operation with pagination."""
        # Arrange
        mock_integrations = [MagicMock()]
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_integrations
        mock_session.execute.return_value = mock_result
        # Act
        result = await base_crud.get_multi(mock_session, skip=5, limit=5)

        # Assert
        assert result == mock_integrations
        mock_session.execute.assert_called_once()

    async def test_create_with_dict(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test create operation with dictionary input."""
        # Arrange
        create_data: dict[str, Any] = {
            "name": "Test Integration",
            "type": IntegrationType.GITHUB,
            "auth_type": AuthType.PAT,
            "credentials": {"pat_token": "test_token"},
            "created_by": 1,
        }

        # Act
        result = await base_crud.create(mock_session, obj_in=create_data)  # type: ignore[arg-type]
        # Assert
        assert result is not None
        assert result.name == "Test Integration"
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once()

    async def test_create_with_pydantic_model(
        self,
        base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate],
        mock_session: Any,
        sample_integration_create: IntegrationCreate,
    ) -> None:
        """Test create operation with Pydantic model input."""
        # Act
        result = await base_crud.create(mock_session, obj_in=sample_integration_create)
        # Assert
        assert result is not None
        assert result.name == "Test Integration"
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once()

    async def test_update_with_dict(
        self,
        base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate],
        mock_session: Any,
        sample_integration: Integration,
    ) -> None:
        """Test update operation with dictionary input."""
        # Arrange
        update_data = {"name": "Updated Integration", "is_active": False}

        # Act
        result = await base_crud.update(mock_session, db_obj=sample_integration, obj_in=update_data)
        # Assert
        assert result is not None
        assert result.name == "Updated Integration"
        assert result.is_active is False
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once()

    async def test_update_with_pydantic_model(
        self,
        base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate],
        mock_session: Any,
        sample_integration: Integration,
        sample_integration_update: IntegrationUpdate,
    ) -> None:
        """Test update operation with Pydantic model input."""
        # Act
        result = await base_crud.update(mock_session, db_obj=sample_integration, obj_in=sample_integration_update)
        # Assert
        assert result is not None
        assert result.name == "Updated Integration"
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once()

    async def test_update_partial_fields(
        self,
        base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate],
        mock_session: Any,
        sample_integration: Integration,
    ) -> None:
        """Test update operation with partial fields."""
        # Arrange
        update_data = {"name": "Partial Update"}

        # Act
        result = await base_crud.update(mock_session, db_obj=sample_integration, obj_in=update_data)
        # Assert
        assert result is not None
        assert result.name == "Partial Update"
        # Other fields should remain unchanged
        assert result.type == IntegrationType.GITHUB
        assert result.auth_type == AuthType.PAT

    async def test_remove_success(
        self,
        base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate],
        mock_session: Any,
        sample_integration: Integration,
    ) -> None:
        """Test successful remove operation."""
        # Arrange
        mock_session.get.return_value = sample_integration  # Act
        result = await base_crud.remove(mock_session, id=1)

        # Assert
        assert result == sample_integration
        mock_session.get.assert_called_once_with(Integration, 1)
        mock_session.delete.assert_called_once_with(sample_integration)
        mock_session.commit.assert_called_once()

    async def test_remove_not_found(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test remove operation when record not found."""
        # Arrange
        mock_session.get.return_value = None
        # Act
        result = await base_crud.remove(mock_session, id=999)

        # Assert
        assert result is None
        mock_session.get.assert_called_once_with(Integration, 999)
        mock_session.delete.assert_not_called()
        mock_session.commit.assert_not_called()

    async def test_exists_true(
        self,
        base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate],
        mock_session: Any,
        sample_integration: Integration,
    ) -> None:
        """Test exists operation when record exists."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        mock_session.execute.return_value = mock_result
        # Act
        result = await base_crud.exists(mock_session, id=1)

        # Assert
        assert result is True
        mock_session.execute.assert_called_once()

    async def test_exists_false(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test exists operation when record doesn't exist."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_session.execute.return_value = mock_result
        # Act
        result = await base_crud.exists(mock_session, id=999)

        # Assert
        assert result is False
        mock_session.execute.assert_called_once()

    async def test_create_with_exclude_unset(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test create operation with exclude_unset behavior."""
        # Arrange
        create_data: dict[str, Any] = {
            "name": "Test Integration",
            "type": IntegrationType.GITHUB,
            "auth_type": AuthType.PAT,
            "credentials": {"pat_token": "test_token"},
            "created_by": 1,
            "is_active": None,  # This should be excluded
        }

        # Act
        result = await base_crud.create(mock_session, obj_in=create_data)  # type: ignore[arg-type]
        # Assert
        assert result is not None
        assert result.name == "Test Integration"
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once()

    async def test_update_with_exclude_unset(
        self,
        base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate],
        mock_session: Any,
        sample_integration: Integration,
    ) -> None:
        """Test update operation with exclude_unset behavior."""
        # Arrange
        update_data: dict[str, Any] = {
            "name": "Updated Integration",
            "is_active": None,  # This should be excluded
        }

        # Act
        result = await base_crud.update(mock_session, db_obj=sample_integration, obj_in=update_data)
        # Assert
        assert result is not None
        assert result.name == "Updated Integration"
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once()

    async def test_create_session_error_handling(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test create operation with session error."""
        # Arrange
        mock_session.add.side_effect = Exception("Database error")

        # Act & Assert
        with pytest.raises(Exception, match="Database error"):
            await base_crud.create(mock_session, obj_in={"name": "Test"})  # type: ignore[arg-type]

    async def test_update_session_error_handling(
        self,
        base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate],
        mock_session: Any,
        sample_integration: Integration,
    ) -> None:
        """Test update operation with session error."""
        # Arrange
        mock_session.add.side_effect = Exception("Database error")

        # Act & Assert
        with pytest.raises(Exception, match="Database error"):
            await base_crud.update(mock_session, db_obj=sample_integration, obj_in={"name": "Updated"})

    async def test_remove_session_error_handling(
        self,
        base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate],
        mock_session: Any,
        sample_integration: Integration,
    ) -> None:
        """Test remove operation with session error."""
        # Arrange
        mock_session.get.return_value = sample_integration
        mock_session.delete.side_effect = Exception("Database error")
        # Act & Assert
        with pytest.raises(Exception, match="Database error"):
            await base_crud.remove(mock_session, id=1)

    def test_model_type_annotation(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate]
    ) -> None:
        """Test that the model type annotation is correct."""
        # This test ensures type safety
        assert isinstance(base_crud.model, type)
        assert issubclass(base_crud.model, Integration)

    async def test_get_multi_default_parameters(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test get_multi operation with default parameters."""
        # Arrange
        mock_integrations = [MagicMock()]
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_integrations
        mock_session.execute.return_value = mock_result
        # Act
        result = await base_crud.get_multi(mock_session)

        # Assert
        assert result == mock_integrations
        mock_session.execute.assert_called_once()

    async def test_create_with_nested_dict(
        self, base_crud: BaseCRUD[Integration, IntegrationCreate, IntegrationUpdate], mock_session: Any
    ) -> None:
        """Test create operation with nested dictionary data."""
        # Arrange
        create_data: dict[str, Any] = {
            "name": "Test Integration",
            "type": IntegrationType.GITHUB,
            "auth_type": AuthType.PAT,
            "credentials": {"pat_token": "test_token", "additional_field": "value"},
            "created_by": 1,
        }

        # Act
        result = await base_crud.create(mock_session, obj_in=create_data)  # type: ignore[arg-type]
        # Assert
        assert result is not None
        assert result.name == "Test Integration"
        mock_session.add.assert_called_once()
        mock_session.commit.assert_called_once()
        mock_session.refresh.assert_called_once()
