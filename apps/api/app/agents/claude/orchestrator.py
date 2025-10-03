"""Claude Code orchestration for agent workflows."""
import re
from collections.abc import AsyncGenerator
from copy import deepcopy
from pathlib import Path
from typing import Any
from uuid import uuid4

from claude_code_sdk import (
    AssistantMessage,
    ClaudeCodeOptions,
    ResultMessage,
    SystemMessage,
    TextBlock,
    ThinkingBlock,
    ToolResultBlock,
    ToolUseBlock,
    UserMessage,
    query,
)
from loguru import logger

from app.core.config import get_settings

TOOL_MAPPING = {
    "TodoWrite": "todo",
    "Read": "read_file",
    "Write": "create_file",
    "Edit": "edit_file",
    "MultiEdit": "edit_file",
    "LS": "list_directory",
    "Grep": "search_files",
    "Bash": "execute_command",
    "WebSearch": "web_search",
    "WebFetch": "web_fetch",
    "NotebookRead": "read_notebook",
    "NotebookEdit": "edit_notebook",
    "Task": "task_manager",
    "ExitPlanMode": "exit_plan_mode",
    "Glob": "glob_files",
}


class ClaudeOrchestrator:
    """
    Orchestrates Claude Code execution for reverse engineering and documentation.

    This class handles:
    - Converting chat messages to Claude prompts
    - Managing Claude Code SDK interactions directly
    - Streaming responses directly as strings
    - Tool mapping for Agent Workflow
    """

    def __init__(
        self,
        base_dir: Path,
        mcp_configs: dict[str, dict[str, Any]],
        system_prompt: str | None = None,
        resume_session_id: str | None = None,
    ) -> None:
        """Initialize Claude orchestrator."""
        self.settings = get_settings()
        # Configure Claude Code SDK options
        permission_mode = getattr(self.settings, "CLAUDE_PERMISSION_MODE", "bypassPermissions")
        if permission_mode not in ["default", "acceptEdits", "bypassPermissions"]:
            permission_mode = "bypassPermissions"

        # Build Claude Code options with optional resume session
        claude_options_kwargs = {
            "allowed_tools": [
                "Read",
                "Bash",
                "Grep",
                "LS",
                "TodoWrite",
                "Write",
                "Edit",
                "MultiEdit",
                "WebFetch",
                "WebSearch",
            ],
            "cwd": base_dir,
            "permission_mode": permission_mode,
            "mcp_servers": mcp_configs,
        }

        # Add system_prompt only if provided
        if system_prompt is not None:
            claude_options_kwargs["system_prompt"] = system_prompt

        # Add resume parameter if session ID provided
        if resume_session_id:
            claude_options_kwargs["continue_conversation"] = True

        self.claude_options = claude_options_kwargs

    async def run(self, messages: list[dict[str, Any]], **options: Any) -> AsyncGenerator[dict[str, Any], None]:
        """
        Stream reverse engineering chat responses using Claude Code SDK.

        Args:
            messages: List of chat messages from the client
            options: Additional options for the Claude Code SDK

        Yields:
            str: Streaming response data in Vercel AI SDK v4 format
        """
        try:
            # Convert messages to Claude prompt
            prompt = self._prepare_llm_prompt(messages)

            logger.info(
                "Starting Claude Code SDK query",
                extra={"message_count": len(messages), "prompt_length": len(prompt)},
            )

            # Prepare claude options
            claude_options_dict = deepcopy(self.claude_options)
            claude_options_dict.update(options)
            claude_options = ClaudeCodeOptions(**claude_options_dict)  # type: ignore[arg-type]

            # Stream responses from Claude Code SDK directly
            async for response in query(prompt=prompt, options=claude_options):
                logger.debug(f"Received message type: {type(response).__name__}")

                if isinstance(response, SystemMessage):
                    logger.debug(f"--> System Message: {response}")
                    yield {"type": "system", "data": response.data}

                elif isinstance(response, AssistantMessage):
                    logger.debug(f"--> Assistant Message: {response}")
                    for block in response.content:
                        if isinstance(block, TextBlock):
                            # Extract thinking block if it exists in the text
                            remaining_text, thinking_block = self._extract_and_yield_thinking_block(block.text)
                            if thinking_block:
                                yield thinking_block
                                if remaining_text:
                                    yield {"type": "text", "data": {"text": remaining_text}}
                            else:
                                # for normal text block
                                yield {"type": "text", "data": {"text": block.text}}

                        elif isinstance(block, ThinkingBlock):
                            logger.debug(f"Claude thinking: {block.thinking}")
                            yield {"type": "thinking", "data": {"text": block.thinking, "signature": block.signature}}

                        elif isinstance(block, ToolUseBlock):
                            tool_call_id = block.id
                            tool_name = block.name
                            tool_args = block.input

                            yield {
                                "type": "tool_call",
                                "toolCallId": tool_call_id,
                                "toolName": self.parse_tool_name(tool_name),
                                "args": tool_args,
                            }

                elif isinstance(response, UserMessage):
                    logger.debug(f"--> User Message: {response}")
                    for user_block in getattr(response, "content", []):
                        if isinstance(user_block, TextBlock):
                            yield {"type": "text", "data": {"text": user_block.text}}
                        elif isinstance(user_block, ToolResultBlock):
                            yield {
                                "type": "tool_result",
                                "toolCallId": user_block.tool_use_id,
                                "result": user_block.content,
                            }
                        elif isinstance(user_block, dict):
                            # Fallback for dict-style tool results - backward compatibility
                            if user_block.get("type") == "tool_result":
                                yield {
                                    "type": "tool_result",
                                    "toolCallId": user_block.get("tool_use_id", ""),
                                    "result": user_block.get("content", ""),
                                }

                elif isinstance(response, ResultMessage):
                    logger.debug(f"--> Result Message: {response}")
                    # Commenting this, as this is causing duplicate text blocks in the stream
                    # yield {"type": "text", "data": {"text": response.result}}
                    # finish the stream
                    yield {
                        "type": "finish",
                        "data": {
                            "finishReason": "error" if response.is_error else "stop",
                            "duration_ms": response.duration_ms,
                            "duration_api_ms": response.duration_api_ms,
                            "total_cost_usd": response.total_cost_usd,
                            "session_id": response.session_id,
                            "usage": response.usage,
                        },
                    }
            logger.info("Claude Code SDK query completed")

        except Exception as e:
            logger.error(f"Claude Code SDK query failed: {e}")
            yield {
                "type": "finish",
                "data": {"finishReason": "error", "message": f"Claude Code SDK query failed: {e}"},
            }

    def parse_tool_name(self, llm_tool_name: str) -> str:
        """
        Map Claude tool names to Agent Workflow compatible names.
        """
        return TOOL_MAPPING.get(llm_tool_name, llm_tool_name)

    def _prepare_llm_prompt(self, messages: list[dict[str, Any]]) -> str:
        """
        Convert chat messages to a simple prompt string for Claude Code SDK.
        Uses the utility function to handle both simple and parts-based messages.
        """
        prompt_parts = []

        for message in messages:
            if message["role"] == "user":
                prompt_parts.append(f"User: {message['content']}")
            elif message["role"] == "assistant":
                prompt_parts.append(f"Assistant: {message['content']}")
            elif message["role"] == "system":
                prompt_parts.append(f"System: {message['content']}")

        return "\n\n".join(prompt_parts)

    def _extract_and_yield_thinking_block(self, text: str) -> tuple[str, dict[str, Any] | None]:
        """
        Extract and yield thinking block from the text.
        """
        thinking_match = re.search(r"<thinking>(.*?)</thinking>", text, re.DOTALL)
        if thinking_match:
            thinking_text = thinking_match.group(1).strip()
            thinking_message = {
                "type": "thinking",
                "data": {"text": thinking_text, "signature": f"reasoning_{uuid4().hex}"},
            }
            remaining_text = re.sub(r"<thinking>.*?</thinking>", "", text, flags=re.DOTALL).strip()
            return remaining_text, thinking_message
        return "", None
