🎓 Project: CampusAction AI
Problem

Students receive information through PDFs, circulars, emails, portals, placement notices, exam notices, WhatsApp groups, etc.

A notice might be 5–15 pages long, while the student really needs to know:

Does this apply to me? What do I need to do? What is the deadline? What documents are required?

Your system converts notices into personalized, evidence-backed actions.

Example

College uploads:

TCS_Campus_Recruitment_2026.pdf

Instead of summarizing it, the engine extracts:

TCS CAMPUS RECRUITMENT

Eligibility
• B.Tech CSE/IT
• Minimum CGPA: 7.0
• No active backlogs
• Batch: 2027

Registration deadline
• August 12, 2026

Required
• Resume
• College ID
• Latest marksheet

Process
Registration → Aptitude Test → Technical Interview → HR

But that's only extraction.

The interesting part starts when the system has a student's profile:

Course: B.Tech CSE
Batch: 2027
CGPA: 8.1
Active backlogs: 0

The engine determines:

🟢 YOU ARE ELIGIBLE

Why?

✓ B.Tech CSE accepted
✓ 8.1 CGPA > required 7.0
✓ No active backlogs
✓ 2027 batch accepted

ACTION REQUIRED

Register for TCS Campus Drive

Deadline
12 August 2026

Required documents
□ Resume
□ College ID
□ Latest marksheet

[View Evidence]

That's a much better product than "Chat with college PDFs

Where RAG comes in

Build a university knowledge base rather than processing each notice independently.

It might contain:

Placement notices
Exam circulars
Academic regulations
Fee notices
Scholarship notices
Attendance policies
Internship notices
Timetables
Hostel notices
University regulations
Student handbook
Previous notices

Every document goes through:

PDF
 ↓
Parsing / OCR
 ↓
Layout understanding
 ↓
Section detection
 ↓
Semantic chunking
 ↓
Metadata extraction
 ↓
Embeddings
 ↓
Vector DB

Metadata becomes extremely important:

{
  "document_type": "placement",
  "company": "TCS",
  "department": ["CSE", "IT"],
  "batch": 2027,
  "published_date": "2026-07-30",
  "deadline": "2026-08-12",
  "page": 3,
  "section": "Eligibility"
}
The core AI pipeline

When a new notice arrives:

                   NEW NOTICE
                       ↓
                Document Parser
                       ↓
             Notice Classification
                       ↓
             Information Extraction
                       ↓
               Query Generation
                       ↓
             ┌─────────┴─────────┐
             ↓                   ↓
       Vector Search            BM25
             ↓                   ↓
             └─────────┬─────────┘
                       ↓
                  Reranking
                       ↓
            Relevant University
                  Knowledge
                       ↓
                LLM Reasoning
                  ↙         ↘
          Student Profile   Notice
                  ↘         ↙
                Applicability
                    Engine
                       ↓
                Action Extraction
                       ↓
              Evidence Verification
                       ↓
                Student Actions

This allows the system to use more than the uploaded notice.

Suppose a placement notice says:

"Eligibility will follow standard university placement rules."

Where are those rules?

A separate Placement_Policy_2026.pdf.

Basic document extraction fails.

Your RAG system retrieves the relevant section from the placement policy, combines it with the new notice, and determines eligibility.

That's a proper RAG use case.

🔥 Feature 1 — Personalized Notice Feed

Instead of showing every university notice:

YOUR ACTIONS

🔴 Placement
TCS Registration
Due tomorrow
→ Action required

🟠 Examination
Semester VIII Exam Form
Due in 4 days
→ Action required

🟡 Scholarship
Merit Scholarship 2026
You may be eligible
→ Review

🟢 Hostel
Water maintenance notice
→ Information only

The AI separates information from actual required actions.

🔥 Feature 2 — "Does this apply to me?"

This could become one of your central GenAI problems.

Notice requirements
        +
Student profile
        ↓
Requirement extraction
        ↓
Eligibility reasoning
        ↓
Evidence verification
        ↓

ELIGIBLE
NOT ELIGIBLE
MAYBE
INSUFFICIENT INFORMATION

