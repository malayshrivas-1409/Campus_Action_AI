"""Custom exception classes and error handling."""

from typing import Optional, Dict, Any
from fastapi import HTTPException, status


class AppException(Exception):
    """Base application exception."""

    def __init__(
        self,
        error_code: str,
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        details: Optional[Dict[str, Any]] = None,
    ):
        """
        Initialize application exception.

        Args:
            error_code: Error code (e.g., "AUTH_001")
            message: User-friendly error message
            status_code: HTTP status code
            details: Additional error details
        """
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_dict(self) -> Dict[str, Any]:
        """Convert exception to dictionary."""
        return {
            "error_code": self.error_code,
            "message": self.message,
            "details": self.details,
        }

    def to_http_exception(self) -> HTTPException:
        """Convert to FastAPI HTTPException."""
        return HTTPException(
            status_code=self.status_code,
            detail=self.to_dict(),
        )


# Authentication Errors
class AuthenticationError(AppException):
    """Authentication failed."""

    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            error_code="AUTH_001",
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class InvalidCredentialsError(AppException):
    """Invalid email or password."""

    def __init__(self):
        super().__init__(
            error_code="AUTH_002",
            message="Invalid email or password",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class InvalidTokenError(AppException):
    """Token is invalid or expired."""

    def __init__(self):
        super().__init__(
            error_code="AUTH_003",
            message="Invalid or expired token",
            status_code=status.HTTP_401_UNAUTHORIZED,
        )


class UserNotFoundError(AppException):
    """User not found."""

    def __init__(self, user_id: str = ""):
        super().__init__(
            error_code="AUTH_004",
            message="User not found",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"user_id": user_id},
        )


class EmailAlreadyExistsError(AppException):
    """Email already registered."""

    def __init__(self, email: str = ""):
        super().__init__(
            error_code="AUTH_005",
            message="Email already registered",
            status_code=status.HTTP_409_CONFLICT,
            details={"email": email},
        )


# Validation Errors
class ValidationError(AppException):
    """Validation failed."""

    def __init__(self, field: str = "", message: str = "Validation failed"):
        super().__init__(
            error_code="VAL_001",
            message=message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"field": field},
        )


class FileTooLargeError(AppException):
    """File exceeds maximum size."""

    def __init__(self, max_size_mb: int = 0):
        super().__init__(
            error_code="VAL_002",
            message=f"File exceeds maximum size of {max_size_mb}MB",
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            details={"max_size_mb": max_size_mb},
        )


class InvalidFileTypeError(AppException):
    """Invalid file type."""

    def __init__(self, allowed_types: list = None):
        super().__init__(
            error_code="VAL_003",
            message="Invalid file type. Allowed types: " + ", ".join(allowed_types or []),
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            details={"allowed_types": allowed_types or []},
        )


# Document Errors
class DocumentNotFoundError(AppException):
    """Document not found."""

    def __init__(self, document_id: str = ""):
        super().__init__(
            error_code="DOC_001",
            message="Document not found",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"document_id": document_id},
        )


class DocumentProcessingError(AppException):
    """Error processing document."""

    def __init__(self, reason: str = ""):
        super().__init__(
            error_code="DOC_002",
            message="Error processing document",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"reason": reason},
        )


class PDFParseError(AppException):
    """Error parsing PDF."""

    def __init__(self, reason: str = ""):
        super().__init__(
            error_code="DOC_003",
            message="Error parsing PDF file",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"reason": reason},
        )


# Student Errors
class StudentNotFoundError(AppException):
    """Student not found."""

    def __init__(self, student_id: str = ""):
        super().__init__(
            error_code="STU_001",
            message="Student not found",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"student_id": student_id},
        )


class StudentProfileIncompleteError(AppException):
    """Student profile incomplete."""

    def __init__(self, missing_fields: list = None):
        super().__init__(
            error_code="STU_002",
            message="Student profile incomplete",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"missing_fields": missing_fields or []},
        )


# Action Errors
class ActionNotFoundError(AppException):
    """Action not found."""

    def __init__(self, action_id: str = ""):
        super().__init__(
            error_code="ACT_001",
            message="Action not found",
            status_code=status.HTTP_404_NOT_FOUND,
            details={"action_id": action_id},
        )


class ActionExtractionError(AppException):
    """Error extracting actions from document."""

    def __init__(self, reason: str = ""):
        super().__init__(
            error_code="ACT_002",
            message="Error extracting actions",
            status_code=status.HTTP_400_BAD_REQUEST,
            details={"reason": reason},
        )


# Search/RAG Errors
class SearchError(AppException):
    """Search operation failed."""

    def __init__(self, reason: str = ""):
        super().__init__(
            error_code="SEARCH_001",
            message="Search operation failed",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"reason": reason},
        )


class EmbeddingError(AppException):
    """Error generating embeddings."""

    def __init__(self, reason: str = ""):
        super().__init__(
            error_code="SEARCH_002",
            message="Error generating embeddings",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"reason": reason},
        )


# Rate Limit Errors
class RateLimitError(AppException):
    """Rate limit exceeded."""

    def __init__(self, retry_after: int = 60):
        super().__init__(
            error_code="RATE_LIMIT_001",
            message="Too many requests. Please try again later.",
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            details={"retry_after_seconds": retry_after},
        )


# Internal Server Errors
class InternalServerError(AppException):
    """Internal server error."""

    def __init__(self, reason: str = ""):
        super().__init__(
            error_code="SERVER_001",
            message="Internal server error",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"reason": reason},
        )


class DatabaseError(AppException):
    """Database operation failed."""

    def __init__(self, reason: str = ""):
        super().__init__(
            error_code="DB_001",
            message="Database operation failed",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details={"reason": reason},
        )


class LLMServiceError(AppException):
    """LLM service error."""

    def __init__(self, reason: str = ""):
        super().__init__(
            error_code="LLM_001",
            message="LLM service error",
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            details={"reason": reason},
        )


# Permission Errors
class PermissionDeniedError(AppException):
    """Permission denied."""

    def __init__(self, resource: str = ""):
        super().__init__(
            error_code="PERM_001",
            message="Permission denied",
            status_code=status.HTTP_403_FORBIDDEN,
            details={"resource": resource},
        )
