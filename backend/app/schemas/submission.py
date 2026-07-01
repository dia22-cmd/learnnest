import uuid
from datetime import datetime
from pydantic import BaseModel


class SubmissionCreate(BaseModel):
    question_id: uuid.UUID
    child_name: str
    answer_given: str


class SubmissionOut(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    child_name: str
    answer_given: str
    score: int | None
    feedback: str | None
    suggestions: str | None
    submitted_at: datetime

    class Config:
        from_attributes = True


class SubmissionDetailOut(BaseModel):
    id: uuid.UUID
    question_id: uuid.UUID
    question: str  # The question text
    child_name: str
    answer_given: str
    score: int | None
    feedback: str | None
    suggestions: str | None
    submitted_at: datetime

    class Config:
        from_attributes = True


class SubmissionResponse(BaseModel):
    success: bool
    data: SubmissionOut


class SubmissionListResponse(BaseModel):
    success: bool
    data: list[SubmissionDetailOut]
