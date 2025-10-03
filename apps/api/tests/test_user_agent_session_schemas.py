"""Tests for user agent session schemas."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.schemas.user_agent_session import SessionListResponse, SessionResponse


class TestSessionResponse:
    """Test SessionResponse schema."""

    def test_session_response_valid_data(self):
        """Test SessionResponse with valid data."""
        session_data = {
            "id": 1,
            "project_id": 5,
            "agent_id": 10,
            "messages": [{"role": "user", "content": "Hello"}, {"role": "assistant", "content": "Hi there!"}],
            "is_active": True,
            "mcps": ["github", "jira", "slack"],
            "custom_properties": {"analysis_type": "full", "priority": "high", "timeout": 300},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 1,
            "message_count": 2,
            "mcp_count": 3,
        }

        response = SessionResponse(**session_data)

        assert response.id == 1
        assert response.project_id == 5
        assert response.agent_id == 10
        assert len(response.messages) == 2
        assert response.messages[0]["role"] == "user"
        assert response.messages[1]["content"] == "Hi there!"
        assert response.is_active is True
        assert response.mcps == ["github", "jira", "slack"]
        assert response.custom_properties["analysis_type"] == "full"
        assert response.created_by == 1
        assert response.message_count == 2
        assert response.mcp_count == 3

    def test_session_response_empty_collections(self):
        """Test SessionResponse with empty messages and mcps."""
        session_data = {
            "id": 2,
            "project_id": 1,
            "agent_id": 2,
            "messages": [],
            "is_active": False,
            "mcps": [],
            "custom_properties": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 2,
            "message_count": 0,
            "mcp_count": 0,
        }

        response = SessionResponse(**session_data)

        assert response.messages == []
        assert response.mcps == []
        assert response.custom_properties == {}
        assert response.is_active is False
        assert response.message_count == 0
        assert response.mcp_count == 0

    def test_session_response_complex_messages(self):
        """Test SessionResponse with complex message structures."""
        complex_messages = [
            {
                "role": "user",
                "content": "Can you analyze this code?",
                "metadata": {
                    "timestamp": "2024-01-01T10:00:00Z",
                    "source": "web",
                    "attachments": [{"type": "file", "name": "main.py", "size": 1024}],
                },
            },
            {
                "role": "assistant",
                "content": "I'll analyze the code for you.",
                "metadata": {"timestamp": "2024-01-01T10:00:05Z", "tools_used": ["code_analysis"], "confidence": 0.95},
            },
            {
                "role": "assistant",
                "content": "Here's my analysis...",
                "metadata": {
                    "timestamp": "2024-01-01T10:00:10Z",
                    "analysis_results": {
                        "complexity": "medium",
                        "issues": ["unused_import", "long_function"],
                        "suggestions": 3,
                    },
                },
            },
        ]

        session_data = {
            "id": 3,
            "project_id": 1,
            "agent_id": 2,
            "messages": complex_messages,
            "is_active": True,
            "mcps": ["code_analysis"],
            "custom_properties": {"analysis_depth": "detailed"},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 1,
            "message_count": 3,
            "mcp_count": 1,
        }

        response = SessionResponse(**session_data)

        assert len(response.messages) == 3
        assert response.messages[0]["metadata"]["attachments"][0]["name"] == "main.py"
        assert response.messages[1]["metadata"]["confidence"] == 0.95
        assert response.messages[2]["metadata"]["analysis_results"]["complexity"] == "medium"

    def test_session_response_various_mcps(self):
        """Test SessionResponse with various MCP configurations."""
        session_data = {
            "id": 4,
            "project_id": 2,
            "agent_id": 3,
            "messages": [],
            "is_active": True,
            "mcps": ["github", "jira", "slack", "confluence", "docker", "kubernetes", "aws", "linear", "notion"],
            "custom_properties": {
                "mcp_config": {
                    "github": {"auth": "token", "repo": "test/repo"},
                    "jira": {"project": "TEST", "auth": "basic"},
                    "slack": {"channel": "#dev", "auth": "oauth"},
                }
            },
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 1,
            "message_count": 0,
            "mcp_count": 9,
        }

        response = SessionResponse(**session_data)

        assert len(response.mcps) == 9
        assert "github" in response.mcps
        assert "kubernetes" in response.mcps
        assert "notion" in response.mcps
        assert response.custom_properties["mcp_config"]["github"]["repo"] == "test/repo"

    def test_session_response_complex_custom_properties(self):
        """Test SessionResponse with complex custom properties."""
        complex_properties = {
            "workflow_config": {
                "type": "code_review",
                "steps": [
                    {"name": "analyze", "timeout": 60},
                    {"name": "review", "timeout": 120},
                    {"name": "report", "timeout": 30},
                ],
                "parallel_execution": True,
            },
            "ai_config": {
                "model": "claude-3-sonnet",
                "temperature": 0.7,
                "max_tokens": 2000,
                "tools": ["code_analysis", "documentation", "testing"],
                "system_prompt_override": None,
            },
            "user_preferences": {
                "notification_level": "verbose",
                "auto_save": True,
                "preferred_language": "python",
                "code_style": "pep8",
            },
            "session_metadata": {
                "start_time": "2024-01-01T10:00:00Z",
                "expected_duration": 1800,
                "complexity_estimate": "medium",
                "billing_code": "PROJ-123",
            },
        }

        session_data = {
            "id": 5,
            "project_id": 3,
            "agent_id": 4,
            "messages": [],
            "is_active": True,
            "mcps": ["code_analysis", "documentation"],
            "custom_properties": complex_properties,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 1,
            "message_count": 0,
            "mcp_count": 2,
        }

        response = SessionResponse(**session_data)

        assert response.custom_properties["workflow_config"]["type"] == "code_review"
        assert len(response.custom_properties["workflow_config"]["steps"]) == 3
        assert response.custom_properties["ai_config"]["model"] == "claude-3-sonnet"
        assert response.custom_properties["user_preferences"]["preferred_language"] == "python"

    def test_session_response_missing_required_fields(self):
        """Test SessionResponse with missing required fields."""
        incomplete_data = {
            "id": 6,
            "project_id": 1,
            # Missing agent_id, messages, is_active, etc.
        }

        with pytest.raises(ValidationError) as exc_info:
            SessionResponse(**incomplete_data)

        error_msg = str(exc_info.value)
        assert any(field in error_msg for field in ["agent_id", "messages", "is_active"])

    def test_session_response_invalid_types(self):
        """Test SessionResponse with invalid field types."""
        invalid_data = {
            "id": "not_an_integer",
            "project_id": "not_an_integer",
            "agent_id": "not_an_integer",
            "messages": "not_a_list",
            "is_active": "not_boolean",
            "mcps": "not_a_list",
            "custom_properties": "not_a_dict",
            "created_at": "not_a_datetime",
            "updated_at": "not_a_datetime",
            "created_by": "not_an_integer",
            "message_count": "not_an_integer",
            "mcp_count": "not_an_integer",
        }

        with pytest.raises(ValidationError):
            SessionResponse(**invalid_data)

    def test_session_response_json_serialization(self):
        """Test SessionResponse JSON serialization."""
        session_data = {
            "id": 7,
            "project_id": 2,
            "agent_id": 3,
            "messages": [
                {"role": "user", "content": "Test message"},
                {"role": "assistant", "content": "Test response"},
            ],
            "is_active": True,
            "mcps": ["github", "jira"],
            "custom_properties": {"test": "value"},
            "created_at": datetime(2024, 1, 15, 10, 30, 0),
            "updated_at": datetime(2024, 1, 15, 11, 0, 0),
            "created_by": 1,
            "message_count": 2,
            "mcp_count": 2,
        }

        response = SessionResponse(**session_data)
        json_data = response.model_dump()

        assert json_data["id"] == 7
        assert json_data["project_id"] == 2
        assert json_data["agent_id"] == 3
        assert len(json_data["messages"]) == 2
        assert json_data["is_active"] is True
        assert json_data["mcps"] == ["github", "jira"]
        assert json_data["custom_properties"]["test"] == "value"
        assert json_data["message_count"] == 2
        assert json_data["mcp_count"] == 2


class TestSessionListResponse:
    """Test SessionListResponse schema."""

    def test_session_list_response_valid(self):
        """Test SessionListResponse with valid data."""
        session_data = {
            "id": 1,
            "project_id": 1,
            "agent_id": 2,
            "messages": [{"role": "user", "content": "Hello"}],
            "is_active": True,
            "mcps": ["github"],
            "custom_properties": {"test": "value"},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
            "created_by": 1,
            "message_count": 1,
            "mcp_count": 1,
        }

        session = SessionResponse(**session_data)

        list_data = {"results": [session], "total": 1, "skip": 0, "limit": 10, "has_more": False}

        list_response = SessionListResponse(**list_data)

        assert len(list_response.results) == 1
        assert list_response.total == 1
        assert list_response.skip == 0
        assert list_response.limit == 10
        assert list_response.has_more is False
        assert list_response.results[0].project_id == 1

    def test_session_list_response_empty(self):
        """Test SessionListResponse with empty session list."""
        list_data = {"results": [], "total": 0, "skip": 0, "limit": 10, "has_more": False}

        list_response = SessionListResponse(**list_data)

        assert len(list_response.results) == 0
        assert list_response.total == 0
        assert list_response.has_more is False

    def test_session_list_response_multiple_sessions(self):
        """Test SessionListResponse with multiple sessions."""
        sessions = []
        for i in range(4):
            session_data = {
                "id": i + 1,
                "project_id": (i % 2) + 1,  # Alternate between projects 1 and 2
                "agent_id": (i % 3) + 1,  # Rotate through agents 1, 2, 3
                "messages": [
                    {"role": "user", "content": f"User message {i + 1}"},
                    {"role": "assistant", "content": f"Assistant response {i + 1}"},
                ],
                "is_active": i < 3,  # First 3 active, last one inactive
                "mcps": [f"mcp_{i + 1}"],
                "custom_properties": {"session_number": i + 1},
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "created_by": (i % 2) + 1,  # Alternate between users 1 and 2
                "message_count": 2,
                "mcp_count": 1,
            }
            sessions.append(SessionResponse(**session_data))

        list_data = {"results": sessions, "total": 4, "skip": 0, "limit": 4, "has_more": False}

        list_response = SessionListResponse(**list_data)

        assert len(list_response.results) == 4
        assert list_response.total == 4
        assert list_response.results[0].is_active is True
        assert list_response.results[3].is_active is False
        assert list_response.results[0].project_id == 1
        assert list_response.results[1].project_id == 2

    def test_session_list_response_with_pagination(self):
        """Test SessionListResponse with pagination."""
        # Create 3 test sessions for current page
        sessions = []
        for i in range(3):
            session_data = {
                "id": i + 21,  # Starting from ID 21
                "project_id": 1,
                "agent_id": 1,
                "messages": [],
                "is_active": True,
                "mcps": [],
                "custom_properties": {"page": 3, "item": i + 1},
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
                "created_by": 1,
                "message_count": 0,
                "mcp_count": 0,
            }
            sessions.append(SessionResponse(**session_data))

        list_data = {
            "results": sessions,
            "total": 50,  # Total sessions in database
            "skip": 20,  # Starting from 20th session (page 3)
            "limit": 3,  # Showing 3 sessions per page
            "has_more": True,  # More sessions available
        }

        list_response = SessionListResponse(**list_data)

        assert len(list_response.results) == 3
        assert list_response.total == 50
        assert list_response.skip == 20
        assert list_response.limit == 3
        assert list_response.has_more is True
        assert list_response.results[0].id == 21

    def test_session_list_response_with_diverse_sessions(self):
        """Test SessionListResponse with diverse session configurations."""
        sessions = []

        # Session 1: Active session with conversation
        sessions.append(
            SessionResponse(
                **{
                    "id": 1,
                    "project_id": 1,
                    "agent_id": 1,
                    "messages": [
                        {"role": "user", "content": "Help with testing"},
                        {"role": "assistant", "content": "I can help you write tests"},
                    ],
                    "is_active": True,
                    "mcps": ["github", "testing"],
                    "custom_properties": {"type": "development"},
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "created_by": 1,
                    "message_count": 2,
                    "mcp_count": 2,
                }
            )
        )

        # Session 2: Inactive session with many MCPs
        sessions.append(
            SessionResponse(
                **{
                    "id": 2,
                    "project_id": 2,
                    "agent_id": 2,
                    "messages": [],
                    "is_active": False,
                    "mcps": ["github", "jira", "slack", "confluence", "docker"],
                    "custom_properties": {"type": "deployment", "completed": True},
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "created_by": 2,
                    "message_count": 0,
                    "mcp_count": 5,
                }
            )
        )

        # Session 3: Active session with complex properties
        sessions.append(
            SessionResponse(
                **{
                    "id": 3,
                    "project_id": 1,
                    "agent_id": 3,
                    "messages": [{"role": "user", "content": "Complex analysis needed"}],
                    "is_active": True,
                    "mcps": ["code_analysis"],
                    "custom_properties": {
                        "complexity": "high",
                        "estimated_duration": 3600,
                        "tools": ["static_analysis", "security_scan"],
                    },
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "created_by": 1,
                    "message_count": 1,
                    "mcp_count": 1,
                }
            )
        )

        list_data = {"results": sessions, "total": 3, "skip": 0, "limit": 10, "has_more": False}

        list_response = SessionListResponse(**list_data)

        assert len(list_response.results) == 3
        assert list_response.results[0].custom_properties["type"] == "development"
        assert list_response.results[1].mcp_count == 5
        assert list_response.results[2].custom_properties["complexity"] == "high"

    def test_session_list_response_json_serialization(self):
        """Test SessionListResponse JSON serialization."""
        session_data = {
            "id": 1,
            "project_id": 1,
            "agent_id": 1,
            "messages": [{"role": "user", "content": "Test"}],
            "is_active": True,
            "mcps": ["test_mcp"],
            "custom_properties": {"serialization": "test"},
            "created_at": datetime(2024, 1, 1, 12, 0, 0),
            "updated_at": datetime(2024, 1, 1, 12, 30, 0),
            "created_by": 1,
            "message_count": 1,
            "mcp_count": 1,
        }

        session = SessionResponse(**session_data)

        list_data = {"results": [session], "total": 1, "skip": 0, "limit": 10, "has_more": False}

        list_response = SessionListResponse(**list_data)
        json_data = list_response.model_dump()

        assert "results" in json_data
        assert len(json_data["results"]) == 1
        assert json_data["total"] == 1
        assert json_data["results"][0]["project_id"] == 1
        assert json_data["results"][0]["custom_properties"]["serialization"] == "test"

    def test_session_list_response_invalid_data(self):
        """Test SessionListResponse with invalid data."""
        invalid_data = {
            "results": "not_a_list",
            "total": "not_an_integer",
            "skip": -1,
            "limit": "not_an_integer",
            "has_more": "not_boolean",
        }

        with pytest.raises(ValidationError):
            SessionListResponse(**invalid_data)

    def test_session_list_response_boundary_values(self):
        """Test SessionListResponse with boundary values."""
        # Test with zero values
        list_data = {"results": [], "total": 0, "skip": 0, "limit": 0, "has_more": False}

        list_response = SessionListResponse(**list_data)
        assert list_response.total == 0
        assert list_response.skip == 0
        assert list_response.limit == 0

        # Test with large values
        large_list_data = {"results": [], "total": 999999, "skip": 999999, "limit": 999999, "has_more": True}

        large_list_response = SessionListResponse(**large_list_data)
        assert large_list_response.total == 999999
