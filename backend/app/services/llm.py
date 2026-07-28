"""LLM service using Groq API."""

import json
import logging
from typing import Optional
from groq import Groq

logger = logging.getLogger(__name__)


class LLMService:
    """Service for LLM operations via Groq API."""

    def __init__(self, api_key: str, model: str = "mixtral-8x7b-32768"):
        """Initialize LLM service."""
        self.client = Groq(api_key=api_key)
        self.model = model

    def extract_actions_from_document(self, document_text: str) -> dict:
        """
        Extract structured actions from a document.

        Returns:
        {
            "actions": [
                {
                    "title": "Register for TCS",
                    "deadline": "2026-08-15",
                    "is_mandatory": true,
                    "requirements": ["Resume", "College ID"],
                    "description": "..."
                }
            ]
        }
        """
        prompt = f"""Extract all actionable items from this document.

Document:
{document_text[:3000]}

For each action, extract:
- Title: Short, clear name
- Deadline: ISO format date or null
- Is Mandatory: true/false
- Requirements: List of required documents/steps
- Description: Brief details

Return ONLY valid JSON with "actions" array, no other text."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.3,  # Lower temp for structured extraction
            )

            response_text = message.choices[0].message.content

            # Parse JSON from response
            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse JSON: {response_text}")
                return {"actions": [], "error": "Failed to parse response"}

        except Exception as e:
            logger.error(f"Error extracting actions: {e}")
            raise

    def check_eligibility(
        self,
        student_profile: dict,
        requirements: dict,
        context_chunks: list[str]
    ) -> dict:
        """
        Check if a student is eligible based on requirements.

        Returns:
        {
            "eligible": true/false/null,
            "reason": "string explanation",
            "confidence": 0.95,
            "missing_info": ["Family income", ...]
        }
        """
        context_str = "\n".join([f"- {chunk[:200]}" for chunk in context_chunks[:5]])

        prompt = f"""Determine if this student is eligible.

STUDENT PROFILE:
{json.dumps(student_profile, indent=2)}

REQUIREMENTS:
{json.dumps(requirements, indent=2)}

CONTEXT FROM DOCUMENTS:
{context_str}

Analyze if student meets requirements. Be strict.

Rules:
- If any required field is missing from student profile, mark as "needs_info"
- Check each requirement against student data
- Provide clear reasoning
- Be conservative (when uncertain, say "needs_info")

Return JSON:
{{
    "eligible": true or false or null,
    "reason": "Why eligible/not eligible",
    "confidence": 0.85,
    "missing_info": ["field1", "field2"]
}}

Return ONLY valid JSON, no other text."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=512,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.2,
            )

            response_text = message.choices[0].message.content

            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse eligibility JSON: {response_text}")
                return {
                    "eligible": None,
                    "reason": "Failed to determine eligibility",
                    "confidence": 0.0,
                    "missing_info": []
                }

        except Exception as e:
            logger.error(f"Error checking eligibility: {e}")
            raise

    def verify_claim_with_evidence(
        self,
        claim: str,
        evidence_chunks: list[str],
        source_urls: list[str] = None
    ) -> dict:
        """
        Verify if a claim is supported by evidence chunks.

        Returns:
        {
            "supported": "yes|partial|no",
            "confidence": 0.95,
            "explanation": "The claim is supported by...",
            "evidence_used": ["chunk_0", "chunk_2"]
        }
        """
        evidence_str = "\n".join(
            [f"[{i}] {chunk[:300]}" for i, chunk in enumerate(evidence_chunks[:5])]
        )

        prompt = f"""Verify this claim against evidence.

CLAIM:
{claim}

EVIDENCE:
{evidence_str}

Determine if claim is:
- yes: Directly supported by evidence
- partial: Partially supported, some details missing
- no: Not supported or contradicted

Be strict. Only "yes" if evidence clearly states it.

Return JSON:
{{
    "supported": "yes or partial or no",
    "confidence": 0.95,
    "explanation": "Why this verdict",
    "evidence_used": [0, 2]
}}

Return ONLY valid JSON, no other text."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=256,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )

            response_text = message.choices[0].message.content

            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse verification JSON: {response_text}")
                return {
                    "supported": "no",
                    "confidence": 0.0,
                    "explanation": "Failed to verify",
                    "evidence_used": []
                }

        except Exception as e:
            logger.error(f"Error verifying claim: {e}")
            raise

    def generate_answer_with_reasoning(
        self,
        query: str,
        context_chunks: list[str],
        student_context: Optional[dict] = None
    ) -> dict:
        """
        Generate an answer with reasoning for a student query.

        Returns:
        {
            "answer": "Detailed answer",
            "reasoning": "How we arrived at this answer",
            "sources": ["chunk_0", "chunk_1"],
            "confidence": 0.85
        }
        """
        context_str = "\n".join(
            [f"[{i}] {chunk[:300]}" for i, chunk in enumerate(context_chunks[:5])]
        )

        student_context_str = ""
        if student_context:
            student_context_str = f"\nSTUDENT CONTEXT:\n{json.dumps(student_context, indent=2)}"

        prompt = f"""Answer this student query using provided context.

QUERY:
{query}
{student_context_str}

CONTEXT:
{context_str}

Provide:
1. Clear, direct answer
2. Step-by-step reasoning
3. Which context chunks support this

Return JSON:
{{
    "answer": "Direct answer to query",
    "reasoning": "How we reached this conclusion",
    "sources": [0, 1],
    "confidence": 0.9
}}

Return ONLY valid JSON, no other text."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,
            )

            response_text = message.choices[0].message.content

            try:
                return json.loads(response_text)
            except json.JSONDecodeError:
                logger.warning(f"Failed to parse answer JSON: {response_text}")
                return {
                    "answer": response_text,
                    "reasoning": "Direct response",
                    "sources": [],
                    "confidence": 0.5
                }

        except Exception as e:
            logger.error(f"Error generating answer: {e}")
            raise
