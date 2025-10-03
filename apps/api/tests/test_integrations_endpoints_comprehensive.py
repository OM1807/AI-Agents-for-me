"""Comprehensive tests for integration endpoints."""

from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException, status

from app.models.integration import AuthType, Integration, IntegrationType
from app.models.user import User


def create_mock_integration_response() -> MagicMock:
    """Create a mock integration response object."""
    mock_integration = MagicMock()
    mock_integration.id = 1
    mock_integration.name = "Test Integration"
    mock_integration.type = IntegrationType.GITHUB
    mock_integration.auth_type = AuthType.PAT
    mock_integration.is_active = True
    mock_integration.created_at = "2023-01-01T00:00:00"
    mock_integration.updated_at = "2023-01-01T00:00:00"
    mock_integration.created_by = 1
    mock_integration.credentials = {"pat_token": "test_token"}
    mock_integration.credentials = {}
    mock_integration.mcp_config = {"github": {"type": "http", "url": "https://api.githubcopilot.com/mcp/"}}
    return mock_integration


def create_mock_validation_service(
    is_valid: bool = True, message: str = "Valid credentials", mcp_config: dict[str, Any] | None = None
) -> MagicMock:
    """Create a mock validation service."""
    if mcp_config is None:
        mcp_config = {"github": {"type": "http"}}

    mock_validation = MagicMock()
    mock_validation_result = MagicMock()
    mock_validation_result.is_valid = is_valid
    mock_validation_result.message = message
    mock_validation_result.mcp_config = mcp_config
    mock_validation.validate_integration = AsyncMock(return_value=mock_validation_result)
    return mock_validation


def create_mock_crud(mock_integration: MagicMock | None = None) -> MagicMock:
    """Create a mock CRUD service."""
    if mock_integration is None:
        mock_integration = create_mock_integration_response()

    mock_crud = MagicMock()
    mock_crud.create_integration = AsyncMock(return_value=mock_integration)
    mock_crud.get_by_id = AsyncMock(return_value=mock_integration)
    mock_crud.list_user_integrations = AsyncMock(return_value=[mock_integration])
    mock_crud.get_active_integrations = AsyncMock(return_value=[mock_integration])
    mock_crud.get_by_integration_type = AsyncMock(return_value=[mock_integration])
    mock_crud.get_integration_stats = AsyncMock(return_value={"total": 1, "active": 1})
    mock_crud.update_integration = AsyncMock(return_value=mock_integration)

    mock_crud.delete_integration = AsyncMock(return_value=True)
    return mock_crud


