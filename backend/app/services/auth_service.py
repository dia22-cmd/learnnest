from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.models.user import User
from app.schemas.user import UserCreate

# Password hashing context — bcrypt algorithm
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


# ── PASSWORD UTILS ──────────────────────────────────────────

def hash_password(plain_password: str) -> str:
    """Turn plain text into bcrypt hash. One way — cannot reverse."""
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Check plain text matches stored hash. Returns True/False."""
    return pwd_context.verify(plain_password, hashed_password)


# ── JWT UTILS ────────────────────────────────────────────────

def create_access_token(data: dict) -> str:
    """
    Create a signed JWT token.
    - data: payload to encode (we put user id inside)
    - token expires after JWT_EXPIRE_MINUTES (from .env)
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> dict | None:
    """
    Decode and verify a JWT token.
    Returns payload dict if valid.
    Returns None if expired or tampered.
    """
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        return payload
    except JWTError:
        return None


# ── USER OPERATIONS ──────────────────────────────────────────

def get_user_by_email(db: Session, email: str) -> User | None:
    """Fetch user from DB by email. Returns None if not found."""
    return db.query(User).filter(User.email == email).first()


def create_user(db: Session, user_data: UserCreate) -> User:
    """
    Register a new user.
    1. Check email not already taken
    2. Hash the password
    3. Save to DB
    4. Return the new user
    """
    # Check duplicate email
    existing = get_user_by_email(db, user_data.email)
    if existing:
        raise ValueError("Email already registered")

    # Hash password — NEVER store plain text
    hashed = hash_password(user_data.password)

    # Create DB record
    new_user = User(
        email=user_data.email,
        password_hash=hashed,
        full_name=user_data.full_name,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    """
    Login check.
    1. Find user by email
    2. Verify password matches hash
    3. Return user if valid, None if not
    """
    user = get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user
