from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from app.api.firebase_deps import get_firebase_user
from app.core.firebase_auth import FirebaseUser
from app.services import firestore
from app.services.matching import get_coms_matches


class MatchOpportunitiesRequest(BaseModel):
    msme_id: str | None = None  # accepted for backwards compatibility; the profile is profile/main
    top_k: int = Field(default=5, ge=1, le=50)
    sector: list[str] | None = None
    is_verified: bool | None = None


class OpportunityMatch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    opportunity_id: str
    title: str
    organization: str
    sector: str
    opportunity_type: str
    vector_similarity: float
    capability_overlap: float
    coms_score: float
    explainability_tags: list[str]


class MatchOpportunitiesResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    msme_id: str
    top_k: int
    total_matches: int
    matches: list[OpportunityMatch]


router = APIRouter(prefix="/match", tags=["matching"])


@router.post("/opportunities", response_model=MatchOpportunitiesResponse, status_code=status.HTTP_200_OK)
def match_opportunities(
    payload: MatchOpportunitiesRequest,
    user: FirebaseUser = Depends(get_firebase_user),
) -> MatchOpportunitiesResponse:
    try:
        matches = get_coms_matches(
            id_token=user.id_token,
            top_k=payload.top_k,
            sectors=payload.sector,
            is_verified=payload.is_verified,
        )
    except LookupError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc
    except firestore.FirestoreError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=f"Database error: {exc}") from exc

    return MatchOpportunitiesResponse(
        msme_id="main",
        top_k=payload.top_k,
        total_matches=len(matches),
        matches=[OpportunityMatch.model_validate(m) for m in matches],
    )
