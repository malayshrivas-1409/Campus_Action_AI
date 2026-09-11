"""Document management service."""

import os
import uuid
import logging
from pathlib import Path
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, desc

from app.models.document import Document, DocumentVersion, DocumentChunk
from app.models.user import User
from app.services.pdf_parser import PDFParser
from app.logger import logger


class DocumentService:
    """Service for managing documents and versions."""

    def __init__(self, upload_dir: str = "uploads/documents"):
        """
        Initialize document service.

        Args:
            upload_dir: Directory to store uploaded files
        """
        self.upload_dir = upload_dir
        self.parser = PDFParser()
        
        # Create upload directory if it doesn't exist
        Path(self.upload_dir).mkdir(parents=True, exist_ok=True)

    async def save_upload(self, file_content: bytes, filename: str) -> str:
        """
        Save uploaded file to disk.

        Args:
            file_content: File content as bytes
            filename: Original filename

        Returns:
            Path where file was saved
        """
        # Generate unique filename to prevent collisions
        file_id = str(uuid.uuid4())
        _, ext = os.path.splitext(filename)
        safe_filename = f"{file_id}{ext}"
        
        file_path = os.path.join(self.upload_dir, safe_filename)
        
        # Write file
        with open(file_path, "wb") as f:
            f.write(file_content)
        
        logger.info(f"Saved upload to {file_path}")
        return file_path

    async def create_document(
        self,
        session: AsyncSession,
        title: str,
        document_type: str,
        file_path: str,
        file_size: int,
        mime_type: str,
        uploaded_by_id: str,
        source_url: Optional[str] = None,
    ) -> Document:
        """
        Create a document record.

        Args:
            session: Database session
            title: Document title
            document_type: Type of document (placement, exam, etc.)
            file_path: Path to file
            file_size: File size in bytes
            mime_type: MIME type
            uploaded_by_id: User ID who uploaded
            source_url: Optional source URL

        Returns:
            Created document
        """
        document = Document(
            title=title,
            document_type=document_type,
            file_path=file_path,
            file_size=file_size,
            mime_type=mime_type,
            uploaded_by=uploaded_by_id,
            source_url=source_url,
            is_active=True,
            uploaded_at=datetime.utcnow(),
        )
        
        session.add(document)
        await session.flush()
        
        logger.info(f"Created document {document.id} - {title}")
        return document

    async def create_version(
        self,
        session: AsyncSession,
        document_id: str,
        version_number: int = 1,
    ) -> DocumentVersion:
        """
        Create a document version.

        Args:
            session: Database session
            document_id: Document ID
            version_number: Version number

        Returns:
            Created version
        """
        version = DocumentVersion(
            document_id=document_id,
            version_number=version_number,
            effective_date=datetime.utcnow(),
            is_latest=True,
        )
        
        session.add(version)
        await session.flush()
        
        logger.info(f"Created version {version_number} for document {document_id}")
        return version

    async def store_chunks(
        self,
        session: AsyncSession,
        version_id: str,
        chunks: list,
    ) -> int:
        """
        Store document chunks.

        Args:
            session: Database session
            version_id: Document version ID
            chunks: List of chunk dictionaries

        Returns:
            Number of chunks stored
        """
        chunk_objects = []
        
        for chunk in chunks:
            chunk_obj = DocumentChunk(
                document_version_id=version_id,
                chunk_index=chunk["chunk_index"],
                content=chunk["content"],
                page_number=chunk.get("page_number"),
                section=chunk.get("section"),
                chunk_metadata=chunk.get("metadata", {}),
            )
            chunk_objects.append(chunk_obj)
        
        session.add_all(chunk_objects)
        await session.flush()
        
        logger.info(f"Stored {len(chunk_objects)} chunks for version {version_id}")
        return len(chunk_objects)

    async def get_document(
        self,
        session: AsyncSession,
        document_id: str,
    ) -> Optional[Document]:
        """Get document by ID."""
        result = await session.execute(
            select(Document).where(Document.id == document_id)
        )
        return result.scalar_one_or_none()

    async def get_documents(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 20,
        document_type: Optional[str] = None,
        uploaded_by_id: Optional[str] = None,
    ) -> list:
        """
        Get documents with pagination.

        Args:
            session: Database session
            skip: Number of records to skip
            limit: Maximum records to return
            document_type: Filter by type
            uploaded_by_id: Filter by user who uploaded (for user isolation)

        Returns:
            List of documents
        """
        query = select(Document).where(Document.is_active == True)
        
        if document_type:
            query = query.where(Document.document_type == document_type)
        
        # IMPORTANT: Filter by user for isolation
        if uploaded_by_id:
            query = query.where(Document.uploaded_by == uploaded_by_id)
        
        query = query.order_by(desc(Document.uploaded_at)).offset(skip).limit(limit)
        
        result = await session.execute(query)
        return result.scalars().all()

    async def get_document_chunks(
        self,
        session: AsyncSession,
        document_id: str,
    ) -> Optional[list]:
        """
        Get all chunks for a document (latest version).

        Args:
            session: Database session
            document_id: Document ID

        Returns:
            List of chunks with content or None if document not found
        """
        try:
            # Get latest version of document
            result = await session.execute(
                select(DocumentVersion)
                .where(
                    and_(
                        DocumentVersion.document_id == document_id,
                        DocumentVersion.is_latest == True,
                    )
                )
                .order_by(desc(DocumentVersion.version_number))
            )
            
            version = result.scalar_one_or_none()
            if not version:
                return None
            
            # Get all chunks for this version
            chunks_result = await session.execute(
                select(DocumentChunk)
                .where(DocumentChunk.document_version_id == version.id)
                .order_by(DocumentChunk.chunk_index)
            )
            
            chunks = chunks_result.scalars().all()
            
            return [
                {
                    "chunk_index": chunk.chunk_index,
                    "content": chunk.content,
                    "page_number": chunk.page_number,
                    "section": chunk.section,
                }
                for chunk in chunks
            ]
            
        except Exception as e:
            logger.error(f"Error retrieving document chunks: {e}", exc_info=True)
            return None

    async def delete_document(
        self,
        session: AsyncSession,
        document_id: str,
    ) -> bool:
        """
        Delete a document (hard delete).

        Args:
            session: Database session
            document_id: Document ID

        Returns:
            True if deleted, False if not found
        """
        try:
            document = await self.get_document(session, document_id)
            
            if not document:
                return False
            
            # Get file path before deleting
            file_path = document.file_path
            
            # Delete document (cascade will delete versions and chunks)
            await session.delete(document)
            await session.flush()
            await session.commit()
            
            # Delete file from disk
            try:
                if file_path and Path(file_path).exists():
                    Path(file_path).unlink()
                    logger.info(f"Deleted file from disk: {file_path}")
            except Exception as e:
                logger.warning(f"Could not delete file {file_path}: {e}")
                # Don't fail the entire delete if file deletion fails
            
            logger.info(f"✅ Document deleted: {document_id}")
            return True
            
        except Exception as e:
            await session.rollback()
            logger.error(f"❌ Error deleting document: {e}", exc_info=True)
            raise

    async def process_upload(
        self,
        session: AsyncSession,
        file_content: bytes,
        filename: str,
        title: str,
        document_type: str,
        uploaded_by_id: str,
    ) -> dict:
        """
        Process an uploaded file end-to-end.

        Args:
            session: Database session
            file_content: File bytes
            filename: Original filename
            title: Document title
            document_type: Type of document
            uploaded_by_id: Uploader user ID

        Returns:
            Result dictionary with document and chunks info
        """
        try:
            # Save file
            file_path = await self.save_upload(file_content, filename)
            file_size = len(file_content)
            
            # Create document record
            document = await self.create_document(
                session=session,
                title=title,
                document_type=document_type,
                file_path=file_path,
                file_size=file_size,
                mime_type="application/pdf",
                uploaded_by_id=uploaded_by_id,
            )
            
            # Create version
            version = await self.create_version(session, document.id, version_number=1)
            
            # Parse and chunk PDF
            chunks, error = self.parser.extract_and_chunk(file_path)
            
            if error:
                logger.error(f"Failed to parse PDF: {error}")
                await session.commit()
                return {
                    "success": False,
                    "document_id": str(document.id),
                    "error": f"PDF parsing failed: {error}",
                    "chunks_count": 0,
                }
            
            if not chunks:
                logger.warning(f"No chunks extracted from PDF: {filename}")
                await session.commit()
                return {
                    "success": False,
                    "document_id": str(document.id),
                    "error": "No text content found in PDF",
                    "chunks_count": 0,
                }
            
            # Store chunks
            chunks_count = await self.store_chunks(session, version.id, chunks)
            
            await session.commit()
            
            logger.info(f"Document uploaded: {len(chunks)} chunks stored")
            
            # Generate embeddings for chunks
            logger.info(f"🔄 Generating embeddings for {chunks_count} chunks...")
            from app.services.chunk_embedder import ChunkEmbedderService
            embedding_result = await ChunkEmbedderService.embed_chunks_for_version(session, version.id)
            
            if not embedding_result["success"]:
                # FAIL the upload - embeddings are critical for RAG
                logger.error(f"❌ Embedding generation failed: {embedding_result['error']}")
                await session.rollback()
                return {
                    "success": False,
                    "document_id": str(document.id),
                    "error": f"Embedding generation failed: {embedding_result['error']}",
                    "chunks_count": chunks_count,
                }
            
            embeddings_generated = embedding_result["chunks_processed"]
            logger.info(f"✅ Generated embeddings for {embeddings_generated} chunks")
            
            return {
                "success": True,
                "document_id": str(document.id),
                "version_id": str(version.id),
                "chunks_count": chunks_count,
                "embeddings_generated": embeddings_generated,
                "embedding_status": "completed",
                "error": None,
            }
            
        except Exception as e:
            await session.rollback()
            logger.error(f"Error processing upload: {str(e)}", exc_info=True)
            return {
                "success": False,
                "error": str(e),
                "chunks_count": 0,
            }
