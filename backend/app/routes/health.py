"""Health check endpoint."""

from fastapi import APIRouter
from ..config import config

router = APIRouter()


@router.get("/health")
def health():
    """Service health check."""
    try:
        from ..db import health_check
        db_ok = health_check()
    except (RuntimeError, ImportError):
        db_ok = False

    return {
        "status": "ok",
        "service": "Rostr Contracts API",
        "version": "1.0.0",
        "region": config.region,
        "database": "connected" if db_ok else "not configured",
    }
