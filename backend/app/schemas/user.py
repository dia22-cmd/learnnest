import uuid
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Register input"""
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)
    full_name: str | None = None


class UserLogin(BaseModel):
    """Login input"""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """API output. NO PASSWORD."""
    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """Login returns this"""
    access_token: str
    token_type: str = "bearer"
