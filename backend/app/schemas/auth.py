"""Authentication schemas."""

from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class TokenResponse(BaseModel):
    """Token response schema."""
    access_token: str
    token_type: str
    expires_in: int


class UserLoginRequest(BaseModel):
    """User login request."""
    email: EmailStr
    password: str


class UserSignupRequest(BaseModel):
    """User signup request."""
    email: EmailStr
    name: str
    password: str
    role: str = "student"  # Default to student


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    email: str
    name: str
    role: str
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True


class CurrentUserResponse(BaseModel):
    """Current logged-in user response."""
    id: str
    email: str
    name: str
    role: str
    is_active: bool

    class Config:
        from_attributes = True
