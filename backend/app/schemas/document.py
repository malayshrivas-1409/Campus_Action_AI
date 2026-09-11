"""Document schemas for validation."""

from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
import re


class DocumentUploadRequest(BaseModel):
    """Validate document upload request."""
    
    title: str = Field(..., min_length=3, max_length=500, description="Document title")
    document_type: str = Field(..., min_length=3, max_length=50, description="Type of document")
    source_url: Optional[str] = Field(None, max_length=1000, description="Source URL if available")
    
    @field_validator("title")
    @classmethod
    def title_not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Title cannot be empty")
        return v.strip()
    
    @field_validator("document_type")
    @classmethod
    def document_type_valid(cls, v):
        valid_types = [
            "placement", "exam", "scholarship", "internship", 
            "event", "announcement", "policy", "notice", "other"
        ]
        if v.lower() not in valid_types:
            raise ValueError(f"Invalid document type. Must be one of: {', '.join(valid_types)}")
        return v.lower()
    
    @field_validator("source_url")
    @classmethod
    def source_url_valid(cls, v):
        if v and not re.match(r"https?://", v):
            raise ValueError("Invalid URL format")
        return v


class DocumentResponse(BaseModel):
    """Document response model."""
    
    id: str
    title: str
    document_type: str
    file_path: str
    file_size: int
    mime_type: str
    uploaded_by: str
    uploaded_at: datetime
    is_active: bool
    source_url: Optional[str] = None
    
    class Config:
        from_attributes = True


class DocumentListResponse(BaseModel):
    """Document list response."""
    
    success: bool
    total: int
    skip: int
    limit: int
    documents: List[DocumentResponse]


class DocumentDetailResponse(BaseModel):
    """Document detail response."""
    
    success: bool
    document: DocumentResponse
    chunks_count: int
    pages: int
    metadata: dict
