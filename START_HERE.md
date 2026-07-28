# 🚀 START HERE - Campus Action AI

**Welcome to Campus Action AI!** This is your one-stop guide to get started.

---

## ⚡ 2-Minute Quick Start

```bash
# 1. Navigate to project
cd ~/Projects/Campus_Action_AI

# 2. Run setup script
./setup.sh

# 3. Open in browser
# Frontend:  http://localhost:5173
# Docs:      http://localhost:8000/docs
```

**Done!** Services are running.

---

## 🔑 Important: Add Groq API Key

The system uses **Groq API for AI operations**. You need a free API key:

### Get API Key (2 minutes)
1. Go to https://console.groq.com
2. Click "Sign up" or "Sign in"
3. Copy your API key
4. Edit `backend/.env` file:
   ```
   GROQ_API_KEY=gsk_your_key_here_from_console_groq_com
   ```
5. Restart backend:
   ```bash
   docker-compose restart backend
   ```

**Cost:** FREE tier includes 30 requests/minute (plenty for development)

---

## 🎯 What's Ready to Use

### ✅ Working Right Now
- Backend API running at http://localhost:8000
- Frontend React app at http://localhost:5173
- PostgreSQL database + pgvector
- Redis cache
- Auto-generated API docs at http://localhost:8000/docs

### 🛠️ Services Running
- **Backend:** FastAPI (Python)
- **Frontend:** React (TypeScript)
- **Database:** PostgreSQL with pgvector
- **Cache:** Redis
- **LLM:** Groq API (free tier)

### ✅ Code Structure Ready
- Database models (all 10 tables)
- Authentication service (ready for Sprint 1-2)
- LLM service (all methods implemented)
- Clean project organization

---

## 🎓 What to Read

**Pick based on your role:**

### For Frontend Developers
1. `README.md` - Overview
2. `frontend/` directory - Code structure
3. `QUICK_REFERENCE.md` - Common commands

### For Backend Developers
1. `README.md` - Overview
2. `IMPLEMENTATION_GUIDE.md` - Technical deep dive
3. `backend/` directory - Code structure

### For Project Managers
1. `PROJECT_PLAN.md` - Complete specifications
2. `SPRINT_1_1_COMPLETE.md` - What was built
3. `QUICK_REFERENCE.md` - Status updates

### For DevOps Engineers
1. `docker-compose.yml` - Infrastructure
2. `.github/workflows/ci.yml` - CI/CD pipeline
3. `IMPLEMENTATION_GUIDE.md` - Deployment section

---

## 📊 Current Project Status

### Phase 1: Foundation (Weeks 1-6)
- **Sprint 1-1:** ✅ COMPLETE (You are here)
  - Project setup done
  - Database models created
  - Backend skeleton ready
  - Frontend started
  - Docker configured
  
- **Sprint 1-2:** Next (Week 2)
  - User authentication
  - Student profiles
  - Login/signup pages

- **Sprints 1-3 to 1-6:** Later (Weeks 3-6)
  - Document management
  - RAG pipeline
  - Student feed
  - Admin features

---

## 🔧 Common Tasks

### Start Development
```bash
cd ~/Projects/Campus_Action_AI
docker-compose up --build
```

### Stop Development
```bash
docker-compose down
```

### Run Backend Tests
```bash
cd backend
pytest
```

### Run Frontend Linting
```bash
cd frontend
npm run lint
```

### View API Documentation
```
http://localhost:8000/docs
```

### Check Service Status
```bash
docker-compose ps
```

### View Logs
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
```

---

## 🎯 What to Do Next

### Option 1: Just Get Familiar
```bash
1. Run ./setup.sh
2. Open http://localhost:5173
3. Click around
4. Explore http://localhost:8000/docs
```

### Option 2: Start Developing
```bash
1. Run ./setup.sh
2. Pick a task from Sprint 1-2
3. Start implementing
4. Run tests frequently
```

### Option 3: Set Up Your Editor
```bash
1. Open project in VS Code or PyCharm
2. Set up Python interpreter
3. Install backend dependencies
4. Install frontend packages
5. Run locally instead of Docker
```

---

## 📱 Quick Links

| Resource | URL |
|----------|-----|
| Frontend | http://localhost:5173 |
| Backend | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| Groq Console | https://console.groq.com |
| FastAPI Docs | https://fastapi.tiangolo.com |
| React Docs | https://react.dev |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

---

## ❓ Common Questions

### Q: What do I do after ./setup.sh?
**A:** Services start automatically. Just open http://localhost:5173

### Q: Where's my Groq API key?
**A:** Get free one at https://console.groq.com, add to backend/.env

### Q: How do I modify code?
**A:** Edit files in `backend/app/` or `frontend/src/`. Changes auto-reload.

### Q: Where are my databases?
**A:** PostgreSQL on port 5432, Redis on 6379 (both in Docker)

### Q: How do I see what's not working?
**A:** Check `docker-compose logs backend` or `docker-compose logs frontend`

### Q: Can I run without Docker?
**A:** Yes, locally with `pip install` + npm, but Docker is easier.

---

## 🚨 If Something's Wrong

### Services Won't Start
```bash
# Reset everything
docker-compose down -v
docker-compose up --build
```

### Database Connection Error
```bash
# Check if postgres is running
docker-compose ps

