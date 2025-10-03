"""File upload API endpoints for session-specific file management."""

from typing import Annotated

from fastapi import APIRouter, Depends, File, UploadFile

from app.api.deps import get_current_active_user, get_workspace_service
from app.models.user import User
from app.schemas.file_upload import FileDeleteResponse, FileUploadResponse
from app.services.workspace_service import WorkspaceService

router = APIRouter()


@router.post(
    "/upload",
    response_model=FileUploadResponse,
    summary="Upload a file to user storage",
    description="Upload a file (docx, pdf, csv, doc, txt) to user's file storage.",
)
async def upload_file(
    *,
    file: UploadFile = File(..., description="File to upload"),
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> FileUploadResponse:
    """Upload a file to user's file storage."""
    result = await workspace_service.upload_user_asset(
        user_id=current_user.id,  # type: ignore[arg-type]
        file=file,
    )
    return FileUploadResponse(**result)


@router.delete(
    "/user-files/{filename}",
    response_model=FileDeleteResponse,
    summary="Delete a user file",
    description="Delete a specific file from user's file storage.",
)
async def delete_user_file(
    *,
    filename: str,
    workspace_service: Annotated[WorkspaceService, Depends(get_workspace_service)],
    current_user: Annotated[User, Depends(get_current_active_user)],
) -> FileDeleteResponse:
    """Delete a specific file from user's file storage."""
    result = await workspace_service.delete_user_asset(
        user_id=current_user.id,  # type: ignore[arg-type]
        file_name=filename,
    )
    return FileDeleteResponse(success=result["success"], message=result["message"], file_name=result["file_name"])
