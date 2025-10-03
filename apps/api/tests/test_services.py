"""Service tests for integration validation and OAuth token services."""

from datetime import datetime, timedelta
from typing import Any
from unittest.mock import MagicMock, patch

import pytest
from httpx import Response

from app.services.integration_validator import AtlassianValidator, GithubValidator, NotionValidator, OAuthTokenService
from app.services.mcp_token_service import MCPTokenService


class TestGithubValidator:
    """Test GitHub validator."""

    @pytest.fixture
    def github_validator(self) -> GithubValidator:
        """GitHub validator instance for testing."""
        return GithubValidator()

    @pytest.fixture
    def github_credentials(self) -> dict[str, str]:
        """GitHub credentials for testing."""
        return {"pat_token": "ghp_valid_token"}

    @patch("app.services.integration_validator.httpx.AsyncClient")
    async def test_validate_credentials_success(
        self, mock_client: MagicMock, github_validator: GithubValidator, github_credentials: dict[str, str]
    ) -> None:
        """Test successful GitHub credentials validation."""
        # Arrange
        mock_response = MagicMock(spec=Response)
        mock_response.status_code = 200
        mock_response.json.return_value = {"login": "testuser"}
        mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
        # Act
        result = await github_validator.validate_credentials(github_credentials)

        # Assert
        assert result.is_valid is True
        assert result.mcp_config is not None
        assert result.mcp_config is not None
        assert "github" in result.mcp_config

    @patch("app.services.integration_validator.httpx.AsyncClient")
    async def test_validate_credentials_failure(
        self, mock_client: MagicMock, github_validator: GithubValidator, github_credentials: dict[str, str]
    ) -> None:
        """Test failed GitHub credentials validation."""
        # Arrange
        mock_response = MagicMock(spec=Response)
        mock_response.status_code = 401
        mock_client.return_value.__aenter__.return_value.get.return_value = mock_response
        # Act
        result = await github_validator.validate_credentials(github_credentials)

        # Assert
        assert result.is_valid is False
        assert "401" in result.message

    @patch("app.services.integration_validator.httpx.AsyncClient")
    async def test_validate_credentials_missing_token(
        self, mock_client: MagicMock, github_validator: GithubValidator
    ) -> None:
        """Test GitHub credentials validation with missing token."""
        # Arrange
        credentials: dict[str, Any] = {}  # No token

        # Act
        result = await github_validator.validate_credentials(credentials)

        # Assert
        assert result.is_valid is False
        assert "github" in result.message.lower()

    def test_generate_mcp_config(self, github_validator: GithubValidator, github_credentials: dict[str, str]) -> None:
        """Test MCP config generation for GitHub."""
        # Act
        result = github_validator.generate_mcp_config(github_credentials)

        # Assert
        assert "github" in result
        assert "headers" in result["github"]
        assert "Authorization" in result["github"]["headers"]


