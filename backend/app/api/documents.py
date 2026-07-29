"""Document management API endpoints."""

import io
from typing import Annotated, Optional

from fastapi import APIRouter, UploadFile, File, Form, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.schemas.document import (
    DocumentResponse,
    DocumentUploadResponse,
    DocumentDetailResponse,
    DocumentListResponse,
)
from app.services.document import DocumentService
from app.logger import logger


router = APIRouter(prefix="/documents", tags=["documents"])
document_service = DocumentService()


@router.post("/upload", response_model=DocumentUploadResponse)
async def upload_document(
    title: Annotated[str, Form()],
    document_type: Annotated[str, Form()],
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    Upload a document.

    - **title**: Document title
    - **document_type**: Type of document (placement, exam, scholarship, etc.)
    - **file**: PDF file to upload
    """
    # Validate file
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF files are supported"
        )

    if file.size and file.size > 50 * 1024 * 1024:  # 50MB limit
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size must be less than 50MB"
        )

    try:
        # Read file content
        file_content = await file.read()
        
        # Process upload
        result = await document_service.process_upload(
            session=session,
            file_content=file_content,
            filename=file.filename,
            title=title,
            document_type=document_type,
            uploaded_by_id=current_user.id,
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload document"
        )


@router.get("", response_model=DocumentListResponse)
async def list_documents(
    skip: int = 0,
    limit: int = 20,
    document_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """
    List all documents with pagination.

    - **skip**: Number of records to skip
    - **limit**: Maximum records to return
    - **document_type**: Filter by document type
    """
    try:
        documents = await document_service.get_documents(
            session=session,
            skip=skip,
            limit=limit,
            document_type=document_type,
        )
        
        return {
            "items": documents,
            "total": len(documents),  # TODO: Get actual total count
            "skip": skip,
            "limit": limit,
        }
        
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list documents"
        )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Get document details by ID."""
    try:
        document = await document_service.get_document(session, document_id)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        return document
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get document"
        )


@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_db),
):
    """Delete a document (soft delete)."""
    try:
        deleted = await document_service.delete_document(session, document_id)
        
        if not deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        await session.commit()
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"Error deleting document: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document"
        )
