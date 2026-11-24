import os

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..audit import record_audit
from ..config import settings
from ..database import get_db
from ..forensics import sha256_hex, validate_upload, verify_hash
from ..models import Case, Evidence, User
from ..schemas import EvidenceOut
from ..security import require

router = APIRouter(prefix="/api", tags=["evidence"])


@router.post("/cases/{case_id}/evidence", status_code=201, response_model=EvidenceOut)
async def upload_evidence(
    case_id: int,
    file: UploadFile = File(...),
    source: str = Form(""),
    db: Session = Depends(get_db),
    user: User = Depends(require("police", "investigator", "admin")),
):
    if not db.get(Case, case_id):
        raise HTTPException(404, "Case not found")
    data = await file.read()
    error = validate_upload(file.filename or "", len(data))
    if error:
        raise HTTPException(400, error)

    digest = sha256_hex(data)
    evidence = Evidence(
        evidence_code="TMP",
        case_id=case_id,
        filename=os.path.basename(file.filename or ""),
        size=len(data),
        source=source,
        sha256=digest,
        stored_path="",
        uploaded_by=user.id,
    )
    db.add(evidence)
    db.flush()
    evidence.evidence_code = f"EV-{evidence.id:04d}"
    evidence.stored_path = os.path.join(settings.upload_dir, f"{evidence.evidence_code}.bin")
    with open(evidence.stored_path, "wb") as fh:  # original preserved; never executed
        fh.write(data)
    db.commit()
    record_audit(db, user, "evidence_uploaded", f"{evidence.evidence_code} sha256={digest}")
    return evidence


@router.post("/evidence/{evidence_id}/verify")
def verify_evidence(
    evidence_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require("investigator", "admin")),
) -> dict:
    evidence = db.get(Evidence, evidence_id)
    if not evidence:
        raise HTTPException(404, "Evidence not found")
    with open(evidence.stored_path, "rb") as fh:
        result = verify_hash(fh.read(), evidence.sha256)
    evidence.verification_status = result["status"]
    db.commit()
    record_audit(db, user, "evidence_verified", f"{evidence.evidence_code}: {result['status']}")
    return result
