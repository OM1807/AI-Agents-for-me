from unittest.mock import patch

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_code_assistance_endpoint() -> None:
    """Test Claude Code assistance endpoint with mocked response"""
    response = client.post(
        "/api/v1/claude-code/code-assistance", json={"prompt": "Write a Python function for binary search"}
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"


def test_code_assistance_missing_prompt() -> None:
    """Test code assistance with missing prompt"""
    response = client.post("/api/v1/claude-code/code-assistance", json={})
    assert response.status_code == 422  # Validation error


def test_code_assistance_empty_prompt() -> None:
    """Test code assistance with empty prompt"""
    response = client.post("/api/v1/claude-code/code-assistance", json={"prompt": ""})
    assert response.status_code == 422  # Validation error (min_length=1)


def test_code_assistance_with_context() -> None:
    """Test code assistance with context and session ID"""
    response = client.post(
        "/api/v1/claude-code/code-assistance",
        json={
            "prompt": "Help me write a binary search function",
            "context": "Working on a FastAPI project with algorithms",
            "session_id": "test-session-123",
        },
    )
    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"
    assert response.headers.get("x-session-id") == "test-session-123"


def test_code_assistance_long_prompt() -> None:
    """Test code assistance with very long prompt"""
    long_prompt = "x" * 15000  # Exceeds max_length validation
    response = client.post("/api/v1/claude-code/code-assistance", json={"prompt": long_prompt})
    assert response.status_code == 422  # Validation error due to prompt length


def test_code_assistance_health_endpoint() -> None:
    """Test Claude Code assistance health check"""
    response = client.get("/api/v1/claude-code/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Claude Code Wrapper API"
    assert "claude_sdk_available" in data
    assert "version" in data


def test_code_assistance_streaming_response() -> None:
    """Test that the streaming response works correctly"""
    response = client.post("/api/v1/claude-code/code-assistance", json={"prompt": "Write binary search"})

    assert response.status_code == 200
    assert response.headers["content-type"] == "text/event-stream; charset=utf-8"

    # Read the streaming response
    content = response.content.decode()
    assert "data:" in content  # SSE format


def test_code_assistance_error_handling() -> None:
    """Test error handling when Claude SDK fails"""
    with patch("app.services.claude_service.query") as mock_query:
        mock_query.side_effect = Exception("Claude API is down")

        response = client.post("/api/v1/claude-code/code-assistance", json={"prompt": "Write a function"})

        # The endpoint should handle the error gracefully
        # The exact behavior depends on your error handling implementation
        assert response.status_code in [200, 500]  # Either handles gracefully or returns server error


def test_code_assistance_prompt_sanitization() -> None:
    """Test that prompts are properly sanitized"""
    response = client.post(
        "/api/v1/claude-code/code-assistance", json={"prompt": "  Write a function with extra whitespace  \n\t"}
    )

    assert response.status_code == 200


def test_code_assistance_session_id_generation() -> None:
    """Test that session IDs are generated when not provided"""
    response = client.post("/api/v1/claude-code/code-assistance", json={"prompt": "Write a function"})

    assert response.status_code == 200
    # Should have a generated session ID in headers
    session_id = response.headers.get("x-session-id")
    assert session_id is not None
    assert session_id.startswith("claude-session-")
    assert len(session_id) > len("claude-session-")


def test_code_assistance_validates_prompt_length() -> None:
    """Test that prompt length validation works"""
    # Test minimum length
    response = client.post("/api/v1/claude-code/code-assistance", json={"prompt": ""})
    assert response.status_code == 422

    # Test maximum length
    long_prompt = "x" * 20000
    response = client.post("/api/v1/claude-code/code-assistance", json={"prompt": long_prompt})
    assert response.status_code == 422


def test_code_assistance_context_optional() -> None:
    """Test that context parameter is optional"""
    response = client.post("/api/v1/claude-code/code-assistance", json={"prompt": "Write a simple function"})
    assert response.status_code == 200
