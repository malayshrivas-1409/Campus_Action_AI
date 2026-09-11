"""Eligibility checking service for determining if students qualify for actions."""

import json
import logging
import re
from typing import Optional, List, Dict, Any
from decimal import Decimal
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.student import Student
from app.models.action import Action
from app.models.student_action import StudentAction
from app.services.llm import get_llm_service
from app.logger import logger


class EligibilityCheckerService:
    """Service for checking student eligibility against action requirements."""
    
    def __init__(self):
        """Initialize eligibility checker."""
        self.llm_service = get_llm_service()
    
    async def check_student_eligibility_for_action(
        self,
        session: AsyncSession,
        student: Student,
        action: Action,
    ) -> Dict[str, Any]:
        """
        Check if a student is eligible for an action.
        
        Args:
            session: Database session
            student: Student object
            action: Action object
            
        Returns:
            Dictionary with eligibility status, reason, and confidence
        """
        try:
            logger.info(
                f"Checking eligibility for student {student.roll_number} "
                f"for action {action.action_title}"
            )
            
            # Parse requirements from action
            requirements = self._parse_requirements(
                action.eligibility_requirements
            )
            
            # Check against student profile
            rule_results = self._evaluate_requirements(student, requirements)
            
            # Determine overall eligibility
            if rule_results["failed_rules"]:
                status = "not_eligible"
                confidence = 0.95
                reason = f"Does not meet: {', '.join(rule_results['failed_reasons'])}"
            elif rule_results["unsure_rules"]:
                status = "maybe"
                confidence = 0.6
                reason = f"Unclear criteria: {', '.join(rule_results['unsure_reasons'])}"
            else:
                status = "eligible"
                confidence = 0.95
                reason = "Meets all requirements"
            
            # If LLM is available, get second opinion for edge cases
            if self.llm_service.client and rule_results["unsure_rules"]:
                llm_result = await self._verify_eligibility_with_llm(
                    student,
                    action,
                    rule_results,
                )
                if llm_result:
                    status = llm_result["status"]
                    confidence = llm_result["confidence"]
                    reason = llm_result["reason"]
            
            result = {
                "eligible": status,
                "status": status,
                "confidence": float(confidence),
                "reason": reason,
                "missing_info": rule_results["unsure_rules"],
                "matched_criteria": rule_results["passed_reasons"],
                "unmatched_criteria": rule_results["failed_reasons"],
            }
            
            logger.info(
                f"Eligibility result: {status} (confidence: {confidence})"
            )
            
            return result
            
        except Exception as e:
            logger.error(f"Error checking eligibility: {e}")
            return {
                "eligible": "maybe",
                "status": "maybe",
                "confidence": 0.5,
                "reason": f"Error during evaluation: {str(e)}",
                "missing_info": [],
                "matched_criteria": [],
                "unmatched_criteria": [],
            }
    
    def _parse_requirements(
        self,
        requirements_list: Optional[List[str]],
    ) -> List[Dict[str, Any]]:
        """
        Parse eligibility requirements from string list.
        
        Supported formats:
        - "CGPA >= 7.0"
        - "Department: CSE, IT"
        - "No backlogs"
        - "Batch 2024, 2025"
        - "Year >= 3"
        """
        if not requirements_list:
            return []
        
        requirements = []
        
        for req in requirements_list:
            req = req.strip()
            
            # CGPA requirement
            if "cgpa" in req.lower() or "gpa" in req.lower():
                parsed = self._parse_numeric_requirement(req, "cgpa")
                if parsed:
                    requirements.append(parsed)
            
            # Department requirement
            elif "department" in req.lower() or "branch" in req.lower():
                parsed = self._parse_department_requirement(req)
                if parsed:
                    requirements.append(parsed)
            
            # Backlogs requirement
            elif "backlog" in req.lower() or "back log" in req.lower():
                parsed = self._parse_backlog_requirement(req)
                if parsed:
                    requirements.append(parsed)
            
            # Batch/Year requirement
            elif any(x in req.lower() for x in ["batch", "year", "semester"]):
                parsed = self._parse_batch_requirement(req)
                if parsed:
                    requirements.append(parsed)
            
            # Generic numeric requirement
            else:
                # Try to parse as generic requirement
                parsed = self._parse_generic_requirement(req)
                if parsed:
                    requirements.append(parsed)
        
        return requirements
    
    def _parse_numeric_requirement(
        self,
        req: str,
        field: str,
    ) -> Optional[Dict[str, Any]]:
        """Parse numeric requirements like 'CGPA >= 7.0'."""
        try:
            # Find operators: >=, <=, >, <, ==, !=
            for op in [">=", "<=", ">", "<", "==", "!="]:
                if op in req:
                    parts = req.split(op)
                    if len(parts) >= 2:
                        try:
                            value = float(parts[-1].strip())
                            return {
                                "type": "numeric",
                                "field": field,
                                "operator": op,
                                "value": value,
                                "original": req,
                            }
                        except ValueError:
                            continue
            return None
        except Exception as e:
            logger.warning(f"Could not parse numeric requirement: {req} - {e}")
            return None
    
    def _parse_department_requirement(self, req: str) -> Optional[Dict[str, Any]]:
        """Parse department requirements like 'Department: CSE, IT'."""
        try:
            # Extract departments after colon
            if ":" in req:
                departments_str = req.split(":", 1)[1]
            else:
                departments_str = req
            
            # Split by comma and clean
            departments = [d.strip().upper() for d in departments_str.split(",")]
            departments = [d for d in departments if d and d not in ["DEPARTMENT"]]
            
            if departments:
                return {
                    "type": "department",
                    "field": "department",
                    "operator": "in",
                    "values": departments,
                    "original": req,
                }
            return None
        except Exception as e:
            logger.warning(f"Could not parse department requirement: {req} - {e}")
            return None
    
    def _parse_backlog_requirement(self, req: str) -> Optional[Dict[str, Any]]:
        """Parse backlog requirements like 'No backlogs' or 'Backlogs <= 2'."""
        try:
            if any(x in req.lower() for x in ["no backlog", "0 backlog", "zero backlog"]):
                return {
                    "type": "numeric",
                    "field": "backlogs",
                    "operator": "==",
                    "value": 0,
                    "original": req,
                }
            else:
                # Try to parse numeric backlog requirement
                return self._parse_numeric_requirement(req, "backlogs")
        except Exception as e:
            logger.warning(f"Could not parse backlog requirement: {req} - {e}")
            return None
    
    def _parse_batch_requirement(self, req: str) -> Optional[Dict[str, Any]]:
        """Parse batch/year requirements like 'Batch 2024, 2025'."""
        try:
            # Extract numbers from requirement
            numbers = re.findall(r"\d{4}|\d{1,2}", req)
            if numbers:
                # If range-like pattern (e.g., >= 3)
                if any(op in req.lower() for op in [">=", "<=", ">", "<"]):
                    return self._parse_numeric_requirement(req, "batch")
                else:
                    # Multiple specific batches
                    batches = [int(n) for n in numbers if len(n) == 4 or int(n) <= 50]
                    if batches:
                        return {
                            "type": "batch",
                            "field": "batch",
                            "operator": "in",
                            "values": batches,
                            "original": req,
                        }
            return None
        except Exception as e:
            logger.warning(f"Could not parse batch requirement: {req} - {e}")
            return None
    
    def _parse_generic_requirement(self, req: str) -> Optional[Dict[str, Any]]:
        """Parse generic requirements that don't fit other patterns."""
        return {
            "type": "generic",
            "description": req,
            "original": req,
        }
    
    def _evaluate_requirements(
        self,
        student: Student,
        requirements: List[Dict[str, Any]],
    ) -> Dict[str, Any]:
        """Evaluate if student meets all requirements."""
        passed = []
        failed = []
        unsure = []
        
        for req in requirements:
            req_type = req.get("type", "unknown")
            
            if req_type == "numeric":
                result = self._check_numeric_requirement(student, req)
            elif req_type == "department":
                result = self._check_department_requirement(student, req)
            elif req_type == "batch":
                result = self._check_batch_requirement(student, req)
            else:
                result = "unsure"
            
            if result == "pass":
                passed.append(req.get("original", str(req)))
            elif result == "fail":
                failed.append(req.get("original", str(req)))
            else:
                unsure.append(req.get("original", str(req)))
        
        return {
            "passed_rules": len(passed),
            "failed_rules": len(failed),
            "unsure_rules": len(unsure),
            "passed_reasons": passed,
            "failed_reasons": failed,
            "unsure_reasons": unsure,
        }
    
    def _check_numeric_requirement(
        self,
        student: Student,
        req: Dict[str, Any],
    ) -> str:
        """Check numeric requirement (CGPA, backlogs, etc.)."""
        try:
            field = req["field"]
            operator = req["operator"]
            value = req["value"]
            
            # Get student field value
            if field == "cgpa":
                student_value = student.cgpa
                if student_value is None:
                    return "unsure"
            elif field == "backlogs":
                student_value = student.backlogs
            else:
                return "unsure"
            
            # Evaluate operator
            if operator == ">=":
                result = student_value >= value
            elif operator == "<=":
                result = student_value <= value
            elif operator == ">":
                result = student_value > value
            elif operator == "<":
                result = student_value < value
            elif operator == "==":
                result = student_value == value
            elif operator == "!=":
                result = student_value != value
            else:
                return "unsure"
            
            return "pass" if result else "fail"
            
        except Exception as e:
            logger.warning(f"Error checking numeric requirement: {e}")
            return "unsure"
    
    def _check_department_requirement(
        self,
        student: Student,
        req: Dict[str, Any],
    ) -> str:
        """Check department requirement."""
        try:
            allowed_departments = [d.upper() for d in req.get("values", [])]
            student_dept = student.department.upper()
            
            return "pass" if student_dept in allowed_departments else "fail"
            
        except Exception as e:
            logger.warning(f"Error checking department requirement: {e}")
            return "unsure"
    
    def _check_batch_requirement(
        self,
        student: Student,
        req: Dict[str, Any],
    ) -> str:
        """Check batch requirement."""
        try:
            if req.get("operator") in [">=", "<=", ">", "<"]:
                # Handle as numeric
                return self._check_numeric_requirement(student, {
                    "field": "batch",
                    "operator": req["operator"],
                    "value": req["value"],
                })
            else:
                allowed_batches = req.get("values", [])
                return "pass" if student.batch in allowed_batches else "fail"
        except Exception as e:
            logger.warning(f"Error checking batch requirement: {e}")
            return "unsure"
    
    async def _verify_eligibility_with_llm(
        self,
        student: Student,
        action: Action,
        rule_results: Dict[str, Any],
    ) -> Optional[Dict[str, Any]]:
        """Use LLM to verify eligibility for edge cases."""
        try:
            if not self.llm_service.client:
                return None
            
            prompt = f"""Based on the following information, determine if this student is eligible for this action.

Student Profile:
- Roll Number: {student.roll_number}
- Department: {student.department}
- Batch: {student.batch}
- CGPA: {student.cgpa or 'Not provided'}
- Backlogs: {student.backlogs}

Action:
- Title: {action.action_title}
- Description: {action.action_description}
- Type: {action.action_type}
- Mandatory: {action.is_mandatory}
- Required Documents: {', '.join(action.required_documents or [])}

Requirements Analysis:
- Met criteria: {', '.join(rule_results['passed_reasons']) or 'None'}
- Not met criteria: {', '.join(rule_results['failed_reasons']) or 'None'}
- Unclear criteria: {', '.join(rule_results['unsure_reasons']) or 'None'}

Provide eligibility decision in JSON format:
{{
    "status": "eligible",  // eligible, not_eligible, or maybe
    "confidence": 0.85,    // 0-1
    "reason": "Short explanation"
}}
"""
            
            response_text = await self.llm_service.generate_response(
                query=prompt,
                context="",
                temperature=0.2,  # Low temperature for consistency
                max_tokens=512,
            )
            
            # Parse JSON response
            json_start = response_text.find('{')
            json_end = response_text.rfind('}') + 1
            
            if json_start >= 0 and json_end > json_start:
                json_str = response_text[json_start:json_end]
                data = json.loads(json_str)
                
                return {
                    "status": data.get("status", "maybe"),
                    "confidence": float(data.get("confidence", 0.5)),
                    "reason": data.get("reason", "LLM verification complete"),
                }
            
            return None
            
        except Exception as e:
            logger.warning(f"Error verifying eligibility with LLM: {e}")
            return None
    
    async def check_eligibility_for_all_students(
        self,
        session: AsyncSession,
        action: Action,
    ) -> List[Dict[str, Any]]:
        """
        Check eligibility for an action across all students.
        Bulk operation for newly extracted actions.
        """
        try:
            logger.info(f"Checking eligibility for action {action.action_title} across all students")
            
            # Get all active students
            result = await session.execute(select(Student))
            students = result.scalars().all()
            
            results = []
            
            for student in students:
                eligibility = await self.check_student_eligibility_for_action(
                    session,
                    student,
                    action,
                )
                
                # Create or update student_action record
                student_action_result = await session.execute(
                    select(StudentAction).where(
                        StudentAction.student_id == student.id,
                        StudentAction.action_id == action.id,
                    )
                )
                student_action = student_action_result.scalar_one_or_none()
                
                if student_action:
                    # Update existing
                    student_action.eligibility_status = eligibility["status"]
                    student_action.eligibility_reason = eligibility["reason"]
                    student_action.eligibility_confidence = Decimal(str(eligibility["confidence"]))
                    student_action.required_info = eligibility["missing_info"]
                else:
                    # Create new
                    student_action = StudentAction(
                        student_id=student.id,
                        action_id=action.id,
                        eligibility_status=eligibility["status"],
                        eligibility_reason=eligibility["reason"],
                        eligibility_confidence=Decimal(str(eligibility["confidence"])),
                        required_info=eligibility["missing_info"],
                    )
                    session.add(student_action)
                
                results.append({
                    "student_id": str(student.id),
                    "student_roll": student.roll_number,
                    **eligibility,
                })
            
            await session.commit()
            logger.info(f"Checked eligibility for {len(results)} students")
            
            return results
            
        except Exception as e:
            await session.rollback()
            logger.error(f"Error checking eligibility for all students: {e}")
            raise


# Global instance
_eligibility_checker: Optional[EligibilityCheckerService] = None


def get_eligibility_checker() -> EligibilityCheckerService:
    """Get or create global eligibility checker instance."""
    global _eligibility_checker
    if _eligibility_checker is None:
        _eligibility_checker = EligibilityCheckerService()
    return _eligibility_checker
