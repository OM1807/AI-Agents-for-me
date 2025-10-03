from unittest.mock import patch

from app.core.config import Settings, get_settings


def test_get_cors_origins_empty() -> None:
    """Test get_cors_origins with empty BACKEND_CORS_ORIGINS"""
    settings = Settings(DATABASE_URL="sqlite:///test.db")
    settings.BACKEND_CORS_ORIGINS = ""
    assert settings.get_cors_origins() == []


def test_get_cors_origins_comma_separated() -> None:
    """Test get_cors_origins with comma-separated values"""
    settings = Settings(DATABASE_URL="sqlite:///test.db")
    settings.BACKEND_CORS_ORIGINS = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001"
    expected = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]
    assert settings.get_cors_origins() == expected


def test_get_cors_origins_with_spaces() -> None:
    """Test get_cors_origins with spaces around values"""
    settings = Settings(DATABASE_URL="sqlite:///test.db")
    settings.BACKEND_CORS_ORIGINS = " http://localhost:3000 , http://127.0.0.1:3000 , http://localhost:3001 "
    expected = ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001"]
    assert settings.get_cors_origins() == expected


def test_get_cors_origins_json_format() -> None:
    """Test get_cors_origins with JSON array format"""
    settings = Settings(DATABASE_URL="sqlite:///test.db")
    settings.BACKEND_CORS_ORIGINS = '["http://localhost:3000", "http://127.0.0.1:3000"]'
    expected = ["http://localhost:3000", "http://127.0.0.1:3000"]
    assert settings.get_cors_origins() == expected


def test_get_cors_origins_invalid_json() -> None:
    """Test get_cors_origins with invalid JSON format"""
    settings = Settings(DATABASE_URL="sqlite:///test.db")
    settings.BACKEND_CORS_ORIGINS = '["http://localhost:3000", invalid json'
    # Should fall back to comma-separated parsing for invalid JSON
    result = settings.get_cors_origins()
    assert isinstance(result, list)
    # It will treat it as comma-separated, so we expect some parsing


def test_get_cors_origins_empty_brackets() -> None:
    """Test get_cors_origins with empty brackets"""
    settings = Settings(DATABASE_URL="sqlite:///test.db")
    settings.BACKEND_CORS_ORIGINS = "[]"
    assert settings.get_cors_origins() == []


def test_get_settings_cached() -> None:
    """Test that get_settings returns cached instance"""
    settings1 = get_settings()
    settings2 = get_settings()
    # Should be the same instance due to lru_cache
    assert settings1 is settings2


@patch.dict("os.environ", {"PROJECT_NAME": "Test API", "DEBUG": "false", "LOG_LEVEL": "ERROR"})
def test_settings_from_environment() -> None:
    """Test that settings can be loaded from environment variables"""
    # Clear the cache to test environment loading
    get_settings.cache_clear()
    settings = get_settings()

    assert settings.PROJECT_NAME == "Test API"
    assert settings.DEBUG is False
    assert settings.LOG_LEVEL == "ERROR"

    # Clean up
    get_settings.cache_clear()