@pytest.mark.skip(
    reason="Tests need to be updated for service layer architecture - endpoints now use IntegrationService instead of direct CRUD"
)
class TestIntegrationEndpointsComprehensive:
    """Comprehensive tests for integration endpoints - SKIPPED due to service layer architecture changes."""

    """Comprehensive tests for integration endpoints."""

    @pytest.fixture
    def sample_user(self) -> User:
        """Sample user for testing."""
        return User(
            id=1,
            email="test@example.com",
            is_active=True,
            provider="PASS",
        )

    @pytest.fixture
    def sample_integration(self) -> Integration:
        """Sample integration for testing."""
        return Integration(
            id=1,
            name="Test Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            credentials={},
            token="test_token",
            mcp_config={"github": {"type": "http", "url": "https://api.githubcopilot.com/mcp/"}},
            created_by=1,
            is_active=True,
        )

    @pytest.fixture
    def sample_integration_create_data(self) -> dict:
        """Sample integration create data for testing."""
        return {
            "name": "Test Integration",
            "type": IntegrationType.GITHUB,
            "auth_type": AuthType.PAT,
            "token": "test_token",
            "credentials": {},
        }

    @pytest.fixture
    def sample_integration_update_data(self) -> dict:
        """Sample integration update data for testing."""
        return {
            "name": "Updated Integration",
        }

    @pytest.mark.skip(reason="Test needs to be updated for service layer architecture")
    async def test_create_integration_success(
        self, sample_user: User, sample_integration_create_data: dict[str, Any]
    ) -> None:
        """Test successful integration creation."""
        # TODO: Update test to work with service layer architecture
        pass

    @pytest.mark.skip(reason="Test needs to be updated for service layer architecture")
    async def test_create_integration_validation_failure(
        self, sample_user: User, sample_integration_create_data: dict[str, Any]
    ) -> None:
        """Test integration creation with validation failure."""
        # TODO: Update test to work with service layer architecture
        pass

    async def test_create_integration_user_id_none(self, sample_integration_create_data: dict[str, Any]) -> None:
        """Test integration creation with user ID as None."""
        # Arrange
        user_without_id = User(
            id=None,
            email="test@example.com",
            is_active=True,
            provider="PASS",
        )
        mock_session = AsyncMock()
        mock_validation = create_mock_validation_service()

        # Import the endpoint function directly
        from fastapi import HTTPException

        from app.api.v1.endpoints.integrations import create_integration
        from app.schemas.integration import IntegrationCreate

        # Create the request model
        integration_create = IntegrationCreate(**sample_integration_create_data)

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationValidationService", return_value=mock_validation):
            # Act & Assert - should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await create_integration(
                    integration_in=integration_create,
                    db_session=mock_session,
                    current_user=user_without_id,
                )

            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "User ID is required" in str(exc_info.value.detail)

    async def test_list_integrations_success(self, sample_user: User) -> None:
        """Test successful integration listing."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()

        # Import the endpoint function directly
        from app.api.v1.endpoints.integrations import list_integrations

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud):
            # Act - call the endpoint function directly
            response = await list_integrations(
                skip=0,
                limit=100,
                db_session=mock_session,
                current_user=sample_user,
            )

            # Assert
            assert response is not None
            assert len(response) == 1
            mock_crud.list_user_integrations.assert_called_once_with(skip=0, limit=100)

    async def test_list_integrations_with_pagination(self, sample_user: User) -> None:
        """Test integration listing with pagination."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()

        # Import the endpoint function directly
        from app.api.v1.endpoints.integrations import list_integrations

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud):
            # Act - call the endpoint function directly
            response = await list_integrations(
                skip=5,
                limit=10,
                db_session=mock_session,
                current_user=sample_user,
            )

            # Assert
            assert response is not None
            assert len(response) == 1
            mock_crud.list_user_integrations.assert_called_once_with(skip=5, limit=10)

    async def test_list_active_integrations_success(self, sample_user: User) -> None:
        """Test successful active integration listing."""
        # TODO: Update test to work with service layer architecture
        pass

    async def test_get_integration_success(self, sample_user: User, sample_integration: Integration) -> None:
        """Test successful integration retrieval."""
        # TODO: Update test to work with service layer architecture
        pass

    async def test_get_integration_not_found(self, sample_user: User) -> None:
        """Test integration retrieval when not found."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()
        mock_crud.get_by_id.return_value = None
        # Import the endpoint function directly
        from fastapi import HTTPException

        from app.api.v1.endpoints.integrations import get_integration

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud):
            # Act & Assert - should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await get_integration(
                    integration_id=999,
                    db_session=mock_session,
                    current_user=sample_user,
                )

            assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
            assert "Integration not found" in str(exc_info.value.detail)

    async def test_get_integration_wrong_user(self, sample_user: User) -> None:
        """Test integration retrieval with wrong user."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()
        wrong_user_integration = MagicMock()
        wrong_user_integration.created_by = 999  # Different user
        mock_crud.get_by_id.return_value = wrong_user_integration
        # Import the endpoint function directly
        from fastapi import HTTPException

        from app.api.v1.endpoints.integrations import get_integration

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud):
            # Act & Assert - should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await get_integration(
                    integration_id=1,
                    db_session=mock_session,
                    current_user=sample_user,
                )

            assert exc_info.value.status_code == status.HTTP_403_FORBIDDEN
            assert "Not authorized" in str(exc_info.value.detail)

    async def test_update_integration_success(
        self, sample_user: User, sample_integration: Integration, sample_integration_update_data: dict[str, Any]
    ) -> None:
        """Test successful integration update."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()
        mock_crud.get_by_id = AsyncMock(return_value=sample_integration)

        # Import the endpoint function directly
        from app.api.v1.endpoints.integrations import update_integration
        from app.schemas.integration import IntegrationUpdate

        # Create the request model
        integration_update = IntegrationUpdate(**sample_integration_update_data)

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud):
            # Act - call the endpoint function directly
            response = await update_integration(
                integration_id=1,
                integration_in=integration_update,
                db_session=mock_session,
                current_user=sample_user,
            )

            # Assert
            assert response is not None
            assert response.id == 1
            mock_crud.get_by_id.assert_called_once_with(1)
            mock_crud.update_integration.assert_called_once()

    async def test_update_integration_not_found(
        self, sample_user: User, sample_integration_update_data: dict[str, Any]
    ) -> None:
        """Test integration update when not found."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()
        mock_crud.get_by_id = AsyncMock(return_value=None)

        # Import the endpoint function directly
        from app.api.v1.endpoints.integrations import update_integration
        from app.schemas.integration import IntegrationUpdate

        # Create the request model
        integration_update = IntegrationUpdate(**sample_integration_update_data)

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud):
            # Act & Assert - should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await update_integration(
                    integration_id=999,
                    integration_in=integration_update,
                    db_session=mock_session,
                    current_user=sample_user,
                )

            assert exc_info.value.status_code == 404
            assert "Integration not found" in str(exc_info.value.detail)

    async def test_update_integration_wrong_user(
        self, sample_user: User, sample_integration: Integration, sample_integration_update_data: dict[str, Any]
    ) -> None:
        """Test integration update with wrong user."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()
        sample_integration.created_by = 999  # Different user
        mock_crud.get_by_id = AsyncMock(return_value=sample_integration)

        # Import the endpoint function directly
        from app.api.v1.endpoints.integrations import update_integration
        from app.schemas.integration import IntegrationUpdate

        # Create the request model
        integration_update = IntegrationUpdate(**sample_integration_update_data)

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud):
            # Act & Assert - should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await update_integration(
                    integration_id=1,
                    integration_in=integration_update,
                    db_session=mock_session,
                    current_user=sample_user,
                )

            assert exc_info.value.status_code == 403
            assert "Not authorized" in str(exc_info.value.detail)

    async def test_update_integration_with_credentials_validation_success(
        self, sample_user: User, sample_integration: Integration
    ) -> None:
        """Test integration update with credentials validation success."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()
        mock_crud.get_by_id = AsyncMock(return_value=sample_integration)
        mock_validation = create_mock_validation_service()

        # Import the endpoint function directly
        from app.api.v1.endpoints.integrations import update_integration
        from app.schemas.integration import IntegrationUpdate

        # Create the request model with credentials
        integration_update = IntegrationUpdate(
            name="Updated Name", auth_type=None, credentials={"pat_token": "new_token"}, is_active=None, mcp_config=None
        )

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud), patch(
            "app.api.v1.endpoints.integrations.IntegrationValidationService", return_value=mock_validation
        ):
            # Act - call the endpoint function directly
            response = await update_integration(
                integration_id=1,
                integration_in=integration_update,
                db_session=mock_session,
                current_user=sample_user,
            )

            # Assert
            assert response is not None
            mock_validation.validate_integration.assert_called_once()
            mock_crud.update_integration.assert_called_once()

    async def test_update_integration_with_credentials_validation_failure(
        self, sample_user: User, sample_integration: Integration
    ) -> None:
        """Test integration update with credentials validation failure."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()
        mock_crud.get_by_id = AsyncMock(return_value=sample_integration)
        mock_validation = create_mock_validation_service(is_valid=False, message="Invalid credentials")

        # Import the endpoint function directly
        from app.api.v1.endpoints.integrations import update_integration
        from app.schemas.integration import IntegrationUpdate

        # Create the request model with credentials
        integration_update = IntegrationUpdate(
            name="Updated Name",
            auth_type=None,
            credentials={"pat_token": "invalid_token"},
            is_active=None,
            mcp_config=None,
        )

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud), patch(
            "app.api.v1.endpoints.integrations.IntegrationValidationService", return_value=mock_validation
        ):
            # Act & Assert - should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await update_integration(
                    integration_id=1,
                    integration_in=integration_update,
                    db_session=mock_session,
                    current_user=sample_user,
                )

            assert exc_info.value.status_code == 400
            assert "Invalid credentials" in str(exc_info.value.detail)

    async def test_update_integration_is_active_only(self, sample_user: User, sample_integration: Integration) -> None:
        """Test integration update with only is_active field."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()
        mock_crud.get_by_id = AsyncMock(return_value=sample_integration)

        # Import the endpoint function directly
        from app.api.v1.endpoints.integrations import update_integration
        from app.schemas.integration import IntegrationUpdate

        # Create the request model with only is_active
        integration_update = IntegrationUpdate(
            name=None, auth_type=None, credentials=None, is_active=False, mcp_config=None
        )

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud):
            # Act - call the endpoint function directly
            response = await update_integration(
                integration_id=1,
                integration_in=integration_update,
                db_session=mock_session,
                current_user=sample_user,
            )

            # Assert
            assert response is not None
            mock_crud.get_by_id.assert_called_once_with(1)
            mock_crud.update_integration.assert_called_once()

    async def test_delete_integration_success(self, sample_user: User) -> None:
        """Test successful integration deletion."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()
        mock_crud.delete_integration = AsyncMock(return_value=True)

        # Import the endpoint function directly
        from app.api.v1.endpoints.integrations import delete_integration

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud):
            # Act - call the endpoint function directly
            response = await delete_integration(  # type: ignore[func-returns-value]
                integration_id=1,
                db_session=mock_session,
                current_user=sample_user,
            )

            # Assert
            assert response is None  # 204 No Content
            mock_crud.delete_integration.assert_called_once_with(integration_id=1, user_id=1)

    async def test_delete_integration_not_found(self, sample_user: User) -> None:
        """Test integration deletion when not found."""
        # Arrange
        mock_session = AsyncMock()
        mock_crud = create_mock_crud()
        mock_crud.delete_integration = AsyncMock(return_value=False)

        # Import the endpoint function directly
        from app.api.v1.endpoints.integrations import delete_integration

        # Mock the services
        with patch("app.api.v1.endpoints.integrations.IntegrationCRUD", return_value=mock_crud):
            # Act & Assert - should raise HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await delete_integration(
                    integration_id=999,
                    db_session=mock_session,
                    current_user=sample_user,
                )

            assert exc_info.value.status_code == 404
            assert "Integration not found" in str(exc_info.value.detail)
