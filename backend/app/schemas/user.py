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


class UserOut(BaseModel):
    """User fields returned in API responses. NO PASSWORD."""

    id: uuid.UUID
    email: EmailStr
    full_name: str | None
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    """JWT token payload"""

    token: str


class UserResponse(BaseModel):
    """Wrapper for user endpoints"""

    success: bool
    data: UserOut


class TokenResponse(BaseModel):
    """Wrapper for login endpoint"""

    success: bool
    data: Token
