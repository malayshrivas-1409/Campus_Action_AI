"""FastAPI application entry point."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, close_db
from app.logger import logger
from app.api import health, auth, students, documents

# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent Notice Management & Eligibility Engine",
    version="0.2.0",
    debug=settings.DEBUG,
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Startup and shutdown events
@app.on_event("startup")
async def startup():
    """Initialize database and services on startup."""
    logger.info("Starting Campus Action AI API")
    await init_db()
    logger.info("Database initialized")


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown."""
    logger.info("Shutting down Campus Action AI API")
    from app.database import close_db
    await close_db()


# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(documents.router)


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Campus Action AI",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
