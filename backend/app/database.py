"""Database engine, declarative base and the per-request session dependency."""

from collections.abc import Iterator

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, Session

from .config import settings

engine = create_engine(settings.database_url, pool_pre_ping=True)


class Base(DeclarativeBase):
    """Base class for all ORM models."""


def get_db() -> Iterator[Session]:
    """FastAPI dependency: one session per request."""
    with Session(engine) as db:
        yield db
