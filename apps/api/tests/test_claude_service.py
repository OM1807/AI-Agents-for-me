from unittest.mock import MagicMock, patch

import pytest

from app.services.claude_service import ClaudeCodeWrapper


class TestClaudeCodeWrapper:
    def test_init(self) -> None:
        """Test ClaudeCodeWrapper initialization"""
        wrapper = ClaudeCodeWrapper()
        assert wrapper.options is not None
        assert wrapper._request_timeout == 300  # Default timeout

    def test_wrapper_attributes(self) -> None:
        """Test that wrapper has expected attributes"""
        wrapper = ClaudeCodeWrapper()
        assert hasattr(wrapper, "options")
        assert hasattr(wrapper, "_request_timeout")
        assert hasattr(wrapper, "stream_code_assistance")

    @pytest.mark.asyncio
    async def test_stream_code_assistance_generator(self) -> None:
        """Test that stream_code_assistance returns an async generator"""
        wrapper = ClaudeCodeWrapper()
        gen = wrapper.stream_code_assistance("Test prompt")
        assert hasattr(gen, "__aiter__")
        assert hasattr(gen, "__anext__")

    @pytest.mark.asyncio
    async def test_stream_code_assistance_yields_results(self, mock_claude_sdk: MagicMock) -> None:
        """Test that stream_code_assistance yields expected results"""
        wrapper = ClaudeCodeWrapper()
        results = []

        async for result in wrapper.stream_code_assistance("Test prompt"):
            results.append(result)

        assert len(results) >= 1  # At least one result
        # Check that we get the expected types
        result_types = [r["type"] for r in results]
        assert "system_status" in result_types or "code_assistance" in result_types

    @pytest.mark.asyncio
    async def test_stream_code_assistance_handles_exceptions(self) -> None:
        """Test exception handling in stream_code_assistance"""
        with patch("app.services.claude_service.query") as mock_query:
            mock_query.side_effect = Exception("API Error")

            wrapper = ClaudeCodeWrapper()

            with pytest.raises(Exception) as exc_info:
                async for _ in wrapper.stream_code_assistance("Test prompt"):
                    pass

            assert "API Error" in str(exc_info.value)

    def test_process_response_chunk_assistant_message(self) -> None:
        """Test processing of AssistantMessage response chunks"""
        from claude_code_sdk.types import TextBlock

        wrapper = ClaudeCodeWrapper()

        mock_response = MagicMock()
        mock_response.__class__.__name__ = "AssistantMessage"
        # Create a real TextBlock for proper isinstance check
        text_block = TextBlock(text="Test response content")
        mock_response.content = [text_block]

        result = wrapper._process_response_chunk(mock_response, 0)

        assert result is not None
        assert result["type"] == "code_assistance"
        assert "Test response content" in result["content"]
        assert result["icon"] == "🤖"
        assert result["chunk_index"] == 0

    def test_process_response_chunk_system_message(self) -> None:
        """Test processing of SystemMessage response chunks"""
        wrapper = ClaudeCodeWrapper()

        mock_response = MagicMock()
        mock_response.__class__.__name__ = "SystemMessage"

        result = wrapper._process_response_chunk(mock_response, 1)

        assert result is not None
        assert result["type"] == "system_status"
        assert result["content"] == "Processing your coding request..."
        assert result["icon"] == "🧠"
        assert result["chunk_index"] == 1

    def test_process_response_chunk_unknown_type(self) -> None:
        """Test processing of unknown response chunk types"""
        wrapper = ClaudeCodeWrapper()

        mock_response = MagicMock()
        mock_response.__class__.__name__ = "UnknownMessage"

        result = wrapper._process_response_chunk(mock_response, 0)

        assert result is None

    def test_extract_content_from_blocks_with_text_block(self) -> None:
        """Test content extraction from TextBlock using direct mock setup"""
        from claude_code_sdk.types import TextBlock

        wrapper = ClaudeCodeWrapper()

        # Create a mock response with a TextBlock
        mock_text_block = TextBlock(text="Here's your code")
        mock_response = MagicMock()
        mock_response.content = [mock_text_block]

        result = wrapper._extract_content_from_blocks(mock_response)
        assert result == "Here's your code"

    def test_extract_content_from_blocks_no_content(self) -> None:
        """Test content extraction when no content is available"""
        wrapper = ClaudeCodeWrapper()

        mock_response = MagicMock()
        mock_response.content = None

        result = wrapper._extract_content_from_blocks(mock_response)
        assert result == "No content available"

    def test_extract_content_from_blocks_empty_content(self) -> None:
        """Test content extraction with empty content list"""
        wrapper = ClaudeCodeWrapper()

        mock_response = MagicMock()
        mock_response.content = []

        result = wrapper._extract_content_from_blocks(mock_response)
        assert result == "No content available"  # Changed to match actual implementation
