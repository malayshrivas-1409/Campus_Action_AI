"""Database configuration and session management."""

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.config import settings
from app.logger import logger

# Convert PostgreSQL URL to async format
async_database_url = settings.DATABASE_URL.replace(
    "postgresql://", "postgresql+asyncpg://"
)

# Create async engine
engine = create_async_engine(
    async_database_url,
    echo=settings.DEBUG,
    pool_pre_ping=True,
    pool_size=20,
    max_overflow=0,
)

# Session factory
async_session_maker = async_sessionmaker(
    engine, class_=AsyncSession, expire_on_commit=False, autoflush=False
)

# Base class for models
Base = declarative_base()


async def get_db():
    """Dependency for getting database session."""
    async with async_session_maker() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database tables and extensions."""
    # Enable pgvector extension in a separate transaction
    async with engine.begin() as conn:
        try:
            await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            logger.info("pgvector extension enabled successfully")
        except Exception as e:
            logger.warning(f"Could not enable pgvector extension: {e}")
            # This is expected if pgvector is not installed, but we continue
    
    # Create tables in a separate transaction to avoid being blocked by extension failure
    async with engine.begin() as conn:
        try:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Database tables created successfully")
        except Exception as e:
            logger.error(f"Failed to create database tables: {e}")
            raise


async def close_db():
    """Close database connection."""
    await engine.dispose()

