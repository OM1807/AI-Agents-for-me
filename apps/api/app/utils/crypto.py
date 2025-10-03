from __future__ import annotations

from typing import cast

from sqlalchemy import String as SAString
from sqlalchemy_utils import StringEncryptedType  # type: ignore[import-untyped]

from app.core.config import get_settings


def _get_secret_key() -> str:
    return get_settings().SECRET_KEY


# Use the same encryption mechanism as the model layer
_string_encrypter: StringEncryptedType = StringEncryptedType(SAString(255), key=_get_secret_key)


def encrypt_text(plaintext: str) -> str:
    """Encrypt text using the configured SECRET_KEY.

    Returns a base64-encoded ciphertext string compatible with StringEncryptedType.
    """
    return cast(str, _string_encrypter.process_bind_param(plaintext, None))


def decrypt_text(ciphertext: str) -> str:
    """Decrypt text previously produced by encrypt_text using SECRET_KEY."""
    if not ciphertext:
        return ""
    return cast(str, _string_encrypter.process_result_value(ciphertext, None))
