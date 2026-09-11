"""Activity / Audit endpoints."""

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from typing import List

from app.database import get_db
from app.dependencies import get_current_user
from app.models.audit_log import AuditLog
from app.models.user import User
from app.logger import logger

router = APIRouter(prefix="/api/v1/activity", tags=["Activity"])


@router.get("", response_model=dict)
async def recent_activity(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
    limit: int = Query(6, ge=1, le=50),
) -> dict:
    """Return recent activity (audit logs) for the current user."""
    try:
        query = select(AuditLog).where(AuditLog.user_id == current_user.id).order_by(desc(AuditLog.created_at)).limit(limit)
        result = await session.execute(query)
        logs = result.scalars().all()

        logger.info(f"Listed {len(logs)} audit logs for user {current_user.id}")

        return {
            "success": True,
            "total": len(logs),
            "activities": [
                {
                    "id": str(l.id),
                    "action_type": l.action_type,
                    "entity_type": l.entity_type,
                    "entity_id": str(l.entity_id) if l.entity_id else None,
                    "created_at": l.created_at.isoformat(),
                    "old_value": l.old_value,
                    "new_value": l.new_value,
                }
                for l in logs
            ],
        }

    except Exception as e:
        logger.error(f"Error fetching recent activity: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Error fetching activity")
