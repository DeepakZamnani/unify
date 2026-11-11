from __future__ import annotations

from uuid import UUID

from fastapi import HTTPException, status
from sqlmodel import Session, select

from app.api.v1.schemas import ContractCreate
from app.db.models import Contract, ContractStatus, Milestone


# ---------------------------------------------------------------------------
# FSM: valid forward transitions for contract status
# DISPUTED is a lateral state reachable from any active stage via escalation
# (handled separately); this table only covers the happy path.
# ---------------------------------------------------------------------------
_VALID_TRANSITIONS: dict[ContractStatus, set[ContractStatus]] = {
    ContractStatus.UNDER_REVIEW:   {ContractStatus.VERIFIED, ContractStatus.DISPUTED},
    ContractStatus.VERIFIED:       {ContractStatus.ESCROW_PENDING, ContractStatus.DISPUTED},
    ContractStatus.ESCROW_PENDING: {ContractStatus.ACTIVE, ContractStatus.DISPUTED},
    ContractStatus.ACTIVE:         {ContractStatus.COMPLETED, ContractStatus.DISPUTED},
    ContractStatus.COMPLETED:      set(),
    ContractStatus.DISPUTED:       set(),
}


def create_contract_with_milestones(db: Session, contract_in: ContractCreate) -> Contract:
    """Persist a Contract and its associated Milestone rows.

    The contract is always created with an initial status of UNDER_REVIEW,
    regardless of what the caller supplies.
    """
    contract = Contract(
        opportunity_id=contract_in.opportunity_id,
        msme_id=contract_in.msme_id,
        agreed_amount=contract_in.agreed_amount,
        status=ContractStatus.UNDER_REVIEW,
    )
    db.add(contract)
    db.flush()  # populate contract.id before inserting milestones

    for m in contract_in.milestones:
        milestone = Milestone(
            contract_id=contract.id,
            title=m.title,
            payout_percentage=m.payout_percentage,
            due_date=m.due_date,
            is_completed=False,
        )
        db.add(milestone)

    db.commit()
    db.refresh(contract)
    return contract


def update_contract_status(db: Session, contract_id: UUID, new_status: ContractStatus) -> Contract:
    """Transition a contract to a new status, enforcing FSM rules.

    Raises:
        HTTPException 404 – contract not found.
        HTTPException 422 – transition is not allowed from the current status.
    """
    contract = db.get(Contract, contract_id)
    if contract is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Contract {contract_id} not found.",
        )

    allowed = _VALID_TRANSITIONS.get(contract.status, set())
    if new_status not in allowed:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                f"Cannot transition contract from '{contract.status.value}' "
                f"to '{new_status.value}'. "
                f"Allowed next states: {[s.value for s in allowed] or 'none'}."
            ),
        )

    contract.status = new_status
    db.add(contract)
    db.commit()
    db.refresh(contract)
    return contract


def toggle_milestone_completion(db: Session, milestone_id: UUID, is_completed: bool) -> Milestone:
    """Update a milestone's completion flag.

    After toggling, if every milestone for the parent contract is completed,
    the contract is automatically advanced to COMPLETED (provided it is
    currently ACTIVE).

    Raises:
        HTTPException 404 – milestone not found.
    """
    milestone = db.get(Milestone, milestone_id)
    if milestone is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Milestone {milestone_id} not found.",
        )

    milestone.is_completed = is_completed
    db.add(milestone)
    db.flush()

    # Auto-complete the parent contract when all milestones are done.
    all_milestones = db.exec(
        select(Milestone).where(Milestone.contract_id == milestone.contract_id)
    ).all()

    if all_milestones and all(m.is_completed for m in all_milestones):
        contract = db.get(Contract, milestone.contract_id)
        if contract is not None and contract.status == ContractStatus.ACTIVE:
            contract.status = ContractStatus.COMPLETED
            db.add(contract)

    db.commit()
    db.refresh(milestone)
    return milestone
