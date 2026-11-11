from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlmodel import Session, select

from app.api.deps import get_db, require_roles
from app.api.v1.schemas import OpportunityCreate, OpportunityRead
from app.db.models import Opportunity, OpportunityType, User, UserRole
from app.services.opportunity import create_opportunity_with_vector


router = APIRouter(tags=["opportunities"])


@router.post("", response_model=OpportunityRead, status_code=status.HTTP_201_CREATED)
def create_opportunity(
    payload: OpportunityCreate,
    _current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.CONSULTANT])),
    db: Session = Depends(get_db),
) -> Opportunity:
    try:
        return create_opportunity_with_vector(db=db, opp_data=payload)
    except RuntimeError as exc:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=str(exc)) from exc


@router.get("", response_model=list[OpportunityRead], status_code=status.HTTP_200_OK)
def list_opportunities(
    db: Session = Depends(get_db),
    sector: str | None = None,
    organization: str | None = None,
    opportunity_type: OpportunityType | None = None,
    is_verified: bool | None = None,
    search: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
) -> list[Opportunity]:
    statement = select(Opportunity)

    if sector:
        statement = statement.where(Opportunity.sector.ilike(f"%{sector.strip()}%"))
    if organization:
        statement = statement.where(Opportunity.organization.ilike(f"%{organization.strip()}%"))
    if opportunity_type is not None:
        statement = statement.where(Opportunity.type == opportunity_type)
    if is_verified is not None:
        statement = statement.where(Opportunity.is_verified == is_verified)
    if search:
        pattern = f"%{search.strip()}%"
        statement = statement.where(
            or_(
                Opportunity.title.ilike(pattern),
                Opportunity.description.ilike(pattern),
                Opportunity.organization.ilike(pattern),
                Opportunity.sector.ilike(pattern),
            )
        )

    statement = statement.order_by(Opportunity.deadline.asc(), Opportunity.title.asc()).offset(offset).limit(limit)
    return db.exec(statement).all()
