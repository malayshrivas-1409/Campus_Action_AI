"""RAG-related Pydantic schemas."""

from pydantic import BaseModel
from typing import List, Optional


class ChunkSource(BaseModel):
    """Source chunk information."""
    chunk_id: str
    document_title: str
    document_type: str
    page_number: Optional[int] = None
    section: Optional[str] = None


class RetrievedChunk(BaseModel):
    """Retrieved chunk with metadata."""
    chunk_id: str
    document_id: str
    document_title: str
    document_type: str
    content: str
    page_number: Optional[int] = None
    section: Optional[str] = None
    score: float
    source: str  # "vector" or "keyword"


class RAGQueryRequest(BaseModel):
    """Request for RAG query endpoint."""
    query: str
    top_k: int = 10
    vector_weight: float = 0.7
    keyword_weight: float = 0.3


class RAGQueryResponse(BaseModel):
    """Response from RAG query endpoint."""
    response: str
    sources: List[ChunkSource]
    chunks_retrieved: int


class RetrieveRequest(BaseModel):
    """Request for document retrieval."""
    query: str
    top_k: int = 10
    vector_weight: float = 0.7
    keyword_weight: float = 0.3


class RetrieveResponse(BaseModel):
    """Response from document retrieval."""
    chunks: List[RetrievedChunk]
    total_retrieved: int
