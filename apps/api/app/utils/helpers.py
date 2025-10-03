from __future__ import annotations

import json
import re
import uuid
from typing import Any


def sanitize_prompt(prompt: str) -> str:
    """
    Sanitize and clean up the input prompt

    Args:
        prompt: The raw prompt string

    Returns:
        Cleaned and sanitized prompt string
    """
    if not prompt:
        return ""

    # Strip whitespace but preserve internal structure
    return prompt.strip()


def generate_session_id() -> str:
    """
    Generate a unique session ID for tracking related requests

    Returns:
        A unique session ID string in the format "claude-session-{uuid}"
    """
    return f"claude-session-{uuid.uuid4().hex[:12]}"


def try_parse_json_content(content_str: str | bytes | dict) -> dict[str, Any] | None:
    """
    Parse JSON content from a string, bytes, or dict.
    """
    parsed_content: dict[str, Any] | None = None
    try:
        if isinstance(content_str, str | bytes):
            parsed_content = json.loads(content_str)
        elif isinstance(content_str, dict):
            parsed_content = content_str
    except Exception:
        parsed_content = None
    return parsed_content


def parse_github_pr_url(url: str) -> tuple[str, str, int]:
    """Parse a GitHub PR URL to extract owner, repo, and PR number.

    Args:
        url: GitHub PR URL (e.g., https://github.com/owner/repo/pull/123)

    Returns:
        Tuple of (owner, repo, pr_number)

    Raises:
        ValueError: If URL format is invalid
    """
    # Support both github.com and www.github.com
    pattern = r"^https?://(?:www\.)?github\.com/([^/]+)/([^/]+)/pull/(\d+)(?:/.*)?$"
    match = re.match(pattern, url.strip())

    if not match:
        raise ValueError("Invalid GitHub PR URL format. Expected: https://github.com/owner/repo/pull/number")

    owner, repo, pr_number_str = match.groups()

    try:
        pr_number = int(pr_number_str)
    except ValueError:
        raise ValueError("Invalid PR number in URL")

    return owner, repo, pr_number