The last two are important.

If the notice requires:

Family income < ₹8 lakh

but the student's profile doesn't contain income information, the LLM must not guess.

Instead:

⚠️ I need one more piece of information.

Is your annual family income below ₹8 lakh?

Then continue the reasoning.

That introduces adaptive GenAI interactions.

🔥 Feature 3 — Action extraction

Have the LLM generate structured output:

{
  "action": "Register for campus drive",
  "deadline": "2026-08-12",
  "mandatory": true,
  "requirements": [
    "Resume",
    "College ID",
    "Latest marksheet"
  ],
  "dependencies": [],
  "source_chunks": ["chunk_128", "chunk_134"]
}

Then your application—not the LLM—controls how that information appears.

🔥 Feature 4 — Cross-document RAG

This will make the project significantly stronger.

Imagine you have:

University Placement Policy
        +
TCS Notice
        +
Updated TCS Notice
        +
Academic Regulations
        +
Student Profile

Question:

"Am I eligible for TCS?"

The system might need information from three sources.

TCS Notice
 ↓
Required CGPA

Placement Policy
 ↓
Backlog restrictions

Academic records
 ↓
Student CGPA/backlogs

       ↓

Final eligibility

That's multi-hop/cross-document RAG.

🔥 Feature 5 — Notice Updates / Contradictions

Imagine:

Notice #1

Registration deadline: August 10

Three days later:

Updated Notice

Registration deadline extended to August 15.

You don't want the RAG system retrieving August 10 later.

Store:

Notice V1
effective: July 25
deadline: Aug 10

       ↓ superseded_by

Notice V2
effective: Aug 8
deadline: Aug 15

Now you've introduced Temporal RAG.

The application can proactively show:

🔔 DEADLINE UPDATED

TCS registration

Previous: August 10
New:      August 15

Source: Updated Placement Circular

That's a fantastic feature to demonstrate.

🔥 Feature 6 — Evidence-backed AI

Every generated action gets:

Why?

Clicking it shows:

Register before August 15.

Evidence

TCS Placement Circular — Page 2

"Eligible students must complete registration
through the placement portal by August 15..."

Your pipeline can verify:

Generated claim
      ↓
Source chunks
      ↓
Entailment / LLM verifier
      ↓
SUPPORTED ✓
PARTIALLY SUPPORTED ⚠
UNSUPPORTED ✕

Unsupported actions shouldn't be shown as facts.

This gives you hallucination detection + grounded generation.

🔥 Feature 7 — Conversational RAG

Then add chat, but don't make it the product.

Students can ask:

"What do I have due this week?"

"Which placements am I eligible for?"

"What documents do I need for TCS?"

"Why am I not eligible for Infosys?"

"Did any exam deadlines change?"

"What happens if I miss exam registration?"

"Show me everything related to Semester VIII exams."

These require different retrieval strategies.

🔥 Feature 8 — Intelligent Query Routing

You could eventually classify queries:

                   Student Query
                         ↓
                    AI Router
                         ↓

        ┌────────────────┼────────────────┐
        ↓                ↓                ↓
     SIMPLE          PERSONALIZED       COMPLEX

"What is the       "Am I eligible?"   "What deadlines
deadline?"                            changed this month?"
        ↓                ↓                ↓
     Simple          Profile +         Multi-query /
      RAG              RAG             Temporal RAG

Now you have Adaptive RAG.



