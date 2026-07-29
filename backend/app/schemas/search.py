"""Search and vector query schemas."""

from typing import Optional, List
from pydantic import BaseModel, Field


class VectorSearchRequest(BaseModel):
    """Request for vector similarity search."""
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=10, ge=1, le=100)
    threshold: float = Field(default=0.5, ge=0.0, le=1.0)


class DocumentChunkSearchResult(BaseModel):
    """Search result with document chunk."""
    chunk_id: str
    document_id: str
    document_title: str
    document_type: str
    content: str
    page_number: Optional[int]
    section: Optional[str]
    similarity_score: float


class VectorSearchResponse(BaseModel):
    """Response for vector search."""
    query: str
    results: List[DocumentChunkSearchResult]
    total: int


class HybridSearchRequest(BaseModel):
    """Request for hybrid search (vector + keyword)."""
    query: str = Field(..., min_length=1, max_length=500)
    limit: int = Field(default=10, ge=1, le=100)
    vector_weight: float = Field(default=0.7, ge=0.0, le=1.0)
    keyword_weight: float = Field(default=0.3, ge=0.0, le=1.0)


class HybridSearchResponse(BaseModel):
    """Response for hybrid search."""
    query: str
    results: List[DocumentChunkSearchResult]
    total: int


class EmbeddingInfoResponse(BaseModel):
    """Information about embedding service."""
    model_name: str
    embedding_dimension: int
    service_status: str
    
    class Config:
        protected_namespaces = ()
