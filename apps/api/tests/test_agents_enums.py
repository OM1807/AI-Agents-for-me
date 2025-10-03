"""Tests for agent enums."""


from app.agents.enums import AgentIdentifier, AgentModule


class TestAgentIdentifier:
    """Test AgentIdentifier enum."""

    def test_agent_identifier_values(self):
        """Test all agent identifier values are valid."""
        expected_values = {
            "code_analysis",
            "test_case_generation",
        }
        actual_values = {ai.value for ai in AgentIdentifier}
        assert actual_values == expected_values

    def test_agent_identifier_string_conversion(self):
        """Test agent identifiers can be converted to strings."""
        assert AgentIdentifier.CODE_ANALYSIS.value == "code_analysis"
        assert AgentIdentifier.TEST_CASE_GENERATION.value == "test_case_generation"

    def test_agent_identifier_comparison(self):
        """Test agent identifier comparison with strings."""
        assert AgentIdentifier.CODE_ANALYSIS == "code_analysis"
        assert AgentIdentifier.CODE_ANALYSIS != "invalid_type"

    def test_agent_identifier_iteration(self):
        """Test that all agent identifiers can be iterated."""
        identifiers = list(AgentIdentifier)
        assert len(identifiers) == 2
        assert AgentIdentifier.CODE_ANALYSIS in identifiers
        assert AgentIdentifier.TEST_CASE_GENERATION in identifiers


class TestAgentModule:
    """Test AgentModule enum."""

    def test_agent_module_values(self):
        """Test all agent module values are valid."""
        expected_values = {
            "development",
            "project_management",
            "quality_assurance",
        }
        actual_values = {am.value for am in AgentModule}
        assert actual_values == expected_values

    def test_agent_module_string_conversion(self):
        """Test agent modules can be converted to strings."""
        assert AgentModule.DEVELOPMENT.value == "development"
        assert AgentModule.PROJECT_MANAGEMENT.value == "project_management"
        assert AgentModule.QUALITY_ASSURANCE.value == "quality_assurance"

    def test_agent_module_comparison(self):
        """Test agent module comparison with strings."""
        assert AgentModule.DEVELOPMENT == "development"
        assert AgentModule.PROJECT_MANAGEMENT == "project_management"
        assert AgentModule.DEVELOPMENT != "invalid_module"

    def test_agent_module_iteration(self):
        """Test that all agent modules can be iterated."""
        modules = list(AgentModule)
        assert len(modules) == 3
        assert AgentModule.DEVELOPMENT in modules
        assert AgentModule.PROJECT_MANAGEMENT in modules
        assert AgentModule.QUALITY_ASSURANCE in modules
