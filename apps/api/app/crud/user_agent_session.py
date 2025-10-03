"""User Agent Session CRUD operations with user scoping."""

from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified
from sqlalchemy.sql.selectable import Select

from app.crud.base import BaseCRUD
from app.models.user_agent_session import UserAgentSession


def _extract_user_messages(messages: list[dict[str, Any]]) -> list[dict[str, Any]]:
    return [m for m in messages if isinstance(m, dict) and m.get("role") == "user"]


class UserAgentSessionCRUD(BaseCRUD[UserAgentSession, dict[str, Any], dict[str, Any]]):
    """CRUD operations for UserAgentSession model, scoped to current user."""

    def __init__(self, session: AsyncSession, user_id: int) -> None:
        super().__init__(UserAgentSession, session)
        self.user_id = user_id

    def get_query(self) -> Select:
        query = super().get_query()
        return query.where(self.model.created_by == self.user_id)  # type: ignore

    async def create_session(
        self,
        *,
        project_id: int,
        agent_id: int,
        messages: list[dict[str, Any]] | None = None,
        mcps: list[str] | None = None,
        custom_properties: dict[str, Any] | None = None,
    ) -> UserAgentSession:
        create_data: dict[str, Any] = {
            "project_id": project_id,
            "agent_id": agent_id,
            "messages": messages,
            "is_active": True,
            "mcps": mcps or [],
            "custom_properties": custom_properties or {},
            "created_by": self.user_id,
            "updated_by": self.user_id,
        }
        db_obj = self.model(**create_data)
        self.session.add(db_obj)
        await self.session.commit()
        await self.session.refresh(db_obj)
        return db_obj

    async def update_session_messages(
        self, *, session_id: int, messages: list[dict[str, Any]]
    ) -> UserAgentSession | None:
        session = await self.get(session_id)
        if not session:
            return None
        session.messages = messages
        session.updated_by = self.user_id
        # Flag JSONB fields as modified so SQLAlchemy detects changes
        flag_modified(session, "messages")
        self.session.add(session)
        await self.session.commit()
        await self.session.refresh(session)
        return session

    async def get_session(self, *, session_id: int) -> UserAgentSession | None:
        return await self.get(session_id)

    async def update_llm_session_id(self, *, session: UserAgentSession, llm_session_id: str) -> UserAgentSession | None:
        """
        Update the LLM session ID for a user agent session.

        Args:
            session_id: The session ID to update
            llm_session_id: The LLM provider session ID

        Returns:
            bool: True if update was successful, False otherwise
        """
        try:
            # Only update if not already set to avoid overwrites
            if session.llm_session_id is not None:
                return session  # Already set, consider success

            session.llm_session_id = llm_session_id
            session.updated_by = self.user_id

            self.session.add(session)
            await self.session.commit()
            await self.session.refresh(session)
            return session

        except Exception:
            # Rollback on any error
            await self.session.rollback()
            return None
