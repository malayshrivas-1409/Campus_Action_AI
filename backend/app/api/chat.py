"""Chat and conversation endpoints."""

import logging
import asyncio
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

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
    conversation = None
    user_message = None
    
    try:
        llm_service = get_llm_service()
        
        # Check if LLM service is configured
        if not llm_service.client:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="LLM service not configured (missing GROQ_API_KEY)",
            )
        
        # PHASE 1: Get or create conversation (and commit)
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
                title="New Chat",
            )
            session.add(conversation)
            await session.flush()
        
        # PHASE 2: Add user message (and commit)
        user_message = ConversationMessage(
            conversation_id=conversation.id,
            role="user",
            content=request.message,
        )
        session.add(user_message)
        await session.commit()  # COMMIT early to avoid transaction corruption
        
        logger.info(f"User message saved for conversation {conversation.id}")
        
        # PHASE 3: Get RAG response (in a completely separate session)
        rag_result = None
        rag_session = None
        try:
            from app.database import async_session_maker
            rag_session = async_session_maker()
            rag_service = get_rag_service()
            rag_result = await rag_service.answer_question(
                session=rag_session,
                query=request.message,
                top_k=request.top_k,
                document_ids=request.selected_document_ids,
                user_id=str(current_user.id),  # CRITICAL: Pass user_id for security isolation
            )
            await rag_session.close()
        except Exception as rag_error:
            logger.error(f"RAG service error: {rag_error}", exc_info=True)
            if rag_session:
                await rag_session.close()
            # Don't fail the entire request - return a default response
            rag_result = {
                "response": "I encountered an error processing your question. Please try again.",
                "sources": [],
                "chunks_retrieved": 0,
            }
        
        # PHASE 4: Add assistant message and update title (final commit)
        assistant_message = ConversationMessage(
            conversation_id=conversation.id,
            role="assistant",
            content=rag_result["response"],
            sources=rag_result.get("sources", []),
        )
        session.add(assistant_message)
        
        # Update conversation title from first message
        if conversation.title == "New Chat" or not conversation.title:
            try:
                # Try to generate title using LLM with a timeout
                title = await asyncio.wait_for(
                    llm_service.generate_title(request.message),
                    timeout=5.0  # 5 second timeout
                )
                if title and title.strip() and title != "New Chat":
                    conversation.title = title
                    logger.info(f"Generated title: {title}")
                else:
                    # Fallback to message prefix if title generation returned empty or "New Chat"
                    title = request.message[:50]
                    if len(request.message) > 50:
                        title += "..."
                    conversation.title = title
                    logger.warning(f"Title generation returned empty/default, using fallback: {title}")
            except asyncio.TimeoutError:
                logger.warning(f"Title generation timed out after 5 seconds")
                # Fallback to message prefix
                title = request.message[:50]
                if len(request.message) > 50:
                    title += "..."
                conversation.title = title
            except Exception as e:
                logger.warning(f"Failed to generate title: {e}")
                # Fallback to message prefix
                title = request.message[:50]
                if len(request.message) > 50:
                    title += "..."
                conversation.title = title
                logger.info(f"Using fallback title: {title}")
        
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
        await session.rollback()
        raise
    except Exception as e:
        logger.error(f"Error in send_message: {e}", exc_info=True)
        await session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing message: {str(e)}",
        )


@router.get("/conversations", response_model=list[ConversationResponse])
async def list_conversations(
    search: str = "",
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get all conversations for the current user.
    
    Args:
        search: Optional search term to filter by title or content
    """
    try:
        query = select(Conversation).where(
            Conversation.user_id == current_user.id,
            Conversation.is_active == True,
        )
        
        # Add search filter if provided
        if search:
            search_filter = f"%{search}%"
            query = query.where(
                Conversation.title.ilike(search_filter)
            )
        
        query = query.order_by(Conversation.updated_at.desc())
        
        result = await session.execute(query)
        conversations = result.scalars().all()
        
        # Convert UUID objects to strings for Pydantic serialization
        return [
            ConversationResponse(
                id=str(c.id),
                user_id=str(c.user_id),
                title=c.title,
                is_active=c.is_active,
                created_at=c.created_at,
                updated_at=c.updated_at,
            )
            for c in conversations
        ]
        
    except Exception as e:
        logger.error(f"Error listing conversations: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to list conversations",
        )


@router.get("/conversations/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: str,
    skip: int = 0,
    limit: int = 50,
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get conversation details with paginated messages.
    
    Args:
        conversation_id: ID of the conversation
        skip: Number of messages to skip (default: 0)
        limit: Maximum messages to return (default: 50, max: 100)
    """
    try:
        # Ensure limit doesn't exceed max
        limit = min(limit, 100)
        
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
        
        # Get total message count
        count_result = await session.execute(
            select(func.count(ConversationMessage.id)).where(
                ConversationMessage.conversation_id == conversation.id
            )
        )
        total_messages = count_result.scalar()
        
        # Get paginated messages
        messages_result = await session.execute(
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conversation.id)
            .order_by(ConversationMessage.created_at.asc())
            .offset(skip)
            .limit(limit)
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


@router.get("/conversations/{conversation_id}/export")
async def export_conversation(
    conversation_id: str,
    format: str = "markdown",
    session: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Export a conversation as JSON or Markdown.
    
    Args:
        conversation_id: ID of the conversation
        format: Export format - "json" or "markdown" (default: markdown)
    """
    try:
        if format not in ["json", "markdown"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Format must be 'json' or 'markdown'",
            )
        
        # Get conversation with all messages
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
        
        # Get all messages
        messages_result = await session.execute(
            select(ConversationMessage)
            .where(ConversationMessage.conversation_id == conversation.id)
            .order_by(ConversationMessage.created_at.asc())
        )
        
        messages = messages_result.scalars().all()
        
        if format == "json":
            # Export as JSON
            export_data = {
                "title": conversation.title,
                "created_at": conversation.created_at.isoformat(),
                "updated_at": conversation.updated_at.isoformat(),
                "messages": [
                    {
                        "role": m.role,
                        "content": m.content,
                        "sources": m.sources,
                        "created_at": m.created_at.isoformat(),
                    }
                    for m in messages
                ],
            }
            return export_data
        
        else:  # markdown
            # Export as Markdown
            markdown = f"# {conversation.title}\n\n"
            markdown += f"_Created: {conversation.created_at.strftime('%Y-%m-%d %H:%M:%S')}_\n\n"
            markdown += "---\n\n"
            
            for msg in messages:
                role = "**You**" if msg.role == "user" else "**AI**"
                markdown += f"{role}:\n\n{msg.content}\n\n"
                
                if msg.sources:
                    markdown += "_Sources:_\n"
                    for source in msg.sources:
                        if isinstance(source, dict):
                            markdown += f"- {source.get('title', source.get('document_id', 'Unknown'))}\n"
                        else:
                            markdown += f"- {source}\n"
                    markdown += "\n"
                
                markdown += "---\n\n"
            
            # Return as downloadable content
            from fastapi.responses import StreamingResponse
            import io
            
            buffer = io.BytesIO(markdown.encode('utf-8'))
            filename = f"{conversation.title.replace(' ', '_')}_{conversation.id}.md"
            
            return StreamingResponse(
                iter([buffer.getvalue()]),
                media_type="text/markdown",
                headers={"Content-Disposition": f"attachment; filename={filename}"},
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting conversation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export conversation",
        )
