"""FastAPI application entry point."""

import logging
import warnings
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import init_db, close_db
from app.logger import logger
from app.api import health, auth, students, documents, search, embeddings, rag, chat, actions, notifications, activity
from app.services.embedding import get_embedding_service

# Suppress warnings during startup
warnings.filterwarnings("ignore", category=RuntimeWarning)


def _validate_startup():
    """Validate configuration on startup."""
    errors = []
    warnings_list = []
    
    # Check critical settings
    if not settings.DATABASE_URL or settings.DATABASE_URL == "postgresql+asyncpg://user:password@localhost:5432/campus_ai_db":
        errors.append("DATABASE_URL not configured properly")
    
    if settings.DEBUG and settings.ENVIRONMENT == "production":
        errors.append("DEBUG=True in production environment - security risk!")
    
    if not settings.SECRET_KEY:
        errors.append("SECRET_KEY is not set")
    
    if settings.ENVIRONMENT == "production" and not settings.GROQ_API_KEY:
        warnings_list.append("GROQ_API_KEY not set - LLM features will be disabled")
    
    # Print errors
    for error in errors:
        logger.error(f"❌ STARTUP ERROR: {error}")
    
    # Print warnings
    for warning in warnings_list:
        logger.warning(f"⚠️ STARTUP WARNING: {warning}")
    
    if errors:
        raise RuntimeError(f"Startup validation failed: {'; '.join(errors)}")
    
    return True


# Create FastAPI application
app = FastAPI(
    title=settings.APP_NAME,
    description="Intelligent Notice Management & Eligibility Engine",
    version="0.3.0",
    debug=settings.DEBUG,
)

# Add CORS middleware FIRST (before other middleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)


# Startup and shutdown events
@app.on_event("startup")
async def startup():
    """Initialize database and services on startup."""
    logger.info("=" * 60)
    logger.info("🚀 Starting Campus Action AI API")
    logger.info("=" * 60)
    
    try:
        # Validate configuration
        logger.info("🔍 Validating configuration...")
        _validate_startup()
        logger.info("✅ Configuration validated")
        
        # Initialize database
        logger.info("📊 Initializing database...")
        await init_db()
        logger.info("✅ Database initialized")
        
        # Log settings
        logger.info(f"🏢 Environment: {settings.ENVIRONMENT}")
        logger.info(f"🔧 Debug Mode: {settings.DEBUG}")
        logger.info(f"📍 Allowed Origins: {', '.join(settings.ALLOWED_ORIGINS)}")
        logger.info(f"🚀 API Documentation: /docs")
        logger.info("=" * 60)
        
    except Exception as e:
        logger.critical(f"❌ Startup failed: {e}")
        raise


@app.on_event("shutdown")
async def shutdown():
    """Cleanup on shutdown."""
    logger.info("🛑 Shutting down Campus Action AI API")
    from app.database import close_db
    await close_db()


# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(students.router)
app.include_router(documents.router)
app.include_router(notifications.router)
app.include_router(search.router)
app.include_router(embeddings.router)
app.include_router(rag.router)
app.include_router(chat.router)
app.include_router(actions.router)
app.include_router(activity.router)


# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Handle all exceptions globally."""
    logger.error(f"❌ Unhandled exception: {exc}", exc_info=True)
    return {
        "detail": "Internal server error",
        "error": str(exc) if settings.DEBUG else "Internal server error",
        "status_code": 500,
    }


# Root endpoint
@app.get("/")
async def root():
    """Root endpoint."""
    return {
        "message": "Welcome to Campus Action AI",
        "version": "0.3.0",
        "docs": "/docs",
        "health": "/health",
        "environment": settings.ENVIRONMENT,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG
    )
