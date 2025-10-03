"""Tests for AI Agent model."""


from app.agents.enums import AgentIdentifier, AgentModule
from app.models.ai_agent import AIAgent


class TestAIAgentModel:
    """Test AIAgent model."""

    def test_ai_agent_creation(self):
        """Test AI Agent model creation."""
        agent = AIAgent(
            name="Test Agent",
            description="A test agent for code generation",
            identifier=AgentIdentifier.code_documentation,
            module=AgentModule.development,
            system_prompt="You are a helpful coding assistant.",
            is_active=True,
            created_by=1,
            updated_by=1,
        )
        assert agent.name == "Test Agent"
        assert agent.description == "A test agent for code generation"
        assert agent.identifier == AgentIdentifier.code_documentation
        assert agent.module == AgentModule.development
        assert agent.system_prompt == "You are a helpful coding assistant."
        assert agent.is_active
        assert agent.tags == []
        assert agent.custom_properties_schema == {}

    def test_ai_agent_with_tags(self):
        """Test AI Agent with custom tags."""
        tags = ["python", "testing", "automation"]
        custom_schema = {"type": "object", "properties": {"analysis_type": {"type": "string"}}}

        agent = AIAgent(
            name="Configured Agent",
            description="Agent with custom tags",
            identifier=AgentIdentifier.test_case_generation,
            module=AgentModule.testing,
            system_prompt="Generate comprehensive tests.",
            tags=tags,
            custom_properties_schema=custom_schema,
            created_by=1,
            updated_by=1,
        )

        assert agent.tags == tags
        assert agent.custom_properties_schema == custom_schema

    def test_ai_agent_properties(self):
        """Test AI Agent properties."""
        # Active agent
        active_agent = AIAgent(
            name="Active Agent",
            description="Test description",
            identifier=AgentIdentifier.code_documentation,
            module=AgentModule.development,
            system_prompt="Test prompt",
            is_active=True,
            created_by=1,
            updated_by=1,
        )

        assert active_agent.is_active is True
        assert active_agent.display_name == "Active Agent"

        # Inactive agent
        inactive_agent = AIAgent(
            name="Inactive Agent",
            description="Test description",
            identifier=AgentIdentifier.code_documentation,
            module=AgentModule.development,
            system_prompt="Test prompt",
            is_active=False,
            created_by=1,
            updated_by=1,
        )

        assert inactive_agent.is_active is False

    def test_ai_agent_repr(self):
        """Test AI Agent string representation."""
        agent = AIAgent(
            name="Repr Agent",
            description="Test description",
            identifier=AgentIdentifier.jira,
            module=AgentModule.project_management,
            system_prompt="Test prompt",
            created_by=1,
            updated_by=1,
        )
        agent.id = 42

        repr_str = repr(agent)
        assert "AIAgent" in repr_str
        assert "id=42" in repr_str
        assert "name='Repr Agent'" in repr_str
        assert "identifier='jira'" in repr_str

    def test_ai_agent_defaults(self):
        """Test AI Agent default values."""
        agent = AIAgent(
            name="Default Agent",
            description="Test description",
            identifier=AgentIdentifier.test_case_generation,
            module=AgentModule.testing,
            system_prompt="Test prompt",
            created_by=1,
            updated_by=1,
        )

        assert agent.is_active
        assert agent.tags == []
        assert agent.custom_properties_schema == {}

    def test_ai_agent_with_deployment_module(self):
        """Test AI Agent with deployment module."""
        agent = AIAgent(
            name="Project Agent",
            description="Agent with deployment capabilities",
            identifier=AgentIdentifier.code_documentation,
            module=AgentModule.deployment,
            system_prompt="Deploy applications safely.",
            created_by=1,
            updated_by=1,
        )

        assert agent.name == "Project Agent"
        assert agent.module == AgentModule.deployment

    def test_ai_agent_tag_manipulation(self):
        """Test AI Agent tag manipulation methods."""
        agent = AIAgent(
            name="Tag Test Agent",
            description="Agent for testing tag methods",
            identifier=AgentIdentifier.code_documentation,
            module=AgentModule.development,
            system_prompt="Test prompt",
            created_by=1,
            updated_by=1,
        )

        # Test initial state
        assert agent.tags == []
        assert agent.tag_list == []
        assert not agent.has_tag("python")

        # Test adding tags
        agent.add_tag("python")
        assert agent.tags == ["python"]
        assert agent.tag_list == ["python"]
        assert agent.has_tag("python")

        # Test adding duplicate tag (should not duplicate)
        agent.add_tag("python")
        assert agent.tags == ["python"]

        # Test adding more tags
        agent.add_tag("testing")
        agent.add_tag("automation")
        assert len(agent.tags) == 3
        assert "python" in agent.tags
        assert "testing" in agent.tags
        assert "automation" in agent.tags

        # Test removing tag
        agent.remove_tag("testing")
        assert "testing" not in agent.tags
        assert len(agent.tags) == 2

        # Test removing non-existent tag (should not error)
        agent.remove_tag("nonexistent")
        assert len(agent.tags) == 2

        # Test has_tag method
        assert agent.has_tag("python")
        assert agent.has_tag("automation")
        assert not agent.has_tag("testing")
        assert not agent.has_tag("nonexistent")

    def test_ai_agent_tag_list_property(self):
        """Test AI Agent tag_list property with different scenarios."""
        # Test with None tags
        agent = AIAgent(
            name="None Tags Agent",
            description="Agent with None tags",
            identifier=AgentIdentifier.jira,
            module=AgentModule.project_management,
            system_prompt="Test prompt",
            tags=None,
            created_by=1,
            updated_by=1,
        )
        assert agent.tag_list == []

        # Test with pre-populated tags list
        tags = ["jira", "project", "management"]
        agent_with_tags = AIAgent(
            name="Preset Tags Agent",
            description="Agent with preset tags",
            identifier=AgentIdentifier.jira,
            module=AgentModule.project_management,
            system_prompt="Test prompt",
            tags=tags,
            created_by=1,
            updated_by=1,
        )
        assert agent_with_tags.tag_list == tags
        assert agent_with_tags.tag_list is not tags  # Should be a copy, not the same object
