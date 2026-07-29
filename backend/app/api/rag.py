"""RAG and chat endpoints."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.rag import (
    RAGQueryRequest,
    RAGQueryResponse,
    RetrieveRequest,
    RetrieveResponse,
)
from app.services.rag import RAGService
from app.services.llm import get_llm_service
from app.logger import logger


router = APIRouter(prefix="/api/v1/rag", tags=["RAG"])


def get_rag_service() -> RAGService:
    """Get RAG service instance."""
    llm_service = get_llm_service()
    return RAGService(llm_service=llm_service)


@router.post("/retrieve", response_model=RetrieveResponse)
async def retrieve_documents(
    request: RetrieveRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Retrieve relevant documents for a query.
    
    Uses hybrid search combining vector similarity and keyword matching.
    """
    try:
        rag_service = get_rag_service()
        
        chunks = await rag_service.retrieve_documents(
            session=session,
            query=request.query,
            top_k=request.top_k,
            vector_weight=request.vector_weight,
            keyword_weight=request.keyword_weight,
        )
        
        return RetrieveResponse(
            chunks=chunks,
            total_retrieved=len(chunks),
        )
        
    except Exception as e:
        logger.error(f"Error retrieving documents: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving documents",
        )


@router.post("/query", response_model=RAGQueryResponse)
async def rag_query(
    request: RAGQueryRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Ask a question and get an answer using RAG.
    
    Retrieves relevant documents and generates an answer using LLM.
    """
    try:
        llm_service = get_llm_service()
        
        # Check if LLM service is configured
        if not llm_service.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM service not configured (missing GROQ_API_KEY)",
            )
        
        rag_service = get_rag_service()
        
        # Get answer with RAG
        result = await rag_service.answer_question(
            session=session,
            query=request.query,
            top_k=request.top_k,
        )
        
        return RAGQueryResponse(
            response=result["response"],
            sources=result["sources"],
            chunks_retrieved=result["chunks_retrieved"],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in RAG query: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing query: {str(e)}",
        )


@router.get("/status")
async def rag_status(
    current_user: User = Depends(get_current_user),
):
    """Get RAG service status."""
    try:
        llm_service = get_llm_service()
        embedding_service = None
        
        try:
            from app.services.embedding import get_embedding_service
            embedding_service = get_embedding_service()
        except Exception as e:
            logger.warning(f"Could not get embedding service: {e}")
        
        return {
            "status": "operational",
            "llm_configured": llm_service.client is not None,
            "llm_model": llm_service.model if llm_service.client else "N/A",
            "embeddings_available": embedding_service is not None,
            "embedding_model": "BAAI/bge-small-en-v1.5" if embedding_service else "N/A",
        }
        
    except Exception as e:
        logger.error(f"Error getting RAG status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error getting service status",
        )
