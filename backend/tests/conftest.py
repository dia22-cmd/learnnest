import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
from jose import jwt

from app.database import Base, get_db
from app.main import app
from app.config import settings
from app.models import User, Material, Question, Submission  # noqa: F401
from app.services.auth_service import hash_password

from sqlalchemy.pool import StaticPool

# Use in-memory SQLite database for fast, isolated test runs
TEST_DATABASE_URL = "sqlite:///:memory:"
engine = create_engine(
    TEST_DATABASE_URL, connect_args={"check_same_thread": False}, poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db():
    """
    Creates an isolated database schema for each test run.
    Yields a session and drops all tables upon teardown.
    """
    Base.metadata.create_all(bind=engine)
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db):
    """
    Provides a FastAPI TestClient configured to override the
    get_db dependency with the test database session.
    """

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app, raise_server_exceptions=True) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def test_user(db):
    """
    Helper fixture to seed a test parent user in the DB.
    """
    user = User(
        email="testparent@example.com",
        password_hash=hash_password("securepassword123"),
        full_name="Test Parent",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_headers(test_user):
    """
    Helper fixture providing valid JWT headers for the test user.
    """
    payload = {"sub": str(test_user.id), "email": test_user.email}
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    return {"Authorization": f"Bearer {token}"}
