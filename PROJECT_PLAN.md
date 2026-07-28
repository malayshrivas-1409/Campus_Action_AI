# Campus Action AI - Comprehensive Project Plan

**Project Title:** Campus Action AI - Intelligent Notice Management & Eligibility Engine  
**Date Created:** July 28, 2026  
**Status:** Planning Phase  
**Version:** 1.0

---

## 📋 Table of Contents

1. [Executive Summary](#executive-summary)
2. [Project Overview](#project-overview)
3. [Core Architecture](#core-architecture)
4. [Database Schema Design](#database-schema-design)
5. [Project Phases](#project-phases)
6. [Technology Stack](#technology-stack)
7. [Implementation Approach](#implementation-approach)
8. [Git Strategy & Conventions](#git-strategy--conventions)
9. [Development Best Practices](#development-best-practices)
10. [Risk Management](#risk-management)

---

## Executive Summary

Campus Action AI transforms how students interact with university notices by converting lengthy PDFs into personalized, actionable insights. Instead of showing raw information, the system extracts requirements, matches them against student profiles, and presents only relevant actions with evidence-backed eligibility determination.

**Key Innovation:** Retrieval-Augmented Generation (RAG) with cross-document reasoning, temporal tracking, and evidence verification to ensure students get accurate, contextualized information.

---

## Project Overview

### Problem Statement

Students receive notices through multiple channels (PDFs, emails, portals, WhatsApp) but struggle to:
- Understand if a notice applies to them
- Extract required actions and deadlines
- Identify necessary documents
- Track changing deadlines and contradictions

### Solution

An AI-powered platform that:
1. **Ingests** university documents into a knowledge base
2. **Extracts** structured information with metadata
3. **Reasons** across documents using RAG
4. **Personalizes** based on student profiles
5. **Delivers** actionable insights with evidence

### Target Users

- **Primary:** Students (B.Tech, M.Tech, MBA programs)
- **Secondary:** Administrative staff (notice uploads)
- **Tertiary:** Placement coordinators (placement drives)

### Success Metrics

- 80%+ accuracy in eligibility determination
- <2s response time for personalized queries
- 90%+ student adoption rate
- Zero hallucinations in evidence-backed claims

---

## Core Architecture

### High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend Layer                          │
│  React + TypeScript + Tailwind CSS (Student/Admin Portal)   │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API (JSON)
┌────────────────────▼────────────────────────────────────────┐
│                      Backend Layer                           │
│              FastAPI + Python Application                    │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Auth Service     │  │ Document Service │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Notice Service   │  │ Action Service   │                 │
│  └──────────────────┘  └──────────────────┘                 │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │ Student Service  │  │ Query Service    │                 │
│  └──────────────────┘  └──────────────────┘                 │
│                                                               │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
        ▼            ▼            ▼
┌──────────────┐ ┌─────────┐ ┌───────────┐
│ PostgreSQL   │ │ Redis   │ │ Minio/S3  │
│ + pgvector   │ │ Cache   │ │ Document  │
│              │ │         │ │ Storage   │
└──────────────┘ └─────────┘ └───────────┘
        │
        ▼
┌──────────────────────────────────────┐
│     Core RAG Processing Layer         │
│                                       │
│ • Embedding Generation                │
│ • Vector Search (pgvector)            │
│ • Sparse Search (BM25/FTS)            │
│ • RRF Fusion & Reranking              │
│ • Context Building                    │
│ • LLM Integration (Ollama)            │
│                                       │
└──────────────────────────────────────┘
        │
        ▼
┌──────────────────────────────────────┐
│      Background Job Processing        │
│  (Celery/Dramatiq + Message Queue)    │
│                                       │
│ • Document Ingestion Pipeline         │
│ • Embedding Generation                │
│ • Action Extraction                   │
│ • Evidence Verification               │
│ • Student Matching                    │
│                                       │
└──────────────────────────────────────┘
```

### Data Flow Architecture

```
Document Upload
       │
       ▼
┌──────────────────────┐
│ File Storage (S3)    │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────────────────┐
│ Document Processing Pipeline      │
│                                  │
│ 1. PDF Parsing & OCR             │
│ 2. Layout Detection              │
│ 3. Text Normalization            │
│ 4. Section Identification        │
│ 5. Semantic Chunking             │
│ 6. Metadata Extraction           │
│                                  │
└──────────┬───────────────────────┘
           │
           ├─────────────┬──────────────┐
           ▼             ▼              ▼
    Structured Text  Metadata      Embeddings
           │             │              │
           ▼             ▼              ▼
    ┌─────────────────────────────────┐
    │  PostgreSQL                      │
    │  • chunks table                  │
    │  • metadata table                │
    │  • vector embeddings (pgvector)  │
    │                                  │
    └─────────────────────────────────┘
           │
           ▼
┌──────────────────────┐
│ LLM Processing       │
│                      │
│ • Action Extraction  │
│ • Eligibility Check  │
│ • Evidence Verify    │
│                      │
└──────────┬───────────┘
           │
           ▼
┌──────────────────────┐
│ Store Actions        │
│ & Notifications      │
└──────────┬───────────┘
           │
           ▼
Student Feed & Alerts
```

---

## Database Schema Design

### Core Tables

#### 1. Users Table

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('student', 'admin', 'staff') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);
```

#### 2. Students Table

```sql
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    roll_number VARCHAR(50) UNIQUE NOT NULL,
    department VARCHAR(50) NOT NULL,
    batch INTEGER NOT NULL,
    cgpa DECIMAL(4,2),
    backlogs INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_students_department ON students(department);
CREATE INDEX idx_students_batch ON students(batch);
CREATE INDEX idx_students_cgpa ON students(cgpa);
```

#### 3. Documents Table

```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    document_type VARCHAR(50) NOT NULL, -- placement, exam, scholarship, etc.
    source_url VARCHAR(1000),
    file_path VARCHAR(1000) NOT NULL,
    file_size BIGINT,
    mime_type VARCHAR(50),
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE INDEX idx_documents_type ON documents(document_type);
CREATE INDEX idx_documents_uploaded_at ON documents(uploaded_at DESC);
```

#### 4. Document Versions Table

```sql
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    version_number INTEGER NOT NULL,
    effective_date TIMESTAMP NOT NULL,
    superseded_by UUID, -- Reference to newer version
    is_latest BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE,
    FOREIGN KEY (superseded_by) REFERENCES document_versions(id),
    UNIQUE(document_id, version_number)
);

CREATE INDEX idx_doc_versions_effective ON document_versions(effective_date DESC);
```

#### 5. Document Chunks Table

```sql
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_version_id UUID NOT NULL,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    page_number INTEGER,
    section VARCHAR(255),
    embedding vector(384), -- BGE embedding dimension
    metadata JSONB, -- {department: [CSE, IT], batch: 2027, ...}
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_version_id) REFERENCES document_versions(id) ON DELETE CASCADE
);

-- Vector similarity index
CREATE INDEX idx_chunks_embedding ON document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- JSONB index for metadata filtering
CREATE INDEX idx_chunks_metadata ON document_chunks USING GIN (metadata);

CREATE INDEX idx_chunks_section ON document_chunks(section);
```

#### 6. Extraction Results Table

```sql
CREATE TABLE extraction_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    extraction_type VARCHAR(50) NOT NULL, -- eligibility, deadline, requirements, etc.
    extracted_data JSONB NOT NULL,
    source_chunks TEXT[] NOT NULL, -- Array of chunk IDs
    confidence_score DECIMAL(3,2),
    verified BOOLEAN DEFAULT false,
    verification_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_extraction_type ON extraction_results(extraction_type);
```

#### 7. Actions Table

```sql
CREATE TABLE actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    action_title VARCHAR(500) NOT NULL,
    action_description TEXT,
    action_type VARCHAR(50) NOT NULL, -- registration, submission, etc.
    deadline TIMESTAMP,
    is_mandatory BOOLEAN DEFAULT false,
    required_documents TEXT[], -- Array of document names
    dependencies TEXT[], -- Array of prerequisite actions
    evidence_chunks TEXT[], -- Array of chunk IDs providing evidence
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
);

CREATE INDEX idx_actions_deadline ON actions(deadline);
CREATE INDEX idx_actions_type ON actions(action_type);
```

#### 8. Student Actions Table

```sql
CREATE TABLE student_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    action_id UUID NOT NULL,
    eligibility_status VARCHAR(50) NOT NULL, -- eligible, not_eligible, maybe, needs_info
    eligibility_reason TEXT,
    eligibility_confidence DECIMAL(3,2),
    required_info TEXT[] DEFAULT '{}', -- What info is missing
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed, dismissed
    view_count INTEGER DEFAULT 0,
    first_viewed_at TIMESTAMP,
    completed_at TIMESTAMP,
    dismissed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE CASCADE,
    UNIQUE(student_id, action_id)
);

CREATE INDEX idx_student_actions_status ON student_actions(status);
CREATE INDEX idx_student_actions_student ON student_actions(student_id);
CREATE INDEX idx_student_actions_eligibility ON student_actions(eligibility_status);
```

#### 9. Notifications Table

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL,
    action_id UUID,
    notification_type VARCHAR(50) NOT NULL, -- deadline_approaching, new_action, deadline_updated
    title VARCHAR(255) NOT NULL,
    message TEXT,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (action_id) REFERENCES actions(id) ON DELETE SET NULL
);

CREATE INDEX idx_notifications_unread ON notifications(is_read, created_at DESC);
CREATE INDEX idx_notifications_student ON notifications(student_id);
```

#### 10. Logs Table (Audit)

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    action_type VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_timestamp ON audit_logs(created_at DESC);
```

### Database Indexes Summary

| Table | Index | Purpose |
|-------|-------|---------|
| users | email | Fast login lookup |
| students | department, batch, cgpa | Filtering & eligibility checks |
| documents | type, uploaded_at | Document discovery |
| document_chunks | embedding (IVF), metadata | Vector search & filtering |
| actions | deadline, type | Feed ordering |
| student_actions | status, student_id | Student dashboard |
| notifications | is_read, student_id | Notification service |


---

## Project Phases

### Phase 1: Foundation & MVP (Weeks 1-6) 🏗️

**Objective:** Build core infrastructure and basic RAG pipeline

#### Sprint 1-1: Project Setup (Week 1)

- [ ] Repository initialization with Git workflows
- [ ] Development environment setup (Docker, local services)
- [ ] Database schema creation & migrations
- [ ] API project structure scaffold
- [ ] Frontend project scaffold
- [ ] CI/CD pipeline setup (GitHub Actions)

**Deliverables:**
- GitHub repository with main/develop branches
- Docker Compose file for local development
- Empty FastAPI application with error handling
- Empty React TypeScript application
- Database migrations working

**Tasks:**
```
phase-1/sprint-1-setup
├── setup-backend
├── setup-frontend
├── setup-database
├── setup-docker
├── setup-ci-cd
└── setup-docs
```

#### Sprint 1-2: Authentication & User Management (Week 2)

- [ ] User authentication (JWT tokens)
- [ ] Role-based access control (RBAC)
- [ ] Student profile management
- [ ] Admin dashboard skeleton
- [ ] User API endpoints

**Deliverables:**
- Login/signup endpoints
- JWT token generation & validation
- Student profile CRUD
- Protected routes

**DB Migrations:**
```sql
-- M001_create_users.sql
-- M002_create_students.sql
-- M003_create_audit_logs.sql
```

#### Sprint 1-3: Document Ingestion Pipeline (Week 3)

- [ ] File upload API
- [ ] PDF parsing (PyMuPDF)
- [ ] Basic text extraction
- [ ] Document storage (S3/Minio)
- [ ] Document metadata storage

**Deliverables:**
- POST /documents endpoint
- PDF parsing service
- Document versioning

**Background Jobs:**
- Document parsing job queue

#### Sprint 1-4: Vector Database & Embeddings (Week 4)

- [ ] pgvector setup
- [ ] Embedding model integration (BGE)
- [ ] Chunk generation & storage
- [ ] Vector similarity search API

**Deliverables:**
- Semantic chunking service
- Embedding generation pipeline
- Vector search endpoint

**Models:**
```python
# models/embeddings.py
- ChunkModel
- EmbeddingService
```

#### Sprint 1-5: Basic RAG Pipeline (Week 5)

- [ ] Query understanding
- [ ] Dense retrieval (pgvector)
- [ ] BM25 sparse retrieval
- [ ] RRF fusion
- [ ] Basic LLM integration (Ollama)

**Deliverables:**
- RAG query endpoint
- Retrieved context formatting
- LLM response generation

**Endpoints:**
```
POST /rag/query
POST /rag/search
```

#### Sprint 1-6: Frontend & Student Feed (Week 6)

- [ ] Student dashboard UI
- [ ] Notice/action feed display
- [ ] Basic search interface
- [ ] Action detail view
- [ ] Mobile responsiveness

**Deliverables:**
- Student dashboard
- Action feed component
- Search interface

**Phase 1 Acceptance Criteria:**
- ✅ System processes PDF → chunks → embeddings
- ✅ Basic RAG returns relevant documents
- ✅ Students can view uploaded notices
- ✅ At least 70% retrieval accuracy on test queries
- ✅ <3 second latency on searches

---

### Phase 2: Eligibility Engine & Personalization (Weeks 7-12) 🎯

**Objective:** Build core intelligence for eligibility determination

#### Sprint 2-1: Action Extraction (Week 7)

- [ ] LLM-based action extraction
- [ ] Structured output (JSON schema)
- [ ] Multiple action types
- [ ] Deadline extraction
- [ ] Requirements extraction

**Deliverables:**
- Action extraction LLM prompts
- Action model in database
- Action validation service

**New Tables:**
```sql
-- M004_create_actions.sql
-- M005_create_extraction_results.sql
```

#### Sprint 2-2: Student Profile Enrichment (Week 8)

- [ ] Extended student profile
- [ ] Academic data integration
- [ ] Document requirement tracking
- [ ] Custom field support
- [ ] Profile completeness scoring

**Deliverables:**
- Student profile API endpoints
- Profile validation
- Data import utilities

**DB Schema Updates:**
```sql
-- M006_alter_students_add_fields.sql
```

#### Sprint 2-3: Eligibility Reasoning Engine (Week 9)

- [ ] Requirement extraction from actions
- [ ] Eligibility logic implementation
- [ ] Missing information detection
- [ ] Confidence scoring
- [ ] Evidence linking

**Deliverables:**
- Eligibility determination API
- Evidence verification
- "Needs Information" workflow

**Services:**
```python
# services/eligibility.py
- EligibilityEngine
- RequirementMatcher
- EvidenceVerifier
```

#### Sprint 2-4: Cross-Document RAG (Week 10)

- [ ] Multi-hop query routing
- [ ] Document relationship mapping
- [ ] Context synthesis
- [ ] Policy retrieval

**Deliverables:**
- Cross-document query handler
- Document linking mechanism
- Enhanced context building

#### Sprint 2-5: Temporal RAG & Updates (Week 11)

- [ ] Document version tracking
- [ ] Supersession detection
- [ ] Update notification system
- [ ] Timeline-aware retrieval

**Deliverables:**
- Version management system
- Update detection pipeline
- Deadline change notifications

**DB Tables:**
```sql
-- M007_create_document_versions.sql
-- M008_create_notifications.sql
```

#### Sprint 2-6: Personalized Feed & Actions (Week 12)

- [ ] Student action feed
- [ ] Eligibility filtering
- [ ] Priority sorting
- [ ] Action categorization
- [ ] Frontend feed display

**Deliverables:**
- Student feed API
- Feed sorting/filtering logic
- Enhanced UI components

**Endpoints:**
```
GET /student/feed
GET /student/feed/placement
GET /student/feed/exam
GET /student/actions
```

**Phase 2 Acceptance Criteria:**
- ✅ System accurately determines eligibility for test cases
- ✅ 85%+ accuracy on action extraction
- ✅ Handles missing student information gracefully
- ✅ Tracks document changes and notifies students
- ✅ Personalized feed shows only relevant actions

---

### Phase 3: Advanced Features & Optimization (Weeks 13-18) 🚀

#### Sprint 3-1: Evidence-Backed AI (Week 13)

- [ ] Evidence chunking & linking
- [ ] Claim verification
- [ ] Hallucination detection
- [ ] Evidence UI display
- [ ] Source citations

**Deliverables:**
- Evidence verification service
- Evidence display component
- Supported/unsupported claim marking

#### Sprint 3-2: Conversational RAG (Week 14)

- [ ] Chat interface
- [ ] Query routing
- [ ] Conversation context
- [ ] Multi-turn queries
- [ ] Chat history

**Deliverables:**
- Chat API endpoints
- Conversation storage
- Chat UI component

**Endpoints:**
```
POST /chat/message
GET /chat/history
```

#### Sprint 3-3: Advanced Reranking (Week 15)

- [ ] Cross-encoder integration
- [ ] Reranking pipeline
- [ ] Relevance scoring
- [ ] Custom rerankers

**Deliverables:**
- Reranking service
- Improved retrieval accuracy
- Performance benchmarks

#### Sprint 3-4: RAG Evaluation Framework (Week 16)

- [ ] RAGAS metrics
- [ ] Retrieval evaluation
- [ ] Generation evaluation
- [ ] Custom metrics
- [ ] Evaluation dashboard

**Deliverables:**
- RAGAS integration
- Evaluation reports
- Performance monitoring

#### Sprint 3-5: Admin Features (Week 17)

- [ ] Document management UI
- [ ] Notice versioning UI
- [ ] Analytics dashboard
- [ ] User management
- [ ] System logs viewer

**Deliverables:**
- Admin dashboard
- Document management interface
- Analytics views

#### Sprint 3-6: Performance & Scaling (Week 18)

- [ ] Caching strategies
- [ ] Query optimization
- [ ] Load testing
- [ ] Database tuning
- [ ] API rate limiting

**Deliverables:**
- Optimized query performance
- Caching layer (Redis)
- Load test reports
- Performance benchmarks

**Phase 3 Acceptance Criteria:**
- ✅ Evidence verification reduces hallucinations by 90%
- ✅ Chat interface works for multi-turn queries
- ✅ System handles 1000 concurrent users
- ✅ Average retrieval accuracy > 88%
- ✅ Admin features functional

---

### Phase 4: Production Readiness & Deployment (Weeks 19-20) 🎬

#### Sprint 4-1: Security & Compliance (Week 19)

- [ ] Security audit
- [ ] Data encryption (at rest & in transit)
- [ ] GDPR compliance
- [ ] Password policies
- [ ] API security hardening

**Deliverables:**
- Security checklist
- Encrypted configurations
- Compliance documentation

#### Sprint 4-2: Deployment & Monitoring (Week 20)

- [ ] Production deployment
- [ ] Monitoring setup (Prometheus/Grafana)
- [ ] Logging aggregation (ELK)
- [ ] Backup strategies
- [ ] Disaster recovery

**Deliverables:**
- Deployed application
- Monitoring dashboards
- Runbooks
- Backup verification

**Phase 4 Acceptance Criteria:**
- ✅ System passes security audit
- ✅ Deployment automated with CI/CD
- ✅ Monitoring & alerting in place
- ✅ 99.5% uptime SLA target
- ✅ Documentation complete

---

## Technology Stack

### Backend

```yaml
Framework: FastAPI 0.104+
Language: Python 3.11+
ORM: SQLAlchemy 2.0+
Migrations: Alembic 1.12+
Async: asyncio + uvicorn

Core Libraries:
  - pydantic (data validation)
  - PyJWT (authentication)
  - python-jose (JWT)
  - PyMuPDF (PDF parsing)
  - Docling (advanced document parsing)
  - Pytesseract (OCR)

Data & Embeddings:
  - sentence-transformers (BGE embeddings)
  - numpy/pandas (data processing)
  - scikit-learn (ML utilities)

Vector & Search:
  - pgvector (PostgreSQL vectors)
  - rank_bm25 (BM25 ranking)

LLM & RAG:
  - langchain (LLM framework) [optional]
  - Groq API (preferred) OR Ollama (local LLM)

Jobs & Async:
  - Celery (task queue) or Dramatiq
  - Redis (message broker/cache)

Monitoring & Logging:
  - python-json-logger
  - prometheus-client
  - structlog

Testing:
  - pytest
  - pytest-asyncio
  - pytest-cov

Environment:
  - python-dotenv
  - pydantic-settings
```

### Frontend

```yaml
Framework: React 18+
Language: TypeScript 5+
Styling: Tailwind CSS 3+
UI Components: shadcn/ui or Headless UI

State Management:
  - React Query / TanStack Query
  - Zustand (lightweight state)

API Client:
  - axios or fetch

Forms:
  - react-hook-form
  - zod (validation)

Routing:
  - React Router v6

Dev Tools:
  - Vite (build tool)
  - ESLint
  - Prettier

Testing:
  - Vitest
  - React Testing Library
  - Playwright (e2e)

Monitoring:
  - Sentry (error tracking)
```

### Database

```yaml
Database: PostgreSQL 14+
Extensions:
  - pgvector (vector similarity)
  - pg_trgm (text similarity)
  - uuid-ossp (UUID generation)

Migrations: Alembic

Connection Pooling:
  - pgBouncer or SQLAlchemy connection pool

Backup:
  - pg_dump
  - WAL archiving
```

### Infrastructure

```yaml
Containerization: Docker
Orchestration: Docker Compose (dev), K8s (prod)
Message Queue: Redis or RabbitMQ
Cache: Redis
Object Storage: MinIO (local) / S3 (cloud)
Reverse Proxy: Nginx

LLM Options:
  Option 1: Groq API (RECOMMENDED)
    - Extremely fast inference (best-in-class)
    - Free tier generous: 30 requests/minute
    - Supports: Llama 2, Mixtral, Gemma
    - Cost: $0.00 (free tier), scalable pay-as-you-go
    - Best for: Production, accuracy, speed
    
  Option 2: Ollama (Local)
    - Completely free, offline
    - Runs on local hardware
    - Limited model performance
    - CPU/GPU intensive
    - Best for: Development, no internet requirement

Monitoring:
  - Prometheus
  - Grafana
  - Loki (log aggregation)
  - Jaeger (tracing)
```

---

## LLM Selection: Groq vs Ollama

### Why Groq API is Better for Your Project

| Aspect | Groq API | Ollama (Local) |
|--------|----------|---------------|
| **Inference Speed** | ⚡ 100-300 tokens/sec | 🐢 10-50 tokens/sec |
| **Quality** | 🟢 Best-in-class models (Llama2-70B, Mixtral-8x7B) | 🟡 Smaller models only |
| **Cost** | 💰 $0.00-$0.15 per million tokens (free tier: 30 req/min) | 💰 $0.00 (but hardware cost) |
| **Scalability** | ✅ Infinite (cloud) | ❌ Limited by hardware |
| **Latency** | ⚡ 50-200ms | 🐌 500-2000ms+ |
| **Hallucinations** | 🟢 Lower (larger models) | 🟡 Higher (smaller models) |
| **Setup Complexity** | Easy (API key) | Hard (GPU/CPU setup) |
| **Offline Capability** | ❌ Requires internet | ✅ Works offline |
| **Production Ready** | ✅ Enterprise grade | ⚠️ Development only |

### Cost Comparison

**Groq (per million tokens):**
- Free tier: 30 requests/minute, unlimited tokens
- Paid: $0.15/million input tokens, $0.60/million output tokens
- For your use case: ~$10-50/month for 1000+ students

**Ollama (local):**
- API: $0.00
- GPU Hardware: $500-5000 (one-time)
- Electricity: $30-100/month
- DevOps overhead: Significant

### Recommendation

**Use Groq API** because:

1. ✅ **Speed:** 5-10x faster inference → better UX
2. ✅ **Accuracy:** Larger models (Llama-70B) = fewer hallucinations
3. ✅ **Cost:** Free tier covers dev + low production workload
4. ✅ **Reliability:** No infrastructure to maintain
5. ✅ **Scalability:** Handles growth automatically
6. ✅ **Development:** Quick setup, no GPU needed locally

---

## Groq Integration Setup

### 1. Install Client Library

```bash
pip install groq
```

### 2. Get API Key

Visit [console.groq.com](https://console.groq.com) and create API key

### 3. Environment Configuration

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    groq_api_key: str
    groq_model: str = "llama-2-70b-chat"  # or mixtral-8x7b-32768
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### 4. Create LLM Service

```python
# app/services/llm.py
from groq import Groq
from typing import Optional

class LLMService:
    def __init__(self, api_key: str, model: str = "llama-2-70b-chat"):
        self.client = Groq(api_key=api_key)
        self.model = model
    
    def extract_actions(self, text: str, context: str) -> dict:
        """Extract structured actions from document."""
        prompt = f"""
        Analyze this document excerpt and extract structured actions.
        
        Document:
        {text}
        
        Context:
        {context}
        
        Return JSON with: action_title, deadline, requirements[], is_mandatory
        """
        
        message = self.client.messages.create(
            model=self.model,
            max_tokens=1024,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return message.choices[0].message.content
    
    def check_eligibility(
        self,
        requirements: dict,
        student_profile: dict,
        document_context: str
    ) -> dict:
        """Check if student is eligible."""
        prompt = f"""
        Student Profile:
        {student_profile}
        
        Requirements:
        {requirements}
        
        Supporting Context:
        {document_context}
        
        Determine eligibility: eligible, not_eligible, or maybe (with reason).
        If maybe, list what information is missing.
        
        Return JSON: status, reason, confidence_score, missing_info[]
        """
        
        message = self.client.messages.create(
            model=self.model,
            max_tokens=512,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return message.choices[0].message.content
    
    def verify_claim(
        self,
        claim: str,
        evidence_chunks: list[str]
    ) -> dict:
        """Verify if claim is supported by evidence."""
        prompt = f"""
        Claim: {claim}
        
        Evidence:
        {chr(10).join(evidence_chunks)}
        
        Is this claim supported, partially supported, or unsupported?
        Return JSON: status, confidence_score, explanation
        """
        
        message = self.client.messages.create(
            model=self.model,
            max_tokens=256,
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        
        return message.choices[0].message.content
```

### 5. Add to .env

```bash
GROQ_API_KEY=gsk_your_key_here
GROQ_MODEL=llama-2-70b-chat
```

### 6. Use in Your Services

```python
# app/services/eligibility.py
from app.services.llm import LLMService
from app.config import settings

llm = LLMService(settings.groq_api_key, settings.groq_model)

def determine_eligibility(student, action, context):
    result = llm.check_eligibility(
        requirements=action.requirements,
        student_profile=student.to_dict(),
        document_context=context
    )
    return result
```

### 7. Rate Limiting (Important!)

```python
# app/middleware/rate_limit.py
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)

# In your FastAPI app:
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# On endpoints:
@app.get("/api/v1/eligibility")
@limiter.limit("30/minute")  # Groq free tier: 30 req/min
async def check_eligibility(request: Request):
    pass
```

---

## Groq Available Models

```
Llama 2 Models:
  - llama-2-7b-chat (fastest, lower quality)
  - llama-2-13b-chat (balanced)
  - llama-2-70b-chat (best, slower - RECOMMENDED)

Mixtral Model:
  - mixtral-8x7b-32768 (excellent for reasoning, fast)

Gemma Model:
  - gemma-7b-it (new, good balance)
```

**For your use case:** Use `llama-2-70b-chat` or `mixtral-8x7b-32768`
- Both are fast enough for real-time eligibility checks
- Both have strong instruction following (important for structured output)
- Llama-2-70B better for evidence verification
- Mixtral better for multi-hop reasoning

---



```yaml
VCS: GitHub
CI: GitHub Actions
Container Registry: GitHub Container Registry
Artifact Storage: GitHub Packages
```

---

## Implementation Approach

### Development Workflow

1. **Feature Development**
   - Create feature branch from `develop`
   - Implement feature with tests
   - Create pull request
   - Code review (minimum 1 approval)
   - Merge to `develop`

2. **Integration Testing**
   - All tests pass in CI
   - Automated linting passes
   - Type checking passes

3. **Staging Deployment**
   - Merge `develop` → `staging` branch
   - Deploy to staging environment
   - QA testing
   - Performance testing

4. **Production Deployment**
   - Create release from `develop` → `main`
   - Version bump (semantic versioning)
   - Deploy to production
   - Smoke tests

### Code Quality Standards

**Python Backend:**
```yaml
Linting: pylint, flake8
Formatting: black, isort
Type Checking: mypy
Security: bandit
Testing: pytest (target 80%+ coverage)
```

**TypeScript Frontend:**
```yaml
Linting: ESLint
Formatting: Prettier
Type Checking: TypeScript strict mode
Testing: Vitest (target 75%+ coverage)
```

### API Design Principles

- RESTful endpoints where applicable
- Consistent error responses (RFC 7807)
- Request/response validation with Pydantic
- Pagination for list endpoints
- API versioning (/api/v1/)
- Rate limiting per user/IP

**Error Response Format:**
```json
{
  "type": "validation_error",
  "title": "Invalid Input",
  "status": 422,
  "detail": "Student CGPA must be between 0 and 10",
  "instance": "/api/v1/students",
  "errors": [
    {
      "field": "cgpa",
      "message": "Must be between 0 and 10"
    }
  ]
}
```

### Database Migration Strategy

- Alembic for version control
- One migration per feature
- Reversible migrations where possible
- Data migrations in separate files
- Schema changes backward compatible

**Migration Naming:**
```
{seq:04d}_{description_in_snake_case}.py

Example:
0001_initial_schema.py
0002_create_students_table.py
0003_add_cgpa_to_students.py
0004_create_document_chunks_table.py
```

### Testing Strategy

**Unit Tests:**
- Service layer logic
- Utility functions
- Edge cases

**Integration Tests:**
- Database queries
- API endpoints
- External service integration

**E2E Tests:**
- Critical user workflows
- Cross-component interactions

**Test Pyramid:**
```
        E2E (10%)
       /        \
     IT (30%)
    /    \
  Unit (60%)
```


---

## Git Strategy & Conventions

### Branch Naming Strategy

**Branch Types:**

```
main/
├── main (production-ready code)
├── develop (integration branch)
├── staging (staging environment)
│
├── feature/ (new features)
│  ├── feature/user-authentication
│  ├── feature/document-upload
│  ├── feature/eligibility-engine
│
├── bugfix/ (bug fixes)
│  ├── bugfix/fix-chunk-embedding-error
│  ├── bugfix/invalid-session-token
│
├── hotfix/ (critical production fixes)
│  ├── hotfix/csrf-vulnerability
│  ├── hotfix/db-connection-leak
│
├── chore/ (maintenance, dependencies)
│  ├── chore/update-dependencies
│  ├── chore/refactor-auth-service
│
├── docs/ (documentation)
│  ├── docs/api-documentation
│  ├── docs/deployment-guide
│
└── test/ (testing & experimental)
   ├── test/performance-benchmarks
   ├── test/rag-evaluation
```

**Branch Naming Rules:**
- Lowercase with hyphens: `feature/user-profile-management`
- No spaces or special characters
- Descriptive and concise (max 50 chars after prefix)
- Reference issue number if applicable: `feature/CAI-42-user-profile`

**Hierarchy:**
```
main (production)
  ↑ (merge via PR)
staging (staging env)
  ↑ (merge via PR)
develop (integration)
  ↑ (merge via PR)
feature/*, bugfix/*, hotfix/* (work branches)
```

### Commit Message Convention

**Format:** Conventional Commits (Angular style)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat:` New feature
- `fix:` Bug fix
- `refactor:` Code refactoring (no functional change)
- `perf:` Performance improvement
- `test:` Add/update tests
- `docs:` Documentation changes
- `chore:` Dependencies, build tools, etc.
- `ci:` CI/CD configuration
- `style:` Code style (formatting, missing semicolons, etc.)

**Scopes:**
- `auth:` Authentication module
- `document:` Document processing
- `rag:` RAG pipeline
- `api:` API layer
- `db:` Database/schema
- `ui:` Frontend components
- `infra:` Infrastructure/deployment
- `test:` Testing utilities

**Subject Rules:**
- Imperative mood ("add", not "added" or "adds")
- First letter lowercase
- No period at end
- Max 50 characters
- Concise, specific, meaningful

**Body Rules:**
- Explain *what* and *why*, not *how*
- Wrap at 72 characters
- Separate from subject by blank line
- Optional but recommended for non-trivial changes

**Footer Rules:**
- Reference issues: `Closes #123`
- Breaking changes: `BREAKING CHANGE: description`
- Co-authors: `Co-authored-by: Name <email>`

**Examples:**

Good:
```
feat(eligibility): implement cross-document eligibility reasoning

Add multi-hop RAG for eligibility determination. Students now
see eligibility status pulled from multiple documents (placement
policy + TCS notice + student profile).

- Implement EligibilityEngine service
- Add cross-document query routing
- Create evidence linking mechanism
- Add integration tests

Closes #42
```

Good:
```
fix(rag): handle empty vector search results

Previously, when pgvector returned no results, the system would
crash with KeyError. Now gracefully falls back to BM25 search.

Closes #156
```

Good:
```
refactor(db): simplify student_actions query logic

Reduce N+1 queries in student feed endpoint by using
SQLAlchemy relationship eager loading.

Performance: 45% faster on student dashboard.
```

Bad:
```
updated code
Fix stuff
WIP: eligibility
TODO: implement this later
```

### Pull Request Workflow

**1. Create Feature Branch**
```bash
git checkout develop
git pull origin develop
git checkout -b feature/user-authentication
```

**2. Regular Commits**
```bash
git add src/services/auth.py
git commit -m "feat(auth): implement JWT token generation"

git add tests/test_auth.py
git commit -m "test(auth): add JWT validation tests"
```

**3. Keep Branch Updated**
```bash
git fetch origin
git rebase origin/develop  # Or merge for long-running branches
```

**4. Push & Create PR**
```bash
git push -u origin feature/user-authentication
# Create PR on GitHub with template
```

**PR Title Format:**
```
[SCOPE] Short description (max 50 chars after scope)

Examples:
[auth] Implement JWT token generation
[rag] Add cross-document query routing
[ui] Create student action feed component
```

**PR Description Template:**
```markdown
## Description
Brief summary of what this PR does.

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Refactoring
- [ ] Performance improvement
- [ ] Documentation

## Changes Made
- Implemented JWT authentication
- Added token validation middleware
- Created user profile endpoints

## Testing Done
- [ ] Unit tests added
- [ ] Integration tests added
- [ ] Manual testing completed

Test Coverage: 85%

## How to Test
```bash
pytest tests/test_auth.py -v
```

## Checklist
- [x] Code follows style guidelines
- [x] Self-review completed
- [x] Comments added for complex logic
- [x] Documentation updated
- [x] Tests added/updated
- [x] No breaking changes

## Related Issues
Closes #42
```

**5. Code Review Process**
- Minimum 1 approval required
- CI/CD checks must pass
- All conversations resolved
- Merge with squash or rebase (avoid merge commits)

**6. Merge Strategy**

Preferred: **Squash Merge** (feature → develop)
```bash
# Keeps main branch clean with one commit per feature
git merge --squash feature/user-authentication
git commit -m "feat(auth): implement user authentication"
```

Develop → Staging/Main: **Regular Merge**
```bash
# Preserves history for integration branches
git merge develop
```

### Release Process

**Versioning:** Semantic Versioning (MAJOR.MINOR.PATCH)

**Release Branch:**
```bash
git checkout -b release/v1.0.0 develop

# Bump versions in package.json, pyproject.toml, docker image tags
npm version minor
git commit -m "chore: bump version to 1.1.0"

# Back-merge to main
git checkout main
git merge --no-ff release/v1.0.0 -m "chore: merge release v1.1.0 to main"
git tag -a v1.1.0 -m "Release version 1.1.0"

# Back-merge to develop
git checkout develop
git merge --no-ff release/v1.0.0 -m "chore: merge release v1.1.0 back to develop"

git push origin main develop --tags
```

### Git Configuration

**.gitignore (Python Backend):**
```
# Virtual environments
venv/
env/
.venv/

# Python
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
build/
develop-eggs/
dist/
downloads/
eggs/
.eggs/
lib/
lib64/
parts/
sdist/
var/
wheels/
*.egg-info/
.installed.cfg
*.egg

# Testing
.pytest_cache/
.coverage
htmlcov/
.tox/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Environment
.env
.env.local
.env.*.local

# Logs
logs/
*.log

# Database
*.db
*.sqlite

# Cache
.cache/
```

**.gitignore (React Frontend):**
```
# Dependencies
node_modules/
npm-debug.log
yarn-error.log

# Production
build/
dist/
.next/

# Misc
.DS_Store
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# Testing
.coverage
```

**.git/config (Local):**
```ini
[user]
    name = Your Name
    email = your.email@university.edu

[pull]
    rebase = true  # Always rebase when pulling

[rebase]
    autoStash = true  # Auto stash before rebase

[merge]
    ff = only  # Only fast-forward merges

[commit]
    template = .gitmessage  # Commit message template
```

**Setup Commit Message Template:**
```bash
cat > .gitmessage << 'EOF'
# <type>(<scope>): <subject>
#
# <body>
#
# <footer>
#
# Types: feat, fix, refactor, perf, test, docs, chore, ci, style
# Scopes: auth, document, rag, api, db, ui, infra, test
EOF

git config --local commit.template .gitmessage
```

---

## Development Best Practices

### Code Organization

**Backend Structure:**
```
backend/
├── app/
│  ├── __init__.py
│  ├── main.py                 # FastAPI application
│  ├── config.py               # Configuration management
│  ├── dependencies.py         # Dependency injection
│  │
│  ├── api/
│  │  ├── __init__.py
│  │  ├── v1/
│  │  │  ├── __init__.py
│  │  │  ├── routes/
│  │  │  │  ├── __init__.py
│  │  │  │  ├── auth.py
│  │  │  │  ├── documents.py
│  │  │  │  ├── students.py
│  │  │  │  ├── actions.py
│  │  │  │  └── rag.py
│  │  │  └── schemas/
│  │  │     ├── __init__.py
│  │  │     ├── auth.py
│  │  │     ├── student.py
│  │  │     └── action.py
│  │
│  ├── models/
│  │  ├── __init__.py
│  │  ├── user.py
│  │  ├── student.py
│  │  ├── document.py
│  │  ├── chunk.py
│  │  └── action.py
│  │
│  ├── services/
│  │  ├── __init__.py
│  │  ├── auth.py
│  │  ├── document_processor.py
│  │  ├── embedding.py
│  │  ├── rag.py
│  │  ├── eligibility.py
│  │  └── notification.py
│  │
│  ├── repositories/
│  │  ├── __init__.py
│  │  ├── student_repo.py
│  │  ├── document_repo.py
│  │  ├── action_repo.py
│  │  └── chunk_repo.py
│  │
│  ├── utils/
│  │  ├── __init__.py
│  │  ├── logger.py
│  │  ├── validators.py
│  │  └── pdf_utils.py
│  │
│  ├── jobs/
│  │  ├── __init__.py
│  │  ├── document_processing.py
│  │  ├── embedding_generation.py
│  │  └── notification_sender.py
│  │
│  ├── middleware/
│  │  ├── __init__.py
│  │  ├── auth.py
│  │  ├── cors.py
│  │  └── error_handler.py
│  │
│  └── db/
│     ├── __init__.py
│     ├── session.py
│     ├── base.py
│     └── migrations/
│        └── alembic.ini
│
├── tests/
│  ├── __init__.py
│  ├── conftest.py
│  ├── test_auth.py
│  ├── test_documents.py
│  ├── test_rag.py
│  └── integration/
│     └── test_eligibility_flow.py
│
├── requirements.txt
├── pyproject.toml
├── Dockerfile
├── docker-compose.yml
└── README.md
```

**Frontend Structure:**
```
frontend/
├── src/
│  ├── main.tsx
│  ├── App.tsx
│  ├── index.css
│  │
│  ├── components/
│  │  ├── common/
│  │  │  ├── Header.tsx
│  │  │  ├── Sidebar.tsx
│  │  │  ├── Footer.tsx
│  │  │  └── Loading.tsx
│  │  ├── auth/
│  │  │  ├── LoginForm.tsx
│  │  │  └── SignupForm.tsx
│  │  ├── dashboard/
│  │  │  ├── StudentDashboard.tsx
│  │  │  ├── ActionFeed.tsx
│  │  │  └── ActionCard.tsx
│  │  ├── actions/
│  │  │  ├── ActionDetail.tsx
│  │  │  └── EvidencePanel.tsx
│  │  └── search/
│  │     ├── SearchBar.tsx
│  │     └── SearchResults.tsx
│  │
│  ├── pages/
│  │  ├── HomePage.tsx
│  │  ├── LoginPage.tsx
│  │  ├── DashboardPage.tsx
│  │  ├── ActionDetailPage.tsx
│  │  └── NotFoundPage.tsx
│  │
│  ├── hooks/
│  │  ├── useAuth.ts
│  │  ├── useQuery.ts
│  │  ├── useFetch.ts
│  │  └── useNotifications.ts
│  │
│  ├── services/
│  │  ├── api.ts
│  │  ├── authService.ts
│  │  ├── documentService.ts
│  │  └── ragService.ts
│  │
│  ├── store/
│  │  ├── auth.ts
│  │  ├── notifications.ts
│  │  └── ui.ts
│  │
│  ├── types/
│  │  ├── index.ts
│  │  ├── api.ts
│  │  └── models.ts
│  │
│  ├── utils/
│  │  ├── formatters.ts
│  │  ├── validators.ts
│  │  └── constants.ts
│  │
│  └── styles/
│     └── globals.css
│
├── tests/
│  ├── components/
│  │  └── ActionCard.test.tsx
│  ├── hooks/
│  │  └── useAuth.test.ts
│  └── services/
│     └── authService.test.ts
│
├── index.html
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── package.json
└── README.md
```

### Python Best Practices

**Type Hints:**
```python
from typing import List, Optional, Dict, Tuple
from pydantic import BaseModel

class StudentProfile(BaseModel):
    id: str
    name: str
    cgpa: float
    backlogs: int = 0
    
def get_eligible_actions(
    student: StudentProfile,
    actions: List[Action]
) -> List[EligibleAction]:
    """Determine which actions student is eligible for."""
    pass
```

**Error Handling:**
```python
from fastapi import HTTPException, status

class DocumentNotFoundError(Exception):
    """Raised when document is not found."""
    pass

def get_document(doc_id: str) -> Document:
    doc = db.query(Document).filter_by(id=doc_id).first()
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Document {doc_id} not found"
        )
    return doc
```

**Logging:**
```python
import logging

logger = logging.getLogger(__name__)

def process_document(doc_id: str) -> None:
    logger.info(f"Starting document processing for {doc_id}")
    try:
        # Process document
        logger.debug(f"Document {doc_id} parsed successfully")
    except Exception as e:
        logger.error(f"Failed to process document {doc_id}", exc_info=True)
        raise
```

### TypeScript Best Practices

**Type Safety:**
```typescript
interface StudentProfile {
  id: string;
  name: string;
  cgpa: number;
  backlogs: number;
}

interface EligibilityResult {
  status: 'eligible' | 'not_eligible' | 'maybe';
  reason: string;
  confidence: number;
}

function determineEligibility(
  student: StudentProfile,
  action: Action
): EligibilityResult {
  // Implementation
}
```

**Error Handling:**
```typescript
try {
  const response = await fetch('/api/v1/actions');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return await response.json();
} catch (error) {
  console.error('Failed to fetch actions:', error);
  throw error;
}
```

### Testing Best Practices

**Unit Test Example (Python):**
```python
import pytest
from app.services.eligibility import EligibilityEngine

@pytest.fixture
def eligibility_engine():
    return EligibilityEngine()

def test_cgpa_eligibility_check(eligibility_engine):
    """Test CGPA eligibility determination."""
    student = StudentProfile(cgpa=8.5)
    requirement = {"min_cgpa": 7.0}
    
    result = eligibility_engine.check_cgpa(student, requirement)
    
    assert result is True

def test_insufficient_cgpa(eligibility_engine):
    """Test when student CGPA below requirement."""
    student = StudentProfile(cgpa=6.5)
    requirement = {"min_cgpa": 7.0}
    
    result = eligibility_engine.check_cgpa(student, requirement)
    
    assert result is False
```

**Integration Test Example:**
```python
@pytest.mark.asyncio
async def test_eligibility_flow(client, db_session):
    """Test complete eligibility determination flow."""
    # Setup
    student = await create_test_student(db_session)
    action = await create_test_action(db_session)
    
    # Execute
    response = await client.post(
        "/api/v1/check-eligibility",
        json={"student_id": str(student.id), "action_id": str(action.id)}
    )
    
    # Assert
    assert response.status_code == 200
    assert response.json()["eligible"] is True
```

### Security Best Practices

- **Authentication:** JWT with secure token storage
- **Authorization:** Role-based access control (RBAC)
- **Input Validation:** Pydantic/Zod schemas
- **SQL Injection Prevention:** Parameterized queries (SQLAlchemy ORM)
- **CSRF Protection:** CSRF tokens for state-changing operations
- **Rate Limiting:** Throttle API endpoints
- **Secrets Management:** Environment variables, never in code
- **HTTPS Only:** All API communication encrypted
- **CORS:** Restrict to known domains
- **Data Sanitization:** HTML escaping for user-generated content

---

## Risk Management

### Identified Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|-----------|
| LLM hallucinations in eligibility | High | High | Evidence verification, claim validation |
| Performance degradation at scale | Medium | High | Caching, indexing, load testing |
| Data privacy concerns | Medium | High | GDPR compliance, encryption, audit logs |
| RAG retrieval failures | Medium | Medium | BM25 fallback, error handling, monitoring |
| PDF parsing edge cases | Medium | Medium | Docling + OCR, manual review workflow |
| Student data quality issues | High | Medium | Profile validation, missing data detection |
| Third-party service failures (LLM) | Low | High | Fallback responses, graceful degradation |

### Mitigation Strategies

1. **Hallucination Detection**
   - Evidence verification pipeline
   - Claim entailment checking
   - Manual review for low-confidence claims
   - User feedback loop

2. **Performance**
   - Implement Redis caching
   - Database query optimization
   - API rate limiting
   - Load testing & stress testing
   - CDN for static assets

3. **Data Privacy**
   - Encrypt sensitive data at rest
   - HTTPS for all communications
   - Audit logging for data access
   - Data retention policies
   - GDPR compliance checklist

4. **Error Resilience**
   - Comprehensive logging
   - Monitoring & alerting
   - Graceful error handling
   - Fallback mechanisms
   - Circuit breakers for external services

5. **Quality Assurance**
   - RAGAS framework for RAG evaluation
   - Regular accuracy audits
   - User acceptance testing
   - Beta program for new features

---

## Success Criteria

### Technical Metrics

- ✅ 85%+ retrieval accuracy on test queries
- ✅ 80%+ action extraction accuracy
- ✅ 90%+ eligibility determination accuracy
- ✅ <2s average response time
- ✅ 99% reduction in hallucinated claims (vs baseline)
- ✅ 80%+ code coverage
- ✅ Zero critical security vulnerabilities
- ✅ 99.5% uptime SLA

### Business Metrics

- ✅ 80%+ student adoption
- ✅ 85%+ student satisfaction
- ✅ 50% reduction in advisor/staff inquiries
- ✅ 70% faster student action completion time
- ✅ Cost efficiency: <$0.1 per student per month

---

## Next Steps

1. **Week 1:** Team formation, environment setup
2. **Week 2:** Begin Phase 1 Sprint 1
3. **Week 4:** First demo with auth + document upload
4. **Week 8:** MVP with basic eligibility determination
5. **Week 20:** Production deployment

---

## Appendices

### A. Development Environment Setup

```bash
# Clone repository
git clone https://github.com/your-org/campus-action-ai.git
cd campus-action-ai

# Setup backend
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env

# Setup database
alembic upgrade head

# Setup frontend
cd ../frontend
npm install
npm run dev

# Start services with Docker Compose
docker-compose up
```

### B. Useful Commands

```bash
# Run tests
pytest tests/ -v --cov=app

# Format code
black app/ tests/
isort app/ tests/
mypy app/

# Database migrations
alembic revision --autogenerate -m "description"
alembic upgrade head

# Frontend development
npm run dev
npm run lint
npm run test

# Docker
docker-compose up -d
docker-compose logs -f
docker-compose down
```

### C. Resources & References

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy ORM](https://docs.sqlalchemy.org/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Sentence Transformers](https://www.sbert.net/)
- [RAGAS Framework](https://github.com/explodinggradients/ragas)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)

---

**Document Version:** 1.0  
**Last Updated:** July 28, 2026  
**Maintained By:** Project Leads
