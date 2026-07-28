"""Student endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate, StudentUpdate, StudentResponse
from app.services.auth import AuthService
from app.logger import logger
from app.dependencies import get_token

router = APIRouter(prefix="/api/v1/students", tags=["students"])


async def get_current_user_id(
    token: str = Depends(get_token),
    session: AsyncSession = Depends(get_db)
) -> str:
    """Extract current user ID from token."""
    payload = await AuthService.verify_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

    return user_id


@router.post("/profile", response_model=StudentResponse)
async def create_student_profile(
    request: StudentCreate,
    token: str = Depends(get_token),
    session: AsyncSession = Depends(get_db)
):
    """
    Create student profile.
    
    Requires: Authorization header with JWT token
    """
    try:
        user_id = await get_current_user_id(token, session)

        # Check if student profile already exists
        result = await session.execute(
            select(Student).where(Student.user_id == user_id)
        )
        existing_student = result.scalar_one_or_none()

        if existing_student:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Student profile already exists for this user"
            )

        # Verify user exists
        user = await AuthService.get_user_by_id(session, user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Create student profile
        student = Student(
            user_id=user_id,
            roll_number=request.roll_number,
            department=request.department,
            batch=request.batch,
            cgpa=request.cgpa,
            backlogs=request.backlogs
        )

        session.add(student)
        await session.commit()
        await session.refresh(student)

        logger.info(f"Student profile created: {student.roll_number}")

        return StudentResponse(
            id=str(student.id),
            user_id=str(student.user_id),
            roll_number=student.roll_number,
            department=student.department,
            batch=student.batch,
            cgpa=student.cgpa,
            backlogs=student.backlogs,
            created_at=student.created_at,
            updated_at=student.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Create student profile error: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error creating student profile"
        )


@router.get("/me", response_model=StudentResponse)
async def get_my_profile(
    token: str = Depends(get_token),
    session: AsyncSession = Depends(get_db)
):
    """
    Get current user's student profile.
    
    Requires: Authorization header with JWT token
    """
    try:
        user_id = await get_current_user_id(token, session)

        result = await session.execute(
            select(Student).where(Student.user_id == user_id)
        )
        student = result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )

        return StudentResponse(
            id=str(student.id),
            user_id=str(student.user_id),
            roll_number=student.roll_number,
            department=student.department,
            batch=student.batch,
            cgpa=student.cgpa,
            backlogs=student.backlogs,
            created_at=student.created_at,
            updated_at=student.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get student profile error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving student profile"
        )


@router.get("/{student_id}", response_model=StudentResponse)
async def get_student_by_id(
    student_id: str,
    session: AsyncSession = Depends(get_db)
):
    """
    Get student by ID.
    
    Public endpoint (no authentication required)
    """
    try:
        result = await session.execute(
            select(Student).where(Student.id == student_id)
        )
        student = result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student not found"
            )

        return StudentResponse(
            id=str(student.id),
            user_id=str(student.user_id),
            roll_number=student.roll_number,
            department=student.department,
            batch=student.batch,
            cgpa=student.cgpa,
            backlogs=student.backlogs,
            created_at=student.created_at,
            updated_at=student.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Get student error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving student"
        )


@router.put("/me", response_model=StudentResponse)
async def update_my_profile(
    request: StudentUpdate,
    token: str = Depends(get_token),
    session: AsyncSession = Depends(get_db)
):
    """
    Update current user's student profile.
    
    Requires: Authorization header with JWT token
    """
    try:
        user_id = await get_current_user_id(token, session)

        result = await session.execute(
            select(Student).where(Student.user_id == user_id)
        )
        student = result.scalar_one_or_none()

        if not student:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Student profile not found"
            )

        # Update fields if provided
        if request.cgpa is not None:
            student.cgpa = request.cgpa
        if request.backlogs is not None:
            student.backlogs = request.backlogs

        await session.commit()
        await session.refresh(student)

        logger.info(f"Student profile updated: {student.roll_number}")

        return StudentResponse(
            id=str(student.id),
            user_id=str(student.user_id),
            roll_number=student.roll_number,
            department=student.department,
            batch=student.batch,
            cgpa=student.cgpa,
            backlogs=student.backlogs,
            created_at=student.created_at,
            updated_at=student.updated_at
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Update student profile error: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating student profile"
        )
