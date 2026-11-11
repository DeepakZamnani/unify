"""Verify Firebase ID tokens (Google-signed JWTs) without a service account."""
from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Any

import httpx
from jose import JWTError, jwt

from app.core.config import get_settings

_JWKS_URL = "https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com"
_jwks_cache: dict[str, Any] = {"keys": [], "fetched_at": 0.0}


@dataclass(frozen=True)
class FirebaseUser:
    uid: str
    email: str
    is_admin: bool
    id_token: str


def _get_keys(force: bool = False) -> list[dict[str, Any]]:
    if force or not _jwks_cache["keys"] or time.time() - _jwks_cache["fetched_at"] > 3600:
        resp = httpx.get(_JWKS_URL, timeout=10.0)
        resp.raise_for_status()
        _jwks_cache["keys"] = resp.json()["keys"]
        _jwks_cache["fetched_at"] = time.time()
    return _jwks_cache["keys"]


def verify_id_token(token: str) -> FirebaseUser:
    """Raises ValueError when the token is missing, expired, forged or for another project."""
    settings = get_settings()
    try:
        kid = jwt.get_unverified_header(token).get("kid")
        keys = _get_keys()
        key = next((k for k in keys if k["kid"] == kid), None)
        if key is None:
            key = next((k for k in _get_keys(force=True) if k["kid"] == kid), None)
        if key is None:
            raise ValueError("Unknown signing key")
        payload = jwt.decode(
            token,
            key,
            algorithms=["RS256"],
            audience=settings.firebase_project_id,
            issuer=f"https://securetoken.google.com/{settings.firebase_project_id}",
        )
    except (JWTError, httpx.HTTPError, KeyError) as exc:
        raise ValueError("Invalid or expired token") from exc

    email = str(payload.get("email", ""))
    return FirebaseUser(
        uid=str(payload["sub"]),
        email=email,
        is_admin=email.lower() in settings.admin_email_list,
        id_token=token,
    )
