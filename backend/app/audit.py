"""ARCHIVE ledger on the server: append entries to the hash-chained audit log."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from .forensics import GENESIS_HASH, chain_hash
from .models import AuditLog, User, utcnow


def record_audit(db: Session, user: User | None, action: str, detail: str = "") -> None:
    """Append one entry. Each entry's hash covers the previous entry, so edits are detectable."""
    last = db.scalar(select(AuditLog).order_by(AuditLog.id.desc()).limit(1))
    prev = last.entry_hash if last else GENESIS_HASH
    number = (last.id if last else 0) + 1
    at = utcnow().isoformat()
    actor = str(user.id) if user else "anonymous"
    db.add(
        AuditLog(
            id=number,
            user_id=user.id if user else None,
            action=action,
            detail=detail,
            at_text=at,
            prev_hash=prev,
            entry_hash=chain_hash(prev, number, at, actor, action, detail),
        )
    )
    db.commit()
