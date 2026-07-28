"""Student schemas."""

from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class StudentCreate(BaseModel):
    """Student creation schema."""
    roll_number: str
    department: str
    batch: int
    cgpa: Optional[float] = None
    backlogs: int = 0


class StudentUpdate(BaseModel):
    """Student update schema."""
    cgpa: Optional[float] = None
    backlogs: Optional[int] = None


class StudentResponse(BaseModel):
    """Student response schema."""
    id: str
    user_id: str
    roll_number: str
    department: str
    batch: int
    cgpa: Optional[float]
    backlogs: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
