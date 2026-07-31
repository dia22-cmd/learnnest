import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class MaterialOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    subject: str
    file_url: str | None
    created_at: datetime


class MaterialDetailOut(MaterialOut):
    raw_text: str


class MaterialResponse(BaseModel):
    success: bool
    data: MaterialOut


class MaterialDetailResponse(BaseModel):
    success: bool
    data: MaterialDetailOut


class MaterialListResponse(BaseModel):
    success: bool
    data: list[MaterialOut]
