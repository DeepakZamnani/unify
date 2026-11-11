from __future__ import annotations

from fastapi import Header, HTTPException, status

from app.core.firebase_auth import FirebaseUser, verify_id_token


def get_firebase_user(authorization: str | None = Header(default=None, alias="Authorization")) -> FirebaseUser:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        return verify_id_token(authorization.removeprefix("Bearer ").strip())
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
