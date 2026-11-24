"""Request and response schemas. Responses never expose password hashes or server file paths."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class LoginIn(BaseModel):
    email: str
    password: str


class LoginOut(BaseModel):
    access_token: str
    role: str
    name: str


class CaseIn(BaseModel):
    title: str
    incident_type: str
    description: str = ""
    priority: str = "Medium"


class CaseOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    case_code: str
    title: str
    incident_type: str
    description: str
    priority: str
    status: str
    created_by: int
    assigned_to: int | None
    created_at: datetime


class AssignIn(BaseModel):
    investigator_id: int


class EvidenceOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    evidence_code: str
    case_id: int
    filename: str
    size: int
    source: str
    sha256: str
    verification_status: str
    uploaded_by: int
    uploaded_at: datetime


class AuditOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    user_id: int | None
    action: str
    detail: str
    at: datetime
    prev_hash: str
    entry_hash: str


class ChatIn(BaseModel):
    case_id: int
    message: str = Field(min_length=1, max_length=1000)
    history: list[dict] = []
