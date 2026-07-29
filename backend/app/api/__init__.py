"""API routes."""

from app.api import health, auth, students, documents, search, embeddings, rag

__all__ = ["health", "auth", "students", "documents", "search", "embeddings", "rag"]

