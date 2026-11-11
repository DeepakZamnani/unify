"""
scripts/seed_data.py
====================
Populate Supabase (PostgreSQL via SQLModel) and Pinecone with realistic test
data for the UNIFY platform.

Run from the `backend/` directory:
    python -m scripts.seed_data

Optional flags:
    --random-vectors   Skip the embedding model entirely and use random 768-dim
                       vectors. Useful when HuggingFace is slow / rate-limited
                       and no OpenAI key is configured.
"""
from __future__ import annotations

import random
import sys
import os
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal

# ---------------------------------------------------------------------------
# Ensure `backend/` is on sys.path so `app.*` imports resolve correctly when
# running via `python -m scripts.seed_data` from the backend/ directory.
# ---------------------------------------------------------------------------
_BACKEND_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _BACKEND_DIR not in sys.path:
    sys.path.insert(0, _BACKEND_DIR)

# NOTE: We import bcrypt directly instead of using app.core.security.hash_password
# to avoid the passlib + bcrypt 4.x incompatibility where passlib crashes while
# trying to read __about__.__version__ (removed in bcrypt 4.x).
import bcrypt as _bcrypt_lib  # noqa: E402

from sqlmodel import Session, select  # noqa: E402

from app.db.session import engine  # noqa: E402
from app.db.models import (  # noqa: E402
    MSMEProfile,
    Opportunity,
    OpportunityType,
    User,
    UserRole,
)
from app.services.vector_store import pinecone_configured, upsert_opportunity_vector  # noqa: E402

EMBEDDING_DIMENSION = 768


# ---------------------------------------------------------------------------
# Internal helpers
# ---------------------------------------------------------------------------

def _hash_password(password: str) -> str:
    """Hash a password with bcrypt, producing a $2b$ hash compatible with passlib."""
    return _bcrypt_lib.hashpw(
        password.encode("utf-8"), _bcrypt_lib.gensalt()
    ).decode("utf-8")


def _make_random_vector(dim: int = EMBEDDING_DIMENSION) -> list[float]:
    """Return a random unit-normalised vector of the given dimension."""
    vec = [random.gauss(0, 1) for _ in range(dim)]
    magnitude = sum(v * v for v in vec) ** 0.5
    return [v / magnitude for v in vec]


def _get_embedding(text: str, use_random: bool) -> list[float]:
    """
    Generate an embedding for *text*.

    If *use_random* is True (or the model/API is unavailable), falls back to a
    random 768-dim unit vector so the seed never blocks on a download.
    """
    if use_random:
        return _make_random_vector()

    # Try sentence-transformers first, then OpenAI, then random fallback.
    try:
        from app.services.embedding import generate_embedding
        return generate_embedding(text)
    except Exception as exc:
        print(f"    [!] Embedding generation failed ({exc}); using random vector.")
        return _make_random_vector()


@dataclass
class _OppSnapshot:
    """Plain data snapshot of an Opportunity, safe to use after the session closes."""

    id: str
    title: str
    description: str
    sector: str
    organization: str
    is_verified: bool
    opportunity_type: str

    @classmethod
    def from_orm(cls, opp: Opportunity) -> "_OppSnapshot":
        return cls(
            id=str(opp.id),
            title=opp.title,
            description=opp.description,
            sector=opp.sector,
            organization=opp.organization,
            is_verified=opp.is_verified,
            opportunity_type=opp.type.value,
        )


# ---------------------------------------------------------------------------
# Seed fixtures
# ---------------------------------------------------------------------------

MSME_USER_EMAIL = "msme@example.com"
MSME_USER_PASSWORD = "Password123!"

MSME_PROFILE_DATA = {
    "company_name": "Aether Tech Dynamics",
    "udyam_registration": "UDYAM-MH-12-9876543",
    "digital_maturity_score": 85,
    "fairness_score": 0.92,
    "capabilities": {
        "sector": "IT & Software",
        "keywords": ["AI", "Cloud", "FastAPI", "Python", "Data Science"],
        "description": (
            "Specialized in cloud backend systems, AI matching, and "
            "scalable web API development."
        ),
    },
}

OPPORTUNITIES_DATA = [
    {
        "title": "AI-Driven Logistics Optimization Engine",
        "description": (
            "Design and develop an AI-powered engine to optimize last-mile "
            "delivery routes, warehouse slot allocation, and demand forecasting "
            "across a national supply-chain network. The solution must integrate "
            "with existing ERP systems and expose RESTful APIs."
        ),
        "organization": "National Supply Chain Corp",
        "type": OpportunityType.GOV_CONTRACT,
        "sector": "IT & Software",
        "budget_min": Decimal("500000"),
        "budget_max": Decimal("1500000"),
        "deadline": date.today() + timedelta(days=60),
        "is_verified": True,
    },
    {
        "title": "Solar Panel Mounting Frame Fabrication",
        "description": (
            "Fabricate and supply galvanized steel mounting frames for a 50 MW "
            "ground-mounted solar installation. Frames must conform to IEC 61215 "
            "structural standards, withstand wind loads up to 150 km/h, and "
            "include corrosion-resistant coating."
        ),
        "organization": "GreenEnergy State Dept",
        "type": OpportunityType.GOV_TENDER,
        "sector": "Manufacturing",
        "budget_min": Decimal("800000"),
        "budget_max": Decimal("2000000"),
        "deadline": date.today() + timedelta(days=45),
        "is_verified": True,
    },
    {
        "title": "Enterprise FastAPI Microservices Refactoring",
        "description": (
            "Refactor a legacy monolithic Python Django application into a "
            "suite of independent FastAPI microservices. The engagement covers "
            "domain modelling, async I/O migration, OpenAPI documentation, "
            "Docker containerisation, and CI/CD pipeline setup on AWS ECS."
        ),
        "organization": "TechGlobal Corp",
        "type": OpportunityType.PRIVATE_SUPPLY_CHAIN,
        "sector": "IT & Software",
        "budget_min": Decimal("200000"),
        "budget_max": Decimal("600000"),
        "deadline": date.today() + timedelta(days=30),
        "is_verified": False,
    },
]


