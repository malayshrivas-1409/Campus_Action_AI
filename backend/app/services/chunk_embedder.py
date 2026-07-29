"""Service to generate and store embeddings for document chunks."""

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update

from app.models.document import DocumentChunk, DocumentVersion
from app.services.embedding import get_embedding_service
from app.logger import logger


class ChunkEmbedderService:
    """Generate and store embeddings for document chunks."""

    @staticmethod
    async def embed_chunks_for_version(
        session: AsyncSession,
        version_id: str,
        batch_size: int = 32,
    ) -> dict:
        """
        Generate embeddings for all chunks in a document version.

        Args:
            session: Database session
            version_id: Document version ID
            batch_size: Batch size for encoding

        Returns:
            Result dictionary with stats
        """
        try:
            # Get all chunks for this version that don't have embeddings
            query = (
                select(DocumentChunk)
                .where(
                    DocumentChunk.document_version_id == version_id,
                    DocumentChunk.embedding == None,
                )
                .order_by(DocumentChunk.chunk_index)
            )

            result = await session.execute(query)
            chunks = result.scalars().all()

            if not chunks:
                return {
                    "success": True,
                    "chunks_processed": 0,
                    "chunks_skipped": 0,
                    "error": None,
                }

            logger.info(f"Generating embeddings for {len(chunks)} chunks in version {version_id}")

            # Get embedding service
            service = get_embedding_service()

            # Extract texts
            texts = [chunk.content for chunk in chunks]

            # Generate embeddings in batches
            embeddings = service.embed_texts(texts, batch_size=batch_size)

            # Store embeddings
            for chunk, embedding in zip(chunks, embeddings):
                chunk.embedding = embedding

            # Commit changes
            await session.flush()
            await session.commit()

            logger.info(f"Successfully generated {len(chunks)} embeddings for version {version_id}")

            return {
                "success": True,
                "chunks_processed": len(chunks),
                "chunks_skipped": 0,
                "error": None,
            }

        except Exception as e:
            await session.rollback()
            logger.error(f"Error embedding chunks: {str(e)}")
            return {
                "success": False,
                "chunks_processed": 0,
                "chunks_skipped": len(chunks) if chunks else 0,
                "error": str(e),
            }

    @staticmethod
    async def embed_all_chunks(
        session: AsyncSession,
        batch_size: int = 32,
    ) -> dict:
        """
        Generate embeddings for all chunks without embeddings.

        Args:
            session: Database session
            batch_size: Batch size for encoding

        Returns:
            Result dictionary with stats
        """
        try:
            # Get all chunks without embeddings
            query = select(DocumentChunk).where(DocumentChunk.embedding == None)

            result = await session.execute(query)
            chunks = result.scalars().all()

            if not chunks:
                return {
                    "success": True,
                    "total_processed": 0,
                    "error": None,
                }

            logger.info(f"Generating embeddings for {len(chunks)} chunks")

            # Get embedding service
            service = get_embedding_service()

            # Extract texts
            texts = [chunk.content for chunk in chunks]

            # Generate embeddings in batches
            embeddings = service.embed_texts(texts, batch_size=batch_size)

            # Store embeddings
            for chunk, embedding in zip(chunks, embeddings):
                chunk.embedding = embedding

            # Commit changes
            await session.flush()
            await session.commit()

            logger.info(f"Successfully generated {len(chunks)} embeddings")

            return {
                "success": True,
                "total_processed": len(chunks),
                "error": None,
            }

        except Exception as e:
            await session.rollback()
            logger.error(f"Error embedding all chunks: {str(e)}")
            return {
                "success": False,
                "total_processed": 0,
                "error": str(e),
            }
