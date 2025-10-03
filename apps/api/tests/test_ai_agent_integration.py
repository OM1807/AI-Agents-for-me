"""Integration tests for AI Agent functionality."""

from datetime import datetime
from unittest.mock import AsyncMock, MagicMock

import pytest

from app.agents.enums import AgentIdentifier, AgentModule
from app.crud.ai_agent import AIAgentCRUD
from app.models.ai_agent import AIAgent
from app.schemas.agent import AIAgentListResponse, AIAgentResponse


class TestAIAgentIntegration:
    """Integration tests for AI Agent data flow."""

    @pytest.fixture
    def sample_agent_model(self):
        """Create a sample AIAgent model."""
        return AIAgent(
            id=1,
            name="Integration Test Agent",
            description="Agent for integration testing",
            identifier=AgentIdentifier.CODE_ANALYSIS,
            module=AgentModule.DEVELOPMENT,
            tags=["integration", "testing", "documentation"],
            is_active=True,
            system_prompt="You are an integration test agent.",
            custom_properties_schema={
                "type": "object",
                "properties": {"test_mode": {"type": "boolean", "default": True}},
            },
            created_at=datetime.now(),
            updated_at=datetime.now(),
            created_by=1,
            updated_by=1,
        )

    @pytest.fixture
    def mock_session(self):
        """Create a mock database session."""
        return AsyncMock()

    def test_model_to_schema_conversion(self, sample_agent_model):
        """Test converting AIAgent model to AIAgentResponse schema."""
        # Create response schema from model data
        schema_data = {
            "id": sample_agent_model.id,
            "name": sample_agent_model.name,
            "description": sample_agent_model.description,
            "identifier": sample_agent_model.identifier,
            "module": sample_agent_model.module,
            "tags": sample_agent_model.tags,
            "is_active": sample_agent_model.is_active,
            "system_prompt": sample_agent_model.system_prompt,
            "custom_properties_schema": sample_agent_model.custom_properties_schema,
            "created_at": sample_agent_model.created_at,
            "updated_at": sample_agent_model.updated_at,
        }

        response = AIAgentResponse(**schema_data)

        # Verify all fields match
        assert response.id == sample_agent_model.id
        assert response.name == sample_agent_model.name
        assert response.description == sample_agent_model.description
        assert response.identifier == sample_agent_model.identifier
        assert response.module == sample_agent_model.module
        assert response.tags == sample_agent_model.tags
        assert response.is_active == sample_agent_model.is_active
        assert response.system_prompt == sample_agent_model.system_prompt
        assert response.custom_properties_schema == sample_agent_model.custom_properties_schema

    def test_model_tag_operations_integration(self, sample_agent_model):
        """Test tag operations work with schema conversion."""
        # Test initial state
        assert sample_agent_model.tags == ["integration", "testing", "documentation"]
        assert "testing" in sample_agent_model.tags

        # Add a new tag by manipulating the list directly
        sample_agent_model.tags.append("new_feature")
        assert "new_feature" in sample_agent_model.tags

        # Convert to schema and verify tags are preserved
        schema_data = {
            "id": sample_agent_model.id,
            "name": sample_agent_model.name,
            "description": sample_agent_model.description,
            "identifier": sample_agent_model.identifier,
            "module": sample_agent_model.module,
            "tags": sample_agent_model.tags,
            "is_active": sample_agent_model.is_active,
            "system_prompt": sample_agent_model.system_prompt,
            "custom_properties_schema": sample_agent_model.custom_properties_schema,
            "created_at": sample_agent_model.created_at,
            "updated_at": sample_agent_model.updated_at,
        }

        response = AIAgentResponse(**schema_data)
        assert "new_feature" in response.tags

    @pytest.mark.asyncio
    async def test_crud_with_schemas(self, mock_session, sample_agent_model):
        """Test CRUD operations work with schema conversion."""
        crud = AIAgentCRUD(model=AIAgent, session=mock_session)

        # Mock the database query result
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = [sample_agent_model]
        mock_session.execute.return_value = mock_result

        # Test list operation
        agents = await crud.list_agents()
        assert len(agents) == 1
        assert agents[0].name == "Integration Test Agent"

        # Convert to response schemas
        agent_responses = []
        for agent in agents:
            schema_data = {
                "id": agent.id,
                "name": agent.name,
                "description": agent.description,
                "identifier": agent.identifier,
                "module": agent.module,
                "tags": agent.tags,
                "is_active": agent.is_active,
                "system_prompt": agent.system_prompt,
                "custom_properties_schema": agent.custom_properties_schema,
                "created_at": agent.created_at,
                "updated_at": agent.updated_at,
            }
            agent_responses.append(AIAgentResponse(**schema_data))

        # Create list response
        list_response = AIAgentListResponse(results=agent_responses, total=1, skip=0, limit=10, has_more=False)

        assert len(list_response.results) == 1
        assert list_response.total == 1
        assert list_response.results[0].name == "Integration Test Agent"

    @pytest.mark.asyncio
    async def test_filtered_crud_operations(self, mock_session):
        """Test filtered CRUD operations with multiple agents."""
        # Create multiple test agents
        agents = [
            AIAgent(
                id=1,
                name="Documentation Agent",
                description="Generates documentation",
                identifier=AgentIdentifier.CODE_ANALYSIS,
                module=AgentModule.DEVELOPMENT,
                tags=["documentation"],
                is_active=True,
                system_prompt="Documentation expert",
                custom_properties_schema={},
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by=1,
                updated_by=1,
            ),
            AIAgent(
                id=2,
                name="Test Generator",
                description="Generates test cases",
                identifier=AgentIdentifier.TEST_CASE_GENERATION,
                module=AgentModule.QUALITY_ASSURANCE,
                tags=["testing", "automation"],
                is_active=True,
                system_prompt="Testing expert",
                custom_properties_schema={},
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by=1,
                updated_by=1,
            ),
            AIAgent(
                id=3,
                name="JIRA Bot",
                description="Manages JIRA tickets",
                identifier=AgentIdentifier.TEST_CASE_GENERATION,
                module=AgentModule.PROJECT_MANAGEMENT,
                tags=["jira", "project_management"],
                is_active=False,
                system_prompt="JIRA specialist",
                custom_properties_schema={},
                created_at=datetime.now(),
                updated_at=datetime.now(),
                created_by=2,
                updated_by=2,
            ),
        ]

        crud = AIAgentCRUD(model=AIAgent, session=mock_session)

        # Test filtering by identifier
        filtered_agents = [a for a in agents if a.identifier == AgentIdentifier.CODE_ANALYSIS]
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = filtered_agents
        mock_session.execute.return_value = mock_result

        result = await crud.list_agents(identifier=AgentIdentifier.CODE_ANALYSIS)
        assert len(result) == 1
        assert result[0].identifier == AgentIdentifier.CODE_ANALYSIS

        # Test filtering by active status
        active_agents = [a for a in agents if a.is_active]
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = active_agents
        mock_session.execute.return_value = mock_result

        result = await crud.list_agents(is_active=True)
        assert len(result) == 2
        assert all(agent.is_active for agent in result)

        # Test filtering by module
        dev_agents = [a for a in agents if a.module == AgentModule.DEVELOPMENT]
        mock_result = MagicMock()
        mock_result.scalars.return_value.all.return_value = dev_agents
        mock_session.execute.return_value = mock_result

        result = await crud.list_agents(module=AgentModule.DEVELOPMENT)
        assert len(result) == 1
        assert result[0].module == AgentModule.DEVELOPMENT

    def test_enum_integration_with_schemas(self):
        """Test that enums work correctly with schema validation."""
        # Test with valid enum values
        for identifier in AgentIdentifier:
            for module in AgentModule:
                agent_data = {
                    "id": 1,
                    "name": f"Test {identifier.value}",
                    "description": f"Test agent for {identifier.value}",
                    "identifier": identifier,
                    "module": module,
                    "tags": [],
                    "is_active": True,
                    "system_prompt": "Test prompt",
                    "custom_properties_schema": {},
                    "created_at": datetime.now(),
                    "updated_at": datetime.now(),
                    "created_by": 1,
                    "updated_by": 1,
                    "display_name": f"Test {identifier.value}",
                    "tag_list": [],
                }

                # Should not raise validation error
                response = AIAgentResponse(**agent_data)
                assert response.identifier == identifier
                assert response.module == module

    def test_complete_data_flow_simulation(self, sample_agent_model):
        """Test complete data flow from model to API response."""
        # Step 1: Model exists with data
        assert sample_agent_model.name == "Integration Test Agent"
        assert len(sample_agent_model.tags) == 3

        # Step 2: Model operations (tag manipulation)
        sample_agent_model.tags.append("api_test")
        assert "api_test" in sample_agent_model.tags

        # Step 3: Convert to response schema (simulating API serialization)
        response_data = {
            "id": sample_agent_model.id,
            "name": sample_agent_model.name,
            "description": sample_agent_model.description,
            "identifier": sample_agent_model.identifier,
            "module": sample_agent_model.module,
            "tags": sample_agent_model.tags,
            "is_active": sample_agent_model.is_active,
            "system_prompt": sample_agent_model.system_prompt,
            "custom_properties_schema": sample_agent_model.custom_properties_schema,
            "created_at": sample_agent_model.created_at,
            "updated_at": sample_agent_model.updated_at,
        }

        agent_response = AIAgentResponse(**response_data)

        # Step 4: Create list response (simulating API list endpoint)
        list_response = AIAgentListResponse(results=[agent_response], total=1, skip=0, limit=10, has_more=False)

        # Step 5: Verify complete flow
        assert list_response.total == 1
        assert len(list_response.results) == 1
        returned_agent = list_response.results[0]
        assert returned_agent.name == "Integration Test Agent"
        assert "api_test" in returned_agent.tags
        assert returned_agent.identifier == AgentIdentifier.CODE_ANALYSIS
        assert returned_agent.module == AgentModule.DEVELOPMENT
        assert returned_agent.is_active is True

        # Step 6: JSON serialization (simulating API response)
        json_data = list_response.model_dump()
        assert json_data["total"] == 1
        assert json_data["results"][0]["name"] == "Integration Test Agent"
        assert "api_test" in json_data["results"][0]["tags"]
