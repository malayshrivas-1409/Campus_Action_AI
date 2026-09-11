"""LLM service using Groq API."""

import logging
from typing import Optional, Dict

from groq import Groq

from app.config import settings
from app.logger import logger


class LLMService:
    """Service for interacting with Groq LLM."""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
    ):
        """
        Initialize LLM service.

        Args:
            api_key: Groq API key (defaults to settings.GROQ_API_KEY)
            model: Model to use (defaults to settings.GROQ_MODEL)
        """
        self.api_key = api_key or settings.GROQ_API_KEY
        self.model = model or settings.GROQ_MODEL

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
        user_profile: Optional[Dict] = None,
        temperature: float = 0.2,
        max_tokens: int = 1024,
    ) -> str:
        """
        Generate response using context.

        Args:
            query: User question
            context: Retrieved context
            user_profile: User profile information for personalization
            temperature: Temperature for generation (kept low for grounded,
                factual QA to reduce the chance of the model drifting into
                its own pretrained knowledge)
            max_tokens: Maximum tokens to generate

        Returns:
            Generated response
        """
        if not self.client:
            raise RuntimeError("LLM service not configured (no API key)")

        try:
            system_prompt = self._build_system_prompt()
            user_prompt = self._build_prompt(query, context, user_profile)

            # Use Groq API: chat.completions.create() instead of messages.create()
            message = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": system_prompt,
                    },
                    {
                        "role": "user",
                        "content": user_prompt,
                    },
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

    def _build_system_prompt(self) -> str:
        """
        Build the system prompt that enforces strict grounding.

        This is kept separate from the per-query user prompt so the
        grounding rules carry consistent behavioral weight across every
        call, regardless of what the user asks.
        """
        return """You are Campus Action AI, a document assistant. Your job is to answer questions using ONLY the information provided in the CONTEXT section below.

CRITICAL RULES:
1. Only use information that exists in the CONTEXT section
2. Do not use training data, general knowledge, or assumptions
3. If information is not in the CONTEXT, say: "This information is not available in the uploaded documents."
4. Answer directly and concisely
5. Cite the document when relevant

If the CONTEXT is empty or says "(No relevant context was retrieved)", then no documents contain information about this question."""

    def _build_prompt(self, query: str, context: str, user_profile: Optional[Dict] = None) -> str:
        """Build the per-query user prompt (context + question only).

        Grounding/behavioral instructions live in the system prompt so they
        aren't diluted by being mixed into the same block as the question.
        """
        # Build user profile section if available
        profile_section = ""
        if user_profile:
            profile_info = []
            if user_profile.get("cgpa") is not None:
                profile_info.append(f"CGPA: {user_profile['cgpa']}")
            if user_profile.get("department"):
                profile_info.append(f"Department: {user_profile['department']}")
            if user_profile.get("batch"):
                profile_info.append(f"Batch: {user_profile['batch']}")
            if user_profile.get("backlogs") is not None:
                profile_info.append(f"Backlogs: {user_profile['backlogs']}")
            if user_profile.get("roll_number"):
                profile_info.append(f"Roll Number: {user_profile['roll_number']}")

            if profile_info:
                # IMPORTANT: include the user profile inside the CONTEXT block so the
                # system prompt (which instructs the assistant to use ONLY the CONTEXT)
                # permits the model to read and use these profile fields when answering.
                profile_section = f"""
USER PROFILE (student):
{chr(10).join(profile_info)}

"""

        context_block = context.strip() if context and context.strip() else "(No relevant context was retrieved for this query.)"

        # Place the user profile inside the CONTEXT section to ensure the system
        # grounding rules allow using it (system prompt forbids using information
        # outside of the CONTEXT block).
        full_context = context_block
        if profile_section:
            full_context = profile_section + full_context

        return f"""CONTEXT (retrieved from uploaded placement documents):
{full_context}

QUESTION:
{query}

ANSWER (remember: use ONLY the CONTEXT above, and address each part of the question separately if there are multiple parts):"""

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

Only extract information that is explicitly present in the document above. Do not invent or infer actions, deadlines, or requirements that are not stated.

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

            # Use Groq API: chat.completions.create() instead of messages.create()
            message = self.client.chat.completions.create(
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

    async def generate_title(
        self,
        message: str,
        max_length: int = 50,
    ) -> str:
        """
        Generate a concise title for a conversation.

        Args:
            message: The first message in the conversation
            max_length: Maximum length for the title

        Returns:
            Generated title (max 50 characters)
        """
        if not self.client:
            raise RuntimeError("LLM service not configured (no API key)")

        try:
            title_prompt = f"""Generate a very concise title (max 5 words, under 50 characters) for this conversation starter. 
Return ONLY the title, nothing else.

Message: {message[:200]}"""

            message_obj = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "user",
                        "content": title_prompt,
                    },
                ],
                temperature=0.5,
                max_tokens=20,
            )

            title = message_obj.choices[0].message.content.strip()
            # Ensure max length
            if len(title) > max_length:
                title = title[:max_length-3] + "..."
            
            logger.info(f"Generated title: {title}")
            return title

        except Exception as e:
            logger.error(f"Error generating title: {e}")
            # Fallback to message prefix
            return (message[:max_length-3] + "...") if len(message) > max_length else message

    async def check_eligibility(
        self,
        requirements: dict,
        student_profile: dict,
        context: Optional[str] = None,
    ) -> dict:
        """
        Check if a student is eligible for an action.

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

Base your determination ONLY on the requirements, student profile, and context provided above. Do not assume any criteria that is not explicitly stated.

Please provide the response as JSON with the following structure:
{{
    "eligible": true/false,
    "reason": "Explanation",
    "confidence": 0.0-1.0,
    "missing_info": ["List of missing information if any"]
}}
"""

            # Use Groq API: chat.completions.create() instead of messages.create()
            message = self.client.chat.completions.create(
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