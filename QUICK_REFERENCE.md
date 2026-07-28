# Quick Reference - Campus Action AI

**One-page guide for common tasks**

---

## 🚀 Start Project

```bash
cd ~/Projects/Campus_Action_AI
./setup.sh
# Or manually: docker-compose up --build
```

**Access:**
- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- Docs: http://localhost:8000/docs

---

## 🔑 Get Groq API Key

1. Go to https://console.groq.com
2. Sign up / Login
3. Copy API key
4. Edit `backend/.env`
5. Set `GROQ_API_KEY=gsk_your_key`
6. Restart backend: `docker-compose restart backend`

---

## 📝 Common Commands

### Docker
```bash
# Start all services
docker-compose up --build

# Stop all services
docker-compose down

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Reset everything
docker-compose down -v && docker-compose up --build

# Check status
docker-compose ps
```

### Backend
```bash
# Run locally (with Docker PostgreSQL)
cd backend
pip install -r requirements.txt
export DATABASE_URL=postgresql://campus_user:campus_password@localhost/campus_ai_db
python -m uvicorn app.main:app --reload

# Run tests
pytest

# Format code
black app/
isort app/

# Type check
mypy app/
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Start dev server
npm run build        # Build for production
npm run lint         # Check code
npm run type-check   # TypeScript check
```

---

## 🗄️ Database

### Reset Database
```bash
docker-compose down -v
docker-compose up -d postgres redis
# Wait 10 seconds
docker-compose up -d backend
```

### Connect to PostgreSQL
```bash
psql -h localhost -U campus_user -d campus_ai_db

# Common commands in psql:
# \dt              - Show tables
# SELECT * FROM users;
# \q               - Exit
```

### View pgvector Extension
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
CREATE EXTENSION IF NOT EXISTS vector;
```

---

## 🔍 Testing Endpoints

### Health Check
```bash
curl http://localhost:8000/health
```

### View All Endpoints
```
http://localhost:8000/docs
```

### Test with curl
```bash
# GET with JSON
curl -H "Content-Type: application/json" \
     http://localhost:8000/api/v1/students

# POST with data
curl -X POST \
     -H "Content-Type: application/json" \
     -d '{"name":"John"}' \
     http://localhost:8000/api/v1/students
```

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :8000
lsof -i :5173
lsof -i :5432

# Kill process
kill -9 <PID>
```

### Docker Issues
```bash
# Clean everything
docker-compose down -v
docker system prune -a

# Rebuild
docker-compose up --build
```

### Database Not Connecting
```bash
# Check if postgres is running
docker-compose ps

# View logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

### LLM Service Error
```bash
# Check Groq API key in backend/.env
cat backend/.env | grep GROQ_API_KEY

# Verify key is correct from console.groq.com
# Restart backend
docker-compose restart backend

# Check logs
docker-compose logs backend | grep -i groq
```

---

## 📁 File Locations

| File | Purpose |
|------|---------|
| `backend/.env` | Environment variables |
| `backend/app/main.py` | FastAPI entry point |
| `backend/app/config.py` | Settings |
| `backend/app/database.py` | DB connection |
| `frontend/src/App.tsx` | Main React component |
| `frontend/vite.config.ts` | Vite config |
| `docker-compose.yml` | Container orchestration |
| `README.md` | Full documentation |
| `IMPLEMENTATION_GUIDE.md` | Technical deep dive |

---

## 💾 Adding New Packages

### Python (Backend)
```bash
cd backend
pip install package_name
pip freeze > requirements.txt

# Then rebuild Docker
docker-compose up --build
```

### JavaScript (Frontend)
```bash
cd frontend
npm install package_name
npm run dev  # Test

# Then rebuild Docker
docker-compose up --build
```

---

## 🔄 Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes
git add .
git commit -m "feat: description"

# Push
git push origin feature/your-feature

# Create PR on GitHub
# After review, merge to develop
# Then main for release
```

---

## 📊 Project Structure at a Glance

```
campus_action_ai/
├── backend/          # FastAPI + Python
│   ├── app/          # Application code
│   └── requirements.txt
├── frontend/         # React + TypeScript
│   ├── src/          # Source code
│   └── package.json
├── docker-compose.yml # All services
├── README.md         # Start here
└── IMPLEMENTATION_GUIDE.md
```

---

## 🎯 What's Implemented

✅ **Backend**
- FastAPI with async support
- PostgreSQL + pgvector
- Authentication service
- LLM integration (Groq)
- 10 database models

✅ **Frontend**
- React 18 + TypeScript
- Tailwind CSS
- Vite build tool

✅ **Infrastructure**
- Docker Compose
- Redis cache
- GitHub Actions CI/CD

❌ **Not Yet**
- Authentication endpoints
- Document upload
- Eligibility checking
- Student feed

---

## 📚 Documentation

- `README.md` - Start here
- `IMPLEMENTATION_GUIDE.md` - How it works
- `PROJECT_PLAN.md` - Full specs
- `GROQ_INTEGRATION_GUIDE.md` - LLM details
- `SPRINT_1_1_COMPLETE.md` - What's done
- `/docs` - Auto-generated API docs

---

## 🚨 Important Notes

1. **Get Groq API Key First** - Required for LLM operations
2. **Never commit .env** - Use .env.example instead
3. **Always use feature branches** - Never push to main
4. **Run tests before committing** - `pytest` + `npm run lint`
5. **Docker Compose first** - Easiest way to run everything

---

## 🆘 When Stuck

1. Check logs: `docker-compose logs -f service_name`
2. Read docs: README.md or IMPLEMENTATION_GUIDE.md
3. Search project: `grep -r "error text" .`
4. Restart service: `docker-compose restart service_name`
5. Reset everything: `docker-compose down -v && docker-compose up --build`

---

## ⏱️ Timeline Estimates

| Phase | Duration | Status |
|-------|----------|--------|
| Phase 1: Foundation | 6 weeks | 1/6 complete ✅ |
| Sprint 1-1: Setup | 1 week | ✅ Complete |
| Sprint 1-2: Auth | 1 week | Next 🚧 |
| Sprint 1-3: Docs | 1 week | Later 📅 |
| Sprint 1-4: Vectors | 1 week | Later 📅 |
| Sprint 1-5: RAG | 1 week | Later 📅 |
| Sprint 1-6: Feed | 1 week | Later 📅 |

---

**Last Updated:** July 28, 2026  
**Project Version:** 0.1.0  
**Status:** Foundation Complete ✅
