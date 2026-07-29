"""API routes."""

from app.api import health, auth, students, documents, search, embeddings, rag, chat

__all__ = ["health", "auth", "students", "documents", "search", "embeddings", "rag", "chat"]

