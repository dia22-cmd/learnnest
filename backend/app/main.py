from fastapi import FastAPI
from sqlalchemy import text

from app.config import settings
from app.database import engine
from app.routers.auth import router as auth_router

app = FastAPI(title="LearnNest API", version="0.1.0")

app.include_router(auth_router)


@app.get("/")
def root():
    return {"message": "LearnNest API is alive"}


@app.get("/health")
def health():
    """Verifies DB is reachable. Used by deployment platforms."""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "db": "connected"}
    except Exception as e:
        return {"status": "degraded", "db": "unreachable", "error": str(e)}