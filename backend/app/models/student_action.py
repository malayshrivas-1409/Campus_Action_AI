"""Student action model - tracks actions for each student."""

from sqlalchemy import Column, String, DateTime, ForeignKey, Index, Integer, Numeric
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from datetime import datetime
import uuid
from app.database import Base


class StudentAction(Base):
    """Student action - tracks which actions apply to which students."""
    __tablename__ = "student_actions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    student_id = Column(UUID(as_uuid=True), ForeignKey("students.id", ondelete="CASCADE"), nullable=False, index=True)
    action_id = Column(UUID(as_uuid=True), ForeignKey("actions.id", ondelete="CASCADE"), nullable=False)
    eligibility_status = Column(String(50), nullable=False, index=True)  # eligible, not_eligible, maybe, needs_info
    eligibility_reason = Column(String(1000), nullable=True)
    eligibility_confidence = Column(Numeric(3, 2), nullable=True)  # 0-1 confidence
    required_info = Column(ARRAY(String), default=[], nullable=False)  # What info is missing
    status = Column(String(50), default="pending", nullable=False, index=True)  # pending, completed, dismissed
    view_count = Column(Integer, default=0, nullable=False)
    first_viewed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    dismissed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    __table_args__ = (
        Index("idx_student_actions_status", "status"),
        Index("idx_student_actions_student", "student_id"),
        Index("idx_student_actions_eligibility", "eligibility_status"),
    )

    def __repr__(self):
        return f"<StudentAction student={self.student_id} action={self.action_id}>"
