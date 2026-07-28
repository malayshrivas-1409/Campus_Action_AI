"""Health check endpoints."""

from fastapi import APIRouter

router = APIRouter(tags=["health"])


@router.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "Campus Action AI API is running"
    }


@router.get("/ready")
async def readiness_check():
    """Readiness check endpoint."""
    return {
        "status": "ready",
        "message": "Service is ready"
    }
