"""CRUD operations package."""

from .base import BaseCRUD
from .user import UserCRUD

__all__ = ["BaseCRUD", "UserCRUD"]
