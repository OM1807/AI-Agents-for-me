from unittest.mock import Mock

import pytest
from fastapi import HTTPException

from app.api.deps import get_claude_code_wrapper, validate_coding_prompt, validate_request_size
from app.services.claude_service import ClaudeCodeWrapper


def test_get_claude_code_wrapper() -> None:
    """Test that get_claude_code_wrapper returns a ClaudeCodeWrapper instance"""
    wrapper = get_claude_code_wrapper()
    assert isinstance(wrapper, ClaudeCodeWrapper)


def test_validate_coding_prompt_valid() -> None:
    """Test validate_coding_prompt with valid prompt"""
    valid_prompt = "Write a Python function for binary search"
    result = validate_coding_prompt(valid_prompt)
    assert result == valid_prompt


def test_validate_coding_prompt_too_long() -> None:
    """Test validate_coding_prompt with prompt that's too long"""
    long_prompt = "x" * 15000  # Exceeds 10KB limit
    with pytest.raises(HTTPException) as exc_info:
        validate_coding_prompt(long_prompt)
    assert exc_info.value.status_code == 400
    assert "too long" in str(exc_info.value.detail)


def test_validate_coding_prompt_empty() -> None:
    """Test validate_coding_prompt with empty prompt"""
    with pytest.raises(HTTPException) as exc_info:
        validate_coding_prompt("")
    assert exc_info.value.status_code == 400
    assert "cannot be empty" in str(exc_info.value.detail)


def test_validate_coding_prompt_whitespace_only() -> None:
    """Test validate_coding_prompt with whitespace-only prompt"""
    with pytest.raises(HTTPException) as exc_info:
        validate_coding_prompt("   \n\t  ")
    assert exc_info.value.status_code == 400
    assert "cannot be empty" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_validate_request_size() -> None:
    """Test validate_request_size dependency"""
    # Mock request with small content length
    mock_request = Mock()
    mock_request.headers = {"content-length": "1000"}

    # Should not raise any exception
    await validate_request_size(mock_request)


@pytest.mark.asyncio
async def test_validate_request_size_too_large() -> None:
    """Test validate_request_size with oversized request"""
    # Mock request with large content length
    mock_request = Mock()
    mock_request.headers = {"content-length": "20971520"}  # 20MB, exceeds 10MB limit

    with pytest.raises(HTTPException) as exc_info:
        await validate_request_size(mock_request)
    assert exc_info.value.status_code == 413
    assert "too large" in str(exc_info.value.detail)


@pytest.mark.asyncio
async def test_validate_request_size_no_content_length() -> None:
    """Test validate_request_size when no content-length header is present"""
    # Mock request without content-length header
    mock_request = Mock()
    mock_request.headers = {}

    # Should not raise any exception when content-length is not present
    await validate_request_size(mock_request)
