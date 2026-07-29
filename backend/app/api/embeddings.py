"""Embedding management endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.chunk_embedder import ChunkEmbedderService
from app.services.embedding import get_embedding_service
from app.logger import logger


router = APIRouter(prefix="/embeddings", tags=["embeddings"])


@router.post("/generate-all")
async def generate_all_embeddings(
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Generate embeddings for all chunks without embeddings.
    
    This is an admin operation that processes existing chunks.
    """
    try:
        logger.info(f"Starting embedding generation for all chunks (initiated by {current_user.email})")
        
        result = await ChunkEmbedderService.embed_all_chunks(session)
        
        if result["success"]:
            logger.info(f"Successfully generated {result['total_processed']} embeddings")
            return {
                "success": True,
                "total_processed": result["total_processed"],
                "message": f"Generated embeddings for {result['total_processed']} chunks",
            }
        else:
            logger.error(f"Failed to generate embeddings: {result['error']}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate embeddings: {result['error']}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_all_embeddings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate embeddings"
        )


@router.post("/generate-version/{version_id}")
async def generate_version_embeddings(
    version_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Generate embeddings for a specific document version.
    
    Args:
        version_id: Document version ID
    """
    try:
        logger.info(f"Generating embeddings for version {version_id} (initiated by {current_user.email})")
        
        result = await ChunkEmbedderService.embed_chunks_for_version(session, version_id)
        
        if result["success"]:
            logger.info(f"Successfully generated {result['chunks_processed']} embeddings for version {version_id}")
            return {
                "success": True,
                "chunks_processed": result["chunks_processed"],
                "message": f"Generated embeddings for {result['chunks_processed']} chunks",
            }
        else:
            logger.error(f"Failed to generate embeddings: {result['error']}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to generate embeddings: {result['error']}"
            )
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in generate_version_embeddings: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate embeddings"
        )
