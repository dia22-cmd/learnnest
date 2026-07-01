import uuid
from datetime import datetime
from pydantic import BaseModel


class QuestionOut(BaseModel):
    id: uuid.UUID
    material_id: uuid.UUID
    type: str  # "mcq" or "short_answer"
    question: str
    options: list[str] | None
    answer: str
    is_selected: bool
    created_at: datetime

    class Config:
        from_attributes = True


class QuestionGenerateInput(BaseModel):
    count: int = 5


class QuestionSelectInput(BaseModel):
    is_selected: bool


class QuestionResponse(BaseModel):
    success: bool
    data: QuestionOut


class QuestionListResponse(BaseModel):
    success: bool
    data: list[QuestionOut]


class QuestionSelectData(BaseModel):
    id: uuid.UUID
    is_selected: bool


class QuestionSelectResponse(BaseModel):
    success: bool
    data: QuestionSelectData
