"""Action extraction service using LLM."""

import json
import logging
from typing import Optional, List, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.document import Document, DocumentVersion, DocumentChunk
from app.models.action import Action
from app.services.llm import get_llm_service
from app.logger import logger


class ActionExtractorService:
    """Service for extracting structured actions from documents."""
    
    def __init__(self):
        """Initialize action extractor."""
        self.llm_service = get_llm_service()
    
    async def extract_actions_from_document(
        self,
        session: AsyncSession,
        document_id: str,
        document_title: str,
        document_type: str,
        full_text: str,
    ) -> Dict[str, Any]:
        """
        Extract actions from a document.
        
        Args:
            session: Database session
            document_id: Document ID
            document_title: Document title
            document_type: Document type (placement, exam, scholarship, etc.)
            full_text: Full document text
            
        Returns:
            Dictionary with extraction results
        """
        try:
            logger.info(f"Starting action extraction for document {document_id}")
            
            if not self.llm_service.client:
                logger.warning("LLM service not configured, skipping action extraction")
                return {
                    "success": False,
                    "error": "LLM service not configured",
                    "actions": [],
                }
            
            # Build extraction prompt
            prompt = self._build_extraction_prompt(
                document_title,
                document_type,
                full_text,
            )
            
            # Call LLM
            logger.info(f"Calling LLM for action extraction")
            response_text = await self.llm_service.generate_response(
                query=prompt,
                context="",
                temperature=0.3,  # Lower temperature for consistency
                max_tokens=4096,
            )
            
            # Parse response
            logger.info(f"Parsing LLM response")
            actions_data = self._parse_extraction_response(response_text)
            
            # Store in database
            logger.info(f"Storing {len(actions_data['actions'])} actions in database")
            await self._store_actions(
                session,
                document_id,
                actions_data["actions"],
            )
            
            return {
                "success": True,
                "actions_extracted": len(actions_data["actions"]),
                "actions": actions_data["actions"],
            }
            
        except Exception as e:
            logger.error(f"Error extracting actions: {e}")
            return {
                "success": False,
                "error": str(e),
                "actions": [],
            }
    
    def _build_extraction_prompt(
        self,
        document_title: str,
        document_type: str,
        text: str,
    ) -> str:
        """Build the extraction prompt for LLM."""
        return f"""You are an expert at extracting actionable items from university documents.

Document Title: {document_title}
Document Type: {document_type}

Please analyze this document and extract all actionable items (requirements, registrations, submissions, deadlines, etc.).

Document Text:
{text}

For each action, extract:
1. action_title - Clear, concise title of the action (max 100 chars)
2. action_description - Detailed description (max 500 chars)
3. action_type - Type of action: registration, submission, eligibility_check, payment, document_collection, exam_registration, enrollment, etc.
4. deadline - Deadline date if mentioned (format: YYYY-MM-DD or null if not specified)
5. is_mandatory - true if required, false if optional
6. required_documents - List of documents needed for this action
7. eligibility_requirements - List of eligibility criteria (e.g., "CGPA >= 7.0", "No backlogs", "CSE/IT department")
8. key_points - List of important points about this action

Return a JSON object with structure:
{{
    "actions": [
        {{
            "action_title": "...",
            "action_description": "...",
            "action_type": "...",
            "deadline": "...",
            "is_mandatory": true/false,
            "required_documents": ["...", "..."],
            "eligibility_requirements": ["...", "..."],
            "key_points": ["...", "..."]
        }},
        ...
    ],
    "extraction_notes": "Any important notes about the extraction"
}}

Only return valid JSON, no other text."""
    
    def _parse_extraction_response(self, response_text: str) -> Dict[str, Any]:
        """Parse LLM response to extract actions."""
        try:
            # Try to extract JSON from response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start == -1 or json_end <= json_start:
                logger.warning("No JSON found in response")
                return {"actions": []}
            
            json_str = response_text[json_start:json_end]
            data = json.loads(json_str)
            
            # Validate and clean actions
            actions = []
            for action in data.get("actions", []):
                cleaned_action = self._clean_action_data(action)
                if cleaned_action:
                    actions.append(cleaned_action)
            
            return {"actions": actions}
            
        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {e}")
            return {"actions": []}
    
    def _clean_action_data(self, action: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Clean and validate action data."""
        try:
            # Required fields
            if not action.get("action_title"):
                return None
            
            # Clean deadline
            deadline = None
            if action.get("deadline"):
                try:
                    deadline = datetime.strptime(action["deadline"], "%Y-%m-%d")
                except ValueError:
                    logger.warning(f"Invalid deadline format: {action['deadline']}")
                    deadline = None
            
            return {
                "action_title": str(action.get("action_title", ""))[:500],
                "action_description": str(action.get("action_description", ""))[:2000],
                "action_type": str(action.get("action_type", "other"))[:50],
                "deadline": deadline,
                "is_mandatory": bool(action.get("is_mandatory", False)),
                "required_documents": action.get("required_documents", []),
                "eligibility_requirements": action.get("eligibility_requirements", []),
                "key_points": action.get("key_points", []),
            }
            
        except Exception as e:
            logger.error(f"Error cleaning action data: {e}")
            return None
    
    async def _store_actions(
        self,
        session: AsyncSession,
        document_id: str,
        actions_data: List[Dict[str, Any]],
    ) -> None:
        """Store extracted actions in database."""
        try:
            for action_data in actions_data:
                action = Action(
                    document_id=document_id,
                    action_title=action_data["action_title"],
                    action_description=action_data["action_description"],
                    action_type=action_data["action_type"],
                    deadline=action_data["deadline"],
                    is_mandatory=action_data["is_mandatory"],
                    required_documents=action_data.get("required_documents", []),
                    dependencies=[],  # Will be populated later
                    evidence_chunks=[],  # Will be populated with chunk references
                )
                session.add(action)
            
            await session.commit()
            logger.info(f"Stored {len(actions_data)} actions successfully")
            
        except Exception as e:
            await session.rollback()
            logger.error(f"Error storing actions: {e}")
            raise
    
    async def extract_eligibility_requirements(
        self,
        action_text: str,
        document_context: str,
    ) -> Dict[str, Any]:
        """
        Extract eligibility requirements from action text.
        
        Args:
            action_text: Text describing the action
            document_context: Additional context from document
            
        Returns:
            Dictionary with eligibility requirements
        """
        try:
            if not self.llm_service.client:
                return {"success": False, "error": "LLM service not configured"}
            
            prompt = f"""Analyze this action and extract all eligibility requirements.

Action:
{action_text}

Context:
{document_context}

Return JSON with:
{{
    "requirements": [
        {{
            "field": "cgpa",  // field: cgpa, department, batch, backlogs, year, etc.
            "operator": ">=",  // operator: >=, >, <=, <, ==, !=, in
            "value": 7.0,
            "description": "GPA must be at least 7.0"
        }},
        ...
    ],
    "eligibility_notes": "Any special eligibility notes"
}}
"""
            
            response_text = await self.llm_service.generate_response(
                query=prompt,
                context="",
                temperature=0.3,
                max_tokens=2048,
            )
            
            # Parse response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            json_str = response_text[json_start:json_end]
            data = json.loads(json_str)
            
            return {
                "success": True,
                "requirements": data.get("requirements", []),
                "notes": data.get("eligibility_notes", ""),
            }
            
        except Exception as e:
            logger.error(f"Error extracting eligibility requirements: {e}")
            return {
                "success": False,
                "error": str(e),
                "requirements": [],
            }


# Global instance
_action_extractor: Optional[ActionExtractorService] = None


def get_action_extractor() -> ActionExtractorService:
    """Get or create global action extractor instance."""
    global _action_extractor
    if _action_extractor is None:
        _action_extractor = ActionExtractorService()
    return _action_extractor
