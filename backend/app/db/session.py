from __future__ import annotations

from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.pool import QueuePool
from sqlmodel import Session

from app.core.config import get_settings


settings = get_settings()

engine: Engine = create_engine(
    settings.database_url,
    poolclass=QueuePool,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
    pool_recycle=1800,
    future=True,
)


def get_db() -> Generator[Session, None, None]:
    with Session(engine) as session:
        yield session
