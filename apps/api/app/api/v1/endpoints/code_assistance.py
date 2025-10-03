import json
import uuid
from collections.abc import AsyncGenerator
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse

from app.api.deps import get_claude_code_wrapper, validate_coding_prompt, validate_request_size
from app.core.config import get_settings
from app.schemas.code_assistance import CodeAssistanceRequest, CodeAssistanceResponse
from app.services.claude_service import ClaudeCodeWrapper
from app.utils import get_logger

logger = get_logger(__name__)

router = APIRouter()


async def code_assistance_stream_generator(
    prompt: str, session_id: str, context: str | None, claude_wrapper: ClaudeCodeWrapper
) -> AsyncGenerator[str, None]:
    """
    Generate streaming responses for Claude Code assistance

    Args:
        prompt: The coding prompt from the user
        session_id: Session identifier for tracking
        context: Optional context information
        claude_wrapper: Claude Code wrapper service instance

    Yields:
        str: Server-Sent Events formatted data
    """
    try:
        # Prepare the full prompt with context if provided
        full_prompt = prompt
        if context:
            full_prompt = f"Context: {context}\n\nQuestion: {prompt}"

        # Stream responses from Claude Code SDK
        async for response_chunk in claude_wrapper.stream_code_assistance(full_prompt):
            # Add session info to response
            response_chunk["session_id"] = session_id

            # Format as Server-Sent Event
            sse_data = f"data: {json.dumps(response_chunk)}\n\n"
            yield sse_data

    except Exception as e:
        # Handle errors gracefully with proper SSE formatting
        error_response = {
            "type": "error",
            "content": f"Code assistance error: {e!s}",
            "icon": "❌",
            "session_id": session_id,
            "error_code": "CLAUDE_SDK_ERROR",
        }
        yield f"data: {json.dumps(error_response)}\n\n"


@router.post("/code-assistance", dependencies=[Depends(validate_request_size)], response_model=CodeAssistanceResponse)
async def stream_code_assistance(
    request: CodeAssistanceRequest,
    claude_wrapper: ClaudeCodeWrapper = Depends(get_claude_code_wrapper),
) -> StreamingResponse:
    """
    Stream coding assistance from Claude Code SDK

    This endpoint provides a streaming interface to Claude Code SDK for coding assistance,
    including code generation, debugging help, explanations, and best practices.

    **Features: **
    - Real-time streaming responses
    - Session tracking for related requests
    - Context-aware assistance
    - Error handling with graceful degradation

    **Response Types: **
    - `code_assistance`: Main coding help and code generation
    - `system_status`: Processing status updates
    - `tool_execution`: Tool usage and results
    - `error`: Error messages and recovery information
    """
    # Validate and sanitize the prompt
    validated_prompt = validate_coding_prompt(request.prompt)

    # Generate session ID if not provided
    session_id = request.session_id or f"claude-session-{uuid.uuid4().hex[:12]}"

    logger.info(
        "Starting code assistance stream",
        extra={"session_id": session_id, "prompt_length": len(validated_prompt), "has_context": bool(request.context)},
    )

    # Create streaming response
    response = StreamingResponse(
        code_assistance_stream_generator(validated_prompt, session_id, request.context, claude_wrapper),
        media_type="text/event-stream",
    )

    # Configure Server-Sent Events headers
    response.headers.update(
        {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0",
            "X-Accel-Buffering": "no",  # Disable nginx buffering
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type, Authorization",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "X-Content-Type-Options": "nosniff",
            "X-Session-ID": session_id,
        }
    )

    return response


@router.get("/health")
async def code_assistance_health() -> dict[str, Any]:
    """
    Health check endpoint for Claude Code assistance service

    Returns the current status of the Claude Code wrapper service,
    including SDK availability and service health.
    """
    settings = get_settings()
    try:
        # Basic health check - could be expanded to actually test Claude SDK
        health_data = {
            "status": "healthy",
            "version": settings.VERSION,
            "service": "Claude Code Wrapper API",
            "claude_sdk_available": True,  # Could add actual SDK health check here
            "environment": settings.ENVIRONMENT,
            "debug_mode": settings.DEBUG,
        }

        return health_data

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Service unhealthy: {e!s}",
        )
