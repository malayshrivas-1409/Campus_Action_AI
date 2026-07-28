"""Document and chunk models."""

from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Index, BIGINT, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, JSONB
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid
from app.database import Base


class Document(Base):
    """Document model."""
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(500), nullable=False)
    document_type = Column(String(50), nullable=False, index=True)  # placement, exam, scholarship, etc.
    source_url = Column(String(1000), nullable=True)
    file_path = Column(String(1000), nullable=False)
    file_size = Column(BIGINT, nullable=True)
    mime_type = Column(String(50), nullable=True)
    uploaded_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_documents_type", "document_type"),
        Index("idx_documents_uploaded_at", "uploaded_at"),
    )

    def __repr__(self):
        return f"<Document {self.title}>"


class DocumentVersion(Base):
    """Document version tracking."""
    __tablename__ = "document_versions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    effective_date = Column(DateTime, nullable=False, index=True)
    superseded_by = Column(UUID(as_uuid=True), ForeignKey("document_versions.id"), nullable=True)
    is_latest = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_doc_versions_effective", "effective_date"),
    )

    def __repr__(self):
        return f"<DocumentVersion {self.document_id} v{self.version_number}>"


class DocumentChunk(Base):
    """Document chunks for RAG."""
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_version_id = Column(UUID(as_uuid=True), ForeignKey("document_versions.id", ondelete="CASCADE"), nullable=False)
    chunk_index = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    section = Column(String(255), nullable=True, index=True)
    embedding = Column(Vector(384), nullable=True)  # BGE embedding dimension
    chunk_metadata = Column(JSONB, default={}, nullable=False)  # {department: [CSE, IT], batch: 2027, ...}
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_chunks_section", "section"),
    )

    def __repr__(self):
        return f"<DocumentChunk {self.document_version_id} chunk {self.chunk_index}>"
