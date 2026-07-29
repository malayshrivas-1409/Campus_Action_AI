"""Retrieval-Augmented Generation (RAG) service."""

import logging
from typing import List, Dict, Optional, Tuple
from rank_bm25 import BM25Okapi
import math

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text

from app.models.document import DocumentChunk, Document, DocumentVersion
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
    ) -> List[Dict]:
        """
        Retrieve relevant documents using hybrid search (vector + BM25).

        Args:
            session: Database session
            query: User query
            top_k: Number of top results
            vector_weight: Weight for vector search
            keyword_weight: Weight for keyword search

        Returns:
            List of retrieved chunks with scores
        """
        try:
            # Get vector search results
            vector_results = await self._vector_search(session, query, top_k * 2)
            
            # Get BM25 search results
            keyword_results = await self._keyword_search(session, query, top_k * 2)
            
            # Combine results using RRF
            combined_results = self._reciprocal_rank_fusion(
                vector_results,
                keyword_results,
                vector_weight,
                keyword_weight,
                top_k,
            )
            
            return combined_results[:top_k]
            
        except Exception as e:
            logger.error(f"Error in retrieve_documents: {e}")
            raise

    async def _vector_search(
        self,
        session: AsyncSession,
        query: str,
        limit: int = 20,
    ) -> List[Dict]:
        """Vector similarity search."""
        try:
            # Generate embedding for query
            query_embedding = self.embedding_service.embed_text(query)
            embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"
            
            # Vector search with pgvector
            sql = text("""
                SELECT 
                    dc.id,
                    d.id as document_id,
                    d.title as document_title,
                    d.document_type,
                    dc.content,
                    dc.page_number,
                    dc.section,
                    (1 - (dc.embedding <=> :embedding::vector)) as score
                FROM document_chunks dc
                JOIN document_versions dv ON dc.document_version_id = dv.id
                JOIN documents d ON dv.document_id = d.id
                WHERE d.is_active = true
                AND dv.is_latest = true
                AND dc.embedding IS NOT NULL
                ORDER BY score DESC
                LIMIT :limit
            """)
            
            result = await session.execute(
                sql,
                {
                    "embedding": embedding_str,
                    "limit": limit,
                }
            )
            
            rows = result.fetchall()
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
            logger.error(f"Error in vector search: {e}")
            return []

    async def _keyword_search(
        self,
        session: AsyncSession,
        query: str,
        limit: int = 20,
    ) -> List[Dict]:
        """BM25 keyword search."""
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
    ) -> Dict:
        """
        Generate response using LLM with retrieved context.

        Args:
            query: Original query
            retrieved_chunks: Retrieved document chunks

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
            )
            
            return {
                "response": response_text,
                "sources": [
                    {
                        "chunk_id": chunk["chunk_id"],
                        "document_title": chunk["document_title"],
                        "document_type": chunk["document_type"],
                        "page_number": chunk.get("page_number"),
                        "section": chunk.get("section"),
                    }
                    for chunk in retrieved_chunks[:3]  # Top 3 sources
                ],
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
            
            part += f"\nContent:\n{chunk['content']}\n"
            context_parts.append(part)
        
        return "\n---\n".join(context_parts)

    async def answer_question(
        self,
        session: AsyncSession,
        query: str,
        top_k: int = 10,
    ) -> Dict:
        """
        End-to-end RAG: retrieve and generate answer.

        Args:
            session: Database session
            query: User question
            top_k: Number of documents to retrieve

        Returns:
            Answer with sources
        """
        try:
            # Retrieve relevant documents
            retrieved_chunks = await self.retrieve_documents(
                session,
                query,
                top_k=top_k,
            )
            
            if not retrieved_chunks:
                return {
                    "response": "No relevant documents found.",
                    "sources": [],
                    "chunks_retrieved": 0,
                }
            
            # Generate response
            answer = await self.generate_response(query, retrieved_chunks)
            
            answer["chunks_retrieved"] = len(retrieved_chunks)
            
            return answer
            
        except Exception as e:
            logger.error(f"Error in answer_question: {e}")
            raise
