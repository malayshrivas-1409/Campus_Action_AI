"""API routes."""

from app.api import health, auth, students, documents, search, embeddings

__all__ = ["health", "auth", "students", "documents", "search", "embeddings"]

