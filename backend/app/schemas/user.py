"""User schemas."""

from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    """User roles."""
    STUDENT = "student"
    ADMIN = "admin"
    STAFF = "staff"


class UserCreate(BaseModel):
    """User creation schema."""
    email: EmailStr
    name: str
    password: str
    role: UserRole = UserRole.STUDENT


class UserLogin(BaseModel):
    """User login schema."""
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    """User response schema."""
    id: str
    email: str
    name: str
    role: UserRole
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
