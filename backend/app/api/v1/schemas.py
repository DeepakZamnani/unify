from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field

from app.db.models import ContractStatus, OpportunityType, UserRole


EMAIL_PATTERN = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"


class UserCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(pattern=EMAIL_PATTERN)
    password: str = Field(min_length=8)
    role: UserRole = UserRole.MSME


class UserLogin(BaseModel):
    model_config = ConfigDict(extra="forbid")

    email: str = Field(pattern=EMAIL_PATTERN)
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: UUID
    email: str
    role: UserRole


class Token(BaseModel):
    model_config = ConfigDict(extra="forbid")

    access_token: str
    token_type: str = "bearer"


class MSMEProfileCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    company_name: str = Field(min_length=1, max_length=255)
    udyam_registration: str | None = Field(default=None, max_length=100)
    capabilities: dict[str, Any] = Field(default_factory=dict)


class MSMEProfileRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: UUID
    user_id: UUID
    company_name: str
    udyam_registration: str | None
    digital_maturity_score: int
    fairness_score: float
    capabilities: dict[str, Any]
    certifications: list[str] | dict[str, Any] | None = None


class OpportunityCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1)
    organization: str = Field(min_length=1, max_length=255)
    type: OpportunityType
    sector: str = Field(min_length=1, max_length=100)
    budget_min: Decimal | None = Field(default=None, ge=0)
    budget_max: Decimal | None = Field(default=None, ge=0)
    deadline: date
    is_verified: bool = False


class OpportunityRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: UUID
    title: str
    description: str
    organization: str
    type: OpportunityType
    sector: str
    budget_min: Decimal | None = None
    budget_max: Decimal | None = None
    deadline: date
    is_verified: bool


# ---------------------------------------------------------------------------
# Milestone schemas
# ---------------------------------------------------------------------------


class MilestoneCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=1, max_length=255)
    payout_percentage: int = Field(ge=1, le=100)
    due_date: date


class MilestoneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: UUID
    contract_id: UUID
    title: str
    payout_percentage: int
    is_completed: bool
    due_date: date


class MilestoneUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    is_completed: bool


# ---------------------------------------------------------------------------
# Contract schemas
# ---------------------------------------------------------------------------


class ContractCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    opportunity_id: UUID | None = None
    msme_id: UUID
    agreed_amount: Decimal = Field(gt=0)
    milestones: list[MilestoneCreate] = Field(default_factory=list)


class ContractRead(BaseModel):
    model_config = ConfigDict(from_attributes=True, extra="forbid")

    id: UUID
    opportunity_id: UUID | None = None
    msme_id: UUID | None = None
    status: ContractStatus
    agreed_amount: Decimal
    milestones: list[MilestoneRead] = Field(default_factory=list)


class ContractUpdateStatus(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: ContractStatus
