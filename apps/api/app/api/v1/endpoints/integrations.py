"""Integration API endpoints using service layer."""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_integration_service
from app.schemas.integration import IntegrationCreate, IntegrationResponse, IntegrationUpdate
from app.services.integration_service import IntegrationService

router = APIRouter()


@router.post(
    "",
    response_model=IntegrationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create new integration",
    description="Create a new integration with validated credentials",
)
async def create_integration(
    *,
    integration_in: IntegrationCreate,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> IntegrationResponse:
    """Create a new integration with validation."""
    try:
        integration = await integration_service.create_integration(integration_data=integration_in)
        return IntegrationResponse.model_validate(integration)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get(
    "",
    response_model=list[IntegrationResponse],
    summary="List user integrations",
    description="Get all integrations for the current user. Use query parameters: integration_id (get specific), integration_type (filter by type), active_only (filter by status), skip/limit (pagination)",
)
async def list_integrations(
    *,
    skip: int = 0,
    limit: int = 100,
    is_active: bool | None = None,
    integration_type: str | None = None,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> list[IntegrationResponse]:
    """Get all integrations for the current user with optional filtering."""
    integrations = await integration_service.list_integrations(
        integration_type=integration_type, is_active=is_active, skip=skip, limit=limit
    )
    # Normalize to list of response models
    return [IntegrationResponse.model_validate(i) for i in integrations]


@router.put(
    "/{integration_id}",
    response_model=IntegrationResponse,
    summary="Update integration",
    description="Update an existing integration. Only is_active status and credentials can be updated.",
)
async def update_integration(
    *,
    integration_id: int,
    integration_in: IntegrationUpdate,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> IntegrationResponse:
    """Update an existing integration (only is_active status and credentials allowed)."""
    try:
        updated_integration = await integration_service.update_integration(
            integration_id=integration_id, update_data=integration_in
        )

        if not updated_integration:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found")
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

    return IntegrationResponse.model_validate(updated_integration)


@router.delete(
    "/{integration_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete integration",
    description="Permanently delete an integration from the database",
)
async def delete_integration(
    *,
    integration_id: int,
    integration_service: Annotated[IntegrationService, Depends(get_integration_service)],
) -> None:
    """Permanently delete an integration."""
    success = await integration_service.delete_integration(integration_id=integration_id)

    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Integration not found or not authorized")
