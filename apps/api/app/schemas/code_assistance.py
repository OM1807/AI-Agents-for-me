from __future__ import annotations

from pydantic import BaseModel, Field


class CodeAssistanceRequest(BaseModel):
    """Request schema for Claude Code assistance"""

    prompt: str = Field(
        ...,
        description="The coding prompt or question to send to Claude",
        min_length=1,
        max_length=10000,
        json_schema_extra={"example": "Help me write a Python function to calculate fibonacci numbers efficiently"},
    )
    session_id: str | None = Field(
        None,
        description="Optional session ID for tracking related requests",
        json_schema_extra={"example": "session-123-456"},
    )
    context: str | None = Field(
        None,
        description="Optional context or additional information for the coding request",
        max_length=5000,
        json_schema_extra={"example": "I'm working on a Python project using FastAPI"},
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "prompt": "Help me write a Python function to calculate fibonacci numbers efficiently with memoization",
                "session_id": "coding-session-001",
                "context": "Working on a FastAPI project that needs efficient recursive calculations",
            }
        }
    }


class CodeAssistanceResponse(BaseModel):
    """Response schema for streaming code assistance data"""

    type: str = Field(..., description="Type of response chunk", json_schema_extra={"example": "code_assistance"})
    content: str = Field(
        ...,
        description="The content of the response chunk",
        json_schema_extra={"example": "Here's an efficient Python function with memoization..."},
    )
    icon: str = Field(..., description="Icon representing the response type", json_schema_extra={"example": "🤖"})
    chunk_index: int | None = Field(
        None, description="Index of the response chunk in the stream", json_schema_extra={"example": 0}
    )

    model_config = {
        "json_schema_extra": {
            "example": {
                "type": "code_assistance",
                "content": "Here's an efficient Python function to calculate fibonacci numbers with "
                "memoization:\n\n```python\ndef fibonacci(n, memo={}):\n    if n in memo:\n        return "
                "memo[n]\n    if n <= 2:\n        return 1\n    memo[n] = fibonacci(n-1, "
                "memo) + fibonacci(n-2, memo)\n    return memo[n]\n```",
                "icon": "🤖",
                "chunk_index": 0,
            }
        }
    }


class HealthResponse(BaseModel):
    """Health check response schema"""

    status: str = Field(..., description="Service health status", json_schema_extra={"example": "healthy"})
    version: str = Field(..., description="API version", json_schema_extra={"example": "1.0.0"})
    service: str = Field(default="Claude Code Wrapper", description="Service name")
    claude_sdk_available: bool = Field(default=True, description="Claude SDK availability status")

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "healthy",
                "version": "1.0.0",
                "service": "Claude Code Wrapper",
                "claude_sdk_available": True,
            }
        }
    }
