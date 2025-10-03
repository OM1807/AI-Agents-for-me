"""Tests for integration API endpoints."""

from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from fastapi import HTTPException, status

from app.models.integration import AuthType, Integration, IntegrationType
from app.models.user import User
from app.schemas.integration import IntegrationCreate, IntegrationResponse, IntegrationUpdate
from app.services.integration_service import IntegrationService


class TestIntegrationAPIEndpoints:
    """Test the integration API endpoints."""

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
    def mock_integration_service(self) -> MagicMock:
        """Mock integration service."""
        return MagicMock(spec=IntegrationService)

    @pytest.fixture
    def mock_current_user(self) -> MagicMock:
        """Mock current user dependency."""
        return MagicMock(return_value=User(id=1, email="test@example.com", is_active=True, provider="PASS"))

    async def test_create_integration_success(
        self, sample_user: User, sample_integration: Integration, mock_integration_service: MagicMock
    ):
        """Test successful integration creation via API."""
        # Mock the service
        mock_integration_service.create_integration = AsyncMock(return_value=sample_integration)

        # Test data
        integration_data = {
            "name": "Test Integration",
            "type": IntegrationType.GITHUB,
            "auth_type": AuthType.PAT,
            "token": "test_token",
            "credentials": {},
        }

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import create_integration

            # Call the endpoint
            result = await create_integration(
                integration_in=IntegrationCreate(**integration_data),
                integration_service=mock_integration_service,
                current_user=sample_user,
            )

            # Assertions
            assert isinstance(result, IntegrationResponse)
            assert result.id == 1
            assert result.name == "Test Integration"
            assert result.type == IntegrationType.GITHUB
            mock_integration_service.create_integration.assert_called_once()

    async def test_create_integration_validation_failure(self, sample_user: User, mock_integration_service: MagicMock):
        """Test integration creation with validation failure."""
        # Mock the service to raise ValueError
        mock_integration_service.create_integration = AsyncMock(side_effect=ValueError("Invalid token"))

        # Test data
        integration_data = {
            "name": "Test Integration",
            "type": IntegrationType.GITHUB,
            "auth_type": AuthType.PAT,
            "token": "invalid_token",
            "credentials": {},
        }

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import create_integration

            # Call the endpoint and expect HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await create_integration(
                    integration_in=IntegrationCreate(**integration_data),
                    integration_service=mock_integration_service,
                    current_user=sample_user,
                )

            # Assertions
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "Invalid token" in str(exc_info.value.detail)

    async def test_create_integration_user_id_required(self, mock_integration_service: MagicMock):
        """Test integration creation with missing user ID."""
        # Create user without ID
        user_without_id = User(
            id=None,
            email="test@example.com",
            is_active=True,
            provider="PASS",
        )

        # Test data
        integration_data = {
            "name": "Test Integration",
            "type": IntegrationType.GITHUB,
            "auth_type": AuthType.PAT,
            "token": "test_token",
            "credentials": {},
        }

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=user_without_id):
            from app.api.v1.endpoints.integrations import create_integration

            # Call the endpoint and expect HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await create_integration(
                    integration_in=IntegrationCreate(**integration_data),
                    integration_service=mock_integration_service,
                    current_user=user_without_id,
                )

            # Assertions
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "User ID is required" in str(exc_info.value.detail)

    async def test_list_integrations_success(
        self, sample_user: User, sample_integration: Integration, mock_integration_service: MagicMock
    ):
        """Test successful integration listing via API."""
        # Mock the service
        mock_integration_service.get_user_integrations = AsyncMock(return_value=[sample_integration])

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import list_integrations

            # Call the endpoint
            result = await list_integrations(
                skip=0,
                limit=10,
                active_only=False,
                integration_service=mock_integration_service,
                current_user=sample_user,
            )

            # Assertions
            assert isinstance(result, list)
            assert len(result) == 1
            assert isinstance(result[0], IntegrationResponse)
            assert result[0].id == 1
            mock_integration_service.get_user_integrations.assert_called_once_with(
                user_id=sample_user.id, skip=0, limit=10, active_only=False
            )

    async def test_list_integrations_with_pagination(self, sample_user: User, mock_integration_service: MagicMock):
        """Test integration listing with pagination parameters."""
        # Mock the service
        mock_integration_service.get_user_integrations = AsyncMock(return_value=[])

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import list_integrations

            # Call the endpoint with pagination
            result = await list_integrations(
                skip=10,
                limit=50,
                active_only=True,
                integration_service=mock_integration_service,
                current_user=sample_user,
            )

            # Assertions
            assert isinstance(result, list)
            mock_integration_service.get_user_integrations.assert_called_once_with(
                user_id=sample_user.id, skip=10, limit=50, active_only=True
            )

    async def test_get_integration_by_id_success(
        self, sample_user: User, sample_integration: Integration, mock_integration_service: MagicMock
    ):
        """Test successful integration retrieval by ID via API."""
        # Mock the service
        mock_integration_service.get_integration = AsyncMock(return_value=sample_integration)

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import get_integration

            # Call the endpoint
            result = await get_integration(
                integration_id=1, integration_service=mock_integration_service, current_user=sample_user
            )

            # Assertions
            assert isinstance(result, IntegrationResponse)
            assert result.id == 1
            assert result.name == "Test Integration"
            mock_integration_service.get_integration.assert_called_once_with(integration_id=1, user_id=sample_user.id)

    async def test_get_integration_by_id_not_found(self, sample_user: User, mock_integration_service: MagicMock):
        """Test integration retrieval by ID when not found."""
        # Mock the service to return None
        mock_integration_service.get_integration = AsyncMock(return_value=None)

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import get_integration

            # Call the endpoint and expect HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await get_integration(
                    integration_id=999, integration_service=mock_integration_service, current_user=sample_user
                )

            # Assertions
            assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
            assert "Integration not found" in str(exc_info.value.detail)

    async def test_get_integrations_by_type_success(
        self, sample_user: User, sample_integration: Integration, mock_integration_service: MagicMock
    ):
        """Test successful integration retrieval by type via API."""
        # Mock the service
        mock_integration_service.get_integrations_by_type = AsyncMock(return_value=[sample_integration])

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import get_integrations_by_type

            # Call the endpoint
            result = await get_integrations_by_type(
                integration_type=IntegrationType.GITHUB,
                integration_service=mock_integration_service,
                current_user=sample_user,
            )

            # Assertions
            assert isinstance(result, list)
            assert len(result) == 1
            assert isinstance(result[0], IntegrationResponse)
            assert result[0].type == IntegrationType.GITHUB
            mock_integration_service.get_integrations_by_type.assert_called_once_with(
                integration_type=IntegrationType.GITHUB, user_id=sample_user.id
            )

    async def test_update_integration_success(
        self, sample_user: User, sample_integration: Integration, mock_integration_service: MagicMock
    ):
        """Test successful integration update via API."""
        # Create updated integration
        updated_integration = Integration(
            id=1,
            name="Updated Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            credentials={},
            token="updated_token",
            mcp_config={},
            created_by=sample_user.id,
            is_active=True,
        )

        # Mock the service
        mock_integration_service.update_integration = AsyncMock(return_value=updated_integration)

        # Test data
        update_data = {
            "name": "Updated Integration",
            "token": "updated_token",
        }

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import update_integration

            # Call the endpoint
            result = await update_integration(
                integration_id=1,
                integration_in=IntegrationUpdate(**update_data),
                integration_service=mock_integration_service,
                current_user=sample_user,
            )

            # Assertions
            assert isinstance(result, IntegrationResponse)
            assert result.id == 1
            assert result.name == "Updated Integration"
            mock_integration_service.update_integration.assert_called_once()

    async def test_update_integration_not_found(self, sample_user: User, mock_integration_service: MagicMock):
        """Test integration update when not found."""
        # Mock the service to return None
        mock_integration_service.update_integration = AsyncMock(return_value=None)

        # Test data
        update_data = {
            "name": "Updated Integration",
        }

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import update_integration

            # Call the endpoint and expect HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await update_integration(
                    integration_id=999,
                    integration_in=IntegrationUpdate(**update_data),
                    integration_service=mock_integration_service,
                    current_user=sample_user,
                )

            # Assertions
            assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
            assert "Integration not found" in str(exc_info.value.detail)

    async def test_update_integration_validation_failure(self, sample_user: User, mock_integration_service: MagicMock):
        """Test integration update with validation failure."""
        # Mock the service to raise ValueError
        mock_integration_service.update_integration = AsyncMock(side_effect=ValueError("Invalid token"))

        # Test data
        update_data = {
            "token": "invalid_token",
        }

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import update_integration

            # Call the endpoint and expect HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await update_integration(
                    integration_id=1,
                    integration_in=IntegrationUpdate(**update_data),
                    integration_service=mock_integration_service,
                    current_user=sample_user,
                )

            # Assertions
            assert exc_info.value.status_code == status.HTTP_400_BAD_REQUEST
            assert "Invalid token" in str(exc_info.value.detail)

    async def test_delete_integration_success(self, sample_user: User, mock_integration_service: MagicMock):
        """Test successful integration deletion via API."""
        # Mock the service
        mock_integration_service.delete_integration = AsyncMock(return_value=True)

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import delete_integration

            # Call the endpoint
            result = await delete_integration(
                integration_id=1, integration_service=mock_integration_service, current_user=sample_user
            )

            # Assertions
            assert result is None  # 204 No Content
            mock_integration_service.delete_integration.assert_called_once_with(
                integration_id=1, user_id=sample_user.id
            )

    async def test_delete_integration_not_found(self, sample_user: User, mock_integration_service: MagicMock):
        """Test integration deletion when not found."""
        # Mock the service to return False
        mock_integration_service.delete_integration = AsyncMock(return_value=False)

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import delete_integration

            # Call the endpoint and expect HTTPException
            with pytest.raises(HTTPException) as exc_info:
                await delete_integration(
                    integration_id=999, integration_service=mock_integration_service, current_user=sample_user
                )

            # Assertions
            assert exc_info.value.status_code == status.HTTP_404_NOT_FOUND
            assert "Integration not found or not authorized" in str(exc_info.value.detail)

    async def test_validate_integration_credentials_success(self, mock_integration_service: MagicMock):
        """Test successful credential validation via API."""
        # Mock the service
        mock_validation_result = {
            "is_valid": True,
            "user_info": {"login": "testuser"},
            "capabilities": ["repository_access", "issue_management"],
        }
        mock_integration_service.validate_integration_credentials = AsyncMock(return_value=mock_validation_result)

        # Mock dependencies
        with patch("app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service):
            from app.api.v1.endpoints.integrations import validate_integration_credentials

            # Call the endpoint
            result = await validate_integration_credentials(
                integration_type=IntegrationType.GITHUB,
                auth_type=AuthType.PAT,
                token="test_token",
                integration_service=mock_integration_service,
            )

            # Assertions
            assert result == mock_validation_result
            mock_integration_service.validate_integration_credentials.assert_called_once_with(
                integration_type=IntegrationType.GITHUB, auth_type=AuthType.PAT, token="test_token"
            )

    async def test_validate_integration_credentials_failure(self, mock_integration_service: MagicMock):
        """Test credential validation failure via API."""
        # Mock the service
        mock_validation_result = {
            "is_valid": False,
            "error": "Invalid token",
        }
        mock_integration_service.validate_integration_credentials = AsyncMock(return_value=mock_validation_result)

        # Mock dependencies
        with patch("app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service):
            from app.api.v1.endpoints.integrations import validate_integration_credentials

            # Call the endpoint
            result = await validate_integration_credentials(
                integration_type=IntegrationType.GITHUB,
                auth_type=AuthType.PAT,
                token="invalid_token",
                integration_service=mock_integration_service,
            )

            # Assertions
            assert result == mock_validation_result
            assert result["is_valid"] is False
            assert "Invalid token" in result["error"]

    async def test_api_endpoint_error_handling(self, sample_user: User, mock_integration_service: MagicMock):
        """Test API endpoint error handling for unexpected exceptions."""
        # Mock the service to raise an unexpected exception
        mock_integration_service.get_integration = AsyncMock(side_effect=Exception("Database error"))

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import get_integration

            # Call the endpoint and expect the exception to be raised
            with pytest.raises(Exception, match="Database error"):
                await get_integration(
                    integration_id=1, integration_service=mock_integration_service, current_user=sample_user
                )

    async def test_api_endpoint_parameter_validation(self, sample_user: User, mock_integration_service: MagicMock):
        """Test API endpoint parameter validation."""
        # Mock the service
        mock_integration_service.get_user_integrations = AsyncMock(return_value=[])

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import list_integrations

            # Test with various parameter combinations
            await list_integrations(
                skip=0,
                limit=10,
                active_only=False,
                integration_service=mock_integration_service,
                current_user=sample_user,
            )

            await list_integrations(
                skip=10,
                limit=50,
                active_only=True,
                integration_service=mock_integration_service,
                current_user=sample_user,
            )

            # Verify service was called with correct parameters
            assert mock_integration_service.get_user_integrations.call_count == 2

    async def test_api_endpoint_response_format(
        self, sample_user: User, sample_integration: Integration, mock_integration_service: MagicMock
    ):
        """Test API endpoint response format consistency."""
        # Mock the service
        mock_integration_service.get_integration = AsyncMock(return_value=sample_integration)

        # Mock dependencies
        with patch(
            "app.api.v1.endpoints.integrations.get_integration_service", return_value=mock_integration_service
        ), patch("app.api.v1.endpoints.integrations.get_current_user", return_value=sample_user):
            from app.api.v1.endpoints.integrations import get_integration

            # Call the endpoint
            result = await get_integration(
                integration_id=1, integration_service=mock_integration_service, current_user=sample_user
            )

            # Verify response format
            assert hasattr(result, "id")
            assert hasattr(result, "name")
            assert hasattr(result, "type")
            assert hasattr(result, "auth_type")
            assert hasattr(result, "is_active")
            assert hasattr(result, "created_by")
            assert hasattr(result, "mcp_config")

            # Verify sensitive data is not exposed
            assert not hasattr(result, "token")
            assert not hasattr(result, "credentials")
