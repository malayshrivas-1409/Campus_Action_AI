"""Application configuration."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """Application settings from environment variables."""

    # App
    APP_NAME: str = "Campus Action AI"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost:5432/campus_ai_db"

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Groq API
    GROQ_API_KEY: str
    GROQ_MODEL: str = "mixtral-8x7b-32768"

    # JWT
    SECRET_KEY: str = "change-me-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # CORS
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
