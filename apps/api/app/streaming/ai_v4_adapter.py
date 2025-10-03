"""Adapter to translate internal agent events into AI SDK v4 data stream protocol frames.

Translates mock agent events into the AI SDK v4 data stream protocol format.
Reference: https://v4.ai-sdk.dev/docs/ai-sdk-ui/stream-protocol#data-stream-protocol
"""

from __future__ import annotations

import json
from collections.abc import AsyncIterator
from typing import Any


def create_error_frame(error_message: str) -> bytes:
    """Create an AI SDK v4 error frame for exception handling.

    Args:
        error_message: The error message to send

    Returns:
        bytes: Formatted error frame
    """
    return f"3:{json.dumps(str(error_message))}\n".encode()


def create_finish_frame(finish_reason: str = "stop", prompt_tokens: int = 0, completion_tokens: int = 0) -> bytes:
    """Create an AI SDK v4 finish frame.

    Args:
        finish_reason: The reason for finishing ("stop", "length", "error", etc.)
        prompt_tokens: Number of prompt tokens used
        completion_tokens: Number of completion tokens generated

    Returns:
        bytes: Formatted finish frame
    """
    finish_payload = {
        "finishReason": finish_reason,
        "usage": {"promptTokens": prompt_tokens, "completionTokens": completion_tokens},
    }
    return f"d:{json.dumps(finish_payload)}\n".encode()


async def events_to_ai_v4(events: AsyncIterator[dict[str, Any]]) -> AsyncIterator[bytes]:
    """Translate internal agent events to AI SDK v4 data stream frames.

    Protocol mappings (per AI SDK v4 docs):
    - Text Part:      0:string\n          → event["type"] == "text"
    - Data Part:      2:Array<JSONValue>\n → event["type"] == "data"
    - Error Part:     3:string\n          → event["type"] == "error"
    - Message Annotation: 8:Array<JSONValue>\n → event["type"] == "system" or "annotation"
    - Tool Call:      9:{toolCallId, toolName, args}\n → event["type"] == "tool_call"
    - Tool Result:    a:{toolCallId, result}\n → event["type"] == "tool_result"
    - Finish Message: d:{finishReason, usage}\n → event["type"] == "finish" OR auto-generated at end
    """

    finish_seen = False

    async for event in events:
        event_type = event.get("type")

        # Text Part: 0:string\n
        if event_type == "text":
            # tool_call_data
            tool_call_data = {
                "toolCallId": event.get(
                    "toolCallId", f"text_tool_call_{hash(event.get('data', {}).get('text', '')) % 1000000}"
                ),
                "toolName": "text",
                "args": {
                    "text": event.get("data", {}).get("text", ""),
                },
            }
            yield f"9:{json.dumps(tool_call_data)}\n".encode()
            continue

        # Data Part: 2:Array<JSONValue>\n
        elif event_type == "data":
            # Pass through the data array as-is
            data_array = event.get("data", [])
            yield f"2:{json.dumps(data_array)}\n".encode()
            continue

        # Tool Call Part: 9:{toolCallId:string; toolName:string; args:object}\n
        elif event_type == "tool_call":
            tool_call_data = {
                "toolCallId": event.get("toolCallId", ""),
                "toolName": event.get("toolName", ""),
                "args": event.get("args", {}),
            }
            yield f"9:{json.dumps(tool_call_data)}\n".encode()
            continue

        # Tool Result Part: a:{toolCallId:string; result:object}\n
        elif event_type == "tool_result":
            tool_result_data = {"toolCallId": event.get("toolCallId", ""), "result": event.get("result", "")}
            yield f"a:{json.dumps(tool_result_data)}\n".encode()
            continue

        # Message Annotation Part: 8:Array<JSONValue>\n
        elif event_type in {"system", "annotation"}:
            # Handle system messages or annotations
            annotation_data = event.get("data", [event])
            if not isinstance(annotation_data, list):
                annotation_data = [annotation_data]
            yield f"8:{json.dumps(annotation_data)}\n".encode()
            continue

        elif event_type == "thinking":
            thinking_data = event.get("data", {})
            yield f"g:{json.dumps(thinking_data.get('text'))}\n".encode()
            yield f"j:{json.dumps({'signature': thinking_data.get('signature')})}\n".encode()
            continue

        # Error Part: 3:string\n
        elif event_type == "error":
            error_message = event.get("message", str(event.get("data", event)))
            yield f"3:{json.dumps(error_message)}\n".encode()
            continue

        # Finish Message Part: d:{finishReason:string; usage:object}\n
        elif event_type == "finish":
            finish_data = event.get("data", {})
            yield f"d:{json.dumps(finish_data)}\n".encode()
            finish_seen = True
            continue
        # Fallback: treat unknown events as generic data parts
        else:
            yield f"2:{json.dumps([event])}\n".encode()

    # Ensure we always end with a finish message if not explicitly provided
    if not finish_seen:
        yield create_finish_frame()
