import bcrypt
from jose import jwt
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from app.models.user import User
from app.schemas.user import UserCreate
import os

SECRET_KEY = os.getenv("JWT_SECRET")
ALGORITHM = "HS256"

def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain[:72].encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain[:72].encode("utf-8"), hashed.encode("utf-8"))

def create_token(user_id: str) -> str:
    payload = {
        "sub": str(user_id),
        "exp": datetime.utcnow() + timedelta(minutes=30)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def register_user(data: UserCreate, db: Session) -> User:
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise ValueError("Email already registered")
    user = User(email=data.email, password_hash=hash_password(data.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def login_user(email: str, password: str, db: Session) -> str:
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.password_hash):
        raise ValueError("Invalid credentials")
    return create_token(user.id)
