"""Retrieval-Augmented Generation (RAG) service."""

import logging
from typing import List, Dict, Optional, Tuple
from rank_bm25 import BM25Okapi
import math

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.models.document import DocumentChunk, Document, DocumentVersion
from app.models.student import Student
from app.services.embedding import get_embedding_service
from app.services.llm import LLMService
from app.logger import logger


class RAGService:
    """Retrieval-Augmented Generation service."""

    def __init__(self, llm_service: Optional[LLMService] = None):
        """Initialize RAG service."""
        self.embedding_service = get_embedding_service()
        self.llm_service = llm_service

    async def retrieve_documents(
        self,
        session: AsyncSession,
        query: str,
        top_k: int = 10,
        vector_weight: float = 0.7,
        keyword_weight: float = 0.3,
        document_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None,
    ) -> List[Dict]:
        """
        Retrieve relevant documents using hybrid search (vector + BM25).

        Args:
            session: Database session
            query: User query
            top_k: Number of top results
            vector_weight: Weight for vector search
            keyword_weight: Weight for keyword search
            document_ids: If provided, only search these documents
            user_id: Current user ID for isolation (IMPORTANT for security)

        Returns:
            List of retrieved chunks with scores
        """
        try:
            logger.info(f"Starting document retrieval for query: {query[:50]}")
            if user_id:
                logger.info(f"User isolation: {user_id}")
            if document_ids:
                logger.info(f"Filtering to {len(document_ids)} selected documents")
            
            # Get vector search results
            vector_results = await self._vector_search(session, query, top_k * 2, document_ids, user_id)
            logger.info(f"Vector search returned {len(vector_results)} results")
            
            # Get BM25 search results
            keyword_results = await self._keyword_search(session, query, top_k * 2, document_ids, user_id)
            logger.info(f"Keyword search returned {len(keyword_results)} results")
            
            # Combine results using RRF
            combined_results = self._reciprocal_rank_fusion(
                vector_results,
                keyword_results,
                vector_weight,
                keyword_weight,
                top_k,
            )
            
            logger.info(f"Combined retrieval returned {len(combined_results)} results")
            return combined_results[:top_k]
            
        except Exception as e:
            logger.error(f"Error in retrieve_documents: {e}", exc_info=True)
            # Return empty list instead of raising - RAG will handle gracefully
            return []

    async def _vector_search(
        self,
        session: AsyncSession,
        query: str,
        limit: int = 20,
        document_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None,
    ) -> List[Dict]:
        """Vector similarity search with dimension validation."""
        try:
            import math
            
            # Generate embedding for query
            query_embedding = self.embedding_service.embed_text(query)
            embedding_dim = len(query_embedding)
            expected_dim = self.embedding_service.get_embedding_dimension()
            
            # Validate query embedding quality
            if embedding_dim != expected_dim:
                logger.error(f"❌ Query embedding dimension mismatch: {embedding_dim} vs {expected_dim}")
                return []
            
            if any(math.isnan(x) or math.isinf(x) for x in query_embedding):
                logger.error(f"❌ Query embedding contains NaN or Infinity")
                return []
            
            logger.info(f"Query embedding dimension: {embedding_dim} ✓")
            
            # Validate stored embeddings before attempting search
            validation_sql = text("""
                SELECT COUNT(*) as total_chunks,
                       SUM(CASE WHEN embedding IS NOT NULL THEN 1 ELSE 0 END) as not_null,
                       SUM(CASE WHEN vector_dims(embedding) = :expected_dim THEN 1 ELSE 0 END) as valid_dims
                FROM document_chunks dc
            """)
            
            try:
                validation_result = await session.execute(
                    validation_sql, 
                    {"expected_dim": expected_dim}
                )
                total, not_null, valid_dims = validation_result.fetchone()
                logger.info(f"Chunk embeddings: total={total}, not_null={not_null}, valid_384d={valid_dims}")
                
                if total > 0 and valid_dims == 0:
                    logger.warning(f"❌ No valid embeddings! {not_null}/{total} chunks have invalid dimensions")
                    return []
            except Exception as e:
                logger.warning(f"Could not validate embeddings: {e}")
                # Continue anyway - vector search might still work
            
            # Convert to pgvector format string
            embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
            
            logger.info(f"Vector search: {embedding_dim}D vector, searching {limit} results")
            
            # Vector search with pgvector
            # Use CAST() instead of ::vector to properly handle parameter binding with SQLAlchemy text()
            where_clause = """
                WHERE d.is_active = true
                AND dv.is_latest = true
                AND dc.embedding IS NOT NULL
                AND vector_dims(dc.embedding) = :expected_dim
            """
            
            params = {
                "embedding": embedding_str,
                "expected_dim": expected_dim,
                "limit": limit,
            }
            
            # Add user isolation filter (CRITICAL)
            if user_id:
                where_clause += " AND d.uploaded_by = CAST(:user_id AS uuid)"
                params["user_id"] = user_id
            
            # Add document filter if specified
            if document_ids:
                where_clause += " AND d.id = ANY(CAST(:document_ids AS uuid[]))"
                params["document_ids"] = document_ids
            
            sql = text(f"""
                SELECT 
                    dc.id,
                    d.id as document_id,
                    d.title as document_title,
                    d.document_type,
                    dc.content,
                    dc.page_number,
                    dc.section,
                    (1 - (dc.embedding <=> CAST(:embedding AS vector))) as score
                FROM document_chunks dc
                JOIN document_versions dv ON dc.document_version_id = dv.id
                JOIN documents d ON dv.document_id = d.id
                {where_clause}
                ORDER BY score DESC
                LIMIT :limit
            """)
            
            result = await session.execute(
                sql,
                params
            )
            
            rows = result.fetchall()
            logger.info(f"✓ Vector search returned {len(rows)} results")
            
            return [
                {
                    "chunk_id": str(row[0]),
                    "document_id": str(row[1]),
                    "document_title": row[2],
                    "document_type": row[3],
                    "content": row[4],
                    "page_number": row[5],
                    "section": row[6],
                    "score": float(row[7]),
                    "source": "vector",
                }
                for row in rows
            ]
            
        except Exception as e:
            error_str = str(e).lower()
            if "transaction is aborted" in error_str:
                logger.error(f"❌ Transaction aborted - session is in failed state: {e}")
                logger.error(f"This indicates a previous operation failed. Check embedding validity.")
            elif "dimension" in error_str or "vector" in error_str:
                logger.error(f"❌ Vector/dimension error: {e}")
            else:
                logger.error(f"❌ Vector search error: {e}", exc_info=True)
            return []

    async def _keyword_search(
        self,
        session: AsyncSession,
        query: str,
        limit: int = 20,
        document_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None,
    ) -> List[Dict]:
        """BM25 keyword search with user isolation."""
        try:
            # Get all active chunks
            query_obj = (
                select(
                    DocumentChunk.id,
                    DocumentChunk.content,
                    Document.id.label("document_id"),
                    Document.title.label("document_title"),
                    Document.document_type,
                    DocumentChunk.page_number,
                    DocumentChunk.section,
                )
                .join(DocumentVersion, DocumentChunk.document_version_id == DocumentVersion.id)
                .join(Document, DocumentVersion.document_id == Document.id)
                .where(
                    Document.is_active == True,
                    DocumentVersion.is_latest == True,
                )
            )
            
            # Add user isolation filter (CRITICAL for security)
            if user_id:
                query_obj = query_obj.where(Document.uploaded_by == user_id)
            
            # Add document filter if specified
            if document_ids:
                from sqlalchemy import and_
                query_obj = query_obj.where(Document.id.in_(document_ids))
            
            result = await session.execute(query_obj)
            rows = result.fetchall()
            
            if not rows:
                return []
            
            # Build BM25 index
            corpus = [row[1] for row in rows]  # content
            bm25 = BM25Okapi(corpus)
            
            # Score documents
            tokenized_query = query.lower().split()
            scores = bm25.get_scores(tokenized_query)
            
            # Get top results
            scored_rows = list(zip(rows, scores))
            scored_rows.sort(key=lambda x: x[1], reverse=True)
            
            return [
                {
                    "chunk_id": str(row[0]),
                    "document_id": str(row[2]),
                    "document_title": row[3],
                    "document_type": row[4],
                    "content": row[1],
                    "page_number": row[5],
                    "section": row[6],
                    "score": float(score),
                    "source": "keyword",
                }
                for row, score in scored_rows[:limit]
            ]
            
        except Exception as e:
            logger.error(f"Error in keyword search: {e}")
            return []

    def _reciprocal_rank_fusion(
        self,
        vector_results: List[Dict],
        keyword_results: List[Dict],
        vector_weight: float,
        keyword_weight: float,
        top_k: int,
    ) -> List[Dict]:
        """
        Combine results using Reciprocal Rank Fusion.
        
        RRF formula: score = sum(w * 1/(k + rank))
        """
        # Create ranking maps
        combined_scores = {}
        
        # Vector results
        for rank, result in enumerate(vector_results, 1):
            chunk_id = result["chunk_id"]
            rrf_score = vector_weight * (1.0 / (60 + rank))  # k=60
            
            if chunk_id not in combined_scores:
                combined_scores[chunk_id] = {**result, "final_score": 0}
            combined_scores[chunk_id]["final_score"] += rrf_score
        
        # Keyword results
        for rank, result in enumerate(keyword_results, 1):
            chunk_id = result["chunk_id"]
            rrf_score = keyword_weight * (1.0 / (60 + rank))
            
            if chunk_id not in combined_scores:
                combined_scores[chunk_id] = {**result, "final_score": 0}
            else:
                # Update with vector data if not already set
                combined_scores[chunk_id].update(result)
            combined_scores[chunk_id]["final_score"] += rrf_score
        
        # Sort by final score
        results = sorted(
            combined_scores.values(),
            key=lambda x: x["final_score"],
            reverse=True,
        )
        
        return results[:top_k]

    async def generate_response(
        self,
        query: str,
        retrieved_chunks: List[Dict],
        user_profile: Optional[Dict] = None,
    ) -> Dict:
        """
        Generate response using LLM with retrieved context.

        Args:
            query: Original query
            retrieved_chunks: Retrieved document chunks
            user_profile: User profile information for personalization

        Returns:
            Generated response with sources
        """
        if not self.llm_service:
            raise RuntimeError("LLM service not configured")
        
        try:
            # Build context
            context = self._build_context(retrieved_chunks)
            
            # Generate response
            response_text = await self.llm_service.generate_response(
                query=query,
                context=context,
                user_profile=user_profile,
            )
            
            # Only include sources if chunks were actually retrieved
            sources = []
            if retrieved_chunks and len(retrieved_chunks) > 0:
                sources = [
                    {
                        "chunk_id": chunk["chunk_id"],
                        "document_title": chunk["document_title"],
                        "document_type": chunk["document_type"],
                        "page_number": chunk.get("page_number"),
                        "section": chunk.get("section"),
                    }
                    for chunk in retrieved_chunks[:3]  # Top 3 sources
                ]
            
            return {
                "response": response_text,
                "sources": sources,
            }
            
        except Exception as e:
            logger.error(f"Error in generate_response: {e}")
            raise

    def _build_context(self, chunks: List[Dict]) -> str:
        """Build context string from retrieved chunks."""
        context_parts = []
        
        for i, chunk in enumerate(chunks, 1):
            part = f"[Document {i}]\n"
            part += f"Title: {chunk['document_title']}\n"
            part += f"Type: {chunk['document_type']}\n"
            
            if chunk.get("page_number"):
                part += f"Page: {chunk['page_number']}\n"
            if chunk.get("section"):
                part += f"Section: {chunk['section']}\n"
            
            # Clean up content - remove pipe symbols and format better
            content = chunk['content']
            # Replace pipes with commas and newlines for better readability
            content = content.replace(" | ", "\n• ")
            content = content.replace("|", "\n• ")
            # Remove excessive newlines
            content = "\n".join(line.strip() for line in content.split("\n") if line.strip())
            
            part += f"\nContent:\n{content}\n"
            context_parts.append(part)
        
        return "\n---\n".join(context_parts)

    async def answer_question(
        self,
        session: AsyncSession,
        query: str,
        top_k: int = 10,
        document_ids: Optional[List[str]] = None,
        user_id: Optional[str] = None,
    ) -> Dict:
        """
        End-to-end RAG: retrieve and generate answer.

        Args:
            session: Database session
            query: User question
            top_k: Number of documents to retrieve
            document_ids: If provided, only search these documents
            user_id: Current user ID for isolation (CRITICAL for security)

        Returns:
            Answer with sources
        """
        try:
            # Get user profile for personalization
            user_profile = None
            if user_id:
                try:
                    result = await session.execute(
                        select(Student).where(Student.user_id == user_id)
                    )
                    student = result.scalar_one_or_none()
                    if student:
                        user_profile = {
                            "cgpa": student.cgpa,
                            "department": student.department,
                            "batch": student.batch,
                            "backlogs": student.backlogs,
                            "roll_number": student.roll_number
                        }
                        logger.info(f"Retrieved user profile for personalization: {user_profile}")
                except Exception as profile_error:
                    logger.warning(f"Could not retrieve user profile: {profile_error}")
                    # Continue without profile - not critical for RAG to work
            
            # Retrieve relevant documents with user isolation
            retrieved_chunks = await self.retrieve_documents(
                session,
                query,
                top_k=top_k,
                document_ids=document_ids,
                user_id=user_id,
            )
            
            logger.info(f"Retrieved {len(retrieved_chunks)} chunks for query")
            
            if not retrieved_chunks:
                logger.warning(f"No relevant documents found for query: {query[:50]}")
                return {
                    "response": "I couldn't find relevant information in the uploaded documents. Please try a different question or upload more documents.",
                    "sources": [],
                    "chunks_retrieved": 0,
                }
            
            # Generate response with user profile for personalization
            answer = await self.generate_response(query, retrieved_chunks, user_profile)
            
            answer["chunks_retrieved"] = len(retrieved_chunks)
            
            return answer
            
        except Exception as e:
            logger.error(f"Error in answer_question: {e}", exc_info=True)
            raise