class TestAtlassianValidator:
    """Test Atlassian validator."""

    @pytest.fixture
    def atlassian_validator(self) -> AtlassianValidator:
        """Atlassian validator instance for testing."""
        return AtlassianValidator()

    @pytest.fixture
    def oauth_credentials(self) -> dict[str, str]:
        """OAuth credentials for testing."""
        return {"refresh_token": "refresh_token_123"}

    @patch("app.services.integration_validator.httpx.AsyncClient")
    async def test_validate_credentials_success(
        self, mock_client: MagicMock, atlassian_validator: AtlassianValidator, oauth_credentials: dict[str, str]
    ) -> None:
        """Test successful Atlassian credentials validation."""
        # Arrange
        mock_response = MagicMock(spec=Response)
        mock_response.status_code = 200
        mock_response.json.return_value = {"access_token": "valid_token"}
        mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
        # Act
        result = await atlassian_validator.validate_credentials(oauth_credentials)

        # Assert
        assert result.is_valid is True
        assert result.mcp_config is not None
        assert result.mcp_config is not None
        assert "Atlassian" in result.mcp_config

    @patch("app.services.integration_validator.httpx.AsyncClient")
    async def test_validate_credentials_failure(
        self, mock_client: MagicMock, atlassian_validator: AtlassianValidator, oauth_credentials: dict[str, str]
    ) -> None:
        """Test failed Atlassian credentials validation."""
        # Arrange - use invalid credentials (too short refresh token)
        invalid_credentials: dict[str, Any] = {"refresh_token": "short"}

        # Act
        result = await atlassian_validator.validate_credentials(invalid_credentials)

        # Assert
        assert result.is_valid is False
        assert "Invalid Atlassian refresh token format" in result.message

    async def test_validate_credentials_missing_token(self, atlassian_validator: AtlassianValidator) -> None:
        """Test Atlassian credentials validation with missing token."""
        # Arrange
        credentials: dict[str, Any] = {}  # No refresh token

        # Act
        result = await atlassian_validator.validate_credentials(credentials)

        # Assert
        assert result.is_valid is False
        assert "Atlassian refresh token is required" in result.message

    def test_generate_mcp_config(
        self, atlassian_validator: AtlassianValidator, oauth_credentials: dict[str, str]
    ) -> None:
        """Test MCP config generation for Atlassian."""
        # Act
        result = atlassian_validator.generate_mcp_config(oauth_credentials)

        # Assert
        assert "Atlassian" in result
        assert "headers" in result["Atlassian"]
        assert "Authorization" in result["Atlassian"]["headers"]


class TestNotionValidator:
    """Test Notion validator."""

    @pytest.fixture
    def notion_validator(self) -> NotionValidator:
        """Notion validator instance for testing."""
        return NotionValidator()

    @pytest.fixture
    def oauth_credentials(self) -> dict[str, str]:
        """OAuth credentials for testing."""
        return {"refresh_token": "refresh_token_123"}

    @patch("app.services.integration_validator.httpx.AsyncClient")
    async def test_validate_credentials_success(
        self, mock_client: MagicMock, notion_validator: NotionValidator, oauth_credentials: dict[str, str]
    ) -> None:
        """Test successful Notion credentials validation."""
        # Arrange
        mock_response = MagicMock(spec=Response)
        mock_response.status_code = 200
        mock_response.json.return_value = {"access_token": "valid_token"}
        mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
        # Act
        result = await notion_validator.validate_credentials(oauth_credentials)

        # Assert
        assert result.is_valid is True
        assert result.mcp_config is not None
        assert result.mcp_config is not None
        assert "notion" in result.mcp_config

    @patch("app.services.integration_validator.httpx.AsyncClient")
    async def test_validate_credentials_failure(
        self, mock_client: MagicMock, notion_validator: NotionValidator, oauth_credentials: dict[str, str]
    ) -> None:
        """Test failed Notion credentials validation."""
        # Arrange - use invalid credentials (too short refresh token)
        invalid_credentials: dict[str, Any] = {"refresh_token": "short"}

        # Act
        result = await notion_validator.validate_credentials(invalid_credentials)

        # Assert
        assert result.is_valid is False
        assert "Invalid Notion refresh token format" in result.message

    async def test_validate_credentials_missing_token(self, notion_validator: NotionValidator) -> None:
        """Test Notion credentials validation with missing token."""
        # Arrange
        credentials: dict[str, Any] = {}  # No refresh token

        # Act
        result = await notion_validator.validate_credentials(credentials)

        # Assert
        assert result.is_valid is False
        assert "Notion refresh token is required" in result.message

    def test_generate_mcp_config(self, notion_validator: NotionValidator, oauth_credentials: dict[str, str]) -> None:
        """Test MCP config generation for Notion."""
        # Act
        result = notion_validator.generate_mcp_config(oauth_credentials)

        # Assert
        assert "notion" in result
        assert "headers" in result["notion"]
        assert "Authorization" in result["notion"]["headers"]


