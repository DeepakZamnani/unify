from __future__ import annotations

from sqlmodel import Session

from app.api.v1.schemas import OpportunityCreate
from app.db.models import Opportunity
from app.services.embedding import generate_embedding
from app.services.vector_store import upsert_opportunity_vector


def _build_search_text(opportunity: OpportunityCreate) -> str:
    return " ".join(
        part.strip()
        for part in (
            opportunity.title,
            opportunity.description,
            opportunity.sector,
            opportunity.organization,
        )
        if part.strip()
    )


def create_opportunity_with_vector(db: Session, opp_data: OpportunityCreate) -> Opportunity:
    """Persist an opportunity and index its vector representation."""
    opportunity = Opportunity(
        title=opp_data.title,
        description=opp_data.description,
        organization=opp_data.organization,
        type=opp_data.type,
        sector=opp_data.sector,
        budget_min=opp_data.budget_min,
        budget_max=opp_data.budget_max,
        deadline=opp_data.deadline,
        is_verified=opp_data.is_verified,
    )

    db.add(opportunity)
    db.commit()
    db.refresh(opportunity)

    search_text = _build_search_text(opp_data)
    vector = generate_embedding(search_text)
    upsert_opportunity_vector(
        vector_id=str(opportunity.id),
        vector=vector,
        metadata={
            "sector": opportunity.sector,
            "organization": opportunity.organization,
            "is_verified": opportunity.is_verified,
            "opportunity_type": opportunity.type.value,
        },
    )
    return opportunity
