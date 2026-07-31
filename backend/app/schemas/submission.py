import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class SubmissionCreate(BaseModel):
    question_id: uuid.UUID
    child_name: str
    child_id: uuid.UUID | None = None
    answer_given: str


class SubmissionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    question_id: uuid.UUID
    child_name: str
    child_id: uuid.UUID | None
    difficulty_level: str | None
    answer_given: str
    score: int | None
    feedback: str | None
    suggestions: str | None
    submitted_at: datetime


class SubmissionDetailOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    question_id: uuid.UUID
    question: str  # The question text
    child_name: str
    child_id: uuid.UUID | None
    difficulty_level: str | None
    answer_given: str
    score: int | None
    feedback: str | None
    suggestions: str | None
    submitted_at: datetime


class SubmissionResponse(BaseModel):
    success: bool
    data: SubmissionOut


class SubmissionListResponse(BaseModel):
    success: bool
    data: list[SubmissionDetailOut]
