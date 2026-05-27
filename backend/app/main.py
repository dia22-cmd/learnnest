import logging
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from alembic.config import Config
from alembic import command

from app.config import settings
from app.database import engine
from app.routers.auth import router as auth_router

logger = logging.getLogger(__name__)

# Explicit path to alembic.ini — works regardless of working directory
ALEMBIC_INI = os.path.join(os.path.dirname(__file__), "..", "alembic.ini")

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
        print("Running database migrations...", flush=True)
        alembic_cfg = Config(ALEMBIC_INI)
        command.upgrade(alembic_cfg, "head")
        print("Migrations complete.", flush=True)
    except Exception as e:
        print(f"Migration failed: {e}", flush=True)
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
