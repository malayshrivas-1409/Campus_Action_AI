"""Actions and eligibility endpoints."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.action import Action
from app.models.student import Student
from app.models.document import Document, DocumentVersion, DocumentChunk
from app.schemas.action import (
    ActionResponse,
    ActionExtractionRequest,
    ActionExtractionResponse,
    EligibilityCheckRequest,
    EligibilityCheckResponse,
)
from app.services.action_extractor import get_action_extractor
from app.services.eligibility import get_eligibility_checker
from app.logger import logger


router = APIRouter(prefix="/api/v1/actions", tags=["actions"])


def get_action_extractor_service():
    """Get action extractor service."""
    return get_action_extractor()


def get_eligibility_checker_service():
    """Get eligibility checker service."""
    return get_eligibility_checker()


@router.post("/extract", response_model=ActionExtractionResponse)
async def extract_actions(
    request: ActionExtractionRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Extract actions from a document.
    
    This endpoint triggers LLM-based action extraction from a document.
    Requires admin or staff role.
    """
    try:
        # Verify document exists and user has permission
        result = await session.execute(
            select(Document).where(Document.id == request.document_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found",
            )
        
        # Check permission (admin/staff can extract)
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin/staff can extract actions",
            )
        
        # Get document text
        result = await session.execute(
            select(DocumentVersion)
            .where(
                DocumentVersion.document_id == request.document_id,
                DocumentVersion.is_latest == True,
            )
        )
        document_version = result.scalar_one_or_none()
        
        if not document_version:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document version not found",
            )
        
        # Get all chunks for this version
        chunks_result = await session.execute(
            select(DocumentChunk)
            .where(DocumentChunk.document_version_id == document_version.id)
            .order_by(DocumentChunk.chunk_index)
        )
        chunks = chunks_result.scalars().all()
        
        if not chunks:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No document chunks found",
            )
        
        # Combine chunks into full text
        full_text = "\n\n".join([chunk.content for chunk in chunks])
        
        # Extract actions
        extractor = get_action_extractor_service()
        extraction_result = await extractor.extract_actions_from_document(
            session=session,
            document_id=str(document.id),
            document_title=document.title,
            document_type=document.document_type,
            full_text=full_text,
        )
        
        if not extraction_result["success"]:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=extraction_result.get("error", "Extraction failed"),
            )
        
        # Get extracted actions from database
        actions_result = await session.execute(
            select(Action).where(Action.document_id == request.document_id)
        )
        actions = actions_result.scalars().all()
        
        logger.info(
            f"Extracted {len(actions)} actions from document {request.document_id}"
        )
        
        return ActionExtractionResponse(
            success=True,
            actions_extracted=len(actions),
            actions=[
                ActionResponse(
                    id=str(action.id),
                    document_id=str(action.document_id),
                    action_title=action.action_title,
                    action_description=action.action_description,
                    action_type=action.action_type,
                    deadline=action.deadline,
                    is_mandatory=action.is_mandatory,
                    required_documents=action.required_documents,
                    created_at=action.created_at,
                    updated_at=action.updated_at,
                )
                for action in actions
            ],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error extracting actions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error extracting actions: {str(e)}",
        )


@router.get("/document/{document_id}", response_model=list[ActionResponse])
async def get_actions_for_document(
    document_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all actions for a document."""
    try:
        result = await session.execute(
            select(Action).where(Action.document_id == document_id)
        )
        actions = result.scalars().all()
        
        return [
            ActionResponse(
                id=str(action.id),
                document_id=str(action.document_id),
                action_title=action.action_title,
                action_description=action.action_description,
                action_type=action.action_type,
                deadline=action.deadline,
                is_mandatory=action.is_mandatory,
                required_documents=action.required_documents,
                created_at=action.created_at,
                updated_at=action.updated_at,
            )
            for action in actions
        ]
        
    except Exception as e:
        logger.error(f"Error getting actions: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get actions",
        )


@router.get("/{action_id}", response_model=ActionResponse)
async def get_action(
    action_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific action."""
    try:
        result = await session.execute(
            select(Action).where(Action.id == action_id)
        )
        action = result.scalar_one_or_none()
        
        if not action:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Action not found",
            )
        
        return ActionResponse(
            id=str(action.id),
            document_id=str(action.document_id),
            action_title=action.action_title,
            action_description=action.action_description,
            action_type=action.action_type,
            deadline=action.deadline,
            is_mandatory=action.is_mandatory,
            required_documents=action.required_documents,
            created_at=action.created_at,
            updated_at=action.updated_at,
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting action: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get action",
        )


@router.post("/check-eligibility", response_model=EligibilityCheckResponse)
async def check_student_eligibility(
    request: EligibilityCheckRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check if current student is eligible for an action.
    
    Only students can check their own eligibility.
    """
    try:
        # Verify current user is a student
        if current_user.role != "student":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only students can check eligibility",
            )
        
        # Get student profile
        student_result = await session.execute(
            select(Student).where(Student.user_id == current_user.id)
        )
        student = student_result.scalar_one_or_none()
        
        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found",
            )
        
        # Get action
        action_result = await session.execute(
            select(Action).where(Action.id == request.action_id)
        )
        action = action_result.scalar_one_or_none()
        
        if not action:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Action not found",
            )
        
        # Check eligibility
        checker = get_eligibility_checker_service()
        eligibility_result = await checker.check_student_eligibility_for_action(
            session=session,
            student=student,
            action=action,
        )
        
        logger.info(
            f"Eligibility check for student {student.roll_number} "
            f"and action {action.action_title}: {eligibility_result['status']}"
        )
        
        return EligibilityCheckResponse(
            action_id=request.action_id,
            eligible=eligibility_result["eligible"] == "eligible",
            reason=eligibility_result["reason"],
            confidence=eligibility_result["confidence"],
            missing_info=eligibility_result.get("missing_info", []),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error checking eligibility: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error checking eligibility: {str(e)}",
        )


@router.post("/check-eligibility-all")
async def check_eligibility_for_all_students(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Check eligibility for all students against all actions.
    
    Requires admin or staff role.
    Runs eligibility checks in batch for performance optimization.
    """
    try:
        # Check permission (admin/staff only)
        if current_user.role not in ["admin", "staff"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only admin/staff can run batch eligibility checks",
            )
        
        # Get all actions
        actions_result = await session.execute(select(Action))
        actions = actions_result.scalars().all()
        
        logger.info(f"Running batch eligibility check for {len(actions)} actions")
        
        checker = get_eligibility_checker_service()
        all_results = []
        
        # Check eligibility for all actions
        for action in actions:
            check_results = await checker.check_eligibility_for_all_students(
                session=session,
                action=action,
            )
            all_results.extend(check_results)
        
        logger.info(f"Batch eligibility check completed: {len(all_results)} results")
        
        return {
            "success": True,
            "actions_checked": len(actions),
            "total_checks": len(all_results),
            "results": all_results,
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in batch eligibility check: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error running batch eligibility check: {str(e)}",
        )

