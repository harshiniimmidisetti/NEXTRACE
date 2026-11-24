from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..forensics import verify_chain
from ..models import AuditLog, User
from ..schemas import AuditOut
from ..security import require

router = APIRouter(prefix="/api", tags=["audit"])

AUDIT_PAGE_SIZE = 200


@router.get("/audit", response_model=list[AuditOut])
def audit_logs(db: Session = Depends(get_db), user: User = Depends(require("admin"))):
    return db.scalars(select(AuditLog).order_by(AuditLog.id.desc()).limit(AUDIT_PAGE_SIZE)).all()


@router.get("/ledger/verify")
def ledger_verify(
    db: Session = Depends(get_db),
    user: User = Depends(require("investigator", "admin")),
) -> dict:
    rows = db.scalars(select(AuditLog).order_by(AuditLog.id)).all()
    return verify_chain(
        [
            {
                "n": r.id,
                "at": r.at_text,
                "actor": str(r.user_id) if r.user_id else "anonymous",
                "action": r.action,
                "detail": r.detail,
                "prev_hash": r.prev_hash,
                "entry_hash": r.entry_hash,
            }
            for r in rows
        ]
    )
