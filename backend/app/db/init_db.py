from __future__ import annotations

from sqlmodel import SQLModel

from app.db.models import Contract, MSMEProfile, Milestone, Opportunity, User
from app.db.session import engine


def init_db() -> None:
    SQLModel.metadata.create_all(engine)


if __name__ == "__main__":
    init_db()
