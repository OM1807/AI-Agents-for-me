"""Tests for agent schemas."""

from datetime import datetime

import pytest
from pydantic import ValidationError

from app.agents.enums import AgentIdentifier, AgentModule
from app.schemas.agent import AIAgentListResponse, AIAgentResponse


class TestAIAgentResponse:
    """Test AIAgentResponse schema."""

    def test_agent_response_valid_data(self):
        """Test AIAgentResponse with valid data."""
        agent_data = {
            "id": 1,
            "name": "Test Agent",
            "description": "A test agent for code analysis",
            "identifier": AgentIdentifier.CODE_ANALYSIS,
            "module": AgentModule.DEVELOPMENT,
            "tags": ["analysis", "automation"],
            "is_active": True,
            "system_prompt": "You are a helpful code analysis assistant.",
            "custom_properties_schema": {"type": "object"},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        response = AIAgentResponse(**agent_data)

        assert response.id == 1
        assert response.name == "Test Agent"
        assert response.description == "A test agent for code analysis"
        assert response.identifier == AgentIdentifier.CODE_ANALYSIS
        assert response.module == AgentModule.DEVELOPMENT
        assert response.tags == ["analysis", "automation"]
        assert response.is_active is True
        assert response.system_prompt == "You are a helpful code analysis assistant."
        assert response.custom_properties_schema == {"type": "object"}

    def test_agent_response_with_enum_strings(self):
        """Test AIAgentResponse with enum values as strings."""
        agent_data = {
            "id": 2,
            "name": "Test Case Generator",
            "description": "Generates comprehensive test cases",
            "identifier": "test_case_generation",  # String instead of enum
            "module": "project_management",  # String instead of enum
            "tags": ["testing", "project_management"],
            "is_active": True,
            "system_prompt": "You are a test case generation specialist.",
            "custom_properties_schema": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        response = AIAgentResponse(**agent_data)

        assert response.identifier == AgentIdentifier.TEST_CASE_GENERATION
        assert response.module == AgentModule.PROJECT_MANAGEMENT

    def test_agent_response_empty_tags(self):
        """Test AIAgentResponse with empty tags."""
        agent_data = {
            "id": 3,
            "name": "Simple Agent",
            "description": "A simple agent",
            "identifier": AgentIdentifier.TEST_CASE_GENERATION,
            "module": AgentModule.QUALITY_ASSURANCE,
            "tags": [],
            "is_active": False,
            "system_prompt": "You are a test generator.",
            "custom_properties_schema": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        response = AIAgentResponse(**agent_data)

        assert response.tags == []
        assert response.is_active is False

    def test_agent_response_complex_custom_schema(self):
        """Test AIAgentResponse with complex custom properties schema."""
        complex_schema = {
            "type": "object",
            "properties": {
                "analysis_type": {"type": "string", "enum": ["static", "dynamic", "hybrid"]},
                "threshold": {"type": "number", "minimum": 0, "maximum": 100},
                "enable_caching": {"type": "boolean", "default": True},
            },
            "required": ["analysis_type"],
        }

        agent_data = {
            "id": 4,
            "name": "Advanced Agent",
            "description": "An agent with complex schema",
            "identifier": AgentIdentifier.CODE_ANALYSIS,
            "module": AgentModule.DEVELOPMENT,
            "tags": ["advanced", "configurable"],
            "is_active": True,
            "system_prompt": "You are an advanced assistant.",
            "custom_properties_schema": complex_schema,
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        response = AIAgentResponse(**agent_data)

        assert response.custom_properties_schema == complex_schema
        assert "analysis_type" in response.custom_properties_schema["properties"]

    def test_agent_response_invalid_identifier(self):
        """Test AIAgentResponse with invalid identifier."""
        agent_data = {
            "id": 5,
            "name": "Invalid Agent",
            "description": "An agent with invalid identifier",
            "identifier": "invalid_identifier",
            "module": AgentModule.DEVELOPMENT,
            "tags": [],
            "is_active": True,
            "system_prompt": "Test prompt",
            "custom_properties_schema": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        with pytest.raises(ValidationError) as exc_info:
            AIAgentResponse(**agent_data)

        assert "identifier" in str(exc_info.value)

    def test_agent_response_invalid_module(self):
        """Test AIAgentResponse with invalid module."""
        agent_data = {
            "id": 6,
            "name": "Invalid Module Agent",
            "description": "An agent with invalid module",
            "identifier": AgentIdentifier.CODE_ANALYSIS,
            "module": "Invalid Module",
            "tags": [],
            "is_active": True,
            "system_prompt": "Test prompt",
            "custom_properties_schema": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        with pytest.raises(ValidationError) as exc_info:
            AIAgentResponse(**agent_data)

        assert "module" in str(exc_info.value)

    def test_agent_response_missing_required_fields(self):
        """Test AIAgentResponse with missing required fields."""
        incomplete_data = {
            "id": 7,
            "name": "Incomplete Agent",
            # Missing required fields
        }

        with pytest.raises(ValidationError) as exc_info:
            AIAgentResponse(**incomplete_data)

        error_msg = str(exc_info.value)
        assert "description" in error_msg or "identifier" in error_msg

    def test_agent_response_json_serialization(self):
        """Test AIAgentResponse JSON serialization."""
        agent_data = {
            "id": 8,
            "name": "JSON Test Agent",
            "description": "Test JSON serialization",
            "identifier": AgentIdentifier.TEST_CASE_GENERATION,
            "module": AgentModule.QUALITY_ASSURANCE,
            "tags": ["json", "test"],
            "is_active": True,
            "system_prompt": "You are a JSON test agent.",
            "custom_properties_schema": {"type": "object"},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        response = AIAgentResponse(**agent_data)
        json_data = response.model_dump()

        assert json_data["id"] == 8
        assert json_data["name"] == "JSON Test Agent"
        assert json_data["identifier"] == "test_case_generation"
        assert json_data["module"] == "quality_assurance"
        assert json_data["tags"] == ["json", "test"]


class TestAIAgentListResponse:
    """Test AIAgentListResponse schema."""

    def test_agent_list_response_valid(self):
        """Test AIAgentListResponse with valid data."""
        agent_data = {
            "id": 1,
            "name": "List Test Agent",
            "description": "Test agent for list response",
            "identifier": AgentIdentifier.CODE_ANALYSIS,
            "module": AgentModule.DEVELOPMENT,
            "tags": ["test"],
            "is_active": True,
            "system_prompt": "Test prompt",
            "custom_properties_schema": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        agent = AIAgentResponse(**agent_data)

        list_data = {"results": [agent], "total": 1, "skip": 0, "limit": 10, "has_more": False}

        list_response = AIAgentListResponse(**list_data)

        assert len(list_response.results) == 1
        assert list_response.total == 1
        assert list_response.skip == 0
        assert list_response.limit == 10
        assert list_response.has_more is False
        assert list_response.results[0].name == "List Test Agent"

    def test_agent_list_response_empty(self):
        """Test AIAgentListResponse with empty agent list."""
        list_data = {"results": [], "total": 0, "skip": 0, "limit": 10, "has_more": False}

        list_response = AIAgentListResponse(**list_data)

        assert len(list_response.results) == 0
        assert list_response.total == 0
        assert list_response.has_more is False

    def test_agent_list_response_with_pagination(self):
        """Test AIAgentListResponse with pagination."""
        # Create multiple test agents
        agents = []
        for i in range(3):
            agent_data = {
                "id": i + 1,
                "name": f"Agent {i + 1}",
                "description": f"Test agent {i + 1}",
                "identifier": AgentIdentifier.CODE_ANALYSIS if i % 2 == 0 else AgentIdentifier.TEST_CASE_GENERATION,
                "module": AgentModule.DEVELOPMENT,
                "tags": [f"tag{i + 1}"],
                "is_active": True,
                "system_prompt": "Test prompt",
                "custom_properties_schema": {},
                "created_at": datetime.now(),
                "updated_at": datetime.now(),
            }
            agents.append(AIAgentResponse(**agent_data))

        list_data = {
            "results": agents,
            "total": 25,  # Total agents in database
            "skip": 10,  # Starting from 10th agent
            "limit": 3,  # Showing 3 agents
            "has_more": True,  # More agents available
        }

        list_response = AIAgentListResponse(**list_data)

        assert len(list_response.results) == 3
        assert list_response.total == 25
        assert list_response.skip == 10
        assert list_response.limit == 3
        assert list_response.has_more is True

    def test_agent_list_response_json_serialization(self):
        """Test AIAgentListResponse JSON serialization."""
        agent_data = {
            "id": 1,
            "name": "JSON List Agent",
            "description": "Test JSON list serialization",
            "identifier": AgentIdentifier.TEST_CASE_GENERATION,
            "module": AgentModule.PROJECT_MANAGEMENT,
            "tags": ["json", "list"],
            "is_active": True,
            "system_prompt": "Test prompt",
            "custom_properties_schema": {},
            "created_at": datetime.now(),
            "updated_at": datetime.now(),
        }

        agent = AIAgentResponse(**agent_data)

        list_data = {"results": [agent], "total": 1, "skip": 0, "limit": 10, "has_more": False}

        list_response = AIAgentListResponse(**list_data)
        json_data = list_response.model_dump()

        assert "results" in json_data
        assert len(json_data["results"]) == 1
        assert json_data["total"] == 1
        assert json_data["results"][0]["name"] == "JSON List Agent"
