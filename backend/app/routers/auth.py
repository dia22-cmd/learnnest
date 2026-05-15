from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.schemas.user import UserCreate, UserResponse, TokenResponse
from app.services.auth_service import register_user, login_user
from app.middleware.auth import get_current_user
from app.models.user import User

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/register", response_model=UserResponse)
def register(data: UserCreate, db: Session = Depends(get_db)):
    try:
        user = register_user(data, db)
        return {"success": True, "data": user}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/login", response_model=TokenResponse)
def login(data: UserCreate, db: Session = Depends(get_db)):
    try:
        token = login_user(data.email, data.password, db)
        return {"success": True, "data": {"token": token}}
    except ValueError as e:
        raise HTTPException(status_code=401, detail=str(e))

@router.get("/me", response_model=UserResponse)
def me(current_user: User = Depends(get_current_user)):
    return {"success": True, "data": current_user}
