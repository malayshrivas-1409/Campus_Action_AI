"""Application configuration."""

import secrets
from pydantic_settings import BaseSettings
from typing import Optional


def _generate_secret_key() -> str:
    """Generate a secure random secret key."""
    return secrets.token_urlsafe(32)


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # App
    APP_NAME: str = "Campus Action AI"
    DEBUG: bool = False  # Default to False for security - override in .env for development
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "production"  # Default to production - override in .env for development

    # Database
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/campus_ai_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Groq API
    GROQ_API_KEY: str = ""  # Optional - empty string if not set
    GROQ_MODEL: str = "openai/gpt-oss-20b"

    # JWT - Use environment variable or generate strong key
    SECRET_KEY: str = ""  # Will be generated if not provided
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Request limits
    MAX_UPLOAD_SIZE_MB: int = 50  # Max file upload size
    MAX_REQUEST_SIZE: int = 10 * 1024 * 1024  # 10MB
    REQUEST_TIMEOUT_SECONDS: int = 30

    # Rate limiting
    RATE_LIMIT_ENABLED: bool = True
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_SECONDS: int = 60

    # CORS - Allow common development ports
    ALLOWED_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
    ]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

    def __init__(self, **data):
        """Initialize settings and generate SECRET_KEY if not provided."""
        super().__init__(**data)
        
        # Generate SECRET_KEY if not provided or is default
        if not self.SECRET_KEY or self.SECRET_KEY == "change-me-in-production":
            import warnings
            warnings.warn(
                "SECRET_KEY not configured or using default value. "
                "Generating a new one. For production, set SECRET_KEY in .env",
                RuntimeWarning
            )
            self.SECRET_KEY = _generate_secret_key()
        
        # Warn if DEBUG is True
        if self.DEBUG and self.ENVIRONMENT == "production":
            import warnings
            warnings.warn(
                "DEBUG is True in production environment. This is a security risk.",
                RuntimeWarning
            )
        
        # Warn if using default database URL
        if self.DATABASE_URL == "postgresql+asyncpg://user:password@localhost:5432/campus_ai_db":
            import warnings
            warnings.warn(
                "Using default DATABASE_URL. Please set DATABASE_URL in .env",
                RuntimeWarning
            )


settings = Settings()
