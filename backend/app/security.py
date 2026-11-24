"""Authentication helpers: JWT creation and the FastAPI dependencies for the current user and roles."""

from collections.abc import Callable
from datetime import timedelta

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User, utcnow

TOKEN_LIFETIME = timedelta(hours=8)
ALGORITHM = "HS256"
bearer = HTTPBearer()


def create_token(user: User) -> str:
    return jwt.encode(
        {"sub": str(user.id), "exp": utcnow() + TOKEN_LIFETIME},
        settings.jwt_secret,
        algorithm=ALGORITHM,
    )


def current_user(
    cred: HTTPAuthorizationCredentials = Depends(bearer),
    db: Session = Depends(get_db),
) -> User:
    try:
        user_id = int(jwt.decode(cred.credentials, settings.jwt_secret, algorithms=[ALGORITHM])["sub"])
    except Exception:
        raise HTTPException(401, "Invalid or expired token")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(401, "Unknown user")
    return user


def require(*roles: str) -> Callable[..., User]:
    """Dependency factory: allow only the listed roles."""

    def dependency(user: User = Depends(current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(403, "Your role cannot do this")
        return user

    return dependency
