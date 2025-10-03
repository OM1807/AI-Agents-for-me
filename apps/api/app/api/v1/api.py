from fastapi import APIRouter

from app.api.v1.endpoints import agents, auth, code_assistance, file_upload, integration_clients, integrations, projects

api_router = APIRouter()

# Authentication endpoints
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"],
    responses={
        401: {"description": "Unauthorized"},
        400: {"description": "Bad request"},
        422: {"description": "Validation error"},
    },
)

# Project endpoints
api_router.include_router(
    projects.router,
    prefix="/projects",
    tags=["Projects"],
    responses={
        401: {"description": "Unauthorized"},
        404: {"description": "Project not found"},
        422: {"description": "Validation error"},
    },
)

# Claude Code assistance endpoints
api_router.include_router(
    code_assistance.router,
    prefix="/claude-code",
    tags=["Claude Code Assistance"],
    responses={
        500: {"description": "Claude SDK error"},
        413: {"description": "Request too large"},
        400: {"description": "Invalid request"},
    },
)

# Integration endpoints
api_router.include_router(
    integrations.router,
    prefix="/integrations",
    tags=["Integrations"],
    responses={
        401: {"description": "Unauthorized"},
        400: {"description": "Bad request"},
        404: {"description": "Integration not found"},
        403: {"description": "Forbidden"},
        422: {"description": "Validation error"},
    },
)

# Integration utility client endpoints
api_router.include_router(
    integration_clients.router,
    prefix="/integrations",
    tags=["Integration Clients"],
    responses={
        401: {"description": "Unauthorized"},
        400: {"description": "Bad request"},
        404: {"description": "Not found"},
        502: {"description": "Upstream provider error"},
    },
)

# AI Agent endpoints
api_router.include_router(
    agents.router,
    prefix="/agents",
    tags=["AI Agents"],
    responses={
        400: {"description": "Bad request"},
        404: {"description": "Agent not found"},
        422: {"description": "Validation error"},
    },
)

# File upload endpoints
api_router.include_router(
    file_upload.router,
    prefix="/files",
    tags=["File Upload"],
    responses={
        401: {"description": "Unauthorized"},
        400: {"description": "Bad request"},
        404: {"description": "File or session not found"},
        413: {"description": "File too large"},
        422: {"description": "Validation error"},
    },
)
