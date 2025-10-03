"""Workspace service for managing per-session directories for agent runs."""

from __future__ import annotations

import os
import shutil
import tempfile
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import HTTPException, UploadFile, status


class WorkspaceService:
    """Manage per-session workspace directories and user file storage.

    The workspace structure is:
    - User files: {root_dir}/{user_id}/files
    - Session workspace: {root_dir}/{user_id}/{project_id}/{session_id}
    """

    def __init__(self, *, root_dir: str | None = None) -> None:
        self.root_dir = root_dir or os.path.join(tempfile.gettempdir(), "sdlc-agents")

    def _path(self, *, user_id: int, project_id: int, session_id: int) -> Path:
        return Path(self.root_dir) / str(user_id) / str(project_id) / str(session_id)

    def _user_files_path(self, *, user_id: int) -> Path:
        """Get the user's file storage directory."""
        return Path(self.root_dir) / str(user_id) / "files"

    async def create(self, *, user_id: int, project_id: int, session_id: int) -> Path:
        path = self._path(user_id=user_id, project_id=project_id, session_id=session_id)
        os.makedirs(path, exist_ok=True)
        return path

    def resolve(self, *, user_id: int, project_id: int, session_id: int) -> Path:
        return self._path(user_id=user_id, project_id=project_id, session_id=session_id)

    def get_user_assets_dir(self, *, user_id: int) -> Path:
        """Get the user's assets directory."""
        assets_dir = self._user_files_path(user_id=user_id)
        if not assets_dir.exists():
            assets_dir.mkdir(parents=True, exist_ok=True)
        return assets_dir

    def has_user_asset(self, *, user_id: int, file_name: str) -> bool:
        """Check if a user has a specific asset file."""
        asset_path = self._user_files_path(user_id=user_id) / file_name
        return asset_path.exists() and asset_path.is_file()

    async def upload_user_asset(self, *, user_id: int, file: UploadFile) -> dict[str, Any]:
        """Upload a user asset file."""
        # Get user's assets directory
        assets_dir = self.get_user_assets_dir(user_id=user_id)

        # Generate unique filename
        original_filename = file.filename
        if not original_filename:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File must have a filename")

        # Check if file already exists and create unique filename if needed
        if self.has_user_asset(user_id=user_id, file_name=original_filename):
            # File exists, append timestamp to make it unique
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            name, ext = os.path.splitext(original_filename)
            safe_filename = f"{name}_{timestamp}{ext}"
        else:
            safe_filename = original_filename

        file_path = assets_dir / safe_filename

        try:
            # Save file to disk
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)

            # Create response
            return {
                "file_name": safe_filename,
            }

        except Exception as e:
            # Clean up file if operation fails
            if file_path.exists():
                file_path.unlink()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to upload file: {e!s}"
            )

    async def delete_user_asset(self, *, user_id: int, file_name: str) -> dict[str, Any]:
        """Delete a user asset file."""
        # Check if the asset exists with the user
        if not self.has_user_asset(user_id=user_id, file_name=file_name):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found")

        # Get user's assets directory
        assets_dir = self.get_user_assets_dir(user_id=user_id)

        # Find and delete file
        file_path = assets_dir / file_name

        try:
            file_path.unlink()
            return {
                "success": True,
                "message": "File deleted successfully",
                "file_name": file_name,
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to delete file: {e!s}"
            )

    async def cleanup(self, *, user_id: int, project_id: int, session_id: int) -> None:
        # Placeholder for retention/cleanup policies to be implemented later
        return None
