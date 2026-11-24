"""NEXA assistant endpoint. Claude is called here, on the server, with only the authorised case's data."""

import os

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from .. import nexa
from ..audit import record_audit
from ..config import settings
from ..database import get_db
from ..models import Case, Evidence, User
from ..schemas import ChatIn
from ..security import current_user

router = APIRouter(prefix="/api/nexa", tags=["nexa"])

TEXT_EXTENSIONS = {"txt", "eml", "csv", "json", "log"}
MAX_TEXT_BYTES = 20_000


def _evidence_payload(row: Evidence) -> dict:
    """Evidence record in the shape `nexa.build_context` expects. Text files are read, never run."""
    extension = row.filename.rsplit(".", 1)[-1].lower()
    text = None
    if extension in TEXT_EXTENSIONS and os.path.exists(row.stored_path):
        with open(row.stored_path, "rb") as fh:
            text = fh.read(MAX_TEXT_BYTES).decode("utf-8", errors="replace")
    return {
        "code": row.evidence_code,
        "filename": row.filename,
        "type": extension.upper(),
        "size": row.size,
        "source": row.source,
        "sha256": row.sha256,
        "status": row.verification_status,
        "uploaded_at": str(row.uploaded_at)[:10],
        "text": text,
    }


@router.post("/chat")
def nexa_chat(body: ChatIn, db: Session = Depends(get_db), user: User = Depends(current_user)) -> dict:
    case = db.get(Case, body.case_id)
    if not case or not nexa.can_access_case(user.role, user.id, case):
        raise HTTPException(404, "Case not found")  # same answer for missing and unauthorised cases
    if not settings.anthropic_api_key:  # the web app then falls back to its labelled demo assistant
        return {"mode": "demo", "answer": None, "reason": "ANTHROPIC_API_KEY is not set on the server."}
    if not nexa.limiter.allow(user.id):
        raise HTTPException(429, "Daily NEXA question limit reached. Try again tomorrow.")

    rows = db.scalars(
        select(Evidence).where(Evidence.case_id == case.id).order_by(Evidence.id)
    ).all()
    context, valid_ids = nexa.build_context(
        {
            "code": case.case_code,
            "title": case.title,
            "incident_type": case.incident_type,
            "status": case.status,
        },
        [_evidence_payload(r) for r in rows],
    )
    messages = nexa.sanitize_history(body.history) + [
        {"role": "user", "content": f"{context}\n\nQuestion: {body.message}"}
    ]
    try:
        answer = nexa.call_claude(
            nexa.SYSTEM_PROMPT,
            messages,
            settings.anthropic_api_key,
            settings.nexa_model,
            settings.nexa_max_tokens,
        )
    except nexa.NexaError as err:
        raise HTTPException(502, str(err))
    answer, unknown = nexa.check_references(answer, valid_ids)
    record_audit(db, user, "nexa_question", f"case={case.case_code} q={body.message[:80]}")
    return {
        "mode": "claude",
        "answer": answer,
        "sources": sorted(set(nexa.ID_RE.findall(answer)) & valid_ids),
        "unknown_refs": unknown,
    }
