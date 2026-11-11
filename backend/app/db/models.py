from __future__ import annotations

import uuid
from datetime import date
from decimal import Decimal
from enum import Enum
from typing import Any
from sqlalchemy import Boolean, Column, Date, Enum as SAEnum, Float, ForeignKey, Integer, Numeric, String, JSON, Uuid
from sqlmodel import Field, SQLModel


class UserRole(str, Enum):
    MSME = "MSME"
    VENDOR = "VENDOR"
    CONSULTANT = "CONSULTANT"
    ADMIN = "ADMIN"


class OpportunityType(str, Enum):
    GOV_TENDER = "GOV_TENDER"
    GOV_CONTRACT = "GOV_CONTRACT"
    PRIVATE_SUPPLY_CHAIN = "PRIVATE_SUPPLY_CHAIN"
    COLLABORATION = "COLLABORATION"


class ContractStatus(str, Enum):
    UNDER_REVIEW = "UNDER_REVIEW"
    VERIFIED = "VERIFIED"
    ESCROW_PENDING = "ESCROW_PENDING"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    DISPUTED = "DISPUTED"


class User(SQLModel, table=True):
    __tablename__ = "users"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(Uuid(as_uuid=True), primary_key=True, nullable=False),
    )
    email: str = Field(sa_column=Column(String(255), unique=True, nullable=False, index=True))
    password_hash: str = Field(sa_column=Column(String(255), nullable=False))
    role: UserRole = Field(sa_column=Column(SAEnum(UserRole, name="user_role"), nullable=False))


class MSMEProfile(SQLModel, table=True):
    __tablename__ = "msme_profiles"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(Uuid(as_uuid=True), primary_key=True, nullable=False),
    )
    user_id: uuid.UUID = Field(
        sa_column=Column(Uuid(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    )
    company_name: str = Field(sa_column=Column(String(255), nullable=False))
    udyam_registration: str | None = Field(default=None, sa_column=Column(String(100), unique=True))
    digital_maturity_score: int = Field(default=0, sa_column=Column(Integer, nullable=False))
    fairness_score: float = Field(default=1.0, sa_column=Column(Float, nullable=False))
    capabilities: dict[str, Any] = Field(default_factory=dict, sa_column=Column(JSON, nullable=False))
    certifications: list[str] | dict[str, Any] | None = Field(default=None, sa_column=Column(JSON))


class Opportunity(SQLModel, table=True):
    __tablename__ = "opportunities"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(Uuid(as_uuid=True), primary_key=True, nullable=False),
    )
    title: str = Field(sa_column=Column(String(255), nullable=False))
    description: str = Field(sa_column=Column(String, nullable=False))
    organization: str = Field(sa_column=Column(String(255), nullable=False))
    type: OpportunityType = Field(sa_column=Column(SAEnum(OpportunityType, name="opportunity_type"), nullable=False))
    sector: str = Field(sa_column=Column(String(100), nullable=False))
    budget_min: Decimal | None = Field(default=None, sa_column=Column(Numeric))
    budget_max: Decimal | None = Field(default=None, sa_column=Column(Numeric))
    deadline: date = Field(sa_column=Column(Date, nullable=False))
    is_verified: bool = Field(default=False, sa_column=Column(Boolean, nullable=False))


class Contract(SQLModel, table=True):
    __tablename__ = "contracts"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(Uuid(as_uuid=True), primary_key=True, nullable=False),
    )
    opportunity_id: uuid.UUID | None = Field(
        default=None,
        sa_column=Column(Uuid(as_uuid=True), ForeignKey("opportunities.id")),
    )
    msme_id: uuid.UUID | None = Field(
        default=None,
        sa_column=Column(Uuid(as_uuid=True), ForeignKey("msme_profiles.id")),
    )
    status: ContractStatus = Field(sa_column=Column(SAEnum(ContractStatus, name="contract_status"), nullable=False))
    agreed_amount: Decimal = Field(sa_column=Column(Numeric, nullable=False))


class Milestone(SQLModel, table=True):
    __tablename__ = "milestones"

    id: uuid.UUID = Field(
        default_factory=uuid.uuid4,
        sa_column=Column(Uuid(as_uuid=True), primary_key=True, nullable=False),
    )
    contract_id: uuid.UUID = Field(
        sa_column=Column(Uuid(as_uuid=True), ForeignKey("contracts.id", ondelete="CASCADE"), nullable=False, index=True)
    )
    title: str = Field(sa_column=Column(String(255), nullable=False))
    payout_percentage: int = Field(sa_column=Column(Integer, nullable=False))
    is_completed: bool = Field(default=False, sa_column=Column(Boolean, nullable=False))
    due_date: date = Field(sa_column=Column(Date, nullable=False))
