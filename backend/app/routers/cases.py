from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..audit import record_audit
from ..database import get_db
from ..models import Case, User, utcnow
from ..nexa import can_access_case
from ..schemas import AssignIn, CaseIn, CaseOut
from ..security import current_user, require

router = APIRouter(prefix="/api/cases", tags=["cases"])


@router.get("", response_model=list[CaseOut])
def list_cases(db: Session = Depends(get_db), user: User = Depends(current_user)):
    cases = db.scalars(select(Case).order_by(Case.id.desc())).all()
    return [c for c in cases if can_access_case(user.role, user.id, c)]  # never list unauthorised cases


@router.post("", status_code=201, response_model=CaseOut)
def create_case(
    body: CaseIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("police", "admin")),
):
    case = Case(case_code="TMP", created_by=user.id, **body.model_dump())
    db.add(case)
    db.flush()
    case.case_code = f"NXT-{utcnow().year}-{case.id:04d}"
    db.commit()
    record_audit(db, user, "case_created", case.case_code)
    return case


@router.patch("/{case_id}/assign", response_model=CaseOut)
def assign_case(
    case_id: int,
    body: AssignIn,
    db: Session = Depends(get_db),
    user: User = Depends(require("admin")),
):
    case, investigator = db.get(Case, case_id), db.get(User, body.investigator_id)
    if not case or not investigator or investigator.role != "investigator":
        raise HTTPException(404, "Case or investigator not found")
    case.assigned_to = investigator.id
    db.commit()
    record_audit(db, user, "case_assigned", f"{case.case_code} -> {investigator.id}")
    return case
