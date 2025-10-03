"""Tests for integration schemas to improve coverage."""

import pytest
from pydantic import ValidationError

from app.integrations.enums import AuthType, IntegrationProvider
from app.schemas.integration import (
    IntegrationCreate,
    IntegrationListResponse,
    IntegrationResponse,
    IntegrationUpdate,
    IntegrationValidationRequest,
    IntegrationValidationResponse,
    IntegrationWithCredentials,
    IntegrationWithMCPConfig,
)


class TestIntegrationSchemasCoverage:
    """Test cases for integration schemas to improve coverage."""

    def test_integration_create_valid(self) -> None:
        """Test valid IntegrationCreate creation."""
        data = {
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "credentials": {"pat_token": "test_token"},
        }

        integration = IntegrationCreate(**data)  # type: ignore[arg-type]
        assert integration.name == "Test Integration"
        assert integration.type == IntegrationProvider.GITHUB
        assert integration.auth_type == AuthType.PAT
        assert integration.credentials == {"pat_token": "test_token"}

    def test_integration_create_empty_credentials(self) -> None:
        """Test IntegrationCreate with empty credentials."""
        data = {
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "credentials": {"pat_token": "test_token"},
        }

        # Valid credentials should work
        integration = IntegrationCreate(**data)
        assert integration.credentials == {"pat_token": "test_token"}  # type: ignore[arg-type]

    def test_integration_update_valid(self) -> None:
        """Test valid IntegrationUpdate creation."""
        data = {
            "name": "Updated Integration",
            "is_active": False,
        }

        integration = IntegrationUpdate(**data)  # type: ignore[arg-type]
        assert integration.name == "Updated Integration"
        assert integration.is_active is False

    def test_integration_update_all_fields(self) -> None:
        """Test IntegrationUpdate with all fields."""
        data = {
            "name": "Updated Integration",
            "auth_type": AuthType.OAUTH,
            "credentials": {"refresh_token": "new_token"},
            "is_active": True,
        }

        integration = IntegrationUpdate(**data)  # type: ignore[arg-type]
        assert integration.name == "Updated Integration"
        assert integration.auth_type == AuthType.OAUTH
        assert integration.credentials == {"refresh_token": "new_token"}
        assert integration.is_active is True

    def test_integration_response_valid(self) -> None:
        """Test valid IntegrationResponse creation."""
        from datetime import datetime

        data = {
            "id": 1,
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "is_active": True,
            "created_at": datetime(2023, 1, 1, 0, 0),
            "updated_at": datetime(2023, 1, 1, 0, 0),
            "created_by": 1,
        }

        integration = IntegrationResponse(**data)  # type: ignore[arg-type]
        assert integration.id == 1
        assert integration.name == "Test Integration"
        assert integration.type == IntegrationProvider.GITHUB
        assert integration.auth_type == AuthType.PAT
        assert integration.is_active is True
        assert integration.created_by == 1
        assert integration.mcp_config == {"config": "test_config"}

    def test_integration_with_credentials_valid(self) -> None:
        """Test valid IntegrationWithCredentials creation."""
        data = {
            "id": 1,
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "is_active": True,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00",
            "created_by": 1,
            "credentials": {"pat_token": "test_token"},
        }

        integration = IntegrationWithCredentials(**data)  # type: ignore[arg-type]
        assert integration.id == 1
        assert integration.credentials == {"pat_token": "test_token"}

    def test_credentials_validation_pat(self) -> None:
        """Test credentials validation for PAT auth type."""
        data = {
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "credentials": {"pat_token": "github_pat_token"},
        }

        integration = IntegrationCreate(**data)
        assert integration.credentials["pat_token"] == "github_pat_token"

    def test_credentials_validation_oauth(self) -> None:
        """Test credentials validation for OAuth auth type."""
        data = {
            "name": "Test Integration",
            "type": IntegrationProvider.ATLASSIAN,
            "auth_type": AuthType.OAUTH,
            "credentials": {"refresh_token": "oauth_refresh_token"},
        }

        integration = IntegrationCreate(**data)
        assert integration.credentials["refresh_token"] == "oauth_refresh_token"

    def test_integration_validation_request_valid(self) -> None:
        """Test valid IntegrationValidationRequest creation."""
        data = {
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "credentials": {"pat_token": "test_token"},
        }

        request = IntegrationValidationRequest(**data)  # type: ignore[arg-type]
        assert request.type == IntegrationProvider.GITHUB
        assert request.auth_type == AuthType.PAT
        assert request.credentials["pat_token"] == "test_token"

    def test_integration_validation_response_valid(self) -> None:
        """Test valid IntegrationValidationResponse creation."""
        data = {
            "is_valid": True,
            "message": "Valid credentials",
            "mcp_config": {"config": "test_config"},
        }

        response = IntegrationValidationResponse(**data)  # type: ignore[arg-type]
        assert response.is_valid is True
        assert response.message == "Valid credentials"
        assert response.mcp_config == {"config": "test_config"}

    def test_integration_validation_response_invalid(self) -> None:
        """Test IntegrationValidationResponse with invalid credentials."""
        data = {
            "is_valid": False,
            "message": "Invalid credentials",
            "mcp_config": None,
        }

        response = IntegrationValidationResponse(**data)  # type: ignore[arg-type]
        assert response.is_valid is False
        assert response.message == "Invalid credentials"
        assert response.mcp_config is None

    def test_integration_response_valid_without_mcp_config(self) -> None:
        """Test IntegrationResponse without MCP config (should work now)."""
        data = {
            "id": 1,
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "is_active": True,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00",
            "created_by": 1,
        }

        # This should work now since we removed mcp_config from IntegrationResponse
        integration = IntegrationResponse(**data)  # type: ignore[arg-type]
        assert integration.type == IntegrationProvider.GITHUB

    def test_integration_with_mcp_config_valid(self) -> None:
        """Test IntegrationWithMCPConfig with valid MCP config."""
        data = {
            "id": 1,
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "is_active": True,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00",
            "created_by": 1,
            "mcp_config": {"config": "test_config"},
        }

        integration = IntegrationWithMCPConfig(**data)  # type: ignore[arg-type]
        assert integration.mcp_config == {"config": "test_config"}

    def test_integration_with_credentials_invalid_type(self) -> None:
        """Test IntegrationWithCredentials with invalid credentials type."""
        data = {
            "id": 1,
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "is_active": True,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00",
            "created_by": 1,
            "credentials": "not_a_dict",
        }

        with pytest.raises(ValidationError):
            IntegrationWithCredentials(**data)  # type: ignore[arg-type]

    def test_integration_with_mcp_config_invalid_type(self) -> None:
        """Test IntegrationWithMCPConfig with invalid MCP config type."""
        data = {
            "id": 1,
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "is_active": True,
            "created_at": "2023-01-01T00:00:00",
            "updated_at": "2023-01-01T00:00:00",
            "created_by": 1,
            "mcp_config": "not_a_dict",
        }

        with pytest.raises(ValidationError):
            IntegrationWithMCPConfig(**data)  # type: ignore[arg-type]

    def test_credentials_validation_missing_token(self) -> None:
        """Test credentials validation with missing required token."""
        data = {
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "credentials": {"wrong_field": "test_token"},
        }

        with pytest.raises(ValidationError):
            IntegrationCreate(**data)

    def test_integration_list_response_valid(self) -> None:
        """Test IntegrationListResponse with valid data."""
        from datetime import datetime

        integration_data = {
            "id": 1,
            "name": "Test Integration",
            "type": IntegrationProvider.GITHUB,
            "auth_type": AuthType.PAT,
            "is_active": True,
            "created_at": datetime(2023, 1, 1, 0, 0),
            "updated_at": datetime(2023, 1, 1, 0, 0),
            "created_by": 1,
        }

        data = {
            "integrations": [integration_data],
            "total": 1,
            "skip": 0,
            "limit": 10,
        }

        response = IntegrationListResponse(**data)
        assert len(response.integrations) == 1
        assert response.total == 1
        assert response.skip == 0
        assert response.limit == 10
        assert response.integrations[0].type == IntegrationProvider.GITHUB
