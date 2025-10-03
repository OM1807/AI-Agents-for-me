from collections.abc import AsyncGenerator
from typing import Any

from claude_code_sdk import query
from claude_code_sdk.types import ClaudeCodeOptions, TextBlock, ToolResultBlock, ToolUseBlock

from app.core.config import get_settings
from app.utils import get_logger, log_error

logger = get_logger(__name__)


class ClaudeCodeWrapper:
    """
    Wrapper service for Claude Code SDK interactions

    This service provides a clean interface for interacting with Claude Code SDK,
    handling streaming responses and content extraction.
    """

    def __init__(self) -> None:
        """Initialize the Claude Code wrapper with configuration"""
        self.settings = get_settings()

        # Cast to the expected literal type for Claude SDK
        permission_mode = self.settings.CLAUDE_PERMISSION_MODE
        if permission_mode not in ["default", "acceptEdits", "bypassPermissions"]:
            permission_mode = "bypassPermissions"  # default fallback
        self.options = ClaudeCodeOptions(permission_mode=permission_mode)  # type: ignore
        self._request_timeout = self.settings.CLAUDE_REQUEST_TIMEOUT

        logger.info(
            "Claude Code wrapper initialized",
            extra={"permission_mode": permission_mode, "request_timeout": self._request_timeout},
        )

    async def stream_code_assistance(self, prompt: str) -> AsyncGenerator[dict[str, Any], None]:
        """
        Stream coding assistance responses from Claude Code SDK

        Args:
            prompt: The coding prompt/question to send to Claude

        Yields:
            Dict[str, Any]: Structured response with type, content, and icon

        Raises:
            Exception: If Claude SDK interaction fails
        """
        logger.debug(
            "Starting stream",
            {"prompt_preview": prompt[:100] + "..." if len(prompt) > 100 else prompt, "prompt_length": len(prompt)},
        )

        try:
            response_generator = query(prompt=prompt, options=self.options)
            logger.info(
                "Response generator created",
                extra={
                    "prompt_preview": prompt[:100] + "..." if len(prompt) > 100 else prompt,
                    "prompt_length": len(prompt),
                },
            )

            chunk_count = 0
            async for response in response_generator:
                logger.debug(
                    "Processing chunk", extra={"chunk_index": chunk_count, "response_type": type(response).__name__}
                )

                response_data = self._process_response_chunk(response, chunk_count)
                if response_data:
                    yield response_data

                chunk_count += 1

            logger.info("Stream completed", extra={"total_chunks": chunk_count})

        except Exception as e:
            log_error(
                "Claude Code SDK stream error",
                e,
                extra={"prompt_preview": prompt[:100] + "..." if len(prompt) > 100 else prompt},
            )
            raise

    def _process_response_chunk(self, response: Any, chunk_index: int) -> dict[str, Any] | None:
        """
        Process individual response chunks from Claude Code SDK

        Args:
            response: Response object from Claude Code SDK
            chunk_index: Index of the current chunk

        Returns:
            Dict[str, Any] | None: Processed response data or None if not processable
        """
        response_type = type(response).__name__

        if response_type == "AssistantMessage":
            content = self._extract_content_from_blocks(response)
            logger.debug(
                "Extracted assistant content",
                extra={
                    "content_preview": content[:100] + "..." if len(content) > 100 else content,
                    "content_length": len(content),
                    "chunk_index": chunk_index,
                },
            )
            return {
                "type": "code_assistance",
                "content": content,
                "icon": "🤖",
                "chunk_index": chunk_index,
            }

        elif response_type == "SystemMessage":
            return {
                "type": "system_status",
                "content": "Processing your coding request...",
                "icon": "🧠",
                "chunk_index": chunk_index,
            }

        elif response_type == "ResultMessage":
            content = self._extract_content_from_blocks(response)
            return {
                "type": "tool_execution",
                "content": content,
                "icon": "🔧",
                "chunk_index": chunk_index,
            }

        # Unknown response type
        logger.debug("Unknown response type", extra={"response_type": response_type, "chunk_index": chunk_index})
        return None

    def _extract_content_from_blocks(self, response: Any) -> str:
        """
        Extract readable content from Claude Code SDK response blocks

        Args:
            response: Response object containing content blocks

        Returns:
            str: Extracted and formatted content
        """
        if not hasattr(response, "content") or not response.content:
            return "No content available"

        content_parts = []

        for block in response.content:
            if isinstance(block, TextBlock):
                content_parts.append(block.text)

            elif isinstance(block, ToolUseBlock):
                tool_description = f"🔧 Using tool: {block.name}"
                if hasattr(block, "input") and block.input:
                    tool_description += f"\n📝 Input: {block.input}"
                content_parts.append(tool_description)

            elif isinstance(block, ToolResultBlock):
                result_description = f"✅ Tool result:\n{block.content}"
                content_parts.append(result_description)

            else:
                # Handle unknown block types gracefully
                content_parts.append(f"📦 Unknown content: {block!s}")

        return "\n\n".join(content_parts) if content_parts else "No readable content available"
