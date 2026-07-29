"""Document schemas for API requests/responses."""

from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field


class DocumentUploadRequest(BaseModel):
    """Request to upload a document."""
    title: str = Field(..., min_length=1, max_length=500)
    document_type: str = Field(..., min_length=1, max_length=50)
    # file_content is handled separately as multipart/form-data


class DocumentResponse(BaseModel):
    """Document response model."""
    id: str
    title: str
    document_type: str
    file_path: str
    file_size: int
    mime_type: str
    is_active: bool
    uploaded_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentVersionResponse(BaseModel):
    """Document version response."""
    id: str
    document_id: str
    version_number: int
    effective_date: datetime
    is_latest: bool
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentChunkResponse(BaseModel):
    """Document chunk response."""
    id: str
    document_version_id: str
    chunk_index: int
    content: str
    page_number: Optional[int]
    section: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DocumentDetailResponse(BaseModel):
    """Detailed document response with metadata."""
    document: DocumentResponse
    latest_version: Optional[DocumentVersionResponse]
    chunk_count: int


class DocumentUploadResponse(BaseModel):
    """Response after uploading document."""
    success: bool
    document_id: str
    version_id: Optional[str] = None
    chunks_count: int = 0
    error: Optional[str] = None


class DocumentListResponse(BaseModel):
    """List of documents."""
    items: List[DocumentResponse]
    total: int
    skip: int
    limit: int
