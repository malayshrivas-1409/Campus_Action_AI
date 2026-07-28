"""FastAPI dependencies."""

from fastapi import HTTPException, status, Header
from typing import Optional


def get_token(authorization: Optional[str] = Header(None)) -> str:
    """
    Extract token from Authorization header.
    
    Expected format: Bearer <token>
    """
    if not authorization:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )

    parts = authorization.split()
    if len(parts) != 2 or parts[0] != "Bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header format. Use: Bearer <token>"
        )

    return parts[1]
