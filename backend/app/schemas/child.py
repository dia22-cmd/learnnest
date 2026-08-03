import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from typing import Optional


class ChildCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)
    difficulty_level: str = Field("medium", pattern="^(easy|medium|hard)$")


class ChildUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=50)
    difficulty_level: Optional[str] = Field(None, pattern="^(easy|medium|hard)$")


class ChildOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    parent_id: uuid.UUID
    name: str
    difficulty_level: str
    created_at: datetime


class AssignmentCreate(BaseModel):
    material_id: uuid.UUID


class AssignmentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    material_id: uuid.UUID
    child_id: uuid.UUID
    created_at: datetime
