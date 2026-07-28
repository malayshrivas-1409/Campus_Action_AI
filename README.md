# Campus Action AI

Intelligent Notice Management & Eligibility Engine for students.

**Project Status:** Phase 1, Sprint 1 - Foundation Setup ✅

---

## 🎯 Quick Start

### Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for local development)
- Node.js 18+ (for frontend development)
- Groq API Key (get from [console.groq.com](https://console.groq.com))

### 1. Clone & Setup

```bash
# Copy environment file
cp backend/.env.example backend/.env

# Add your Groq API key
# Edit backend/.env and set GROQ_API_KEY=gsk_your_key_here
```

### 2. Start with Docker Compose

```bash
# Build and start all services
docker-compose up --build

# In another terminal, initialize the database
# (Migrations will run automatically on startup)
```

### 3. Access the Application

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs
- **Database:** localhost:5432 (postgres user)

---

## 🏗️ Project Structure

```
campus_action_ai/
├── backend/                    # FastAPI backend
│   ├── app/
│   │   ├── models/            # SQLAlchemy models
│   │   ├── schemas/           # Pydantic schemas
│   │   ├── services/          # Business logic
│   │   ├── api/               # API routes
│   │   ├── config.py          # Configuration
│   │   ├── database.py        # DB setup
│   │   ├── logger.py          # Logging
│   │   └── main.py            # FastAPI app
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
│
├── frontend/                  # React + TypeScript
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/            # Page components
│   │   ├── services/         # API services
│   │   ├── hooks/            # Custom hooks
│   │   ├── store/            # State management
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── docker-compose.yml         # Local development setup
├── PROJECT_PLAN.md            # Comprehensive project plan
├── GROQ_INTEGRATION_GUIDE.md   # LLM integration details
└── README.md                   # This file
```

---

## 🚀 Development Workflow

### Backend Development

```bash
# Install dependencies
cd backend
pip install -r requirements.txt

# Run locally (with Docker PostgreSQL)
docker-compose up postgres redis -d
python -m uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black app/
isort app/
```

### Frontend Development

```bash
# Install dependencies
cd frontend
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Lint code
npm run lint
```

---

## 🔑 Environment Variables

**Backend (.env):**

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/campus_ai_db

# Groq API
GROQ_API_KEY=gsk_your_api_key_here
GROQ_MODEL=mixtral-8x7b-32768

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App
DEBUG=True
LOG_LEVEL=INFO
ENVIRONMENT=development
```

---

## 📋 API Endpoints

### Health Check

```bash
GET /health
GET /ready
```

### Authentication (Coming in Sprint 1-2)

```bash
POST /api/v1/auth/signup
POST /api/v1/auth/login
POST /api/v1/auth/refresh
```

### Student Management (Coming in Sprint 1-2)

```bash
GET /api/v1/students/{student_id}
PUT /api/v1/students/{student_id}
POST /api/v1/students/profile
```

### Document Management (Coming in Sprint 1-3)

```bash
POST /api/v1/documents/upload
GET /api/v1/documents/{document_id}
GET /api/v1/documents
DELETE /api/v1/documents/{document_id}
```

### RAG Operations (Coming in Sprint 1-5)

```bash
POST /api/v1/rag/query
POST /api/v1/rag/extract-actions
POST /api/v1/rag/check-eligibility
```

---

## 🗄️ Database Schema

**Core Tables:**
- `users` - User accounts
- `students` - Student profiles
- `documents` - Uploaded documents
- `document_versions` - Document versioning
- `document_chunks` - RAG chunks
- `actions` - Extracted actions
- `student_actions` - Student-action mapping
- `notifications` - Student notifications
- `extraction_results` - LLM extraction results
- `audit_logs` - Change tracking

**Extensions:**
- `pgvector` - Vector similarity search
- `uuid-ossp` - UUID generation
- `pg_trgm` - Text similarity

---

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm run test

# Coverage
pytest --cov=app
```

---

## 📊 Project Phases

### ✅ Phase 1: Foundation (Weeks 1-6)
- [x] Project setup with Docker
- [x] Database schema & models
- [x] FastAPI skeleton
- [x] Frontend skeleton
- [ ] Authentication (Sprint 1-2)
- [ ] Document ingestion (Sprint 1-3)
- [ ] Embeddings & vector search (Sprint 1-4)
- [ ] Basic RAG (Sprint 1-5)

### 🚧 Phase 2: Eligibility Engine (Weeks 7-12)
- Action extraction
- Student profile enrichment
- Eligibility reasoning
- Cross-document RAG
- Temporal tracking
- Personalized feed

### 🔄 Phase 3: Advanced Features (Weeks 13-18)
- Evidence-backed AI
- Conversational RAG
- Advanced reranking
- RAG evaluation
- Admin features
- Performance optimization

### 🎬 Phase 4: Production (Weeks 19-20)
- Security audit
- Deployment & monitoring

---

## 🔐 Security Checklist

- [ ] JWT token verification on protected routes
- [ ] Password hashing with bcrypt
- [ ] SQL injection prevention (using SQLAlchemy ORM)
- [ ] CORS properly configured
- [ ] Rate limiting implemented
- [ ] Groq API key in secrets manager (not .env in prod)
- [ ] HTTPS enforced in production
- [ ] Input validation on all endpoints
- [ ] Audit logging enabled

---

## 📈 Performance Targets

- **Retrieval Accuracy:** 80%+ (MVP), 88%+ (Phase 3)
- **Query Response Time:** <2 seconds
- **Eligibility Determination:** <1 second
- **System Uptime:** 99.5% SLA
- **Concurrent Users:** 1000+
- **Hallucination Rate:** <10%

---

## 🐛 Troubleshooting

### Database Connection Error

```bash
# Check PostgreSQL is running
docker-compose ps

# Reset database
docker-compose down -v
docker-compose up --build
```

### Groq API Rate Limit

Groq's free tier: 30 requests/minute
- Implement request queueing for non-urgent operations
- Use caching to reduce API calls
- Upgrade to paid tier for production

### Frontend Not Loading

```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules
npm install
npm run dev
```

---

## 📚 Documentation

- [PROJECT_PLAN.md](./PROJECT_PLAN.md) - Complete project specifications
- [GROQ_INTEGRATION_GUIDE.md](./GROQ_INTEGRATION_GUIDE.md) - LLM setup & best practices
- [building_plan.md](./building_plan.md) - Additional building guidelines

---

## 🤝 Contributing

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Write tests
4. Submit a pull request

---

## 📝 License

Personal Project - Do not redistribute without permission

---

## 🎯 Next Steps

1. ✅ **Done:** Foundation setup complete
2. **Next:** Implement authentication (Sprint 1-2)
3. Build document ingestion pipeline (Sprint 1-3)
4. Set up embeddings & vector search (Sprint 1-4)
5. Implement basic RAG (Sprint 1-5)

**Estimated Timeline:** 6 weeks to MVP

---

**Questions?** Check the project documentation files or refer to the Groq API docs at [console.groq.com/docs](https://console.groq.com/docs)
