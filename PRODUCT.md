# Campus Action AI - Product Context

## Product Overview
Campus Action AI is an intelligent notice and action management platform for students. It helps students understand notices, documents, and eligibility requirements by leveraging AI-powered semantic search and document understanding.

## Core Users & Needs
- **Primary Users**: College students (18-25 years old)
- **Core Need**: Find relevant information in university documents (notices, placement notices, scholarship guidelines, exam schedules)
- **Current Pain**: Overwhelming volume of PDFs and notices; difficulty finding what applies to them
- **Solution**: Chat interface to ask questions, semantic search, and automatic eligibility checking

## Product Pillars
1. **Operate** mode - Task-oriented app UI where students complete information tasks
2. **Trustworthy AI** - Always show sources, cite documents, be transparent about reasoning
3. **Effortless Onboarding** - Minimal setup before accessing core features
4. **Mobile-First Consideration** - Support mobile usage for on-campus convenience

## Key User Journeys
1. **Auth Flow**: Signup → Profile Setup (roll number, department, CGPA) → Dashboard
2. **Document Management**: Upload PDFs → View list → Delete old documents
3. **Chat & Research**: Ask question → AI searches documents → Get answer with sources
4. **Discovery**: Search documents → View results → Read relevant sections

## Current Tech Stack
- **Frontend**: React + TypeScript, Tailwind CSS, Zustand (state), React Router
- **Backend**: FastAPI (Python), PostgreSQL with pgvector, Groq LLM (Llama 3.3), BGE embeddings
- **Architecture**: RAG (Retrieval-Augmented Generation) pipeline

## Visual World
- **Era**: Contemporary, modern, educational
- **Palette**: Indigo primary (trust, intelligence), grays (clarity), white (openness)
- **Tone**: Helpful, clear, confidence-building
- **Typography**: System fonts (Segoe UI, Roboto), clear hierarchy
- **Density**: Moderate - plenty of whitespace, not cramped

## Constraints & Boundaries
- No external asset creation budget (use system icons/emojis)
- Must support mobile + desktop equally
- Accessibility baseline: WCAG AA minimum
- Performance: Fast load times for document-heavy operations
- Existing color scheme must be preserved (indigo #6366f1)

## Success Metrics
- Students find answers to document questions in <30 seconds
- Chat feels natural and trustworthy (sources always visible)
- Onboarding completes in <2 minutes
- No "404 blank screens" or missing flows
- Mobile experience is equally capable as desktop
