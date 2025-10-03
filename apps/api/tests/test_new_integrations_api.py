"""Simple tests for the new integration API with service layer."""

from unittest.mock import AsyncMock, MagicMock

import pytest

from app.models.integration import AuthType, Integration, IntegrationType
from app.models.user import User
from app.schemas.integration import IntegrationCreate, IntegrationResponse
from app.services.integration_service import IntegrationService


class TestNewIntegrationAPI:
    """Test the new integration API with service layer."""

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

    async def test_create_integration_schema_validation(self, sample_integration_create_data: dict):
        """Test that IntegrationCreate schema works with new structure."""
        integration_create = IntegrationCreate(**sample_integration_create_data)
        assert integration_create.name == "Test Integration"
        assert integration_create.type == IntegrationType.GITHUB
        assert integration_create.auth_type == AuthType.PAT
        assert integration_create.credentials["pat_token"] == "test_token"
        assert integration_create.credentials == {}

    async def test_integration_service_create_success(self, sample_user: User, sample_integration: Integration):
        """Test integration service create method."""
        # Mock the CRUD and GitHub provider
        mock_crud = MagicMock()
        mock_crud.create_integration = AsyncMock(return_value=sample_integration)

        # Create service with mocked dependencies
        mock_session = AsyncMock()
        service = IntegrationService(mock_session)
        service.crud = mock_crud

        # Mock the GitHub provider validation
        mock_github_provider = MagicMock()
        mock_github_provider.validate_credentials = AsyncMock(return_value={"is_valid": True})
        service.github_provider = mock_github_provider

        # Test data
        integration_data = IntegrationCreate(
            name="Test Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            token="test_token",
            credentials={},
        )

        # Call service method
        result = await service.create_integration(integration_data=integration_data, user_id=sample_user.id)

        # Assertions
        assert result == sample_integration
        mock_github_provider.validate_credentials.assert_called_once_with("test_token")
        mock_crud.create_integration.assert_called_once()

    async def test_integration_service_create_validation_failure(self, sample_user: User):
        """Test integration service create method with validation failure."""
        # Create service with mocked dependencies
        mock_session = AsyncMock()
        service = IntegrationService(mock_session)

        # Mock the GitHub provider validation to return failure
        mock_github_provider = MagicMock()
        mock_github_provider.validate_credentials = AsyncMock(
            return_value={"is_valid": False, "error": "Invalid token"}
        )
        service.github_provider = mock_github_provider

        # Test data
        integration_data = IntegrationCreate(
            name="Test Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            token="invalid_token",
            credentials={},
        )

        # Call service method and expect ValueError
        with pytest.raises(ValueError, match="Invalid token"):
            await service.create_integration(integration_data=integration_data, user_id=sample_user.id)

    async def test_integration_response_schema(self, sample_integration: Integration):
        """Test IntegrationResponse schema works with new structure."""
        response = IntegrationResponse.model_validate(sample_integration)
        assert response.id == 1
        assert response.name == "Test Integration"
        assert response.type == IntegrationType.GITHUB
        assert response.auth_type == AuthType.PAT
        assert response.is_active is True
        assert response.created_by == 1
        assert response.mcp_config == {"github": {"type": "http", "url": "https://api.githubcopilot.com/mcp/"}}
        # Token should not be in response (sensitive data)
        assert not hasattr(response, "token")