class TestMCPTokenService:
    """Test MCP token service."""

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

    def test_render_mcp_config_with_access_token(
        self, mcp_token_service: MCPTokenService, sample_mcp_config: dict[str, dict]
    ) -> None:
        """Test rendering MCP config with access token."""
        # Act
        result = mcp_token_service.render_mcp_config_with_access_token(sample_mcp_config, "test_token_123")

        # Assert
        assert result["Atlassian"]["headers"]["Authorization"] == "Bearer test_token_123"

    def test_extract_integration_type_from_mcp_config(self, mcp_token_service: MCPTokenService) -> None:
        """Test extracting integration type from MCP config."""
        # Test Atlassian
        atlassian_config: dict[str, Any] = {"Atlassian": {"type": "sse"}}
        result = mcp_token_service.extract_integration_type_from_mcp_config(atlassian_config)
        assert result == "Atlassian"

        # Test Notion
        notion_config: dict[str, Any] = {"notion": {"type": "http"}}
        result = mcp_token_service.extract_integration_type_from_mcp_config(notion_config)
        assert result == "Notion"

        # Test GitHub
        github_config: dict[str, Any] = {"github": {"type": "http"}}
        result = mcp_token_service.extract_integration_type_from_mcp_config(github_config)
        assert result == "Github"

        # Test unknown
        unknown_config: dict[str, Any] = {"unknown": {"type": "http"}}
        result = mcp_token_service.extract_integration_type_from_mcp_config(unknown_config)
        assert result is None

    def test_validate_template_syntax(self, mcp_token_service: MCPTokenService) -> None:
        """Test template syntax validation."""
        # Valid template
        valid_config = {"test": {"headers": {"Authorization": "Bearer {{ access_token }}"}}}
        result = mcp_token_service.validate_template_syntax(valid_config)
        assert result is True

        # Invalid template (missing closing brace)
        invalid_config = {"test": {"headers": {"Authorization": "Bearer {{ access_token }"}}}
        result = mcp_token_service.validate_template_syntax(invalid_config)
        assert result is False

    @patch("app.services.mcp_token_service.MCPTokenService.get_access_token_for_integration")
    async def test_get_rendered_mcp_config_success(
        self, mock_get_token: MagicMock, mcp_token_service: MCPTokenService
    ) -> None:
        """Test successful MCP config rendering."""
        # Arrange
        mock_get_token.return_value = "test_access_token"
        mcp_config = {"Atlassian": {"headers": {"Authorization": "Bearer {{ access_token }}"}}}
        credentials: dict[str, Any] = {"refresh_token": "test_refresh_token"}

        # Act
        result = await mcp_token_service.get_rendered_mcp_config(
            integration_type="Atlassian",
            mcp_config=mcp_config,
            credentials=credentials,
            client_id="test_client",
            client_secret="test_secret",
        )

        # Assert
        assert "Atlassian" in result
        assert result["Atlassian"]["headers"]["Authorization"] == "Bearer test_access_token"

    @patch("app.services.mcp_token_service.MCPTokenService.get_access_token_for_integration")
    async def test_get_rendered_mcp_config_no_refresh_token(
        self, mock_get_token: MagicMock, mcp_token_service: MCPTokenService
    ) -> None:
        """Test MCP config rendering with no refresh token."""
        # Arrange
        mcp_config = {"Atlassian": {"headers": {"Authorization": "Bearer {{ access_token }}"}}}
        credentials: dict[str, Any] = {}  # No refresh token

        # Act
        result = await mcp_token_service.get_rendered_mcp_config(
            integration_type="Atlassian",
            mcp_config=mcp_config,
            credentials=credentials,
            client_id="test_client",
            client_secret="test_secret",
        )

        # Assert
        assert result == mcp_config  # Should return original config

    @patch("app.services.mcp_token_service.MCPTokenService.get_access_token_for_integration")
    async def test_get_rendered_mcp_config_token_failure(
        self, mock_get_token: MagicMock, mcp_token_service: MCPTokenService
    ) -> None:
        """Test MCP config rendering when token fetch fails."""
        # Arrange
        mock_get_token.return_value = None
        mcp_config = {"Atlassian": {"headers": {"Authorization": "Bearer {{ access_token }}"}}}
        credentials: dict[str, Any] = {"refresh_token": "test_refresh_token"}

        # Act
        result = await mcp_token_service.get_rendered_mcp_config(
            integration_type="Atlassian",
            mcp_config=mcp_config,
            credentials=credentials,
            client_id="test_client",
            client_secret="test_secret",
        )

        # Assert
        assert result == mcp_config  # Should return original config


