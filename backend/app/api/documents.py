"""Document management API endpoints."""

import os
from typing import Annotated, Optional
from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status, Query
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.services.document import DocumentService
from app.config import settings
from app.logger import logger
from app.exceptions import FileTooLargeError, InvalidFileTypeError, DocumentProcessingError

router = APIRouter(prefix="/api/v1/documents", tags=["documents"])
document_service = DocumentService()

# Constants
ALLOWED_EXTENSIONS = {".pdf"}
MAX_FILE_SIZE = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024  # Convert MB to bytes


@router.post("/upload", response_model=dict)
async def upload_document(
    title: Annotated[str, Form()],
    document_type: Annotated[str, Form()],
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """
    Upload a PDF document.

    - **title**: Document title (3-500 characters)
    - **document_type**: Type of document (placement, exam, scholarship, etc.)
    - **file**: PDF file to upload (max 50MB)
    
    Returns:
    - document_id: ID of uploaded document
    - version_id: ID of document version
    - chunks_count: Number of chunks created
    """
    try:
        # Validate title
        if not title or len(title.strip()) < 3:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Title must be at least 3 characters"
            )
        
        # Validate document type
        valid_types = ["placement", "exam", "scholarship", "internship", "event", "announcement", "policy", "notice", "other"]
        if document_type.lower() not in valid_types:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"Invalid document type. Must be one of: {', '.join(valid_types)}"
            )
        
        # Validate file extension
        if not file.filename.lower().endswith(".pdf"):
            logger.warning(f"⚠️ Invalid file type attempted: {file.filename}")
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Only PDF files are supported"
            )
        
        # Validate file size
        file_content = await file.read()
        file_size = len(file_content)
        
        if file_size > MAX_FILE_SIZE:
            logger.warning(f"⚠️ File too large: {file_size} bytes (max: {MAX_FILE_SIZE})")
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File size must be less than {settings.MAX_UPLOAD_SIZE_MB}MB"
            )
        
        if file_size < 1024:  # Less than 1KB
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="File is too small to be a valid PDF"
            )
        
        logger.info(f"📤 Processing document upload: {file.filename} ({file_size} bytes)")
        
        # Process upload
        result = await document_service.process_upload(
            session=session,
            file_content=file_content,
            filename=file.filename,
            title=title.strip(),
            document_type=document_type.lower(),
            uploaded_by_id=current_user.id,
        )
        
        if result["success"]:
            logger.info(f"✅ Document uploaded successfully: {result.get('document_id')}")
        else:
            logger.error(f"❌ Document upload failed: {result.get('error')}")
        
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Unexpected error uploading document: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document"
        )


