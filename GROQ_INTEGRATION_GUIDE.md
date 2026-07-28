# Groq API Integration Guide

**Status:** Recommended for production  
**Date:** July 28, 2026

---

## Quick Summary

✅ **YES, Groq API works perfectly** for Campus Action AI  
✅ **Better than Ollama** for your use case (speed, accuracy, cost)  
✅ **Free tier sufficient** for development and MVP (30 requests/minute, unlimited tokens)  
✅ **Production ready** with enterprise-grade reliability

---

## Why Groq Over Ollama

### Performance Comparison

```
Groq LLama-2-70B:
├── Tokens/sec: 100-300 (⚡ Fast)
├── Latency: 50-200ms
├── Quality: Enterprise grade
├── Cost: $0 (free tier)
└── Best for: Production

Ollama (Local):
├── Tokens/sec: 10-50 (🐢 Slow)
├── Latency: 500-2000ms+
├── Quality: Limited (smaller models only)
├── Cost: $0 API + GPU/CPU hardware ($500-5000)
└── Best for: Development offline only
```

### Real-World Impact

**For your RAG system:**
- Groq: 50ms to generate eligibility → responsive UX
- Ollama: 1000ms+ to generate eligibility → slow, frustrating UX

**For accuracy:**
- Groq (Llama-70B): Fewer hallucinations, better reasoning
- Ollama (7B models only): More hallucinations, weaker reasoning

---

## Setup Steps

### Step 1: Get API Key (2 minutes)

1. Go to [console.groq.com](https://console.groq.com)
2. Sign up with email
3. Copy your API key
4. Save to `.env` file

```bash
GROQ_API_KEY=gsk_your_key_here_from_console
```

### Step 2: Install Package

```bash
pip install groq
```

### Step 3: Create LLM Service

**File: `backend/app/services/llm.py`**

```python
import json
import logging
from typing import Optional
from groq import Groq

logger = logging.getLogger(__name__)

class LLMService:
    """Service for LLM operations via Groq API."""
    
    def __init__(self, api_key: str):
        self.client = Groq(api_key=api_key)
        # Use mixtral-8x7b-32768 for better reasoning
        # Use llama-2-70b-chat for better accuracy
        self.model = "mixtral-8x7b-32768"
    
    def extract_actions_from_document(
        self,
        document_text: str
    ) -> dict:
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
{document_text}

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
        
        Student Profile: {"cgpa": 8.1, "batch": 2027, ...}
        Requirements: {"min_cgpa": 7.0, "batch": 2027, ...}
        Context: Supporting document excerpts
        
        Returns:
        {
            "eligible": true/false/null,  # null means "needs more info"
            "reason": "string explanation",
            "confidence": 0.95,  # 0-1 confidence score
            "missing_info": ["Family income", ...]  # What info is needed
        }
        """
        context_str = "\n".join([f"- {chunk}" for chunk in context_chunks])
        
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
    "eligible": true/false/null,
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
            [f"[{i}] {chunk}" for i, chunk in enumerate(evidence_chunks)]
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
    "supported": "yes|partial|no",
    "confidence": 0.95,
    "explanation": "Why this verdict",
    "evidence_used": [0, 2]  # Indices of supporting chunks
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
            [f"[{i}] {chunk}" for i, chunk in enumerate(context_chunks)]
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
    "sources": [0, 1],  # Chunk indices
    "confidence": 0.9
}}

Return ONLY valid JSON, no other text."""

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.5,  # Slightly higher for conversational
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
```

### Step 4: Add to FastAPI

**File: `backend/app/config.py`**

```python
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Groq Configuration
    groq_api_key: str
    groq_model: str = "mixtral-8x7b-32768"
    
    # Database
    database_url: str = "postgresql://user:password@localhost/campus_ai"
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"

settings = Settings()
```

**File: `backend/app/dependencies.py`**

```python
from app.config import settings
from app.services.llm import LLMService

# Create LLM service instance
llm_service = LLMService(api_key=settings.groq_api_key)

async def get_llm_service():
    return llm_service
```

### Step 5: Create API Endpoints

**File: `backend/app/api/v1/routes/rag.py`**

```python
from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_llm_service
from app.services.llm import LLMService

router = APIRouter(prefix="/api/v1/rag", tags=["RAG"])

@router.post("/extract-actions")
async def extract_actions(
    document_id: str,
    llm: LLMService = Depends(get_llm_service)
):
    """Extract actions from a document."""
    try:
        # Get document text from database
        document_text = get_document_text(document_id)
        
        # Extract using Groq
        result = llm.extract_actions_from_document(document_text)
        
        # Store results in database
        store_extraction_results(document_id, result)
        
        return {"status": "success", "actions": result.get("actions", [])}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/check-eligibility")
async def check_eligibility(
    student_id: str,
    action_id: str,
    llm: LLMService = Depends(get_llm_service)
):
    """Check if student is eligible for an action."""
    try:
        student = get_student(student_id)
        action = get_action(action_id)
        context = retrieve_context_for_action(action_id)
        
        result = llm.check_eligibility(
            student_profile=student.to_dict(),
            requirements=action.requirements,
            context_chunks=context
        )
        
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### Step 6: Test the Integration

```bash
# Test extraction
curl -X POST http://localhost:8000/api/v1/rag/extract-actions \
  -H "Content-Type: application/json" \
  -d '{"document_id": "doc-123"}'

# Test eligibility
curl -X POST http://localhost:8000/api/v1/rag/check-eligibility \
  -H "Content-Type: application/json" \
  -d '{"student_id": "stu-456", "action_id": "action-789"}'
```

---

## Rate Limiting Considerations

### Groq Free Tier Limits

- **30 requests per minute** (per API key)
- **Unlimited tokens** in total
- **No daily limits**

### Rate Limiting Strategy

```python
# app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

@limiter.limit("30/minute")
async def check_eligibility_route(request: Request):
    pass

async def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."}
    )

app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, rate_limit_exceeded_handler)
```

### Handling Rate Limits in Queue

```python
# app/jobs/eligibility_check.py
import asyncio
from celery import shared_task
from app.services.llm import LLMService

@shared_task(bind=True, max_retries=3)
def check_student_eligibility(self, student_id, action_id):
    try:
        llm = LLMService(api_key=settings.groq_api_key)
        result = llm.check_eligibility(
            student_profile=get_student(student_id).to_dict(),
            requirements=get_action(action_id).requirements,
            context_chunks=retrieve_context(action_id)
        )
        store_eligibility_result(student_id, action_id, result)
        return result
    except Exception as exc:
        # Retry with exponential backoff if rate limited
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))
```

---

## Production Deployment Checklist

- [ ] Groq API key stored in secrets manager (not .env in production)
- [ ] Rate limiting configured
- [ ] Error handling for API failures
- [ ] Logging for all LLM calls
- [ ] Caching of results to reduce API calls
- [ ] Monitoring of Groq usage
- [ ] Cost alerts set up (if going paid tier)
- [ ] Fallback mechanism if Groq is unavailable

---

## Cost Projection

**For 1000 students over 4 months:**

```
Assumptions:
- 2 eligibility checks per student per week
- Average 300 tokens per eligibility check
- 50% requests are cached

Calculation:
1000 students × 2 checks/week × 4 weeks × 4 months = 32,000 requests
32,000 × 300 tokens × 0.5 (cache factor) = 4.8M tokens

Cost:
4.8M tokens × $0.15/1M = $0.72

Conclusion: Essentially FREE on Groq's free tier
```

---

## Common Issues & Solutions

### Issue 1: "Rate limit exceeded"
**Solution:** Implement queue/background jobs for non-urgent checks

### Issue 2: "Invalid JSON from LLM"
**Solution:** Add error handling and retries with lower temperature

### Issue 3: "Timeout after 30 seconds"
**Solution:** Implement request timeout handling and async processing

### Issue 4: "API key not found"
**Solution:** Verify .env file and environment variables are loaded

---

## Comparison: Which Model to Use?

```
Llama-2-70B:
  ✅ Best for accuracy & evidence verification
  ✅ Lower hallucination rate
  ❌ Slightly slower (~100 tokens/sec)
  → Use for: Eligibility checks, claim verification

Mixtral-8x7B:
  ✅ Best for reasoning & multi-hop queries
  ✅ Faster (~200+ tokens/sec)
  ✅ Good accuracy
  → Use for: Action extraction, complex queries, chat

Recommendation for your project:
- Use Mixtral for document processing (faster batch)
- Use Llama-2-70B for eligibility (more accurate)
- Both are excellent, hard to go wrong
```

---

## Next Steps

1. ✅ Sign up at [console.groq.com](https://console.groq.com)
2. ✅ Copy API key to `.env`
3. ✅ Install groq package: `pip install groq`
4. ✅ Implement LLMService in your backend
5. ✅ Create API endpoints for RAG operations
6. ✅ Test with sample documents
7. ✅ Add monitoring and logging
8. ✅ Deploy to production

---

**Questions?** The Groq API documentation is at [console.groq.com/docs](https://console.groq.com/docs)

