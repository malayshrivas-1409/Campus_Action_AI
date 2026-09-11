"""Vector search and semantic query endpoints."""

from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_
from sqlalchemy.dialects.postgresql import UUID

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.document import DocumentChunk, Document, DocumentVersion
from app.schemas.search import (
    VectorSearchRequest,
    VectorSearchResponse,
    DocumentChunkSearchResult,
    EmbeddingInfoResponse,
)
from app.services.embedding import get_embedding_service
from app.logger import logger


router = APIRouter(prefix="/api/v1/search", tags=["search"])


@router.get("/info", response_model=EmbeddingInfoResponse)
async def get_embedding_info(
    current_user: User = Depends(get_current_user),
):
    """Get embedding service information."""
    try:
        service = get_embedding_service()
        return {
            "model_name": service.model_name,
            "embedding_dimension": service.get_embedding_dimension(),
            "service_status": "ready",
        }
    except Exception as e:
        logger.error(f"Error getting embedding info: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Embedding service error"
        )


@router.post("/vector", response_model=VectorSearchResponse)
async def vector_search(
    request: VectorSearchRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Search documents using vector similarity.

    - **query**: Search query text
    - **limit**: Maximum results to return
    - **threshold**: Minimum similarity score (0.0-1.0)
    """
    try:
        # Generate embedding for query
        service = get_embedding_service()
        query_embedding = service.embed_text(request.query)
        
        # Search for similar chunks using pgvector
        # Convert embedding to string format for pgvector
        embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
        
        # Use raw SQL for vector similarity search
        from sqlalchemy import text
        
        sql = text("""
            SELECT 
                dc.id,
                dc.document_version_id,
                d.id as document_id,
                d.title as document_title,
                d.document_type,
                dc.content,
                dc.page_number,
                dc.section,
                (1 - (dc.embedding <=> CAST(:embedding AS vector))) as similarity_score
            FROM document_chunks dc
            JOIN document_versions dv ON dc.document_version_id = dv.id
            JOIN documents d ON dv.document_id = d.id
            WHERE d.is_active = true
            AND dv.is_latest = true
            AND d.uploaded_by = :user_id
            AND (1 - (dc.embedding <=> CAST(:embedding AS vector))) > :threshold
            ORDER BY similarity_score DESC
            LIMIT :limit
        """)
        
        result = await session.execute(
            sql,
            {
                "embedding": embedding_str,
                "user_id": str(current_user.id),
                "threshold": request.threshold,
                "limit": request.limit,
            }
        )
        
        rows = result.fetchall()
        
        # Format results
        results = []
        for row in rows:
            results.append(
                DocumentChunkSearchResult(
                    chunk_id=str(row[0]),
                    document_id=str(row[2]),
                    document_title=row[3],
                    document_type=row[4],
                    content=row[5],
                    page_number=row[6],
                    section=row[7],
                    similarity_score=float(row[8]),
                )
            )
        
        return VectorSearchResponse(
            query=request.query,
            results=results,
            total=len(results),
        )
        
    except Exception as e:
        logger.error(f"Error in vector search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )


@router.post("/keyword", response_model=VectorSearchResponse)
async def keyword_search(
    request: VectorSearchRequest,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Search documents using keyword matching.

    - **query**: Search query text
    - **limit**: Maximum results to return
    """
    try:
        # Simple keyword search using ILIKE
        search_term = f"%{request.query}%"
        
        query_obj = (
            select(
                DocumentChunk.id,
                DocumentChunk.document_version_id,
                Document.id.label("document_id"),
                Document.title.label("document_title"),
                Document.document_type,
                DocumentChunk.content,
                DocumentChunk.page_number,
                DocumentChunk.section,
            )
            .join(DocumentVersion, DocumentChunk.document_version_id == DocumentVersion.id)
            .join(Document, DocumentVersion.document_id == Document.id)
            .where(
                and_(
                    Document.is_active == True,
                    Document.uploaded_by == current_user.id,  # IMPORTANT: Filter by current user
                    DocumentVersion.is_latest == True,
                    DocumentChunk.content.ilike(search_term),
                )
            )
            .limit(request.limit)
        )
        
        result = await session.execute(query_obj)
        rows = result.fetchall()
        
        # Format results (all have same score for keyword search)
        results = []
        for row in rows:
            results.append(
                DocumentChunkSearchResult(
                    chunk_id=str(row[0]),
                    document_id=str(row[2]),
                    document_title=row[3],
                    document_type=row[4],
                    content=row[5],
                    page_number=row[6],
                    section=row[7],
                    similarity_score=1.0,
                )
            )
        
        return VectorSearchResponse(
            query=request.query,
            results=results,
            total=len(results),
        )
        
    except Exception as e:
        logger.error(f"Error in keyword search: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )
