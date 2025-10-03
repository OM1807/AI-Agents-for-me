from app.utils.helpers import generate_session_id, sanitize_prompt


def test_sanitize_prompt_normal() -> None:
    """Test sanitize_prompt with normal input"""
    prompt = "Write a Python function for binary search"
    result = sanitize_prompt(prompt)
    assert result == prompt


def test_sanitize_prompt_with_whitespace() -> None:
    """Test sanitize_prompt with extra whitespace"""
    prompt = "  Write a Python function  \n\t  "
    result = sanitize_prompt(prompt)
    assert result == "Write a Python function"


def test_sanitize_prompt_empty() -> None:
    """Test sanitize_prompt with empty string"""
    result = sanitize_prompt("")
    assert result == ""


def test_sanitize_prompt_only_whitespace() -> None:
    """Test sanitize_prompt with only whitespace"""
    result = sanitize_prompt("   \n\t  ")
    assert result == ""


def test_sanitize_prompt_multiline() -> None:
    """Test sanitize_prompt with multiline content"""
    prompt = """Write a function that:
    1. Takes a sorted array
    2. Implements binary search
    3. Returns the index"""
    result = sanitize_prompt(prompt)
    expected = """Write a function that:
    1. Takes a sorted array
    2. Implements binary search
    3. Returns the index"""
    assert result == expected


def test_generate_session_id() -> None:
    """Test generate_session_id generates valid session IDs"""
    session_id = generate_session_id()
    assert isinstance(session_id, str)
    assert session_id.startswith("claude-session-")
    assert len(session_id) > len("claude-session-")


def test_generate_session_id_uniqueness() -> None:
    """Test that generate_session_id generates unique IDs"""
    id1 = generate_session_id()
    id2 = generate_session_id()
    assert id1 != id2


def test_generate_session_id_format() -> None:
    """Test generate_session_id format consistency"""
    session_id = generate_session_id()
    parts = session_id.split("-")
    assert len(parts) == 3
    assert parts[0] == "claude"
    assert parts[1] == "session"
    assert len(parts[2]) == 12  # UUID hex[:12]
