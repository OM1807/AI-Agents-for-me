"""File upload related schemas."""


from pydantic import BaseModel, Field


class FileUploadResponse(BaseModel):
    """Response schema for file upload operations."""

    file_name: str = Field(description="Original filename")


class FileDeleteResponse(BaseModel):
    """Response schema for file deletion operations."""

    success: bool = Field(description="Whether the deletion was successful")
    message: str = Field(description="Deletion result message")
    file_name: str = Field(description="Name of the deleted file")
