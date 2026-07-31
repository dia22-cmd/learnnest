import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class QuestionOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    material_id: uuid.UUID
    type: str  # "mcq", "short_answer", "true_false", "fill_blank", "match_following"
    question: str
    options: dict | list[str] | None
    answer: str
    is_selected: bool
    created_at: datetime


class QuestionGenerateInput(BaseModel):
    count: int = 5
    child_id: uuid.UUID | None = None


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