@router.get("", response_model=dict)
async def list_documents(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    document_type: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """
    List all documents for the current user with pagination.

    Query Parameters:
    - skip: Number of records to skip (default: 0)
    - limit: Maximum records to return (default: 20, max: 100)
    - document_type: Filter by document type
    """
    try:
        logger.info(f"📄 Listing documents for user {current_user.id}")
        
        documents = await document_service.get_documents(
            session=session,
            skip=skip,
            limit=limit,
            document_type=document_type.lower() if document_type else None,
            uploaded_by_id=current_user.id,  # IMPORTANT: Filter by current user
        )
        
        return {
            "success": True,
            "total": len(documents),
            "skip": skip,
            "limit": limit,
            "documents": [
                {
                    "id": str(d.id),
                    "title": d.title,
                    "document_type": d.document_type,
                    "file_size": d.file_size,
                    "mime_type": d.mime_type,
                    "uploaded_at": d.uploaded_at.isoformat(),
                    "uploaded_by": str(d.uploaded_by),
                    "is_active": d.is_active,
                }
                for d in documents
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error listing documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list documents"
        )


@router.get("/{document_id}/view", response_model=dict)
async def view_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """
    View document content (chunks).
    
    Returns:
    - document metadata (title, type, upload info)
    - all chunks with content, page numbers, and sections
    """
    try:
        logger.info(f"👁️ Viewing document: {document_id} for user {current_user.id}")
        
        # Get document
        document = await document_service.get_document(session, document_id)
        
        if not document:
            logger.warning(f"Document not found: {document_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # IMPORTANT: Verify user owns this document
        if str(document.uploaded_by) != str(current_user.id):
            logger.warning(f"Unauthorized access to document {document_id} by user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this document"
            )
        
        # Get document chunks
        chunks = await document_service.get_document_chunks(session, document_id)
        
        if chunks is None:
            logger.warning(f"No chunks found for document: {document_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document content not found"
            )
        
        return {
            "success": True,
            "document": {
                "id": str(document.id),
                "title": document.title,
                "document_type": document.document_type,
                "file_size": document.file_size,
                "mime_type": document.mime_type,
                "uploaded_at": document.uploaded_at.isoformat(),
                "uploaded_by": str(document.uploaded_by),
                "source_url": document.source_url,
            },
            "chunks": chunks,
            "total_chunks": len(chunks),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error viewing document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to view document"
        )


@router.get("/{document_id}/pdf")
async def download_document_pdf(
    document_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Download/stream the PDF file.
    
    Returns the PDF file for viewing in browser.
    """
    try:
        logger.info(f"📥 Downloading PDF: {document_id} for user {current_user.id}")
        
        # Get document
        document = await document_service.get_document(session, document_id)
        
        if not document:
            logger.warning(f"Document not found: {document_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # IMPORTANT: Verify user owns this document
        if str(document.uploaded_by) != str(current_user.id):
            logger.warning(f"Unauthorized access to document {document_id} by user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this document"
            )
        
        # Check if file exists
        if not os.path.exists(document.file_path):
            logger.warning(f"File not found on disk: {document.file_path}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="PDF file not found"
            )
        
        # Return file
        return FileResponse(
            path=document.file_path,
            media_type="application/pdf",
            filename=f"{document.title}.pdf"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error downloading PDF: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to download PDF"
        )


@router.get("/{document_id}", response_model=dict)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Get document details by ID (only if user owns it)."""
    try:
        logger.info(f"📄 Fetching document: {document_id} for user {current_user.id}")
        
        document = await document_service.get_document(session, document_id)
        
        if not document:
            logger.warning(f"Document not found: {document_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # IMPORTANT: Verify user owns this document
        if str(document.uploaded_by) != str(current_user.id):
            logger.warning(f"Unauthorized access to document {document_id} by user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to access this document"
            )
        
        return {
            "success": True,
            "document": {
                "id": str(document.id),
                "title": document.title,
                "document_type": document.document_type,
                "file_size": document.file_size,
                "mime_type": document.mime_type,
                "uploaded_at": document.uploaded_at.isoformat(),
                "uploaded_by": str(document.uploaded_by),
                "source_url": document.source_url,
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get document"
        )


@router.delete("/{document_id}", response_model=dict)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
) -> dict:
    """Delete a document (only if user owns it)."""
    try:
        logger.info(f"🗑️ Deleting document: {document_id} for user {current_user.id}")
        
        # First verify the user owns this document
        document = await document_service.get_document(session, document_id)
        if not document:
            logger.warning(f"Document not found for deletion: {document_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # IMPORTANT: Verify user owns this document
        if str(document.uploaded_by) != str(current_user.id):
            logger.warning(f"Unauthorized deletion attempt for document {document_id} by user {current_user.id}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to delete this document"
            )
        
        deleted = await document_service.delete_document(session, document_id)
        
        if not deleted:
            logger.warning(f"Document not found for deletion: {document_id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        logger.info(f"✅ Document deleted: {document_id}")
        
        return {
            "success": True,
            "message": "Document deleted successfully",
            "document_id": document_id,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error deleting document: {str(e)}", exc_info=True)
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )
