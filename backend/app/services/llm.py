"""LLM service using Groq API."""

import logging
from typing import Optional

from groq import Groq

from app.config import settings
from app.logger import logger


class LLMService:
    """Service for interacting with Groq LLM."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "mixtral-8x7b-32768",
    ):
        """
        Initialize LLM service.

        Args:
            api_key: Groq API key (defaults to settings.GROQ_API_KEY)
            model: Model to use
        """
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model
        
        if not self.api_key:
            logger.warning("Groq API key not configured")
            self.client = None
        else:
            self.client = Groq(api_key=self.api_key)
            logger.info(f"LLM service initialized with model: {self.model}")

    async def generate_response(
        self,
        query: str,
        context: str,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """
        Generate response using context.

        Args:
            query: User question
            context: Retrieved context
            temperature: Temperature for generation
            max_tokens: Maximum tokens to generate

        Returns:
            Generated response
        """
        if not self.client:
            raise RuntimeError("LLM service not configured (no API key)")

        try:
            prompt = self._build_prompt(query, context)
            
            message = self.client.messages.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": prompt,
                    }
                ],
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            response_text = message.choices[0].message.content
            logger.info(f"Generated response for query: {query[:50]}...")
            
            return response_text
            
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            raise

    def _build_prompt(self, query: str, context: str) -> str:
        """Build prompt for LLM."""
        return f"""You are a helpful assistant that answers questions based on the provided documents.

Use the following context to answer the user's question. If the answer is not in the context, say "I don't have enough information to answer this question."

CONTEXT:
{context}

QUESTION:
{query}

ANSWER:
"""

    async def extract_actions(
        self,
        text: str,
        context: Optional[str] = None,
    ) -> dict:
        """
        Extract structured actions from document.

        Args:
            text: Document text
            context: Optional context

        Returns:
            Extracted actions as dictionary
        """
        if not self.client:
            raise RuntimeError("LLM service not configured")

        try:
            prompt = f"""Extract all actions, deadlines, and requirements from this document.

Document:
{text}

{f"Context: {context}" if context else ""}

Please provide the response as JSON with the following structure:
{{
    "actions": [
        {{
            "title": "Action title",
            "deadline": "Deadline if mentioned",
            "requirements": ["Requirement 1", "Requirement 2"],
            "is_mandatory": true/false
        }}
    ]
}}
"""
            
            message = self.client.messages.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=2048,
            )
            
            response_text = message.choices[0].message.content
            
            # Try to parse as JSON
            import json
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logger.warning("Could not parse LLM response as JSON")
                return {"actions": [], "error": "Could not parse response"}
                
        except Exception as e:
            logger.error(f"Error extracting actions: {e}")
            raise

    async def check_eligibility(
        self,
        requirements: dict,
        student_profile: dict,
        context: Optional[str] = None,
    ) -> dict:
        """
        Check if student is eligible for an action.

        Args:
            requirements: Action requirements
            student_profile: Student profile data
            context: Optional context

        Returns:
            Eligibility determination
        """
        if not self.client:
            raise RuntimeError("LLM service not configured")

        try:
            prompt = f"""Determine if a student is eligible for an action based on requirements and profile.

Requirements:
{requirements}

Student Profile:
{student_profile}

{f"Context: {context}" if context else ""}

Please provide the response as JSON with the following structure:
{{
    "eligible": true/false,
    "reason": "Explanation",
    "confidence": 0.0-1.0,
    "missing_info": ["List of missing information if any"]
}}
"""
            
            message = self.client.messages.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
                max_tokens=1024,
            )
            
            response_text = message.choices[0].message.content
            
            # Try to parse as JSON
            import json
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logger.warning("Could not parse eligibility response as JSON")
                return {
                    "eligible": False,
                    "reason": "Could not determine",
                    "confidence": 0.0,
                }
                
        except Exception as e:
            logger.error(f"Error checking eligibility: {e}")
            raise


# Global LLM service instance
_llm_service: Optional[LLMService] = None


def get_llm_service() -> LLMService:
    """Get or create global LLM service instance."""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service
