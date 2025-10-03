"""Dependencies for API endpoints."""

from typing import Annotated

from fastapi import Depends, HTTPException, Request, status
from fastapi.security import HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.agents.catalog import AgentCatalog
from app.core.auth import get_current_user
from app.core.config import get_settings
from app.core.database import get_db_session
from app.core.template_renderer import create_mcp_renderer
from app.crud.ai_agent import AIAgentCRUD
from app.crud.integration import IntegrationCRUD
from app.crud.project import ProjectCRUD
from app.crud.user_agent_session import UserAgentSessionCRUD
from app.models.ai_agent import AIAgent
from app.models.user import User
from app.services.agent_service import AgentService
from app.services.claude_service import ClaudeCodeWrapper
from app.services.integration_service import IntegrationService
from app.services.mcp_service import McpService
from app.services.workspace_service import WorkspaceService

security = HTTPBearer()


def get_claude_code_wrapper() -> ClaudeCodeWrapper:
    """
    Dependency to get Claude Code wrapper service instance

    Returns:
        ClaudeCodeWrapper: Configured Claude Code SDK wrapper
    """
    return ClaudeCodeWrapper()


async def get_current_active_user(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    """
    Dependency to get current active user

    Args:
        current_user: Current authenticated user

    Returns:
        User: Current active user

    Raises:
        HTTPException: If user is inactive
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user",
        )
    return current_user


async def validate_request_size(request: Request) -> None:
    """
    Validate incoming request size to prevent abuse

    Args:
        request: FastAPI request object

    Raises:
        HTTPException: If request size exceeds maximum allowed
    """
    content_length_str = request.headers.get("content-length")
    settings = get_settings()
    if content_length_str:
        content_length = int(content_length_str)
        if content_length > settings.MAX_REQUEST_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"Request too large. Maximum size: {settings.MAX_REQUEST_SIZE} bytes",
            )


def validate_coding_prompt(prompt: str) -> str:
    """
    Validate and sanitize coding prompts

    Args:
        prompt: The coding prompt to validate

    Returns:
        str: Validated and sanitized prompt

    Raises:
        HTTPException: If prompt is invalid
    """
    if not prompt or not prompt.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coding prompt cannot be empty",
        )

    # Basic sanitization
    sanitized_prompt = prompt.strip()

    # Check for reasonable length
    if len(sanitized_prompt) > 10000:  # 10KB limit for prompts
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coding prompt too long. Maximum 10,000 characters allowed",
        )

    return sanitized_prompt


async def get_integration_crud(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> IntegrationCRUD:
    """
    Dependency to get IntegrationCRUD instance with current user injected.

    Args:
        session: Database session
        current_user: Current authenticated user

    Returns:
        IntegrationCRUD: CRUD instance with user filtering applied
    """
    if current_user.id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User ID is required",
        )
    return IntegrationCRUD(session, user_id=current_user.id)


async def get_integration_service(
    crud: Annotated[IntegrationCRUD, Depends(get_integration_crud)],
) -> IntegrationService:
    """Get integration service instance with current user injected."""
    return IntegrationService(crud=crud)


async def get_mcp_service(
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> McpService:
    """Dependency to get MCP service with required collaborators."""
    renderer = create_mcp_renderer()
    return McpService(integration_service=integration_service, renderer=renderer)


async def get_ai_agent_crud(
    session: Annotated[AsyncSession, Depends(get_db_session)],
) -> AIAgentCRUD:
    """
    Dependency to get AIAgentCRUD instance.
    """
    return AIAgentCRUD(model=AIAgent, session=session)


async def get_project_crud(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> ProjectCRUD:
    if current_user.id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User ID is required")
    return ProjectCRUD(session, user_id=current_user.id)


async def get_user_agent_session_crud(
    session: Annotated[AsyncSession, Depends(get_db_session)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> UserAgentSessionCRUD:
    if current_user.id is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="User ID is required")
    return UserAgentSessionCRUD(session, user_id=current_user.id)


def get_workspace_service() -> WorkspaceService:
    settings = get_settings()
    return WorkspaceService(root_dir=settings.AGENTS_DIR)


def get_agent_catalog(
    ai_agent_crud: Annotated[AIAgentCRUD, Depends(get_ai_agent_crud)],
) -> AgentCatalog:
    return AgentCatalog(crud=ai_agent_crud)


async def get_agent_service(
    project_crud: Annotated[ProjectCRUD, Depends(get_project_crud)],
    session_crud: Annotated[UserAgentSessionCRUD, Depends(get_user_agent_session_crud)],
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    mcp_service: Annotated[McpService, Depends(get_mcp_service)],
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
    ai_agent_crud: Annotated[AIAgentCRUD, Depends(get_ai_agent_crud)],
    agent_catalog: Annotated[AgentCatalog, Depends(get_agent_catalog)],
) -> AgentService:
    return AgentService(
        project_crud=project_crud,
        session_crud=session_crud,
        workspace_service=workspace_service,
        mcp_service=mcp_service,
        integration_service=integration_service,
        agent_crud=ai_agent_crud,
        agent_catalog=agent_catalog,
    )
