from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..audit import record_audit
from ..database import get_db
from ..models import User
from ..passwords import check_password
from ..schemas import LoginIn, LoginOut
from ..security import create_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginOut)
def login(body: LoginIn, db: Session = Depends(get_db)) -> LoginOut:
    user = db.scalar(select(User).where(User.email == body.email.lower()))
    if not user or not check_password(body.password, user.password_hash):
        record_audit(db, None, "login_failed", body.email)
        raise HTTPException(401, "Email or password is incorrect")
    record_audit(db, user, "login")
    return LoginOut(access_token=create_token(user), role=user.role, name=user.name)
