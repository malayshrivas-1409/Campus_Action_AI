"""Notification API endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, and_
from datetime import datetime
from typing import List

from app.database import get_db
from app.models.user import User
from app.models.notification import Notification
from app.dependencies import get_current_user
from app.logger import logger

router = APIRouter(prefix="/api/v1/notifications", tags=["Notifications"])


@router.get("", response_model=dict)
async def list_notifications(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    is_read: bool = Query(None),
) -> dict:
    """
    List notifications for current user.
    
    Query Parameters:
    - skip: Number of records to skip (default: 0)
    - limit: Maximum records to return (default: 20, max: 100)
    - is_read: Filter by read status (null = all, true = read only, false = unread only)
    """
    try:
        # Build query
        query = select(Notification).where(
            Notification.student_id == current_user.id
        )
        
        # Filter by read status if provided
        if is_read is not None:
            query = query.where(Notification.is_read == is_read)
        
        # Order by creation date (newest first)
        query = query.order_by(desc(Notification.created_at))
        
        # Get total count
        count_result = await session.execute(
            select(Notification).where(
                Notification.student_id == current_user.id,
                Notification.is_read == False if is_read is False else True if is_read is True else True
            )
        )
        total = len(count_result.scalars().all())
        
        # Apply pagination
        query = query.offset(skip).limit(limit)
        
        result = await session.execute(query)
        notifications = result.scalars().all()
        
        logger.info(f"📬 Listed {len(notifications)} notifications for user {current_user.id}")
        
        return {
            "success": True,
            "total": total,
            "skip": skip,
            "limit": limit,
            "notifications": [
                {
                    "id": str(n.id),
                    "action_id": str(n.action_id) if n.action_id else None,
                    "type": n.notification_type,
                    "title": n.title,
                    "message": n.message,
                    "is_read": n.is_read,
                    "read_at": n.read_at.isoformat() if n.read_at else None,
                    "created_at": n.created_at.isoformat(),
                }
                for n in notifications
            ]
        }
        
    except Exception as e:
        logger.error(f"❌ Error listing notifications: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving notifications"
        )


@router.get("/{notification_id}", response_model=dict)
async def get_notification(
    notification_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get a specific notification."""
    try:
        result = await session.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.student_id == current_user.id,
            )
        )
        notification = result.scalar_one_or_none()
        
        if not notification:
            logger.warning(f"Notification {notification_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {
            "success": True,
            "notification": {
                "id": str(notification.id),
                "action_id": str(notification.action_id) if notification.action_id else None,
                "type": notification.notification_type,
                "title": notification.title,
                "message": notification.message,
                "is_read": notification.is_read,
                "read_at": notification.read_at.isoformat() if notification.read_at else None,
                "created_at": notification.created_at.isoformat(),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Error getting notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving notification"
        )


@router.patch("/{notification_id}/read", response_model=dict)
async def mark_as_read(
    notification_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Mark notification as read."""
    try:
        result = await session.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.student_id == current_user.id,
            )
        )
        notification = result.scalar_one_or_none()
        
        if not notification:
            logger.warning(f"Notification {notification_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Mark as read
        notification.is_read = True
        notification.read_at = datetime.utcnow()
        
        await session.commit()
        
        logger.info(f"✅ Marked notification {notification_id} as read")
        
        return {
            "success": True,
            "message": "Notification marked as read",
            "notification": {
                "id": str(notification.id),
                "is_read": notification.is_read,
                "read_at": notification.read_at.isoformat(),
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"❌ Error marking notification as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating notification"
        )


@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Delete a notification."""
    try:
        result = await session.execute(
            select(Notification).where(
                Notification.id == notification_id,
                Notification.student_id == current_user.id,
            )
        )
        notification = result.scalar_one_or_none()
        
        if not notification:
            logger.warning(f"Notification {notification_id} not found")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Delete
        await session.delete(notification)
        await session.commit()
        
        logger.info(f"🗑️ Deleted notification {notification_id}")
        
        return {
            "success": True,
            "message": "Notification deleted"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        await session.rollback()
        logger.error(f"❌ Error deleting notification: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error deleting notification"
        )


@router.post("/mark-all-read", response_model=dict)
async def mark_all_as_read(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Mark all notifications as read."""
    try:
        # Get all unread notifications
        result = await session.execute(
            select(Notification).where(
                Notification.student_id == current_user.id,
                Notification.is_read == False,
            )
        )
        notifications = result.scalars().all()
        
        # Mark all as read
        now = datetime.utcnow()
        for notification in notifications:
            notification.is_read = True
            notification.read_at = now
        
        await session.commit()
        
        logger.info(f"✅ Marked {len(notifications)} notifications as read for user {current_user.id}")
        
        return {
            "success": True,
            "message": f"Marked {len(notifications)} notifications as read",
            "count": len(notifications),
        }
        
    except Exception as e:
        await session.rollback()
        logger.error(f"❌ Error marking all notifications as read: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error updating notifications"
        )


@router.get("/unread/count", response_model=dict)
async def get_unread_count(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> dict:
    """Get count of unread notifications."""
    try:
        result = await session.execute(
            select(Notification).where(
                Notification.student_id == current_user.id,
                Notification.is_read == False,
            )
        )
        unread_count = len(result.scalars().all())
        
        return {
            "success": True,
            "unread_count": unread_count,
        }
        
    except Exception as e:
        logger.error(f"❌ Error getting unread count: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error retrieving unread count"
        )