# Restart database
docker-compose restart postgres
```

### Frontend Not Loading
```bash
# Check if frontend is running
docker-compose ps frontend

# View logs
docker-compose logs frontend

# Restart
docker-compose restart frontend
```

### Groq API Not Working
```bash
# 1. Check your API key
cat backend/.env | grep GROQ_API_KEY

# 2. Make sure it starts with "gsk_"
# 3. Get a new one from https://console.groq.com
# 4. Update backend/.env
# 5. Restart backend
docker-compose restart backend
```

---

## 📚 Project Documentation Structure

```
Campus_Action_AI/
├── README.md                    ← Start here for overview
├── START_HERE.md               ← You are here
├── QUICK_REFERENCE.md          ← Common commands
├── IMPLEMENTATION_GUIDE.md     ← Technical details
├── PROJECT_PLAN.md             ← Full specifications
├── SPRINT_1_1_COMPLETE.md      ← What's done
├── GROQ_INTEGRATION_GUIDE.md   ← LLM setup
└── building_plan.md            ← Additional guidelines
```

---

## 🎓 Learning Path

### Day 1: Get Familiar
- [ ] Run `./setup.sh`
- [ ] Open browser to http://localhost:5173
- [ ] Visit API docs at http://localhost:8000/docs
- [ ] Read README.md

### Day 2: Understand Architecture
- [ ] Read IMPLEMENTATION_GUIDE.md
- [ ] Explore backend/app/ structure
- [ ] Explore frontend/src/ structure
- [ ] Check database schema in IMPLEMENTATION_GUIDE.md

### Day 3: First Task
- [ ] Pick a task from Sprint 1-2
- [ ] Create a feature branch: `git checkout -b feature/name`
- [ ] Start implementing
- [ ] Run tests: `pytest` (backend) or `npm run lint` (frontend)
- [ ] Submit pull request

---

## 💡 Pro Tips

1. **Always read the error message** - It usually tells you exactly what's wrong
2. **Docker is your friend** - One command to run everything
3. **Check logs frequently** - `docker-compose logs -f` is very helpful
4. **API docs are auto-generated** - http://localhost:8000/docs
5. **Get Groq API key early** - Without it, LLM features won't work
6. **Use feature branches** - Never commit to main
7. **Run tests before pushing** - `pytest` + `npm run lint`

---

## ⏱️ Time Estimates

| Task | Time |
|------|------|
| Read this file | 5 min |
| Run setup.sh | 5 min |
| Verify everything works | 5 min |
| Get Groq API key | 2 min |
| Read README.md | 10 min |
| **Total to be productive** | **27 min** |

---

## 🎯 Success Criteria for First 30 Minutes

- [ ] `./setup.sh` runs without errors
- [ ] Frontend loads at http://localhost:5173
- [ ] API docs visible at http://localhost:8000/docs
- [ ] `docker-compose ps` shows all services running
- [ ] You have a Groq API key in backend/.env

If all ✅, **you're ready to develop!**

---

## 📞 Getting Help

1. **Check docs** - README.md, IMPLEMENTATION_GUIDE.md
2. **Check logs** - `docker-compose logs -f`
3. **Search code** - grep the error message in the codebase
4. **Google it** - Specific error + technology (e.g., "PostgreSQL connection refused")
5. **Reset** - `docker-compose down -v && docker-compose up --build`

---

## 🚀 Ready to Get Started?

```bash
cd ~/Projects/Campus_Action_AI
./setup.sh
```

Then:
- 🎨 Frontend: http://localhost:5173
- 📚 Docs: http://localhost:8000/docs
- 🐍 Backend: http://localhost:8000

**Welcome to Campus Action AI!** 🎉

---

**Last Updated:** July 28, 2026  
**Status:** Phase 1, Sprint 1 - Complete ✅  
**Ready for:** Development & Sprint 1-2
