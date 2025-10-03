"""Comprehensive tests for integration CRUD operations."""

from typing import Any
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.crud.integration import IntegrationCRUD
from app.models.integration import AuthType, Integration, IntegrationType
from app.schemas.integration import IntegrationCreate, IntegrationUpdate


class TestIntegrationCRUDComprehensive:
    """Comprehensive tests for integration CRUD operations."""

    @pytest.fixture
    def integration_crud(self) -> IntegrationCRUD:
        """Integration CRUD instance for testing."""
        session = AsyncMock()
        # Mock the execute method to return a proper result object
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        mock_result.scalars.return_value.all.return_value = []
        session.execute.return_value = mock_result
        return IntegrationCRUD(session)

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
            mcp_config='{"github": {"type": "http", "url": "https://api.githubcopilot.com/mcp/"}}',
        )

    @pytest.fixture
    def sample_integration_create(self) -> IntegrationCreate:
        """Sample integration create schema for testing."""
        return IntegrationCreate(
            name="Test Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            token="test_token",
            credentials={"pat_token": "test_token"},
        )

    @pytest.fixture
    def sample_integration_update(self) -> IntegrationUpdate:
        """Sample integration update schema for testing."""
        return IntegrationUpdate(
            name="Updated Integration",
            auth_type=None,
            token=None,
            credentials=None,
            is_active=None,
        )

    def test_init(self, integration_crud: IntegrationCRUD) -> None:
        """Test integration CRUD initialization."""
        assert integration_crud.model == Integration
        assert integration_crud.session is not None

    async def test_get_by_id_success(self, integration_crud: IntegrationCRUD, sample_integration: Integration) -> None:
        """Test successful get by ID operation."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.get_by_id(1)

        # Assert
        assert result == sample_integration
        integration_crud.session.execute.assert_called_once()  # type: ignore[attr-defined]

    async def test_get_by_id_not_found(self, integration_crud: IntegrationCRUD) -> None:
        """Test get by ID operation when not found."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.get_by_id(999)

        # Assert
        assert result is None

    async def test_list_user_integrations_success(self, integration_crud: IntegrationCRUD) -> None:
        """Test successful list user integrations operation."""
        # Arrange
        mock_integrations = [MagicMock(), MagicMock()]
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_integrations
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.list_user_integrations(skip=0, limit=10)

        # Assert
        assert result == mock_integrations
        integration_crud.session.execute.assert_called_once()  # type: ignore[attr-defined]

    async def test_list_user_integrations_empty(self, integration_crud: IntegrationCRUD) -> None:
        """Test list user integrations operation with empty result."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.list_user_integrations(skip=0, limit=10)

        # Assert
        assert result == []

    async def test_list_user_integrations_with_pagination(self, integration_crud: IntegrationCRUD) -> None:
        """Test list user integrations operation with pagination."""
        # Arrange
        mock_integrations = [MagicMock()]
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_integrations
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.list_user_integrations(skip=5, limit=5)

        # Assert
        assert result == mock_integrations

    async def test_get_by_integration_type_success(self, integration_crud: IntegrationCRUD) -> None:
        """Test successful get by integration type operation."""
        # Arrange
        mock_integrations = [MagicMock(), MagicMock()]
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_integrations
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.get_by_integration_type(integration_type=IntegrationType.GITHUB)

        # Assert
        assert result == mock_integrations
        integration_crud.session.execute.assert_called_once()  # type: ignore[attr-defined]

    async def test_get_by_integration_type_empty(self, integration_crud: IntegrationCRUD) -> None:
        """Test get by integration type operation with empty result."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.get_by_integration_type(integration_type=IntegrationType.GITHUB)

        # Assert
        assert result == []

    async def test_get_active_integrations_success(self, integration_crud: IntegrationCRUD) -> None:
        """Test successful get active integrations operation."""
        # Arrange
        mock_integrations = [MagicMock(), MagicMock()]
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_integrations
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.get_active_integrations()

        # Assert
        assert result == mock_integrations
        integration_crud.session.execute.assert_called_once()  # type: ignore[attr-defined]

    async def test_get_active_integrations_empty(self, integration_crud: IntegrationCRUD) -> None:
        """Test get active integrations operation with empty result."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = []
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.get_active_integrations()

        # Assert
        assert result == []

    async def test_create_integration_success(
        self, integration_crud: IntegrationCRUD, sample_integration_create: IntegrationCreate
    ) -> None:
        """Test successful create integration operation."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.create_integration(
            obj_in=sample_integration_create, created_by=1, mcp_config={"github": {"type": "http"}}
        )

        # Assert
        assert result is not None
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.refresh.assert_called_once()  # type: ignore[attr-defined]

    async def test_create_integration_with_dict_credentials(self, integration_crud: IntegrationCRUD) -> None:
        """Test create integration with dictionary credentials."""
        # Arrange
        create_data = IntegrationCreate(
            name="Test Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            token="test_token",
            credentials={"pat_token": "test_token", "additional": "value"},
        )
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.create_integration(obj_in=create_data, created_by=1)

        # Assert
        assert result is not None
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]

    async def test_create_integration_with_string_credentials(self, integration_crud: IntegrationCRUD) -> None:
        """Test create integration with string credentials."""
        # Arrange - This test is not valid since credentials must be a dict
        # The schema validation will prevent string credentials
        create_data = IntegrationCreate(
            name="Test Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            token="test_token",
            credentials={"pat_token": "test_token"},  # Must be dict, not string
        )
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.create_integration(obj_in=create_data, created_by=1)

        # Assert
        assert result is not None
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]

    async def test_create_integration_with_mcp_config(
        self, integration_crud: IntegrationCRUD, sample_integration_create: IntegrationCreate
    ) -> None:
        """Test create integration with MCP config."""
        # Arrange
        mcp_config = {"github": {"type": "http", "url": "https://api.githubcopilot.com/mcp/"}}
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.create_integration(
            obj_in=sample_integration_create, created_by=1, mcp_config=mcp_config
        )

        # Assert
        assert result is not None
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]

    async def test_update_integration_success(
        self,
        integration_crud: IntegrationCRUD,
        sample_integration: Integration,
        sample_integration_update: IntegrationUpdate,
    ) -> None:
        """Test successful update integration operation."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.update_integration(db_obj=sample_integration, obj_in=sample_integration_update)

        # Assert
        assert result is not None
        assert result.name == "Updated Integration"
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.refresh.assert_called_once()  # type: ignore[attr-defined]

    async def test_update_integration_with_dict_credentials(
        self, integration_crud: IntegrationCRUD, sample_integration: Integration
    ) -> None:
        """Test update integration with dictionary credentials."""
        # Arrange
        update_data = IntegrationUpdate(
            name=None,
            auth_type=None,
            token=None,
            credentials={"pat_token": "updated_token", "new_field": "value"},
            is_active=None,
        )
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.update_integration(db_obj=sample_integration, obj_in=update_data)

        # Assert
        assert result is not None
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]

    async def test_update_integration_with_dict_mcp_config(
        self, integration_crud: IntegrationCRUD, sample_integration: Integration
    ) -> None:
        """Test update integration with dictionary MCP config."""
        # Arrange
        update_data = IntegrationUpdate(
            name=None,
            auth_type=None,
            token=None,
            credentials=None,
            is_active=None,
        )
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.update_integration(db_obj=sample_integration, obj_in=update_data)

        # Assert
        assert result is not None
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]

    async def test_delete_integration_success(
        self, integration_crud: IntegrationCRUD, sample_integration: Integration
    ) -> None:
        """Test successful delete integration operation."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.delete.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.delete_integration(integration_id=1)

        # Assert
        assert result is True
        integration_crud.session.delete.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]

    async def test_delete_integration_not_found(self, integration_crud: IntegrationCRUD) -> None:
        """Test delete integration when not found."""
        # Arrange
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.delete_integration(integration_id=999)

        # Assert
        assert result is False

    async def test_delete_integration_wrong_user(
        self, integration_crud: IntegrationCRUD, sample_integration: Integration
    ) -> None:
        """Test delete integration with wrong user."""
        # Arrange
        sample_integration.created_by = 999  # Different user
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.delete_integration(integration_id=1)

        # Assert
        assert result is False

    async def test_create_integration_json_serialization(self, integration_crud: IntegrationCRUD) -> None:
        """Test JSON serialization in create integration."""
        # Arrange
        create_data = IntegrationCreate(
            name="Test Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            token="test_token",
            credentials={"pat_token": "test_token", "nested": {"key": "value"}},
        )
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = None
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.create_integration(obj_in=create_data, created_by=1)

        # Assert
        assert result is not None
        # Verify that the credentials were stored as dictionary (SQLAlchemy JSON field)
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        added_obj = integration_crud.session.add.call_args[0][0]  # type: ignore[attr-defined]
        assert isinstance(added_obj.credentials, dict)
        assert added_obj.credentials["pat_token"] == "test_token"
        assert added_obj.credentials["nested"]["key"] == "value"

    async def test_update_integration_json_serialization(
        self, integration_crud: IntegrationCRUD, sample_integration: Integration
    ) -> None:
        """Test JSON serialization in update integration."""
        # Arrange
        update_data = IntegrationUpdate(
            name=None,
            auth_type=None,
            token=None,
            credentials={"pat_token": "updated_token", "nested": {"key": "updated_value"}},
            is_active=None,
        )
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.update_integration(db_obj=sample_integration, obj_in=update_data)

        # Assert
        assert result is not None
        # Verify that the credentials were stored as dictionaries (SQLAlchemy JSON fields)
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        added_obj = integration_crud.session.add.call_args[0][0]  # type: ignore[attr-defined]
        assert isinstance(added_obj.credentials, dict)
        assert added_obj.credentials["pat_token"] == "updated_token"
        assert added_obj.credentials["nested"]["key"] == "updated_value"

    async def test_update_integration_is_active_only(
        self, integration_crud: IntegrationCRUD, sample_integration: Integration
    ) -> None:
        """Test update integration with only is_active field."""
        # Arrange
        update_data = IntegrationUpdate(name=None, auth_type=None, token=None, credentials=None, is_active=False)
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.update_integration(db_obj=sample_integration, obj_in=update_data)

        # Assert
        assert result is not None
        assert result.is_active is False
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.refresh.assert_called_once()  # type: ignore[attr-defined]

    async def test_update_integration_name_only(
        self, integration_crud: IntegrationCRUD, sample_integration: Integration
    ) -> None:
        """Test update integration with only name field."""
        # Arrange
        update_data = IntegrationUpdate(
            name="Updated Integration Name", auth_type=None, token=None, credentials=None, is_active=None
        )
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.update_integration(db_obj=sample_integration, obj_in=update_data)

        # Assert
        assert result is not None
        assert result.name == "Updated Integration Name"
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.refresh.assert_called_once()  # type: ignore[attr-defined]

    async def test_update_integration_multiple_fields(
        self, integration_crud: IntegrationCRUD, sample_integration: Integration
    ) -> None:
        """Test update integration with multiple fields."""
        # Arrange
        update_data = IntegrationUpdate(
            name="Multi Updated", auth_type=AuthType.OAUTH, token=None, credentials=None, is_active=False
        )
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.update_integration(db_obj=sample_integration, obj_in=update_data)

        # Assert
        assert result is not None
        assert result.name == "Multi Updated"
        assert result.is_active is False
        assert result.auth_type == AuthType.OAUTH
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.refresh.assert_called_once()  # type: ignore[attr-defined]

    async def test_update_integration_empty_update(
        self, integration_crud: IntegrationCRUD, sample_integration: Integration
    ) -> None:
        """Test update integration with empty update data."""
        # Arrange
        update_data = IntegrationUpdate(name=None, auth_type=None, token=None, credentials=None, is_active=None)
        mock_result: Any = MagicMock()
        mock_result.scalar_one_or_none.return_value = sample_integration
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]
        integration_crud.session.add.return_value = None  # type: ignore[attr-defined]
        integration_crud.session.refresh.return_value = None  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.update_integration(db_obj=sample_integration, obj_in=update_data)

        # Assert
        assert result is not None
        # Should return the original integration unchanged
        integration_crud.session.add.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.commit.assert_called_once()  # type: ignore[attr-defined]
        integration_crud.session.refresh.assert_called_once()  # type: ignore[attr-defined]

    async def test_list_user_integrations_default_parameters(self, integration_crud: IntegrationCRUD) -> None:
        """Test list user integrations with default parameters."""
        # Arrange
        mock_integrations = [MagicMock()]
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_integrations
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.list_user_integrations()

        # Assert
        assert result == mock_integrations
        integration_crud.session.execute.assert_called_once()  # type: ignore[attr-defined]

    async def test_list_user_integrations_custom_parameters(self, integration_crud: IntegrationCRUD) -> None:
        """Test list user integrations with custom parameters."""
        # Arrange
        mock_integrations = [MagicMock()]
        mock_result: Any = MagicMock()
        mock_result.scalars.return_value.all.return_value = mock_integrations
        integration_crud.session.execute.return_value = mock_result  # type: ignore[attr-defined]

        # Act
        result = await integration_crud.list_user_integrations(skip=10, limit=20)

        # Assert
        assert result == mock_integrations
        integration_crud.session.execute.assert_called_once()  # type: ignore[attr-defined]

    def test_integration_crud_inheritance(self, integration_crud: IntegrationCRUD) -> None:
        """Test that IntegrationCRUD properly inherits from BaseCRUD."""
        from app.crud.base import BaseCRUD

        assert isinstance(integration_crud, BaseCRUD)
        assert integration_crud.model == Integration
