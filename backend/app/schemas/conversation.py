"""Conversation-related Pydantic schemas."""

from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class ConversationMessageBase(BaseModel):
    """Base message schema."""
    role: str  # "user" or "assistant"
    content: str
    sources: Optional[List[dict]] = None


class ConversationMessageCreate(ConversationMessageBase):
    """Schema for creating a message."""
    pass


class ConversationMessageResponse(ConversationMessageBase):
    """Schema for message response."""
    id: str
    conversation_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    """Base conversation schema."""
    title: Optional[str] = None
    is_active: bool = True


class ConversationCreate(ConversationBase):
    """Schema for creating a conversation."""
    pass


class ConversationResponse(ConversationBase):
    """Schema for conversation response."""
    id: str
    user_id: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConversationDetailResponse(ConversationResponse):
    """Detailed conversation with messages."""
    messages: List[ConversationMessageResponse] = []


class ChatRequest(BaseModel):
    """Request for chat endpoint."""
    conversation_id: Optional[str] = None
    message: str
    top_k: int = 10
    vector_weight: float = 0.7
    keyword_weight: float = 0.3
    selected_document_ids: Optional[List[str]] = None  # If provided, filter to these documents


class ChatResponse(BaseModel):
    """Response from chat endpoint."""
    conversation_id: str
    message_id: str
    response: str
    sources: List[dict]
    chunks_retrieved: int
