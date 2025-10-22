"""Tests for the Requirements to Code workflow."""

import pytest
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock

from app.agents.enums import AgentIdentifier
from app.agents.workflows.requirements_to_code import RequirementsToCodeWorkflow
from app.models.user_agent_session import UserAgentSession


@pytest.fixture
def mock_integration_service():
    """Mock integration service."""
    service = MagicMock()
    service.crud.get_by_provider = AsyncMock(return_value=MagicMock(id=1))
    service.get_access_token = AsyncMock(return_value="ghp_test_token")
    return service


@pytest.fixture
def workflow(tmp_path, mock_integration_service):
    """Create a workflow instance for testing."""
    return RequirementsToCodeWorkflow(
        workspace_dir=tmp_path,
        mcp_configs={},
        integration_service=mock_integration_service,
    )


@pytest.fixture
def sample_session():
    """Create a sample UserAgentSession for tests."""
    return UserAgentSession(
        id=1,
        project_id=10,
        agent_id=5,
        custom_properties={
            "inputs": [
                {
                    "type": "issue",
                    "provider": "jira",
                    "key": "PROJ-123",
                }
            ],
            "output_config": {
                "type": "new_repo",
                "repo_name": "test-project",
            },
            "options": {
                "generate_tests": True,
                "generate_docs": True,
            },
        },
        created_by=1,
    )


@pytest.mark.asyncio
async def test_workflow_initialization(workflow):
    """Test that the workflow initializes with the correct identifier."""
    assert workflow.identifier == AgentIdentifier.REQUIREMENTS_TO_CODE
    assert workflow.code_dir.name == "code"


@pytest.mark.asyncio
async def test_prepare_creates_directories(workflow, sample_session):
    """Test that the prepare step creates necessary directories."""
    events = []
    async for event in workflow.prepare(session=sample_session, messages=[]):
        events.append(event)

    assert workflow.code_dir.exists()


@pytest.mark.asyncio
async def test_fetch_jira_ticket(workflow):
    """Test the placeholder for Jira ticket fetching."""
    ticket = await workflow._fetch_jira_ticket("PROJ-123")
    assert "key" in ticket
    assert ticket["key"] == "PROJ-123"


@pytest.mark.asyncio
async def test_process_document_file(workflow, tmp_path):
    """Test the processing of a local document file."""
    # Create a dummy user storage directory and file for the test
    user_files_dir = tmp_path / "user_storage"
    user_files_dir.mkdir()
    test_file = user_files_dir / "test.txt"
    test_file.write_text("Test requirements")

    # The workflow copies from a predefined user storage, so we patch it
    workflow.user_storage_path = user_files_dir

    result = await workflow._process_document_file("test.txt")
    assert result["file_name"] == "test.txt"
    assert "Test requirements" in result["content"]


@pytest.mark.asyncio
async def test_run_workflow(workflow, sample_session):
    """Test a full run of the workflow with a mocked orchestrator."""
    messages = [{"role": "user", "content": "Generate code"}]

    # Mock the orchestrator to simulate an AI response
    async def mock_run_generator():
        yield {"type": "text", "data": {"text": "Generating code..."}}
        yield {"type": "finish", "data": {"finishReason": "stop"}}

    workflow.orchestrator.run = AsyncMock(return_value=mock_run_generator())

    events = []
    async for event in workflow.run(session=sample_session, messages=messages):
        events.append(event)

    assert len(events) > 0
    assert any(e.get("type") == "finish" for e in events)
