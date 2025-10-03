"""AI Agent API endpoints for read-only operations and streaming runs."""

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sse_starlette import EventSourceResponse
from starlette.responses import Response, StreamingResponse

from app.agents.enums import AgentIdentifier, AgentModule
from app.api.deps import get_agent_service, get_ai_agent_crud, get_current_active_user, validate_request_size
from app.crud.ai_agent import AIAgentCRUD
from app.models.user import User
from app.schemas.agent import AIAgentListResponse, AIAgentResponse
from app.schemas.agent_run import AgentRunRequest
from app.schemas.session import SessionCreate, SessionResponse
from app.services.agent_service import AgentService
from app.streaming.ai_v4_adapter import events_to_ai_v4
from app.streaming.sse_adapter import events_to_sse, events_to_ui_message_stream

router = APIRouter()


@router.get(
    "",
    response_model=AIAgentListResponse,
    summary="List AI agents",
    description="Get all available AI agents with optional filtering.",
)
async def list_agents(
    *,
    skip: int = Query(0, ge=0, description="Number of records to skip for pagination"),
    limit: int = Query(100, ge=1, le=100, description="Maximum number of records to return"),
    identifier: AgentIdentifier | None = Query(None, description="Filter by agent identifier"),
    module: AgentModule | None = Query(None, description="Filter by agent module"),
    is_active: bool | None = Query(None, description="Filter by active status"),
    search: str | None = Query(None, description="Search in agent name and description"),
    tags: str | None = Query(None, description="Comma-separated list of tags to filter by"),
    agent_crud: Annotated[AIAgentCRUD, Depends(get_ai_agent_crud)],
) -> AIAgentListResponse:
    """Get all available AI agents with optional filtering."""

    # Parse tags from comma-separated string
    tag_list = None
    if tags:
        tag_list = [tag.strip() for tag in tags.split(",") if tag.strip()]

    # Get agents from database
    agents = await agent_crud.list_agents(
        identifier=identifier,
        module=module,
        is_active=is_active,
        search=search,
        tags=tag_list,
        skip=skip,
        limit=limit,
    )

    # Convert to response models
    agent_responses = [AIAgentResponse.model_validate(agent) for agent in agents]

    # Calculate pagination metadata
    total = len(agent_responses)  # This is a simplified approach
    has_more = len(agent_responses) == limit  # Simplified check

    return AIAgentListResponse(
        results=agent_responses,
        total=total,
        skip=skip,
        limit=limit,
        has_more=has_more,
    )


@router.get(
    "/{agent_id}",
    response_model=AIAgentResponse,
    summary="Get AI agent by ID",
    description="Get detailed information about a specific AI agent by its ID.",
)
async def get_agent(
    *,
    agent_id: int,
    agent_crud: Annotated[AIAgentCRUD, Depends(get_ai_agent_crud)],
) -> AIAgentResponse:
    """Get detailed information about a specific AI agent."""
    agent = await agent_crud.get_agent_by_id(agent_id)
    if not agent:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Agent not found")
    return AIAgentResponse.model_validate(agent)


@router.post(
    "/{agent_type}/run",
    summary="Run an agent session and stream results",
    description=(
        "Run an agent in an existing session and stream results. "
        "You must create a session first using the /sessions endpoint. "
        "Select protocol via the 'protocol' query param: 'v5' (AI SDK UI data stream), 'v4' (AI SDK v4 frames), "
        "or 'sse' (Server-Sent Events)."
    ),
)
async def run_agent(
    *,
    agent_type: AgentIdentifier,
    body: AgentRunRequest,
    session_id: int = Query(..., description="Session ID to run the agent in"),
    protocol: Literal["v5", "v4", "sse"] = Query(
        "v4",
        description=(
            "Streaming protocol: 'v5' (AI SDK UI data stream), 'v4' (AI SDK v4 frames), or 'sse' (Server-Sent Events)"
        ),
    ),
    include_event_names: bool = Query(
        True, description="For protocol='sse': if true, include 'event:' field; if false, send data-only messages"
    ),
    agent_service: Annotated[AgentService, Depends(get_agent_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
    _size_guard: Annotated[None, Depends(validate_request_size)],
) -> Response:
    """Run an agent in an existing session."""

    # Use the start method which now handles existing sessions
    events = await agent_service.run(
        user_id=current_user.id,  # type: ignore[arg-type]
        agent_identifier=agent_type,
        session_id=session_id,
        messages=body.messages,
    )

    base_headers = {
        "x-session-id": str(session_id),
        "Cache-Control": "no-cache, no-store, must-revalidate",
        "Pragma": "no-cache",
        "X-Accel-Buffering": "no",
        "Connection": "keep-alive",
    }

    if protocol == "sse":
        return EventSourceResponse(
            events_to_sse(events, data_only=not include_event_names), headers=base_headers, ping=30
        )

    if protocol == "v5":
        headers = {
            **base_headers,
            "x-vercel-ai-ui-message-stream": "v1",
        }
        return EventSourceResponse(events_to_ui_message_stream(events), headers=headers, ping=30)

    headers = {**base_headers, "x-vercel-ai-data-stream": "v1"}
    return StreamingResponse(events_to_ai_v4(events), media_type="text/plain", headers=headers)


@router.post(
    "/{agent_type}/sessions",
    response_model=SessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new session for an agent",
    description="Create a new session for the specified agent with an associated project and workspace.",
)
async def create_session(
    *,
    agent_type: AgentIdentifier,
    body: SessionCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    agent_service: Annotated[AgentService, Depends(get_agent_service)],
) -> SessionResponse:
    """Create a new session for the specified agent."""

    # Delegate to agent service
    session_data = await agent_service.create_session(
        user_id=current_user.id,  # type: ignore
        agent_identifier=agent_type.value,  # Pass the string value
        project_name=body.project_name,
        mcps=body.mcps,
        custom_properties=body.custom_properties,
    )

    return SessionResponse(**session_data)
