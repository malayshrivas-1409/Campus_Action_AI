"""Extraction result model."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Numeric, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB, ARRAY
from datetime import datetime
import uuid
from app.database import Base


class ExtractionResult(Base):
    """Extraction result - stores extracted data from documents."""
    __tablename__ = "extraction_results"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    extraction_type = Column(String(50), nullable=False, index=True)  # eligibility, deadline, requirements, etc.
    extracted_data = Column(JSONB, nullable=False)
    source_chunks = Column(ARRAY(UUID(as_uuid=True)), nullable=False)  # Array of chunk IDs
    confidence_score = Column(Numeric(3, 2), nullable=True)
    verified = Column(Boolean, default=False, nullable=False)
    verification_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_extraction_type", "extraction_type"),
    )

    def __repr__(self):
        return f"<ExtractionResult {self.extraction_type}>"
