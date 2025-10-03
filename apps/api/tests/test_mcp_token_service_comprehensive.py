"""Comprehensive tests for MCP token service."""

from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from jinja2 import TemplateError

from app.services.mcp_token_service import MCPTokenService


class TestMCPTokenServiceComprehensive:
    """Comprehensive tests for MCP token service."""

    @pytest.fixture
    def mcp_token_service(self) -> MCPTokenService:
        """MCP token service instance for testing."""
        return MCPTokenService()

    @pytest.fixture
    def sample_mcp_config(self) -> dict[str, dict]:
        """Sample MCP config for testing."""
        return {
            "Atlassian": {
                "type": "sse",
                "url": "https://mcp.atlassian.com/v1/sse",
                "headers": {"Authorization": "Bearer {{ access_token }}"},
            }
        }

    @pytest.fixture
    def complex_mcp_config(self) -> dict[str, dict]:
        """Complex MCP config with multiple templates."""
        return {
            "Atlassian": {
                "type": "sse",
                "url": "https://mcp.atlassian.com/v1/sse",
                "headers": {
                    "Authorization": "Bearer {{ access_token }}",
                    "X-Custom": "{{ access_token }}",
                    "Content-Type": "application/json",
                },
                "body": {"token": "{{ access_token }}"},
            }
        }

    @pytest.fixture
    def invalid_mcp_config(self) -> dict[str, dict]:
        """Invalid MCP config with template syntax errors."""
        return {
            "Atlassian": {
                "type": "sse",
                "url": "https://mcp.atlassian.com/v1/sse",
                "headers": {"Authorization": "Bearer {{ access_token }"},  # Missing closing brace
            }
        }

    def test_init(self, mcp_token_service: MCPTokenService) -> None:
        """Test MCP token service initialization."""
        assert mcp_token_service.oauth_service is not None
        assert mcp_token_service.jinja_env is not None

    @patch("app.services.mcp_token_service.OAuthTokenService")
    async def test_get_access_token_for_integration_atlassian_success(self, mock_oauth_service: MagicMock) -> None:
        """Test successful Atlassian access token retrieval."""
        # Arrange
        mock_oauth = AsyncMock()
        mock_oauth.get_valid_atlassian_token.return_value = "atlassian_token_123"
        mock_oauth_service.return_value = mock_oauth
        service = MCPTokenService()
        service.oauth_service = mock_oauth

        # Act
        result = await service.get_access_token_for_integration(
            integration_type="Atlassian",
            refresh_token="refresh_token_123",
            client_id="client_id_123",
            client_secret="client_secret_123",
        )

        # Assert
        assert result == "atlassian_token_123"
        mock_oauth.get_valid_atlassian_token.assert_called_once_with(
            refresh_token="refresh_token_123",
            client_id="client_id_123",
            client_secret="client_secret_123",
        )

    @patch("app.services.mcp_token_service.OAuthTokenService")
    async def test_get_access_token_for_integration_notion_success(self, mock_oauth_service: MagicMock) -> None:
        """Test successful Notion access token retrieval."""
        # Arrange
        mock_oauth = AsyncMock()
        mock_oauth.get_valid_notion_token.return_value = "notion_token_123"
        mock_oauth_service.return_value = mock_oauth
        service = MCPTokenService()
        service.oauth_service = mock_oauth

        # Act
        result = await service.get_access_token_for_integration(
            integration_type="Notion",
            refresh_token="refresh_token_123",
            client_id="client_id_123",
            client_secret="client_secret_123",
        )

        # Assert
        assert result == "notion_token_123"
        mock_oauth.get_valid_notion_token.assert_called_once_with(
            refresh_token="refresh_token_123",
            client_id="client_id_123",
            client_secret="client_secret_123",
        )

    @patch("app.services.mcp_token_service.OAuthTokenService")
    async def test_get_access_token_for_integration_unsupported_type(self, mock_oauth_service: MagicMock) -> None:
        """Test access token retrieval for unsupported integration type."""
        # Arrange
        mock_oauth = MagicMock()
        mock_oauth_service.return_value = mock_oauth
        service = MCPTokenService()
        service.oauth_service = mock_oauth

        # Act
        result = await service.get_access_token_for_integration(
            integration_type="Unsupported",
            refresh_token="refresh_token_123",
            client_id="client_id_123",
            client_secret="client_secret_123",
        )

        # Assert
        assert result is None
        mock_oauth.get_valid_atlassian_token.assert_not_called()
        mock_oauth.get_valid_notion_token.assert_not_called()

    @patch("app.services.mcp_token_service.OAuthTokenService")
    async def test_get_access_token_for_integration_case_insensitive(self, mock_oauth_service: MagicMock) -> None:
        """Test access token retrieval with case insensitive integration type."""
        # Arrange
        mock_oauth = AsyncMock()
        mock_oauth.get_valid_atlassian_token.return_value = "atlassian_token_123"
        mock_oauth_service.return_value = mock_oauth
        service = MCPTokenService()
        service.oauth_service = mock_oauth

        # Act
        result = await service.get_access_token_for_integration(
            integration_type="atlassian",  # lowercase
            refresh_token="refresh_token_123",
            client_id="client_id_123",
            client_secret="client_secret_123",
        )

        # Assert
        assert result == "atlassian_token_123"

    @patch("app.services.mcp_token_service.OAuthTokenService")
    async def test_get_access_token_for_integration_exception_handling(self, mock_oauth_service: MagicMock) -> None:
        """Test exception handling in access token retrieval."""
        # Arrange
        mock_oauth = MagicMock()
        mock_oauth.get_valid_atlassian_token.side_effect = Exception("Network error")
        mock_oauth_service.return_value = mock_oauth
        service = MCPTokenService()
        service.oauth_service = mock_oauth

        # Act
        result = await service.get_access_token_for_integration(
            integration_type="Atlassian",
            refresh_token="refresh_token_123",
            client_id="client_id_123",
            client_secret="client_secret_123",
        )

        # Assert
        assert result is None

    def test_render_mcp_config_with_access_token_simple(
        self, mcp_token_service: MCPTokenService, sample_mcp_config: dict[str, dict]
    ) -> None:
        """Test simple MCP config rendering."""
        # Act
        result = mcp_token_service.render_mcp_config_with_access_token(sample_mcp_config, "test_token_123")

        # Assert
        assert result["Atlassian"]["headers"]["Authorization"] == "Bearer test_token_123"
        assert result["Atlassian"]["type"] == "sse"
        assert result["Atlassian"]["url"] == "https://mcp.atlassian.com/v1/sse"

    def test_render_mcp_config_with_access_token_complex(
        self, mcp_token_service: MCPTokenService, complex_mcp_config: dict[str, dict]
    ) -> None:
        """Test complex MCP config rendering with multiple templates."""
        # Act
        result = mcp_token_service.render_mcp_config_with_access_token(complex_mcp_config, "test_token_123")

        # Assert
        assert result["Atlassian"]["headers"]["Authorization"] == "Bearer test_token_123"
        assert result["Atlassian"]["headers"]["X-Custom"] == "test_token_123"
        assert result["Atlassian"]["headers"]["Content-Type"] == "application/json"
        assert result["Atlassian"]["body"]["token"] == "test_token_123"

    def test_render_mcp_config_with_access_token_template_error(
        self, mcp_token_service: MCPTokenService, invalid_mcp_config: dict[str, dict]
    ) -> None:
        """Test MCP config rendering with template syntax error."""
        # Act
        result = mcp_token_service.render_mcp_config_with_access_token(invalid_mcp_config, "test_token_123")

        # Assert - should return original config on error
        assert result == invalid_mcp_config

    def test_render_mcp_config_with_access_token_json_error(self, mcp_token_service: MCPTokenService) -> None:
        """Test MCP config rendering with JSON decode error."""
        # Arrange - Create a config that will cause JSON decode error after rendering
        with patch.object(mcp_token_service, "jinja_env") as mock_env:
            mock_template = MagicMock()
            mock_template.render.return_value = "invalid json"
            mock_env.from_string.return_value = mock_template
            # Act
            result = mcp_token_service.render_mcp_config_with_access_token({"test": "config"}, "test_token")

            # Assert - should return original config on error
            assert result == {"test": "config"}

    def test_render_mcp_config_with_access_token_general_exception(self, mcp_token_service: MCPTokenService) -> None:
        """Test MCP config rendering with general exception."""
        # Arrange
        with patch.object(mcp_token_service, "jinja_env") as mock_env:
            mock_env.from_string.side_effect = Exception("General error")

            # Act
            result = mcp_token_service.render_mcp_config_with_access_token({"test": "config"}, "test_token")

            # Assert - should return original config on error
            assert result == {"test": "config"}

    @patch("app.services.mcp_token_service.MCPTokenService.get_access_token_for_integration")
    async def test_get_rendered_mcp_config_success(
        self, mock_get_token: MagicMock, mcp_token_service: MCPTokenService, sample_mcp_config: dict[str, dict]
    ) -> None:
        """Test successful MCP config rendering with access token."""
        # Arrange
        mock_get_token.return_value = "test_access_token"
        credentials: dict[str, Any] = {"refresh_token": "test_refresh_token"}

        # Act
        result = await mcp_token_service.get_rendered_mcp_config(
            integration_type="Atlassian",
            mcp_config=sample_mcp_config,
            credentials=credentials,
            client_id="test_client",
            client_secret="test_secret",
        )

        # Assert
        assert result["Atlassian"]["headers"]["Authorization"] == "Bearer test_access_token"
        mock_get_token.assert_called_once_with(
            integration_type="Atlassian",
            refresh_token="test_refresh_token",
            client_id="test_client",
            client_secret="test_secret",
        )

    @patch("app.services.mcp_token_service.MCPTokenService.get_access_token_for_integration")
    async def test_get_rendered_mcp_config_no_refresh_token(
        self, mock_get_token: MagicMock, mcp_token_service: MCPTokenService, sample_mcp_config: dict[str, dict]
    ) -> None:
        """Test MCP config rendering with no refresh token."""
        # Arrange
        credentials: dict[str, Any] = {}  # No refresh token

        # Act
        result = await mcp_token_service.get_rendered_mcp_config(
            integration_type="Atlassian",
            mcp_config=sample_mcp_config,
            credentials=credentials,
            client_id="test_client",
            client_secret="test_secret",
        )

        # Assert
        assert result == sample_mcp_config
        mock_get_token.assert_not_called()

    @patch("app.services.mcp_token_service.MCPTokenService.get_access_token_for_integration")
    async def test_get_rendered_mcp_config_token_failure(
        self, mock_get_token: MagicMock, mcp_token_service: MCPTokenService, sample_mcp_config: dict[str, dict]
    ) -> None:
        """Test MCP config rendering when token fetch fails."""
        # Arrange
        mock_get_token.return_value = None
        credentials: dict[str, Any] = {"refresh_token": "test_refresh_token"}

        # Act
        result = await mcp_token_service.get_rendered_mcp_config(
            integration_type="Atlassian",
            mcp_config=sample_mcp_config,
            credentials=credentials,
            client_id="test_client",
            client_secret="test_secret",
        )

        # Assert
        assert result == sample_mcp_config

    @patch("app.services.mcp_token_service.MCPTokenService.get_access_token_for_integration")
    async def test_get_rendered_mcp_config_exception_handling(
        self, mock_get_token: MagicMock, mcp_token_service: MCPTokenService, sample_mcp_config: dict[str, dict]
    ) -> None:
        """Test exception handling in MCP config rendering."""
        # Arrange
        mock_get_token.side_effect = Exception("Network error")
        credentials: dict[str, Any] = {"refresh_token": "test_refresh_token"}

        # Act
        result = await mcp_token_service.get_rendered_mcp_config(
            integration_type="Atlassian",
            mcp_config=sample_mcp_config,
            credentials=credentials,
            client_id="test_client",
            client_secret="test_secret",
        )

        # Assert
        assert result == sample_mcp_config

    def test_extract_integration_type_from_mcp_config_atlassian(self, mcp_token_service: MCPTokenService) -> None:
        """Test extracting Atlassian integration type."""
        # Arrange
        config: dict[str, Any] = {"Atlassian": {"type": "sse"}}

        # Act
        result = mcp_token_service.extract_integration_type_from_mcp_config(config)

        # Assert
        assert result == "Atlassian"

    def test_extract_integration_type_from_mcp_config_notion(self, mcp_token_service: MCPTokenService) -> None:
        """Test extracting Notion integration type."""
        # Arrange
        config: dict[str, Any] = {"notion": {"type": "http"}}

        # Act
        result = mcp_token_service.extract_integration_type_from_mcp_config(config)

        # Assert
        assert result == "Notion"

    def test_extract_integration_type_from_mcp_config_github(self, mcp_token_service: MCPTokenService) -> None:
        """Test extracting GitHub integration type."""
        # Arrange
        config: dict[str, Any] = {"github": {"type": "http"}}

        # Act
        result = mcp_token_service.extract_integration_type_from_mcp_config(config)

        # Assert
        assert result == "Github"

    def test_extract_integration_type_from_mcp_config_unknown(self, mcp_token_service: MCPTokenService) -> None:
        """Test extracting unknown integration type."""
        # Arrange
        config: dict[str, Any] = {"unknown": {"type": "http"}}

        # Act
        result = mcp_token_service.extract_integration_type_from_mcp_config(config)

        # Assert
        assert result is None

    def test_extract_integration_type_from_mcp_config_empty(self, mcp_token_service: MCPTokenService) -> None:
        """Test extracting integration type from empty config."""
        # Arrange
        config: dict[str, Any] = {}

        # Act
        result = mcp_token_service.extract_integration_type_from_mcp_config(config)

        # Assert
        assert result is None

    def test_extract_integration_type_from_mcp_config_exception_handling(
        self, mcp_token_service: MCPTokenService
    ) -> None:
        """Test exception handling in integration type extraction."""
        # Arrange - Pass None to cause exception
        config: dict[str, Any] | None = None

        # Act
        if config is not None:
            result = mcp_token_service.extract_integration_type_from_mcp_config(config)
        else:
            result = mcp_token_service.extract_integration_type_from_mcp_config({})

        # Assert
        assert result is None

    def test_validate_template_syntax_valid(
        self, mcp_token_service: MCPTokenService, sample_mcp_config: dict[str, dict]
    ) -> None:
        """Test template syntax validation with valid template."""
        # Act
        result = mcp_token_service.validate_template_syntax(sample_mcp_config)

        # Assert
        assert result is True

    def test_validate_template_syntax_invalid(
        self, mcp_token_service: MCPTokenService, invalid_mcp_config: dict[str, dict]
    ) -> None:
        """Test template syntax validation with invalid template."""
        # Act
        result = mcp_token_service.validate_template_syntax(invalid_mcp_config)

        # Assert
        assert result is False

    def test_validate_template_syntax_complex_valid(
        self, mcp_token_service: MCPTokenService, complex_mcp_config: dict[str, dict]
    ) -> None:
        """Test template syntax validation with complex valid template."""
        # Act
        result = mcp_token_service.validate_template_syntax(complex_mcp_config)

        # Assert
        assert result is True

    def test_validate_template_syntax_json_error(self, mcp_token_service: MCPTokenService) -> None:
        """Test template syntax validation with JSON error."""
        # Arrange - Create a config that will cause JSON error
        config: dict[str, Any] = {"test": object()}  # Non-serializable object

        # Act
        result = mcp_token_service.validate_template_syntax(config)

        # Assert
        assert result is False

    def test_validate_template_syntax_general_exception(self, mcp_token_service: MCPTokenService) -> None:
        """Test template syntax validation with general exception."""
        # Arrange
        with patch.object(mcp_token_service, "jinja_env") as mock_env:
            mock_env.from_string.side_effect = Exception("General error")
            # Act
            result = mcp_token_service.validate_template_syntax({"test": "config"})

            # Assert
            assert result is False

    def test_validate_template_syntax_template_error(self, mcp_token_service: MCPTokenService) -> None:
        """Test template syntax validation with template error."""
        # Arrange
        with patch.object(mcp_token_service, "jinja_env") as mock_env:
            mock_template = MagicMock()
            mock_template.render.side_effect = TemplateError("Template error")
            mock_env.from_string.return_value = mock_template
            # Act
            result = mcp_token_service.validate_template_syntax({"test": "config"})

            # Assert
            assert result is False
