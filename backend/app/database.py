from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

from app.config import settings


# 1. Engine — the connection pool to PostgreSQL
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # checks connection is alive before using it
    echo=False,  # set True to log every SQL query (debug only)
)

# 2. Session factory — creates new database sessions on demand
SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

# 3. Base class — every model (User, Material, etc.) will inherit from this
Base = declarative_base()


# 4. Dependency for FastAPI routes
def get_db():
    """
    Yields a database session, then closes it.
    FastAPI calls this automatically via Depends(get_db).
    The try/finally ensures the connection ALWAYS closes,
    even if the route raises an exception.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