HIGH LEVEL ARCHITECTURE:

                         ┌─────────────────────┐
                         │      React UI       │
                         │ Student/Admin Portal│
                         └──────────┬──────────┘
                                    │
                                 REST API
                                    │
                         ┌──────────▼──────────┐
                         │      FastAPI        │
                         │   Backend / API     │
                         └──────────┬──────────┘
                                    │
          ┌─────────────────────────┼────────────────────────┐
          │                         │                        │
          ▼                         ▼                        ▼
   Authentication             Notice Service          Student Service
          │                         │                        │
          │                         ▼                        │
          │                Document Ingestion               │
          │                         │                        │
          │                  Parse PDF/OCR                  │
          │                         │                        │
          │                  Clean + Structure              │
          │                         │                        │
          │                  Semantic Chunking              │
          │                         │                        │
          │                  Metadata Extraction            │
          │                         │                        │
          │                     Embeddings                  │
          │                         │                        │
          │                         ▼                        │
          │                 ┌──────────────┐                │
          └────────────────►│ PostgreSQL   │◄───────────────┘
                            │ + pgvector   │
                            └───────┬──────┘
                                    │
                         ┌──────────▼──────────┐
                         │    RAG Engine       │
                         │                     │
                         │ Query Understanding │
                         │ Metadata Filtering  │
                         │ Dense Retrieval     │
                         │ BM25                │
                         │ RRF                 │
                         │ Reranking           │
                         │ Context Builder     │
                         └──────────┬──────────┘
                                    │
                              Retrieved Context
                                    │
                         ┌──────────▼──────────┐
                         │     LLM Layer       │
                         │                     │
                         │ Action Extraction   │
                         │ Eligibility         │
                         │ Answer Generation   │
                         │ Claim Verification  │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         Structured Response







INGESTION PIPELINE:

 POST /documents
       ↓
Store original file
       ↓
Create document_version
       ↓
Background ingestion job
       ↓
PDF parsing
       ↓
OCR if necessary
       ↓
Layout detection
       ↓
Text cleaning
       ↓
Section identification
       ↓
Semantic chunking
       ↓
Metadata extraction
       ↓
Generate embeddings
       ↓
Store chunks + vectors
       ↓
Extract candidate actions
       ↓
Retrieve supporting evidence
       ↓
Verify actions
       ↓
Store actions
       ↓
Match against students

RAG ARCHITECTURE:

Question
   ↓
Embedding
   ↓
pgvector
   ↓
Top-K chunks
   ↓
LLM
   ↓
Grounded answer



But don't stop there.

V2:

                   Query
                     ↓
              Query Analyzer
                     ↓
              Query Rewriter
                     ↓
           ┌─────────┴─────────┐
           ↓                   ↓
      Dense Search        Sparse Search
        pgvector              BM25
           │                   │
           └─────────┬─────────┘
                     ↓
                 RRF Fusion
                     ↓
               Top 20 chunks
                     ↓
                  Reranker
                     ↓
                Top 5 chunks
                     ↓
              Context Builder
                     ↓
                    LLM
                     ↓
             Claim Verification
                     ↓
             Grounded Response

That's where the project becomes serious RAG engineering.


TECH STACK:
| Component                 | We'll use                         |                  Cost |
| ------------------------- | --------------------------------- | --------------------: |
| Frontend                  | React + TypeScript + Tailwind CSS |                  Free |
| Backend                   | FastAPI + Python                  |                  Free |
| Database                  | PostgreSQL                        |                  Free |
| Vector search             | pgvector                          |                  Free |
| ORM                       | SQLAlchemy                        |                  Free |
| Migrations                | Alembic                           |                  Free |
| PDF parsing               | PyMuPDF                           |                  Free |
| Advanced document parsing | Docling                           |                  Free |
| OCR                       | Tesseract                         |                  Free |
| Embeddings                | Sentence Transformers / BGE       |            Free/local |
| Vector retrieval          | pgvector                          |                  Free |
| Sparse retrieval          | BM25 / PostgreSQL FTS             |                  Free |
| Reranker                  | BGE Cross-Encoder/Reranker        |            Free/local |
| LLM                       | Open-source model via Ollama      |            Free/local |
| LLM runtime               | Ollama                            |                  Free |
| Cache                     | Redis                             |            Free/local |
| Background jobs           | Celery or Dramatiq                |                  Free |
| RAG evaluation            | RAGAS + custom metrics            |                 Free* |
| Testing                   | pytest                            |                  Free |
| Containers                | Docker                            | Free for our use case |
| Git repository            | GitHub                            |             Free tier |
| CI/CD                     | GitHub Actions                    |      Free-tier limits |
