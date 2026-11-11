from __future__ import annotations

from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select

from app.api.deps import get_current_user, get_db, require_roles
from app.api.v1.schemas import (
    ContractCreate,
    ContractRead,
    ContractUpdateStatus,
    MilestoneRead,
    MilestoneUpdate,
)
from app.db.models import (
    Contract,
    ContractStatus,
    Milestone,
    MSMEProfile,
    User,
    UserRole,
)
from app.services.contract import (
    create_contract_with_milestones,
    toggle_milestone_completion,
    update_contract_status,
)


router = APIRouter(tags=["contracts"])


# ---------------------------------------------------------------------------
# Helper: load milestones for a contract and attach them so ContractRead can
# serialise the nested list (SQLModel does not eagerly load relationships by
# default when relationship fields are absent from the model definition).
# ---------------------------------------------------------------------------
def _load_contract_with_milestones(db: Session, contract: Contract) -> ContractRead:
    milestones = db.exec(
        select(Milestone).where(Milestone.contract_id == contract.id)
    ).all()
    data = ContractRead.model_validate(contract)
    data.milestones = [MilestoneRead.model_validate(m) for m in milestones]
    return data


# ---------------------------------------------------------------------------
# POST /contracts  – create a new contract with initial milestones
# ---------------------------------------------------------------------------
@router.post("", response_model=ContractRead, status_code=status.HTTP_201_CREATED)
def create_contract(
    payload: ContractCreate,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.CONSULTANT, UserRole.MSME])),
    db: Session = Depends(get_db),
) -> ContractRead:
    """Create a contract together with its milestone schedule.

    Accessible by MSME (self-submission), CONSULTANT, and ADMIN.
    The contract always starts in UNDER_REVIEW status.
    """
    # Verify the referenced MSME profile exists.
    msme_profile = db.get(MSMEProfile, payload.msme_id)
    if msme_profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MSME profile {payload.msme_id} not found.",
        )

    # MSME users may only create contracts for their own profile.
    if current_user.role == UserRole.MSME and msme_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You may only create contracts for your own MSME profile.",
        )

    contract = create_contract_with_milestones(db=db, contract_in=payload)
    return _load_contract_with_milestones(db, contract)


# ---------------------------------------------------------------------------
# GET /contracts  – list contracts scoped by role / user identity
# ---------------------------------------------------------------------------
@router.get("", response_model=list[ContractRead], status_code=status.HTTP_200_OK)
def list_contracts(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[ContractRead]:
    """Return contracts visible to the caller.

    * **MSME** – only contracts linked to their own MSME profile.
    * **ADMIN / CONSULTANT** – all contracts in the system.
    * **VENDOR** – no contracts (returns empty list).
    """
    statement = select(Contract)

    if current_user.role == UserRole.MSME:
        # Find the caller's MSME profile first.
        profile = db.exec(
            select(MSMEProfile).where(MSMEProfile.user_id == current_user.id)
        ).one_or_none()
        if profile is None:
            return []
        statement = statement.where(Contract.msme_id == profile.id)
    elif current_user.role == UserRole.VENDOR:
        return []

    contracts = db.exec(statement.order_by(Contract.id)).all()
    return [_load_contract_with_milestones(db, c) for c in contracts]


# ---------------------------------------------------------------------------
# PATCH /contracts/{contract_id}/status  – advance escrow / review status
# ---------------------------------------------------------------------------
@router.patch(
    "/{contract_id}/status",
    response_model=ContractRead,
    status_code=status.HTTP_200_OK,
)
def patch_contract_status(
    contract_id: UUID,
    payload: ContractUpdateStatus,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.CONSULTANT])),
    db: Session = Depends(get_db),
) -> ContractRead:
    """Transition a contract to the next status stage.

    Only ADMIN and CONSULTANT may drive status changes.
    The FSM defined in the service layer enforces valid transitions.
    """
    contract = update_contract_status(db=db, contract_id=contract_id, new_status=payload.status)
    return _load_contract_with_milestones(db, contract)


# ---------------------------------------------------------------------------
# PATCH /contracts/milestones/{milestone_id}  – toggle milestone completion
# ---------------------------------------------------------------------------
@router.patch(
    "/milestones/{milestone_id}",
    response_model=MilestoneRead,
    status_code=status.HTTP_200_OK,
)
def patch_milestone(
    milestone_id: UUID,
    payload: MilestoneUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MilestoneRead:
    """Mark a milestone as completed or revert it to incomplete.

    * **ADMIN / CONSULTANT** – may toggle any milestone.
    * **MSME** – may only toggle milestones belonging to their own contracts.
    """
    # Resolve the milestone to check ownership when the caller is MSME.
    milestone = db.get(Milestone, milestone_id)
    if milestone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Milestone {milestone_id} not found.",
        )

    if current_user.role == UserRole.MSME:
        # Verify the milestone's contract belongs to this MSME user.
        contract = db.get(Contract, milestone.contract_id)
        if contract is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Associated contract not found.",
            )
        profile = db.exec(
            select(MSMEProfile).where(MSMEProfile.user_id == current_user.id)
        ).one_or_none()
        if profile is None or contract.msme_id != profile.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You may only update milestones for your own contracts.",
            )
    elif current_user.role == UserRole.VENDOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Vendors are not permitted to update milestones.",
        )

    updated = toggle_milestone_completion(
        db=db, milestone_id=milestone_id, is_completed=payload.is_completed
    )
    return MilestoneRead.model_validate(updated)
