from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.firebase_deps import get_firebase_user
from app.core.firebase_auth import FirebaseUser
from app.services import firestore
from app.services.matching import PROFILE_DOC

router = APIRouter(tags=["profiles"])


@router.get("/me")
def get_company_profile(user: FirebaseUser = Depends(get_firebase_user)) -> dict[str, Any]:
    """The company profile (Firestore ``profile/main``) in the shape the COMS page expects."""
    try:
        doc = firestore.get_doc(PROFILE_DOC, user.id_token)
    except firestore.FirestoreError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Database error: {exc}") from exc
    if doc is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Company profile not found")
    return {
        "id": "main",
        "user_id": user.uid,
        "company_name": doc.get("companyName", ""),
        "industry": doc.get("industry"),
        "location": doc.get("location"),
        "employees": doc.get("employees"),
        "capabilities": doc.get("capabilities") or [],
        "certifications": doc.get("certifications") or [],
        "bio": doc.get("bio"),
    }
