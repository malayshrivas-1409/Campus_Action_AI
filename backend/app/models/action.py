"""Action model."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import uuid
from app.database import Base


class Action(Base):
    """Action model - represents actionable items in documents."""
    __tablename__ = "actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False)
    action_title = Column(String(500), nullable=False)
    action_description = Column(Text, nullable=True)
    action_type = Column(String(50), nullable=False, index=True)  # registration, submission, etc.
    deadline = Column(DateTime, nullable=True, index=True)
    is_mandatory = Column(Boolean, default=False, nullable=False)
    required_documents = Column(ARRAY(String), default=[], nullable=False)  # Array of document names
    dependencies = Column(ARRAY(String), default=[], nullable=False)  # Array of prerequisite actions
    evidence_chunks = Column(ARRAY(UUID(as_uuid=True)), default=[], nullable=False)  # Array of chunk IDs
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_actions_deadline", "deadline"),
        Index("idx_actions_type", "action_type"),
    )

    def __repr__(self):
        return f"<Action {self.action_title}>"
