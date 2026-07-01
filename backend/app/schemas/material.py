import uuid
from datetime import datetime
from pydantic import BaseModel


class MaterialOut(BaseModel):
    id: uuid.UUID
    title: str
    file_url: str | None
    created_at: datetime

    class Config:
        from_attributes = True


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
