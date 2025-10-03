"""Project CRUD endpoints for listing, getting, and deleting projects."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Path, Query, status

from app.agents.enums import AgentIdentifier, AgentModule
from app.core.auth import get_current_user
from app.crud.deps import get_project_crud
from app.crud.project import ProjectCRUD
from app.models.user import User
from app.schemas.project import ProjectDetailResponse, ProjectListResponse, ProjectResponse

router = APIRouter()


@router.get("/", response_model=ProjectListResponse)
async def list_projects(
    project_crud: Annotated[ProjectCRUD, Depends(get_project_crud)],
    current_user: Annotated[User, Depends(get_current_user)],
    skip: Annotated[int, Query(ge=0, description="Number of projects to skip")] = 0,
    limit: Annotated[int, Query(ge=1, le=100, description="Maximum number of projects to return")] = 100,
    module: Annotated[AgentModule | None, Query(description="Filter by agent module")] = None,
    agent_identifier: Annotated[AgentIdentifier | None, Query(description="Filter by agent identifier")] = None,
) -> ProjectListResponse:
    """List projects for the current user with pagination and filtering.

    Args:
        project_crud: Project CRUD instance with user scoping.
        current_user: Current authenticated user.
        skip: Number of projects to skip for pagination.
        limit: Maximum number of projects to return (max 100).
        module: Filter projects by agent module (e.g., development, quality_assurance).
        agent_identifier: Filter projects by agent identifier (e.g., code_analysis, test_case_generation).

    Returns:
        ProjectListResponse: Paginated list of projects with agent information.
    """
    assert current_user.id is not None, "Authenticated user must have an ID"

    projects, total = await project_crud.get_projects_with_filters(
        skip=skip,
        limit=limit,
        module=module,
        agent_identifier=agent_identifier,
    )

    # Create response objects from the consolidated data
    results = [ProjectResponse.model_validate(project) for project in projects]

    return ProjectListResponse(
        results=results,
        total=total,
        skip=skip,
        limit=limit,
        has_more=skip + limit < total,
    )


@router.get("/{project_id}", response_model=ProjectDetailResponse)
async def get_project(
    project_crud: Annotated[ProjectCRUD, Depends(get_project_crud)],
    current_user: Annotated[User, Depends(get_current_user)],
    project_id: Annotated[int, Path(description="Project ID")],
) -> ProjectDetailResponse:
    """Get a specific project by ID with session details.

    Args:
        project_crud: Project CRUD instance with user scoping.
        current_user: Current authenticated user.
        project_id: The ID of the project to retrieve.

    Returns:
        ProjectDetailResponse: The project data with session listings and agent information.

    Raises:
        HTTPException: If project is not found.
    """
    assert current_user.id is not None, "Authenticated user must have an ID"

    # Get the project
    project = await project_crud.get(id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
    return ProjectDetailResponse.model_validate(project)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_crud: Annotated[ProjectCRUD, Depends(get_project_crud)],
    current_user: Annotated[User, Depends(get_current_user)],
    project_id: Annotated[int, Path(description="Project ID")],
) -> None:
    """Delete a project by ID.

    Args:
        project_crud: Project CRUD instance with user scoping.
        current_user: Current authenticated user.
        project_id: The ID of the project to delete.

    Raises:
        HTTPException: If project is not found.
    """
    assert current_user.id is not None, "Authenticated user must have an ID"

    project = await project_crud.remove(id=project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )
