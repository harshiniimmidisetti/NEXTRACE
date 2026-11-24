"""ORM models: users, cases, evidence and the hash-chained audit log."""

from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from .database import Base
from .forensics import GENESIS_HASH


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(20))  # police | investigator | admin
    password_hash: Mapped[str] = mapped_column(String(200))


class Case(Base):
    __tablename__ = "cases"

    id: Mapped[int] = mapped_column(primary_key=True)
    case_code: Mapped[str] = mapped_column(String(20), unique=True)
    title: Mapped[str] = mapped_column(String(200))
    incident_type: Mapped[str] = mapped_column(String(60))
    description: Mapped[str] = mapped_column(Text, default="")
    priority: Mapped[str] = mapped_column(String(10), default="Medium")
    status: Mapped[str] = mapped_column(String(20), default="Submitted")
    created_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    assigned_to: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class Evidence(Base):
    __tablename__ = "evidence"

    id: Mapped[int] = mapped_column(primary_key=True)
    evidence_code: Mapped[str] = mapped_column(String(20), unique=True)
    case_id: Mapped[int] = mapped_column(ForeignKey("cases.id"))
    filename: Mapped[str] = mapped_column(String(255))
    size: Mapped[int] = mapped_column(Integer)
    source: Mapped[str] = mapped_column(String(200), default="")
    sha256: Mapped[str] = mapped_column(String(64))  # recorded at intake
    verification_status: Mapped[str] = mapped_column(String(30), default="Unverified")
    stored_path: Mapped[str] = mapped_column(String(300))
    uploaded_by: Mapped[int] = mapped_column(ForeignKey("users.id"))
    uploaded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)


class AuditLog(Base):
    """Audit trail that doubles as the chain of custody (each entry hashes the previous one)."""

    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_id: Mapped[int | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    action: Mapped[str] = mapped_column(String(80))
    detail: Mapped[str] = mapped_column(Text, default="")
    at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    at_text: Mapped[str] = mapped_column(String(40), default="")  # exact text used in the hash
    prev_hash: Mapped[str] = mapped_column(String(64), default=GENESIS_HASH)
    entry_hash: Mapped[str] = mapped_column(String(64), default="")
