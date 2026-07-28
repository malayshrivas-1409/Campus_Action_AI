"""Student model."""

from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Index
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.database import Base


class Student(Base):
    """Student model."""
    __tablename__ = "students"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    roll_number = Column(String(50), unique=True, nullable=False, index=True)
    department = Column(String(50), nullable=False, index=True)
    batch = Column(Integer, nullable=False, index=True)
    cgpa = Column(Float, nullable=True, index=True)
    backlogs = Column(Integer, default=0, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Indexes
    __table_args__ = (
        Index("idx_students_department", "department"),
        Index("idx_students_batch", "batch"),
        Index("idx_students_cgpa", "cgpa"),
    )

    def __repr__(self):
        return f"<Student {self.roll_number}>"
