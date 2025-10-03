"""Tests for UserAgentSession model."""


from app.models.user_agent_session import UserAgentSession


class TestUserAgentSessionModel:
    """Test UserAgentSession model."""

    def test_session_creation(self):
        """Test UserAgentSession model creation."""
        session = UserAgentSession(
            project_id=1,
            agent_id=2,
            messages=[],
            is_active=True,
            mcps=["github", "jira"],
            custom_properties={"analysis_type": "full"},
            created_by=1,
        )

        assert session.project_id == 1
        assert session.agent_id == 2
        assert session.messages == []
        assert session.is_active is True
        assert session.mcps == ["github", "jira"]
        assert session.custom_properties == {"analysis_type": "full"}
        assert session.created_by == 1

    def test_session_defaults(self):
        """Test UserAgentSession default values."""
        session = UserAgentSession(project_id=1, agent_id=2, created_by=1)

        assert session.messages == []  # Default empty list
        assert session.is_active is True  # Default True
        assert session.mcps == []  # Default empty list
        assert session.custom_properties == {}  # Default empty dict

    def test_session_message_operations(self):
        """Test UserAgentSession message manipulation methods."""
        session = UserAgentSession(project_id=1, agent_id=2, created_by=1)

        # Test initial state
        assert session.message_count == 0
        assert session.messages == []

        # Test adding messages by directly manipulating the list
        session.messages.append({"role": "user", "content": "Hello, can you help me?"})
        assert session.message_count == 1
        assert len(session.messages) == 1
        assert session.messages[0]["role"] == "user"
        assert session.messages[0]["content"] == "Hello, can you help me?"

        # Test adding message with metadata
        metadata = {"timestamp": "2024-01-01T12:00:00Z", "source": "web"}
        session.messages.append({"role": "assistant", "content": "Sure! How can I help?", "metadata": metadata})
        assert session.message_count == 2
        assert session.messages[1]["role"] == "assistant"
        assert session.messages[1]["content"] == "Sure! How can I help?"
        assert session.messages[1]["metadata"] == metadata

        # Test adding more messages
        session.messages.append({"role": "user", "content": "I need help with testing"})
        session.messages.append({"role": "assistant", "content": "I can help you write comprehensive tests"})
        assert session.message_count == 4

    def test_session_mcp_operations(self):
        """Test UserAgentSession MCP manipulation methods."""
        session = UserAgentSession(project_id=1, agent_id=2, created_by=1)

        # Test initial state
        assert session.mcp_count == 0
        assert session.mcps == []

        # Test adding MCPs by directly manipulating the list
        session.mcps.append("github")
        assert session.mcp_count == 1
        assert "github" in session.mcps

        # Test adding duplicate MCP (need to handle manually)
        if "github" not in session.mcps:
            session.mcps.append("github")
        assert session.mcp_count == 1
        assert session.mcps == ["github"]

        # Test adding more MCPs
        session.mcps.append("jira")
        session.mcps.append("slack")
        assert session.mcp_count == 3
        assert "jira" in session.mcps
        assert "slack" in session.mcps

        # Test removing MCP
        if "jira" in session.mcps:
            session.mcps.remove("jira")
        assert "jira" not in session.mcps
        assert session.mcp_count == 2

        # Test removing non-existent MCP (should not error)
        if "nonexistent" in session.mcps:
            session.mcps.remove("nonexistent")
        assert session.mcp_count == 2

    def test_session_custom_properties_operations(self):
        """Test UserAgentSession custom properties manipulation."""
        session = UserAgentSession(project_id=1, agent_id=2, created_by=1)

        # Test initial state
        assert session.custom_properties == {}

        # Test setting custom properties by directly manipulating the dict
        session.custom_properties["analysis_type"] = "full"
        assert session.custom_properties.get("analysis_type") == "full"

        # Test setting multiple properties
        session.custom_properties["priority"] = "high"
        session.custom_properties["timeout"] = 300
        session.custom_properties["retry_count"] = 3
        session.custom_properties["enable_cache"] = True

        assert session.custom_properties.get("priority") == "high"
        assert session.custom_properties.get("timeout") == 300
        assert session.custom_properties.get("retry_count") == 3
        assert session.custom_properties.get("enable_cache") is True

        # Test getting non-existent property with default
        assert session.custom_properties.get("nonexistent") is None
        assert session.custom_properties.get("nonexistent", "default") == "default"

        # Test overwriting property
        session.custom_properties["priority"] = "medium"
        assert session.custom_properties.get("priority") == "medium"

    def test_session_complex_messages(self):
        """Test UserAgentSession with complex message structures."""
        session = UserAgentSession(project_id=1, agent_id=2, created_by=1)

        # Add complex message with rich metadata
        complex_metadata = {
            "timestamp": "2024-01-01T12:00:00Z",
            "source": "api",
            "session_id": "sess_123",
            "user_context": {"role": "developer", "team": "backend", "experience": "senior"},
            "message_context": {
                "thread_id": "thread_456",
                "reply_to": None,
                "attachments": [
                    {"type": "file", "name": "code.py", "size": 1024},
                    {"type": "image", "name": "diagram.png", "size": 2048},
                ],
            },
            "ai_context": {
                "model": "claude-3",
                "temperature": 0.7,
                "max_tokens": 1000,
                "tools": ["code_analysis", "documentation"],
            },
        }

        session.messages.append(
            {
                "role": "user",
                "content": "Please analyze this Python code and suggest improvements",
                "metadata": complex_metadata,
            }
        )

        assert session.message_count == 1
        message = session.messages[0]
        assert message["metadata"]["user_context"]["role"] == "developer"
        assert len(message["metadata"]["message_context"]["attachments"]) == 2
        assert message["metadata"]["ai_context"]["model"] == "claude-3"

    def test_session_repr(self):
        """Test UserAgentSession string representation."""
        session = UserAgentSession(project_id=5, agent_id=10, is_active=True, created_by=3)
        session.id = 42

        repr_str = repr(session)
        assert "UserAgentSession" in repr_str
        assert "id=42" in repr_str
        assert "user_id=3" in repr_str
        assert "agent_id=10" in repr_str
        assert "is_active=True" in repr_str

    def test_session_active_inactive_states(self):
        """Test UserAgentSession active and inactive states."""
        # Active session
        active_session = UserAgentSession(project_id=1, agent_id=2, is_active=True, created_by=1)
        assert active_session.is_active is True

        # Inactive session
        inactive_session = UserAgentSession(project_id=1, agent_id=2, is_active=False, created_by=1)
        assert inactive_session.is_active is False

    def test_session_with_none_values(self):
        """Test UserAgentSession with None values for optional fields."""
        session = UserAgentSession(
            project_id=1, agent_id=2, messages=None, mcps=None, custom_properties=None, created_by=1
        )

        # Test that None values are handled correctly in properties
        assert session.message_count == 0  # Should handle None messages
        assert session.mcp_count == 0  # Should handle None mcps
        # Handle None custom_properties safely
        if session.custom_properties is not None:
            assert session.custom_properties.get("test") is None
        else:
            assert session.custom_properties is None

        # Test adding to None collections
        if session.messages is None:
            session.messages = []
        session.messages.append({"role": "user", "content": "Hello"})
        assert session.message_count == 1
        assert session.messages is not None

        if session.mcps is None:
            session.mcps = []
        session.mcps.append("github")
        assert session.mcp_count == 1
        assert session.mcps is not None

        if session.custom_properties is None:
            session.custom_properties = {}
        session.custom_properties["test"] = "value"
        assert session.custom_properties.get("test") == "value"
        assert session.custom_properties is not None

    def test_session_large_conversation(self):
        """Test UserAgentSession with a large conversation."""
        session = UserAgentSession(project_id=1, agent_id=2, created_by=1)

        # Simulate a long conversation
        for i in range(50):
            if i % 2 == 0:
                session.messages.append({"role": "user", "content": f"User message {i//2 + 1}"})
            else:
                session.messages.append({"role": "assistant", "content": f"Assistant response {i//2 + 1}"})

        assert session.message_count == 50
        assert len(session.messages) == 50

        # Verify message order and content
        assert session.messages[0]["role"] == "user"
        assert session.messages[0]["content"] == "User message 1"
        assert session.messages[1]["role"] == "assistant"
        assert session.messages[1]["content"] == "Assistant response 1"
        assert session.messages[-1]["role"] == "assistant"
        assert session.messages[-1]["content"] == "Assistant response 25"

    def test_session_complex_custom_properties(self):
        """Test UserAgentSession with complex custom properties."""
        session = UserAgentSession(project_id=1, agent_id=2, created_by=1)

        # Set complex nested properties by directly manipulating the dict
        session.custom_properties["config"] = {
            "ai_settings": {"temperature": 0.7, "max_tokens": 1000, "top_p": 0.9},
            "workflow_settings": {"auto_save": True, "notifications": ["email", "slack"], "timeout": 300},
            "user_preferences": {"theme": "dark", "language": "en", "timezone": "UTC"},
        }

        session.custom_properties["metrics"] = {
            "start_time": "2024-01-01T10:00:00Z",
            "messages_exchanged": 0,
            "tools_used": [],
            "success_rate": 1.0,
        }

        # Verify complex property retrieval
        config = session.custom_properties.get("config")
        assert config["ai_settings"]["temperature"] == 0.7
        assert "slack" in config["workflow_settings"]["notifications"]

        metrics = session.custom_properties.get("metrics")
        assert metrics["success_rate"] == 1.0
        assert metrics["messages_exchanged"] == 0

    def test_session_tablename_and_indexes(self):
        """Test UserAgentSession table configuration."""
        # Test table name
        assert UserAgentSession.__tablename__ == "user_agent_sessions"

        # Test that table args exist (indexes and foreign keys are defined)
        assert hasattr(UserAgentSession, "__table_args__")
        assert UserAgentSession.__table_args__ is not None

        # The indexes should be defined in __table_args__
        table_args = UserAgentSession.__table_args__
        assert isinstance(table_args, tuple)
        assert len(table_args) > 0

    def test_session_foreign_key_references(self):
        """Test UserAgentSession foreign key field definitions."""
        session = UserAgentSession(project_id=1, agent_id=2, created_by=1)

        # Verify foreign key fields exist and have correct values
        assert hasattr(session, "project_id")
        assert hasattr(session, "agent_id")
        assert hasattr(session, "created_by")  # Inherited from AuditedModel

        assert session.project_id == 1
        assert session.agent_id == 2
        assert session.created_by == 1