# ---------------------------------------------------------------------------
# Seed helpers
# ---------------------------------------------------------------------------

def _seed_msme_user(session: Session) -> User:
    """Upsert the MSME test user."""
    existing = session.exec(
        select(User).where(User.email == MSME_USER_EMAIL)
    ).first()
    if existing:
        print(f"    [~] User '{MSME_USER_EMAIL}' already exists - skipping creation.")
        return existing

    user = User(
        email=MSME_USER_EMAIL,
        password_hash=_hash_password(MSME_USER_PASSWORD),
        role=UserRole.MSME,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    print(f"    [+] Created user '{MSME_USER_EMAIL}'  (id={user.id})")
    return user


def _seed_msme_profile(session: Session, user: User) -> MSMEProfile:
    """Upsert the MSMEProfile for the test user."""
    existing = session.exec(
        select(MSMEProfile).where(MSMEProfile.user_id == user.id)
    ).first()
    if existing:
        print(
            f"    [~] MSMEProfile for user '{user.email}' already exists - skipping creation."
        )
        return existing

    profile = MSMEProfile(
        user_id=user.id,
        company_name=MSME_PROFILE_DATA["company_name"],
        udyam_registration=MSME_PROFILE_DATA["udyam_registration"],
        digital_maturity_score=MSME_PROFILE_DATA["digital_maturity_score"],
        fairness_score=MSME_PROFILE_DATA["fairness_score"],
        capabilities=MSME_PROFILE_DATA["capabilities"],
    )
    session.add(profile)
    session.commit()
    session.refresh(profile)
    print(f"    [+] Created MSMEProfile '{profile.company_name}'  (id={profile.id})")
    return profile


def _upsert_opportunity(session: Session, data: dict) -> _OppSnapshot:
    """
    Persist an Opportunity to Postgres (if not already present) and return a
    plain snapshot of its fields - safe to use after the session is closed.
    """
    existing = session.exec(
        select(Opportunity).where(Opportunity.title == data["title"])
    ).first()
    if existing:
        print(f"    [~] Opportunity '{data['title']}' already exists - will re-index in Pinecone.")
        return _OppSnapshot.from_orm(existing)

    opp = Opportunity(
        title=data["title"],
        description=data["description"],
        organization=data["organization"],
        type=data["type"],
        sector=data["sector"],
        budget_min=data.get("budget_min"),
        budget_max=data.get("budget_max"),
        deadline=data["deadline"],
        is_verified=data.get("is_verified", False),
    )
    session.add(opp)
    session.commit()
    session.refresh(opp)
    print(f"    [+] Created opportunity '{opp.title}'  (id={opp.id})")
    return _OppSnapshot.from_orm(opp)


def _index_opportunity(snap: _OppSnapshot, use_random: bool) -> None:
    """Generate an embedding and upsert the vector into Pinecone."""
    search_text = f"{snap.title} {snap.description} {snap.sector}"
    vector = _get_embedding(search_text, use_random)
    upsert_opportunity_vector(
        vector_id=snap.id,
        vector=vector,
        metadata={
            "title": snap.title,
            "sector": snap.sector,
            "organization": snap.organization,
            "is_verified": snap.is_verified,
            "opportunity_type": snap.opportunity_type,
        },
    )
    tag = "random-vec" if use_random else f"dim={len(vector)}"
    print(f"    [OK] Indexed vector for '{snap.title}'  ({tag})")


# ---------------------------------------------------------------------------
# Main entry point
# ---------------------------------------------------------------------------

def main() -> None:
    use_random = "--random-vectors" in sys.argv

    print("\n================================================")
    print("   UNIFY - Database & Vector Store Seed Script ")
    print("================================================")
    if use_random:
        print("   [!] Mode: RANDOM VECTORS (no model download)")
    print("")

    with Session(engine) as session:
        # -- 1. Users & MSME Profiles ----------------------------------------
        print("[+] Seeding users...")
        user = _seed_msme_user(session)

        print("[+] Seeding MSME profiles...")
        _seed_msme_profile(session, user)

        # -- 2. Opportunities -> PostgreSQL -----------------------------------
        print("\n[+] Seeding opportunities to PostgreSQL...")
        # Build snapshots inside the session to avoid DetachedInstanceError
        # when accessing ORM attributes after the session closes.
        snapshots: list[_OppSnapshot] = []
        for opp_data in OPPORTUNITIES_DATA:
            snap = _upsert_opportunity(session, opp_data)
            snapshots.append(snap)

    # -- 3. Opportunities -> Pinecone ----------------------------------------
    # The session is fully closed here; all access goes through plain snapshots.
    if pinecone_configured():
        print("\n[+] Seeding opportunities to Pinecone...")
        for snap in snapshots:
            try:
                _index_opportunity(snap, use_random)
            except RuntimeError as exc:
                print(f"    [!] Pinecone indexing failed ({exc}); matching will use the local fallback.")
                break
    else:
        print("\n[~] Pinecone not configured - skipping vector indexing (matching uses the local fallback).")

    print("\n[DONE] Seeding completed!\n")


if __name__ == "__main__":
    main()
