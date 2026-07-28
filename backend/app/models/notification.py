"""Notification model."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base


class Notification(Base):
    """Notification model."""
    __tablename__ = "notifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    action_id = Column(UUID(as_uuid=True), ForeignKey("actions.id", ondelete="SET NULL"), nullable=True)
    notification_type = Column(String(50), nullable=False)  # deadline_approaching, new_action, deadline_updated
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False, nullable=False, index=True)
    read_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    __table_args__ = (
        Index("idx_notifications_unread", "is_read", "created_at"),
        Index("idx_notifications_student", "student_id"),
    )

    def __repr__(self):
        return f"<Notification {self.title}>"
