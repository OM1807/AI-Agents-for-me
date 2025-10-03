"""Additional tests to improve coverage."""

from typing import Any
from unittest.mock import patch

import pytest

from app.models.integration import AuthType, Integration, IntegrationType
from app.models.user import User
from app.services.integration_validator import (
    AtlassianValidator,
    GithubValidator,
    IntegrationValidationService,
    NotionValidator,
)
from app.services.mcp_token_service import MCPTokenService


class TestCoverageImprovement:
    """Additional tests to improve coverage."""

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
            credentials='{"pat_token": "test_token"}',
            created_by=1,
            is_active=True,
            mcp_config='{"github": {"type": "http", "url": "https://api.githubcopilot.com/mcp/"}}',
        )

    def test_integration_validation_service_auth_type_compatibility(self) -> None:
        """Test auth type compatibility checks."""
        service = IntegrationValidationService()

        # Test GitHub with PAT
        assert service._is_auth_type_compatible(IntegrationType.GITHUB, AuthType.PAT) is True
        assert service._is_auth_type_compatible(IntegrationType.GITHUB, AuthType.OAUTH) is False

        # Test Atlassian with OAuth
        assert service._is_auth_type_compatible(IntegrationType.ATLASSIAN, AuthType.OAUTH) is True
        assert service._is_auth_type_compatible(IntegrationType.ATLASSIAN, AuthType.PAT) is False

        # Test Notion with OAuth
        assert service._is_auth_type_compatible(IntegrationType.NOTION, AuthType.OAUTH) is True
        assert service._is_auth_type_compatible(IntegrationType.NOTION, AuthType.PAT) is False

    def test_integration_validation_service_generate_mcp_config(self) -> None:
        """Test MCP config generation using individual validators."""
        # Test GitHub validator
        github_validator = GithubValidator()
        result = github_validator.generate_mcp_config({"pat_token": "test"})
        assert "github" in result

        # Test Atlassian validator
        atlassian_validator = AtlassianValidator()
        result = atlassian_validator.generate_mcp_config({"refresh_token": "test"})
        assert "Atlassian" in result

        # Test Notion validator
        notion_validator = NotionValidator()
        result = notion_validator.generate_mcp_config({"refresh_token": "test"})
        assert "notion" in result

    def test_mcp_token_service_template_validation(self) -> None:
        """Test MCP token service template validation."""
        service = MCPTokenService()

        # Test valid template
        valid_config = {"test": {"headers": {"Authorization": "Bearer {{ access_token }}"}}}
        assert service.validate_template_syntax(valid_config) is True

        # Test invalid template
        invalid_config = {"test": {"headers": {"Authorization": "Bearer {{ access_token }"}}}
        assert service.validate_template_syntax(invalid_config) is False

        # Test complex template
        complex_config = {
            "test": {"headers": {"Authorization": "Bearer {{ access_token }}", "X-Custom": "{{ custom_value }}"}}
        }
        assert service.validate_template_syntax(complex_config) is True

    def test_mcp_token_service_extract_integration_type(self) -> None:
        """Test integration type extraction from MCP config."""
        service = MCPTokenService()

        # Test various integration types
        assert service.extract_integration_type_from_mcp_config({"github": {}}) == "Github"
        assert service.extract_integration_type_from_mcp_config({"notion": {}}) == "Notion"
        assert service.extract_integration_type_from_mcp_config({"Atlassian": {}}) == "Atlassian"
        assert service.extract_integration_type_from_mcp_config({"unknown": {}}) is None

    def test_mcp_token_service_render_config(self) -> None:
        """Test MCP config rendering."""
        service = MCPTokenService()

        # Test simple rendering
        config = {"test": {"headers": {"Authorization": "Bearer {{ access_token }}"}}}
        result = service.render_mcp_config_with_access_token(config, "test_token")
        assert result["test"]["headers"]["Authorization"] == "Bearer test_token"

        # Test nested rendering
        nested_config = {
            "test": {"headers": {"Authorization": "Bearer {{ access_token }}"}, "body": {"token": "{{ access_token }}"}}
        }
        result = service.render_mcp_config_with_access_token(nested_config, "test_token")
        assert result["test"]["headers"]["Authorization"] == "Bearer test_token"
        assert result["test"]["body"]["token"] == "test_token"

    @patch("app.services.mcp_token_service.MCPTokenService.get_access_token_for_integration")
    async def test_mcp_token_service_get_rendered_config_no_credentials(self, mock_get_token: Any) -> None:
        """Test getting rendered MCP config with no credentials."""
        service = MCPTokenService()
        mcp_config = {"test": {"headers": {"Authorization": "Bearer {{ access_token }}"}}}
        credentials: dict[str, Any] = {}

        result = await service.get_rendered_mcp_config(
            integration_type="test",
            mcp_config=mcp_config,
            credentials=credentials,
            client_id="test",
            client_secret="test",
        )

        assert result == mcp_config

    @patch("app.services.mcp_token_service.MCPTokenService.get_access_token_for_integration")
    async def test_mcp_token_service_get_rendered_config_token_failure(self, mock_get_token: Any) -> None:
        """Test getting rendered MCP config when token fetch fails."""
        service = MCPTokenService()
        mock_get_token.return_value = None
        mcp_config = {"test": {"headers": {"Authorization": "Bearer {{ access_token }}"}}}
        credentials: dict[str, Any] = {"refresh_token": "test"}

        result = await service.get_rendered_mcp_config(
            integration_type="test",
            mcp_config=mcp_config,
            credentials=credentials,
            client_id="test",
            client_secret="test",
        )

        assert result == mcp_config

    def test_integration_model_str_representation(self) -> None:
        """Test integration model string representation."""
        integration = Integration(
            id=1,
            name="Test Integration",
            type=IntegrationType.GITHUB,
            auth_type=AuthType.PAT,
            credentials='{"pat_token": "test"}',
            created_by=1,
            is_active=True,
            mcp_config='{"github": {}}',
        )

        str_repr = str(integration)
        assert "Test Integration" in str_repr
        assert "GITHUB" in str_repr

    def test_user_model_str_representation(self) -> None:
        """Test user model string representation."""
        user = User(
            id=1,
            email="test@example.com",
            is_active=True,
            provider="PASS",
        )

        str_repr = str(user)
        assert "test@example.com" in str_repr
