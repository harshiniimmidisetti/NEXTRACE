"""NEXTRACE API (FastAPI + SQLAlchemy). Run with: uvicorn app.main:app --reload"""

import os
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from .routers import assistant, audit, auth, cases, evidence


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    """Start-up checks. Alembic migrations are listed as remaining work in the README."""
    settings.validate()
    os.makedirs(settings.upload_dir, exist_ok=True)
    Base.metadata.create_all(engine)
    yield


app = FastAPI(title="NEXTRACE API", version="2.0.0", lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.cors_origins),
    allow_methods=["*"],
    allow_headers=["*"],
)

for module in (auth, cases, evidence, audit, assistant):
    app.include_router(module.router)


@app.get("/api/health", tags=["health"])
def health() -> dict:
    return {"status": "ok", "mode": settings.app_mode}
