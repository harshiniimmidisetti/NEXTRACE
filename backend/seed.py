"""Create the three DEMO accounts. Run once: python seed.py (needs JWT_SECRET and DATABASE_URL in .env)."""

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.database import Base, engine
from app.models import User
from app.passwords import hash_password

DEMO_PASSWORD = "Demo@12345"
DEMO_USERS = [
    ("officer@demo.nextrace", "Demo Officer", "police"),
    ("investigator@demo.nextrace", "Demo Investigator", "investigator"),
    ("admin@demo.nextrace", "Demo Administrator", "admin"),
]


def seed() -> None:
    Base.metadata.create_all(engine)
    with Session(engine) as db:
        for email, name, role in DEMO_USERS:
            if not db.scalar(select(User).where(User.email == email)):
                db.add(User(email=email, name=name, role=role, password_hash=hash_password(DEMO_PASSWORD)))
        db.commit()
    print(f"Demo accounts ready (password {DEMO_PASSWORD}). Demo only: change before any real use.")


if __name__ == "__main__":
    seed()
