"""SSE adapter translating internal agent events to Server-Sent Events.

Uses sse-starlette to emit standards-compliant SSE frames. Event names mirror
our internal event types and payloads include a "type" field for frontend
handling, aligned with AI SDK UI stream conventions.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any
from uuid import uuid4

from sse_starlette import JSONServerSentEvent, ServerSentEvent


def _json_data(payload: dict[str, Any]) -> JSONServerSentEvent:
    """Create a data-only SSE message with JSON payload.

    Emits only `data: <json>` blocks (no `event:` field), relying on the
    `type` inside the payload to distinguish message kinds.
    """
    return JSONServerSentEvent(data=payload)


def _json_event(event_name: str, payload: dict[str, Any]) -> JSONServerSentEvent:
    """Create a named SSE event with JSON payload."""
    return JSONServerSentEvent(event=event_name, data=payload)


def _emit(
    event_name: str,
    payload: dict[str, Any],
    *,
    data_only: bool = False,
) -> JSONServerSentEvent:
    """Emit either a named event or a data-only message based on flag."""
    return _json_data(payload) if data_only else _json_event(event_name, payload)


def create_error_event(error_message: str, *, data_only: bool = False) -> JSONServerSentEvent:
    """Create an SSE error event."""
    payload = {"type": "error", "message": str(error_message)}
    return _emit("error", payload, data_only=data_only)


def create_finish_event(
    finish_reason: str = "stop",
    prompt_tokens: int = 0,
    completion_tokens: int = 0,
    *,
    data_only: bool = False,
) -> JSONServerSentEvent:
    """Create an SSE finish event with basic usage payload."""
    payload = {
        "type": "finish",
        "finishReason": finish_reason,
        "usage": {"promptTokens": prompt_tokens, "completionTokens": completion_tokens},
    }
    return _emit("finish", payload, data_only=data_only)


async def events_to_sse(
    events: AsyncIterator[dict[str, Any]], *, data_only: bool = False
) -> AsyncIterator[JSONServerSentEvent]:
    """Forward events as-is using their `type` as the event name.

    - When data_only is False: emits named events (event: <type>, data: <event-json>)
    - When data_only is True: emits data-only messages (data: <event-json>)
    - Guarantees a final finish if upstream did not emit one
    """

    finish_seen = False

    async for event in events:
        event_type = str(event.get("type", "data"))
        yield _emit(event_type, event, data_only=data_only)
        if event_type == "finish":
            finish_seen = True

    if not finish_seen:
        yield create_finish_event(data_only=data_only)


# ------------------------
# AI SDK UI v5 Data Stream
# ------------------------
def _emit_json(payload: dict[str, Any]) -> JSONServerSentEvent:
    """Emit a JSON data-only SSE frame (no event name)."""
    return JSONServerSentEvent(data=payload)


def _emit_done() -> ServerSentEvent:
    """Emit the literal terminal marker data: [DONE]."""
    return ServerSentEvent(data="[DONE]")


def _make_id(prefix: str) -> str:
    return f"{prefix}{uuid4().hex}"


async def events_to_ui_message_stream(
    events: AsyncIterator[dict[str, Any]],
) -> AsyncIterator[ServerSentEvent | JSONServerSentEvent]:
    """
    Translate internal agent events into AI SDK UI data stream protocol (v5) parts.

    Behavior:
    - Always emits data-only JSON parts (no event name) to align with Vercel AI SDK UI expectations.
    - Emits an initial start part with a generated messageId.
    - Maps internal events to protocol parts (text, tool input/output, error, finish).
    - Ensures a final finish part and terminates with a literal [DONE] frame.

    Reference: https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol
    """

    # Emit start part
    message_id = _make_id("ses_")
    yield _emit_json({"type": "start", "messageId": message_id})

    finish_seen = False

    async for event in events:
        event_type = str(event.get("type", "data"))

        # Text content from upstream
        if event_type == "text":
            text_value = event.get("data", {}).get("text", "")
            text_id = _make_id("msg_")
            yield _emit_json({"type": "text-start", "id": text_id})
            if text_value:
                yield _emit_json({"type": "text-delta", "id": text_id, "delta": text_value})
            yield _emit_json({"type": "text-end", "id": text_id})
            continue

        # Tool call from upstream
        if event_type == "tool_call":
            tool_call_id = event.get("toolCallId", _make_id("call_"))
            tool_name = event.get("toolName", "")
            tool_args = event.get("args", {})

            # Start a step around tool execution
            yield _emit_json({"type": "start-step"})
            yield _emit_json(
                {
                    "type": "tool-input-start",
                    "toolCallId": tool_call_id,
                    "toolName": tool_name,
                }
            )
            # We currently receive complete args; stream as available
            yield _emit_json(
                {
                    "type": "tool-input-available",
                    "toolCallId": tool_call_id,
                    "toolName": tool_name,
                    "input": tool_args,
                }
            )
            continue

        # Tool result from upstream
        if event_type == "tool_result":
            tool_call_id = event.get("toolCallId", _make_id("call_"))
            result = event.get("result", {})
            yield _emit_json(
                {
                    "type": "tool-output-available",
                    "toolCallId": tool_call_id,
                    "output": result,
                }
            )
            yield _emit_json({"type": "finish-step"})
            continue

        # System/annotation events - forward as custom data parts
        if event_type in {"system", "annotation"}:
            suffix = "system" if event_type == "system" else "annotation"
            payload = event.get("data", event)
            yield _emit_json({"type": f"data-{suffix}", "data": payload})
            continue

        if event_type == "thinking":
            thinking_data = event.get("data", {})
            yield _emit_json({"type": "reasoning-start", "id": thinking_data.get("signature")})
            yield _emit_json(
                {"type": "reasoning-delta", "id": thinking_data.get("signature"), "delta": thinking_data.get("text")}
            )
            yield _emit_json({"type": "reasoning-end", "id": thinking_data.get("signature")})
            continue

        # Error normalization
        if event_type == "error":
            message = event.get("message") or "unknown error"
            yield _emit_json({"type": "error", "errorText": str(message)})
            continue

        # Finish part (may include additional metadata from upstream)
        if event_type == "finish":
            finish_data = {k: v for k, v in event.items() if k != "type"}
            # Minimal required type field
            finish_payload: dict[str, Any] = {"type": "finish"}
            finish_payload.update(finish_data)
            yield _emit_json(finish_payload)
            finish_seen = True
            continue

        # Data parts
        if event_type.startswith("data-"):
            data = event.get("data") or event
            yield _emit_json({"type": event_type, "data": data})
            continue

        # Unknown events → generic data part for debugging/compat
        yield _emit_json({"type": f"data-{event_type}", "data": event})

    if not finish_seen:
        yield _emit_json({"type": "finish"})
    # Terminal marker
    yield _emit_done()
