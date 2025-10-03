"""Integration service layer for business logic and CRUD operations."""

from fastapi import HTTPException, status
from loguru import logger

from app.core.template_renderer import create_mcp_renderer
from app.crud.integration import IntegrationCRUD
from app.integrations.oauth.manager import OAuthProvidersManager
from app.integrations.oauth.providers.base import TokenResult
from app.models.integration import Integration
from app.schemas.integration import IntegrationCreate, IntegrationUpdate


class IntegrationService:
    """Service layer for integration operations."""

    def __init__(self, crud: IntegrationCRUD) -> None:
        """
        Initialize integration service with database session, user_id and CRUD instance.

        Args:
            session: Database session
            user_id: User ID for filtering operations (required)
            crud: CRUD instance (required)
        """
        self.crud = crud
        self.oauth_manager = OAuthProvidersManager()
        self.mcp_renderer = create_mcp_renderer()

    async def create_integration(self, *, integration_data: IntegrationCreate) -> Integration:
        """
        Create a new integration with credentials stored as-is.

        Business Rule: Each user can only have ONE integration per type (Atlassian, Notion, GitHub).
        If an integration of the same type already exists for the user, creation will fail.

        Args:
            integration_data: Integration creation data

        Returns:
            Created integration

        Raises:
            HTTPException: If an integration of the same type already exists for the user
            ValueError: If validation fails for updated credentials
        """
        # Validate integration before creating
        provider = integration_data.type

        # Check if any integration of this type already exists for the user (regardless of active status)
        existing_integrations = await self.crud.list_integrations(
            integration_type=provider,
            is_active=None,  # Get all integrations of this type, active or inactive
        )

        if existing_integrations:
            # Business rule: Only one integration per type per user
            existing_integration = existing_integrations[0]  # Should only be one due to constraint

            logger.warning(
                f"Integration of type {provider} already exists for user (ID: {existing_integration.id}). "
                f"Creation failed due to business rule: one integration per type per user."
            )

            # Raise error - user must update existing integration instead of creating new one
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Integration of type '{provider}' already exists for this user. "
                f"Please update the existing integration instead of creating a new one.",
            )

        # validate credentials and persist any enrichment (e.g., cloud_id)
        validated_creds = await self.oauth_manager.validate_credentials(provider, integration_data.credentials)
        if validated_creds:
            integration_data.credentials.update(validated_creds)

        # Create integration with credentials stored as-is and MCP config template
        integration = await self.crud.create_integration(
            obj_in=integration_data,
        )

        logger.debug(f"Created new integration {integration.id} of type {provider}")
        return integration

    async def list_integrations(
        self,
        *,
        integration_type: str | None = None,
        is_active: bool | None = None,
        skip: int = 0,
        limit: int = 100,
    ) -> list[Integration]:
        """
        Get integrations with flexible filtering for the current user.

        Args:
            integration_type: Type of integration to filter by
            is_active: Filter by active status
            skip: Number of records to skip
            limit: Maximum number of records to return

        Returns:
            List of integrations or single integration if ID specified
        """
        result = await self.crud.list_integrations(
            integration_type=integration_type,
            is_active=is_active,
            skip=skip,
            limit=limit,
        )
        return result

    async def update_integration(self, *, integration_id: int, update_data: IntegrationUpdate) -> Integration | None:
        """
        Update an integration (only is_active status and credentials allowed).

        Args:
            integration_id: Integration ID
            update_data: Update data (only is_active and credentials fields are processed)

        Returns:
            Updated integration if successful, None if not found or unauthorized

        Raises:
            ValueError: If validation fails for updated credentials
        """
        # Get existing integration
        integration = await self.crud.get(integration_id)
        if not integration:
            return None

        # validate credentials and persist any enrichment (e.g., cloud_id)
        validated_creds = await self.oauth_manager.validate_credentials(integration.type, update_data.credentials)
        if validated_creds:
            update_data.credentials.update(validated_creds)

        updated_integration = await self.crud.update_integration(db_obj=integration, obj_in=update_data)

        logger.info(f"Updated integration {integration_id}")
        return updated_integration

    async def delete_integration(self, *, integration_id: int) -> bool:
        """
        Delete an integration.
        """
        return await self.crud.delete_integration(integration_id=integration_id)

    async def get_access_token(self, *, integration_id: int) -> str | None:
        """
        Get an access token for an integration.

        If credentials are updated during token generation (e.g., refresh token rotation),
        the updated credentials will be persisted to the database.
        """
        integration = await self.crud.get(integration_id)
        if not integration:
            return None

        # Get token result which may include updated credentials
        token_result: TokenResult = await self.oauth_manager.get_access_token(integration.type, integration.credentials)

        # If credentials were updated (e.g., refresh token rotation), persist them
        if token_result.credentials_updated and token_result.updated_credentials:
            try:
                update_data = IntegrationUpdate(
                    auth_type=integration.auth_type,
                    credentials=token_result.updated_credentials,
                    is_active=integration.is_active,
                )
                await self.crud.update_integration(db_obj=integration, obj_in=update_data)
                logger.info(f"Updated credentials for integration {integration_id} due to token rotation")
            except Exception as e:
                # Log the error but don't fail the token retrieval
                # The token is still valid even if we couldn't persist the new credentials
                logger.error(f"Failed to persist updated credentials for integration {integration_id}: {e}")

        return token_result.access_token
