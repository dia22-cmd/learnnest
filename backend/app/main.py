import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from alembic.config import Config
from alembic import command

from app.config import settings
from app.database import engine
from app.routers.auth import router as auth_router

logger = logging.getLogger(__name__)

app = FastAPI(title="LearnNest API", version="0.1.0")

# CORS — allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)


@app.on_event("startup")
def run_migrations():
    """
    Runs automatically when the server starts.
    In production — no terminal access, so migrations
    must run themselves. This handles it.
    """
    try:
        logger.info("Running database migrations...")
        alembic_cfg = Config("alembic.ini")
        command.upgrade(alembic_cfg, "head")
        logger.info("Migrations complete.")
    except Exception as e:
        logger.error(f"Migration failed: {e}")
        raise


@app.get("/")
def root():
    return {"message": "LearnNest API is alive"}


@app.get("/health")
def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return {"status": "healthy", "db": "connected"}
    except Exception as e:
        return {"status": "degraded", "db": "unreachable", "error": str(e)}
