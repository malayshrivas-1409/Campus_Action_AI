"""Chat and conversation endpoints."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.conversation import Conversation, ConversationMessage
from app.schemas.conversation import (
    ChatRequest,
    ChatResponse,
    ConversationResponse,
    ConversationDetailResponse,
)
from app.services.rag import RAGService
from app.services.llm import get_llm_service
from app.logger import logger


router = APIRouter(prefix="/api/v1/chat", tags=["chat"])


def get_rag_service() -> RAGService:
    """Get RAG service instance."""
    llm_service = get_llm_service()
    return RAGService(llm_service=llm_service)


@router.post("/message", response_model=ChatResponse)
async def send_message(
    request: ChatRequest,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Send a message in a conversation and get an AI response.
    
    If conversation_id is provided, continues existing conversation.
    Otherwise, creates a new conversation.
    """
    try:
        llm_service = get_llm_service()
        
        # Check if LLM service is configured
        if not llm_service.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM service not configured (missing GROQ_API_KEY)",
            )
        
        # Get or create conversation
        conversation_id = request.conversation_id
        if conversation_id:
            # Get existing conversation
            result = await session.execute(
                select(Conversation).where(
                    Conversation.id == conversation_id,
                    Conversation.user_id == current_user.id,
                )
            )
            conversation = result.scalar_one_or_none()
            
            if not conversation:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found",
                )
        else:
            # Create new conversation
            conversation = Conversation(
                user_id=current_user.id,
                title="New Chat",  # Will be auto-generated from first message
            )
            session.add(conversation)
            await session.flush()  # Get the ID without committing
        
        # Add user message
        user_message = ConversationMessage(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
        )
        session.add(user_message)
        await session.flush()
        
        # Get RAG response
        rag_service = get_rag_service()
        rag_result = await rag_service.answer_question(
            session=session,
            query=request.message,
            top_k=request.top_k,
        )
        
        # Add assistant message
        assistant_message = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=rag_result["response"],
            sources=rag_result.get("sources", []),
        )
        session.add(assistant_message)
        
        # Update conversation title if first message
        if not conversation.title or conversation.title == "New Chat":
            # Generate title from first user message (first 50 chars)
            title = request.message[:50]
            if len(request.message) > 50:
                title += "..."
            conversation.title = title
        
        await session.commit()
        
        logger.info(
            f"Chat message processed for user {current_user.email}, "
            f"conversation {conversation.id}"
        )
        
        return ChatResponse(
            conversation_id=str(conversation.id),
            message_id=str(assistant_message.id),
            response=rag_result["response"],
            sources=rag_result.get("sources", []),
            chunks_retrieved=rag_result.get("chunks_retrieved", 0),
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error in send_message: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}",
        )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all conversations for the current user."""
    try:
        result = await session.execute(
            select(Conversation)
            .where(
                Conversation.user_id == current_user.id,
                Conversation.is_active == True,
            )
            .order_by(Conversation.updated_at.desc())
        )
        
        conversations = result.scalars().all()
        return conversations
        
    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list conversations",
        )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get conversation details with all messages."""
    try:
        result = await session.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        
        # Get messages
        messages_result = await session.execute(
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conversation.id)
            .order_by(ConversationMessage.created_at.asc())
        )
        
        messages = messages_result.scalars().all()
        
        return ConversationDetailResponse(
            id=str(conversation.id),
            user_id=str(conversation.user_id),
            title=conversation.title,
            is_active=conversation.is_active,
            created_at=conversation.created_at,
            updated_at=conversation.updated_at,
            messages=[
                {
                    "id": str(m.id),
                    "conversation_id": str(m.conversation_id),
                    "role": m.role,
                    "content": m.content,
                    "sources": m.sources,
                    "created_at": m.created_at,
                }
                for m in messages
            ],
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get conversation",
        )


@router.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete (soft delete) a conversation."""
    try:
        result = await session.execute(
            select(Conversation).where(
                Conversation.id == conversation_id,
                Conversation.user_id == current_user.id,
            )
        )
        
        conversation = result.scalar_one_or_none()
        
        if not conversation:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Conversation not found",
            )
        
        conversation.is_active = False
        await session.commit()
        
        logger.info(f"Conversation {conversation_id} deleted by {current_user.email}")
        
        return {"message": "Conversation deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting conversation: {e}")
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete conversation",
        )