class TestOAuthTokenService:
    """Test OAuth token service."""

    @pytest.fixture
    def oauth_token_service(self) -> OAuthTokenService:
        """OAuth token service instance for testing."""
        return OAuthTokenService()

    def test_calculate_expires_at(self, oauth_token_service: OAuthTokenService) -> None:
        """Test calculating expiration timestamp."""
        # Act
        result = oauth_token_service.calculate_expires_at(3600)  # 1 hour

        # Assert
        assert isinstance(result, datetime)
        assert result > datetime.utcnow()

    def test_is_token_expired(self, oauth_token_service: OAuthTokenService) -> None:
        """Test token expiration check."""
        # Test expired token
        expired_time = datetime.utcnow() - timedelta(hours=1)
        result = oauth_token_service.is_token_expired(expired_time)
        assert result is True

        # Test future token
        future_time = datetime.utcnow() + timedelta(hours=1)
        result = oauth_token_service.is_token_expired(future_time)
        assert result is False

    @patch("app.services.oauth_token_service.httpx.AsyncClient")
    async def test_refresh_access_token_success(
        self, mock_client: MagicMock, oauth_token_service: OAuthTokenService
    ) -> None:
        """Test successful access token refresh."""
        # Arrange
        mock_response = MagicMock(spec=Response)
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "access_token": "new_access_token",
            "expires_in": 3600,
            "refresh_token": "new_refresh_token",
        }
        mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
        # Act
        result = await oauth_token_service.refresh_access_token(
            refresh_token="old_refresh_token",
            token_url="https://test.com/token",
            client_id="test_client",
            client_secret="test_secret",
        )

        # Assert
        assert result is not None
        assert result["access_token"] == "new_access_token"

    @patch("app.services.oauth_token_service.httpx.AsyncClient")
    async def test_refresh_access_token_failure(
        self, mock_client: MagicMock, oauth_token_service: OAuthTokenService
    ) -> None:
        """Test failed access token refresh."""
        # Arrange
        mock_response = MagicMock(spec=Response)
        mock_response.status_code = 400
        mock_response.text = "Invalid refresh token"
        mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
        # Act
        result = await oauth_token_service.refresh_access_token(
            refresh_token="invalid_refresh_token",
            token_url="https://test.com/token",
            client_id="test_client",
            client_secret="test_secret",
        )

        # Assert
        assert result is None

    @patch("app.services.oauth_token_service.httpx.AsyncClient")
    async def test_refresh_access_token_exception(
        self, mock_client: MagicMock, oauth_token_service: OAuthTokenService
    ) -> None:
        """Test access token refresh with exception."""
        # Arrange
        mock_client.return_value.__aenter__.return_value.post.side_effect = Exception("Network error")

        # Act
        result = await oauth_token_service.refresh_access_token(
            refresh_token="test_token",
            token_url="https://test.com/token",
            client_id="test_client",
            client_secret="test_secret",
        )

        # Assert
        assert result is None

    async def test_get_valid_access_token_with_valid_current_token(
        self, oauth_token_service: OAuthTokenService
    ) -> None:
        """Test getting valid access token when current token is still valid."""
        # Arrange
        future_time = datetime.utcnow() + timedelta(hours=1)

        # Act
        result = await oauth_token_service.get_valid_access_token(
            refresh_token="refresh_token",
            token_url="https://test.com/token",
            client_id="test_client",
            client_secret="test_secret",
            current_access_token="valid_token",
            expires_at=future_time,
        )

        # Assert
        assert result == "valid_token"

    @patch("app.services.oauth_token_service.OAuthTokenService.refresh_access_token")
    async def test_get_valid_access_token_refresh_success(
        self, mock_refresh: MagicMock, oauth_token_service: OAuthTokenService
    ) -> None:
        """Test getting valid access token with successful refresh."""
        # Arrange
        mock_refresh.return_value = {"access_token": "new_token", "expires_in": 3600}
        # Act
        result = await oauth_token_service.get_valid_access_token(
            refresh_token="refresh_token",
            token_url="https://test.com/token",
            client_id="test_client",
            client_secret="test_secret",
            current_access_token="expired_token",
            expires_at=datetime.utcnow() - timedelta(hours=1),
        )

        # Assert
        assert result == "new_token"

    @patch("app.services.oauth_token_service.OAuthTokenService.refresh_access_token")
    async def test_get_valid_access_token_refresh_failure(
        self, mock_refresh: MagicMock, oauth_token_service: OAuthTokenService
    ) -> None:
        """Test getting valid access token with failed refresh."""
        # Arrange
        mock_refresh.return_value = None
        # Act
        result = await oauth_token_service.get_valid_access_token(
            refresh_token="refresh_token",
            token_url="https://test.com/token",
            client_id="test_client",
            client_secret="test_secret",
            current_access_token="expired_token",
            expires_at=datetime.utcnow() - timedelta(hours=1),
        )

        # Assert
        assert result is None

    async def test_refresh_atlassian_token(self, oauth_token_service: OAuthTokenService) -> None:
        """Test Atlassian token refresh."""
        # This is a simple wrapper test
        with patch.object(oauth_token_service, "refresh_access_token") as mock_refresh:
            mock_refresh.return_value = {"access_token": "atlassian_token"}
            result = await oauth_token_service.refresh_atlassian_token(
                refresh_token="test_token",
                client_id="test_client",
                client_secret="test_secret",
            )

            assert result == {"access_token": "atlassian_token"}
            mock_refresh.assert_called_once_with(
                "test_token",
                oauth_token_service.ATLASSIAN_TOKEN_URL,
                "test_client",
                "test_secret",
            )

    async def test_refresh_notion_token(self, oauth_token_service: OAuthTokenService) -> None:
        """Test Notion token refresh."""
        # This is a simple wrapper test
        with patch.object(oauth_token_service, "refresh_access_token") as mock_refresh:
            mock_refresh.return_value = {"access_token": "notion_token"}
            result = await oauth_token_service.refresh_notion_token(
                refresh_token="test_token",
                client_id="test_client",
                client_secret="test_secret",
            )

            assert result == {"access_token": "notion_token"}
            mock_refresh.assert_called_once_with(
                "test_token",
                oauth_token_service.NOTION_TOKEN_URL,
                "test_client",
                "test_secret",
            )

    async def test_get_valid_atlassian_token(self, oauth_token_service: OAuthTokenService) -> None:
        """Test getting valid Atlassian token."""
        # This is a simple wrapper test
        with patch.object(oauth_token_service, "get_valid_access_token") as mock_get:
            mock_get.return_value = "atlassian_token"
            result = await oauth_token_service.get_valid_atlassian_token(
                refresh_token="test_token",
                client_id="test_client",
                client_secret="test_secret",
            )

            assert result == "atlassian_token"
            mock_get.assert_called_once_with(
                "test_token",
                oauth_token_service.ATLASSIAN_TOKEN_URL,
                "test_client",
                "test_secret",
            )

    async def test_get_valid_notion_token(self, oauth_token_service: OAuthTokenService) -> None:
        """Test getting valid Notion token."""
        # This is a simple wrapper test
        with patch.object(oauth_token_service, "get_valid_access_token") as mock_get:
            mock_get.return_value = "notion_token"
            result = await oauth_token_service.get_valid_notion_token(
                refresh_token="test_token",
                client_id="test_client",
                client_secret="test_secret",
            )

            assert result == "notion_token"
            mock_get.assert_called_once_with(
                "test_token",
                oauth_token_service.NOTION_TOKEN_URL,
                "test_client",
                "test_secret",
            )
