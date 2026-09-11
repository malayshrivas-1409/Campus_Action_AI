"""Action-related Pydantic schemas."""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ActionBase(BaseModel):
    """Base action schema."""
    action_title: str
    action_description: Optional[str] = None
    action_type: str
    deadline: Optional[datetime] = None
    is_mandatory: bool = False
    required_documents: List[str] = []


class ActionCreate(ActionBase):
    """Schema for creating an action."""
    document_id: str


class ActionResponse(ActionBase):
    """Schema for action response."""
    id: str
    document_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ExtractionResultBase(BaseModel):
    """Base extraction result schema."""
    extraction_type: str
    extracted_data: dict
    confidence_score: Optional[float] = None


class ExtractionResultCreate(ExtractionResultBase):
    """Schema for creating extraction result."""
    document_id: str
    source_chunks: List[str] = []


class ExtractionResultResponse(ExtractionResultBase):
    """Schema for extraction result response."""
    id: str
    document_id: str
    verified: bool = False
    created_at: datetime

    class Config:
        from_attributes = True


class ActionExtractionRequest(BaseModel):
    """Request for action extraction endpoint."""
    document_id: str


class ActionExtractionResponse(BaseModel):
    """Response from action extraction endpoint."""
    success: bool
    actions_extracted: int
    actions: List[ActionResponse] = []
    error: Optional[str] = None


class EligibilityRequirement(BaseModel):
    """Eligibility requirement."""
    field: str  # cgpa, department, batch, backlogs, etc.
    operator: str  # >=, >, <=, <, ==, !=, in
    value: str  # Flexible type for value
    description: str


class EligibilityCheckRequest(BaseModel):
    """Request for eligibility check."""
    action_id: str


class EligibilityCheckResponse(BaseModel):
    """Response from eligibility check."""
    action_id: str
    eligible: bool
    reason: str
    confidence: float
    missing_info: List[str] = []
