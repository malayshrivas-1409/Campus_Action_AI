# Campus Action AI

A document-based AI assistant designed to help students find placement information, scholarship eligibility criteria, exam schedules, and other campus-related documents through intelligent document retrieval and conversational AI.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [API Documentation](#api-documentation)
- [Database Setup](#database-setup)
- [Development](#development)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

Campus Action AI is a full-stack web application that uses Retrieval-Augmented Generation (RAG) to help students access placement and scholarship information. The system combines vector search, keyword search (BM25), and LLM-based responses to provide accurate, context-grounded answers from uploaded documents.

### Key Capabilities
- **Document Upload & Management**: Upload and manage PDF documents
- **Hybrid Search**: Vector-based semantic search + BM25 keyword search
- **Conversational AI**: Chat-based interface with conversation history
- **Source Attribution**: Every answer includes citations with document references
- **User Authentication**: Secure login and profile management
- **Document Search**: Full-text and semantic search across documents

## ✨ Features

### For Students
- 📱 Intuitive chat interface for asking questions
- 🔍 Comprehensive document search
- 💬 Conversation history with auto-generated titles
- 📄 View source documents with page references
- 👤 Personalized student profiles with CGPA and batch information
- 🔐 Secure authentication and data isolation

### For Administrators
- 📤 Bulk document upload with categorization
- 📊 Document management dashboard
- 👥 Student profile management
- 🔧 RAG configuration and monitoring
- 📈 Search analytics (future feature)

## 🛠 Tech Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **HTTP Client**: Axios
- **UI Components**: Lucide React, Framer Motion
- **Markdown**: React Markdown

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with AsyncPG
- **ORM**: SQLAlchemy (async)
- **LLM**: Groq API (OpenAI-compatible)
- **Embeddings**: Sentence Transformers (384-dimensional)
- **Vector Search**: pgvector (PostgreSQL extension)
- **Keyword Search**: BM25 (rank_bm25)
- **File Processing**: PyPDF2, pypdf
- **Migrations**: Alembic

### Infrastructure
- **Containerization**: Docker (configured in Dockerfile)
- **Environment**: Linux/macOS/Windows compatible

## 📁 Project Structure

```
Campus_Action_AI/
├── frontend/                          # React TypeScript frontend
│   ├── src/
│   │   ├── pages/                    # Page components
│   │   │   ├── Login.tsx
│   │   │   ├── Signup.tsx
│   │   │   ├── Chat.tsx              # Main chat interface
│   │   │   ├── Dashboard.tsx
│   │   │   ├── DocumentUpload.tsx
│   │   │   ├── DocumentList.tsx
│   │   │   └── Settings.tsx
│   │   ├── components/               # Reusable components
│   │   │   ├── layout/
│   │   │   ├── primitives/
│   │   │   └── ...
│   │   ├── store/                    # Zustand state management
│   │   │   ├── authStore.ts
│   │   │   └── chatStore.ts
│   │   ├── services/                 # API services
│   │   │   └── api.ts
│   │   └── App.tsx
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── backend/                           # FastAPI backend
│   ├── app/
│   │   ├── api/                      # API route handlers
│   │   │   ├── auth.py               # Authentication endpoints
│   │   │   ├── chat.py               # Chat & conversation endpoints
│   │   │   ├── documents.py          # Document upload/retrieval
│   │   │   ├── search.py             # Search endpoints
│   │   │   └── embeddings.py         # Embedding management
│   │   ├── services/                 # Business logic
│   │   │   ├── auth.py               # JWT token generation
│   │   │   ├── rag.py                # RAG pipeline
│   │   │   ├── llm.py                # LLM interactions
│   │   │   ├── embedding.py          # Embedding generation
│   │   │   └── pdf_parser.py         # PDF processing
│   │   ├── models/                   # SQLAlchemy ORM models
│   │   │   ├── user.py
│   │   │   ├── student.py
│   │   │   ├── document.py
│   │   │   ├── conversation.py
│   │   │   └── action.py
│   │   ├── schemas/                  # Pydantic request/response schemas
│   │   │   ├── auth.py
│   │   │   ├── conversation.py
│   │   │   └── search.py
│   │   ├── database.py               # Database connection & session
│   │   ├── config.py                 # Configuration management
│   │   ├── dependencies.py           # Dependency injection
│   │   ├── main.py                   # FastAPI app initialization
│   │   └── logger.py                 # Logging configuration
│   ├── alembic/                      # Database migrations
│   ├── requirements.txt               # Python dependencies
│   ├── .env.example                  # Example environment variables
│   └── Dockerfile
│
├── .kiro/
│   └── docs/                         # Project documentation
│       ├── BUGFIX.md                 # Bug fixes applied
│       ├── IMPLEMENTATION_ROADMAP.md # Development roadmap
│       └── FRONT_FIX.md              # Frontend-specific fixes
│
├── .github/
│   ├── agents/                       # Custom Kiro agents
│   ├── hooks/                        # Automation hooks
│   └── skills/                       # Kiro skills
│
├── docker-compose.yml                # Docker compose configuration
├── README.md                         # This file
└── .gitignore
```

## 📦 Prerequisites

### System Requirements
- **Node.js**: v18+ (for frontend)
- **Python**: 3.10+ (for backend)
- **PostgreSQL**: 14+ with pgvector extension
- **Git**: For version control
- **Docker** (optional): For containerized deployment

### Environment Variables Needed
- `GROQ_API_KEY`: For LLM access
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string (optional)
- `SECRET_KEY`: JWT secret key

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/Campus_Action_AI.git
cd Campus_Action_AI
```

### 2. Backend Setup

#### Install Python Dependencies
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

#### Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

#### Initialize Database
```bash
# Run migrations
alembic upgrade head

# Or use the initialization script if available
python -m app.database
```

### 3. Frontend Setup

#### Install Node Dependencies
```bash
cd frontend
npm install
```

#### Configure Frontend Environment
```bash
cp .env.example .env.local
# Edit .env.local with API URL
```

## ⚙️ Configuration

### Backend Configuration (`backend/.env`)

```env
# App
APP_NAME=Campus Action AI
DEBUG=False
LOG_LEVEL=INFO
ENVIRONMENT=production

# Database
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/campus_ai_db

# Redis
REDIS_URL=redis://localhost:6379/0

# Groq API (LLM)
GROQ_API_KEY=your_groq_api_key_here
GROQ_MODEL=openai/gpt-oss-20b

# JWT
SECRET_KEY=your-secret-key-here
ACCESS_TOKEN_EXPIRE_MINUTES=30

# File Upload
MAX_UPLOAD_SIZE_MB=50
MAX_REQUEST_SIZE=10485760

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Rate Limiting
RATE_LIMIT_ENABLED=True
RATE_LIMIT_REQUESTS=100
RATE_LIMIT_SECONDS=60
```

### Frontend Configuration (`frontend/.env.local`)

```env
VITE_API_URL=http://localhost:8000
```

## 🏃 Running the Application

### Option 1: Local Development

#### Terminal 1 - Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

The application will be available at `http://localhost:5173`

### Option 2: Docker Compose
```bash
docker-compose up -d
```

### Option 3: Production Deployment
```bash
# Build images
docker build -t campus-ai-backend ./backend
docker build -t campus-ai-frontend ./frontend

# Run containers
docker run -d -p 8000:8000 campus-ai-backend
docker run -d -p 5173:5173 campus-ai-frontend
```

## 📡 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login
- `GET /api/v1/auth/me` - Get current user
- `POST /api/v1/auth/refresh` - Refresh access token
- `GET /api/v1/auth/profile-status` - Get profile completion status

### Chat Endpoints
- `POST /api/v1/chat/message` - Send message and get AI response
- `GET /api/v1/chat/conversations` - List all conversations
- `GET /api/v1/chat/conversations/{id}` - Get conversation details
- `DELETE /api/v1/chat/conversations/{id}` - Delete conversation
- `GET /api/v1/chat/conversations/{id}/export` - Export conversation

### Document Endpoints
- `POST /api/v1/documents/upload` - Upload document
- `GET /api/v1/documents` - List documents
- `GET /api/v1/documents/{id}` - Get document details
- `GET /api/v1/documents/{id}/view` - View document chunks
- `DELETE /api/v1/documents/{id}` - Delete document

### Search Endpoints
- `POST /api/v1/search/vector` - Vector similarity search
- `POST /api/v1/search/keyword` - BM25 keyword search
- `GET /api/v1/search/info` - Search service info

### RAG Endpoints
- `POST /api/v1/rag/retrieve` - Retrieve relevant documents
- `POST /api/v1/rag/query` - Query with RAG pipeline
- `GET /api/v1/rag/status` - RAG service status

## 🗄️ Database Setup

### PostgreSQL with pgvector

#### 1. Create Database
```sql
CREATE DATABASE campus_ai_db;
```

#### 2. Enable pgvector Extension
```sql
\c campus_ai_db
CREATE EXTENSION IF NOT EXISTS vector;
```

#### 3. Run Migrations
```bash
cd backend
alembic upgrade head
```

### Database Schema Overview

**Users Table**
- id (UUID)
- email (String, unique)
- name (String)
- password_hash (String)
- role (String: 'student', 'admin')
- is_active (Boolean)
- created_at, updated_at (DateTime)

**Students Table**
- id (UUID)
- user_id (FK to Users)
- roll_number (String)
- department (String)
- batch (Integer)
- cgpa (Float)
- backlogs (Integer)

**Documents Table**
- id (UUID)
- title (String)
- document_type (String)
- uploaded_by (FK to Users)
- is_active (Boolean)
- created_at, updated_at (DateTime)

**DocumentChunks Table**
- id (UUID)
- document_version_id (FK)
- content (Text)
- embedding (Vector, 384D)
- page_number (Integer)
- section (String)

**Conversations Table**
- id (UUID)
- user_id (FK to Users)
- title (String)
- is_active (Boolean)
- created_at, updated_at (DateTime)

**ConversationMessages Table**
- id (UUID)
- conversation_id (FK)
- role (String: 'user', 'assistant')
- content (Text)
- sources (JSON)
- created_at (DateTime)

## 👨‍💻 Development

### Code Organization

**Frontend**
- Components follow the container/presenter pattern
- State management centralized in Zustand stores
- Services handle API communication
- Tailwind CSS for styling with custom theme

**Backend**
- FastAPI with dependency injection
- SQLAlchemy ORM for database access
- Async/await for concurrent operations
- Service layer for business logic
- Pydantic schemas for request/response validation

### Running Tests
```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test
```

### Type Checking
```bash
# Frontend TypeScript check
cd frontend
npx tsc --noEmit

# Backend type checking (if configured)
cd backend
mypy app/
```

### Linting
```bash
# Frontend
cd frontend
npm run lint

# Backend
cd backend
pylint app/
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Error
```
Error: could not connect to server: Connection refused
```
**Solution**: Ensure PostgreSQL is running and connection string is correct in `.env`

#### 2. pgvector Extension Not Found
```
Error: extension "vector" does not exist
```
**Solution**: Install pgvector extension:
```sql
CREATE EXTENSION vector;
```

#### 3. GROQ API Key Error
```
Error: LLM service not configured
```
**Solution**: Set `GROQ_API_KEY` in backend `.env` file

#### 4. Frontend Cannot Connect to Backend
```
Error: Failed to fetch from http://localhost:8000
```
**Solution**: 
- Check backend is running on port 8000
- Verify `VITE_API_URL` in frontend `.env.local`
- Check CORS settings in backend config

#### 5. Token Expiry Issues
- Access tokens expire after 30 minutes (configurable)
- Token refresh happens automatically 5 minutes before expiry
- Manual logout clears token immediately

#### 6. Embedding Generation Fails
```
Error: Embedding dimension mismatch
```
**Solution**: Ensure all documents are re-embedded after model changes
```bash
# Trigger re-embedding
curl -X POST http://localhost:8000/api/v1/embeddings/generate-all
```

## 📚 Documentation

Additional documentation files:
- `.kiro/docs/BUGFIX.md` - Bug fixes and improvements applied
- `.kiro/docs/IMPLEMENTATION_ROADMAP.md` - Development roadmap and phases
- `.kiro/docs/FRONT_FIX.md` - Frontend-specific fixes and enhancements

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

### Development Guidelines
- Follow existing code style and conventions
- Write clear commit messages
- Update documentation for new features
- Test changes locally before submitting PR

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 📞 Support

For issues, questions, or suggestions:
1. Check existing issues on GitHub
2. Create a detailed issue with reproduction steps
3. Contact the development team

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ User authentication
- ✅ Document upload and management
- ✅ RAG-based Q&A
- ✅ Chat interface with history
- ✅ Student profiles

### Phase 2 (Planned)
- Student eligibility checking
- Placement notifications
- Advanced search analytics
- Admin dashboard enhancements

### Phase 3 (Future)
- Mobile application
- Integration with college management systems
- Multi-language support
- Advanced analytics and reporting

## 🙏 Acknowledgments

- Built with [FastAPI](https://fastapi.tiangolo.com/) and [React](https://react.dev/)
- LLM powered by [Groq](https://groq.com/)
- Vector embeddings by [Sentence Transformers](https://www.sbert.net/)
- Vector search using [pgvector](https://github.com/pgvector/pgvector)

---

**Last Updated**: September 2026
**Version**: 1.0.0
