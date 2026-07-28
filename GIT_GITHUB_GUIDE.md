# Git & GitHub Setup Guide

**Complete guide for version control and collaboration**

---

## 📋 Prerequisites

1. **Git installed**
   ```bash
   git --version
   # Should show: git version 2.x.x
   
   # If not installed:
   sudo apt-get install git
   ```

2. **GitHub account**
   - Go to https://github.com
   - Sign up (free)
   - Verify email

3. **Git configured locally**
   ```bash
   git config --global user.name "Your Name"
   git config --global user.email "your.email@example.com"
   
   # Verify:
   git config --global user.name
   git config --global user.email
   ```

---

## 🚀 Step 1: Initialize Git Locally (One-time)

You're already in the project. Let's initialize Git:

```bash
cd ~/Projects/Campus_Action_AI

# Initialize git
git init

# Check status
git status
```

You should see:
```
On branch master
No commits yet
Untracked files:
  (use "git add <file>..." to include in what will be committed)
        README.md
        backend/
        frontend/
        ...
```

---

## 📤 Step 2: Create Repository on GitHub

### 2.1 Go to GitHub

1. Open https://github.com
2. Click **"New"** (top-left, near your profile)
3. Fill in:
   - **Repository name:** `Campus_Action_AI`
   - **Description:** `Intelligent Notice Management & Eligibility Engine`
   - **Visibility:** Public (or Private if you prefer)
   - **DO NOT** check "Initialize with README" (we already have one)
   - Click **"Create repository"**

### 2.2 You'll see instructions. Copy the HTTPS URL

It looks like:
```
https://github.com/YOUR_USERNAME/Campus_Action_AI.git
```

---

## 🔗 Step 3: Connect Local Repo to GitHub

```bash
cd ~/Projects/Campus_Action_AI

# Add remote (replace with YOUR URL from GitHub)
git remote add origin https://github.com/YOUR_USERNAME/Campus_Action_AI.git

# Verify it's connected
git remote -v
# Should show:
# origin  https://github.com/YOUR_USERNAME/Campus_Action_AI.git (fetch)
# origin  https://github.com/YOUR_USERNAME/Campus_Action_AI.git (push)
```

---

## 💾 Step 4: First Commit & Push

```bash
cd ~/Projects/Campus_Action_AI

# Stage all files
git add .

# Commit
git commit -m "initial: Project setup - Phase 1 Sprint 1

- Backend: FastAPI with SQLAlchemy models
- Frontend: React with TypeScript
- Database: PostgreSQL + pgvector
- Infrastructure: Docker Compose
- Documentation: Complete project plan"

# Create main branch and push
git branch -M main
git push -u origin main

# Verify (check GitHub in browser)
```

---

## 🌿 Step 5: Create Development Branch

Now create a `develop` branch for ongoing work:

```bash
# Create and switch to develop
git checkout -b develop

# Push it to GitHub
git push -u origin develop

# From now on, always create feature branches from develop:
git checkout develop  # Always start here
git checkout -b feature/your-feature-name
```

---

## 🔄 Git Workflow for Development

### Daily Workflow

```bash
# 1. Make sure you're on develop
git checkout develop

# 2. Pull latest changes
git pull origin develop

# 3. Create feature branch (replace with your feature)
git checkout -b feature/authentication

# 4. Make changes to code
# ... edit files ...

# 5. Check what changed
git status

# 6. Stage your changes
git add .
# Or stage specific files:
# git add backend/app/services/auth.py

# 7. Commit with clear message
git commit -m "feat: add user authentication service

- JWT token generation
- Password hashing with bcrypt
- User login verification"

# 8. Push to GitHub
git push origin feature/authentication
```

---

## 📝 Commit Message Format

Use this format for clear commit history:

```
<type>: <subject>

<body (optional)>

<footer (optional)>
```

### Types

- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code formatting (no logic change)
- `refactor:` Code restructure
- `test:` Add tests
- `chore:` Dependencies, config

### Examples

```bash
# Good ✅
git commit -m "feat: add student eligibility check endpoint"
git commit -m "fix: resolve database connection timeout"
git commit -m "docs: update README with deployment guide"

# Bad ❌
git commit -m "update"
git commit -m "fix stuff"
git commit -m "working"
```

---

## 🔀 Step 6: Create Pull Request (PR)

### When to Create PR

After you finish a feature:

```bash
# 1. Make sure everything is committed
git status
# Should show: "working tree clean"

# 2. Push your feature branch
git push origin feature/your-feature-name

# 3. Go to GitHub
# https://github.com/YOUR_USERNAME/Campus_Action_AI
```

### Creating PR on GitHub

1. GitHub will show a banner: **"Compare & pull request"** - Click it
2. Or go to **"Pull requests"** tab → **"New pull request"**
3. Fill in:
   - **Base:** `develop` (target branch)
   - **Compare:** `feature/your-feature-name` (your branch)
   - **Title:** `feat: add user authentication`
   - **Description:**
     ```markdown
     ## Changes
     - Added JWT token generation
     - Implemented password hashing
     - Created login endpoint
     
     ## Testing
     - Tested with POST /api/v1/auth/login
     - Verified tokens work
     
     ## Related Issue
     Closes #1 (if applicable)
     ```

4. Click **"Create pull request"**

---

## ✅ Code Review & Merge

### Code Review Process

1. **You create PR**
2. **Reviewer reviews** (could be yourself for solo project)
3. **CI/CD runs tests** (GitHub Actions)
4. **Merge to develop** if all ✅

### For Solo Project

Since you're working alone, you can approve your own PR:

```bash
# 1. Check your PR passed tests on GitHub
# 2. Click "Merge pull request" button
# 3. Confirm merge
```

Or merge via command line:

```bash
git checkout develop
git pull origin develop
git merge feature/authentication
git push origin develop
```

---

## 📅 Release Process (Every Sprint)

After Sprint 1-2 is complete:

```bash
# 1. Make sure develop has all features
git checkout develop
git pull origin develop

# 2. Create release branch
git checkout -b release/v0.2.0

# 3. Update version numbers and changelog
# (Edit files as needed)

# 4. Commit
git commit -m "chore: bump version to 0.2.0"

# 5. Merge to main
git checkout main
git pull origin main
git merge release/v0.2.0
git tag -a v0.2.0 -m "Release version 0.2.0"

# 6. Push everything
git push origin main
git push origin develop
git push origin --tags
```

---

## 🚨 Common Git Issues & Fixes

### Issue: "fatal: not a git repository"

**Solution:**
```bash
cd ~/Projects/Campus_Action_AI
git init
```

### Issue: "Your branch is ahead by X commits"

**Solution:**
```bash
git push origin your-branch-name
```

### Issue: "Merge conflict"

**Solution:**
```bash
# 1. Open conflicted file
nano conflicted_file.py

# 2. Find conflict markers:
# <<<<<<< HEAD
# your code
# =======
# their code
# >>>>>>> branch-name

# 3. Edit to resolve
# 4. Stage and commit
git add .
git commit -m "resolve: merge conflict in file.py"
```

### Issue: "Want to undo last commit"

**Solution:**
```bash
# Undo but keep changes
git reset --soft HEAD~1

# Undo and discard changes
git reset --hard HEAD~1
```

### Issue: "Want to switch branches but have uncommitted changes"

**Solution:**
```bash
# Stash changes
git stash

# Switch branch
git checkout develop

# Get changes back
git stash pop
```

---

## 📊 Branch Strategy

```
main (production-ready)
  ↑
  └── release/v0.2.0
        ↑
develop (integration branch)
  ↑
  ├── feature/authentication
  ├── feature/document-upload
  ├── feature/rag-pipeline
  └── bugfix/database-timeout
```

### Branch Naming

- **Features:** `feature/short-description`
- **Bugfixes:** `bugfix/issue-description`
- **Hotfixes:** `hotfix/critical-issue`
- **Release:** `release/v0.2.0`

---

## 🔐 GitHub SSH Setup (Optional but Recommended)

Instead of HTTPS, use SSH for password-less pushing:

```bash
# Generate SSH key
ssh-keygen -t ed25519 -C "your.email@example.com"
# Press Enter 3 times (no passphrase needed)

# Copy public key
cat ~/.ssh/id_ed25519.pub

# Add to GitHub:
# 1. Go to https://github.com/settings/keys
# 2. Click "New SSH key"
# 3. Paste your public key
# 4. Save

# Test connection
ssh -T git@github.com
# Should show: "Hi username! You've successfully authenticated"

# Update remote to use SSH
git remote set-url origin git@github.com:YOUR_USERNAME/Campus_Action_AI.git
```

---

## 📚 Useful Git Commands

```bash
# View commit history
git log --oneline
git log --graph --oneline --all

# View changes
git diff
git diff branch1 branch2

# Check which branch you're on
git branch

# See all branches (local + remote)
git branch -a

# Delete local branch
git branch -d feature/old-feature

# Delete remote branch
git push origin --delete feature/old-feature

# Rename branch
git branch -m old-name new-name

# Check status
git status

# See unpushed commits
git log origin/develop..develop
```

---

## ✅ Checklist: First Push

- [ ] Git installed: `git --version`
- [ ] Configured: `git config --global user.name`
- [ ] GitHub account created
- [ ] Repository created on GitHub
- [ ] Local repo initialized: `git init`
- [ ] Remote added: `git remote add origin`
- [ ] First commit: `git commit -m "initial: ..."`
- [ ] Pushed to main: `git push -u origin main`
- [ ] Develop branch created: `git checkout -b develop`
- [ ] Develop pushed: `git push -u origin develop`

---

## 🎯 Next Steps (Right Now)

### Do This First:

```bash
cd ~/Projects/Campus_Action_AI

# 1. Initialize git
git init

# 2. Configure git (one-time)
git config user.name "Your Name"
git config user.email "your.email@example.com"

# 3. Create .gitignore (already done)
# Check: cat .gitignore

# 4. Add all files
git add .

# 5. First commit
git commit -m "initial: Campus Action AI setup

- Backend: FastAPI with 10 SQLAlchemy models
- Frontend: React with TypeScript
- Database: PostgreSQL + pgvector
- Infrastructure: Docker Compose
- CI/CD: GitHub Actions
- Documentation: Complete project specs"

# 6. Create main branch
git branch -M main

# 7. Now go to GitHub and create repository
# Then come back and run:
git remote add origin https://github.com/YOUR_USERNAME/Campus_Action_AI.git
git push -u origin main

# 8. Create develop branch
git checkout -b develop
git push -u origin develop
```

---

## 📞 GitHub Actions CI/CD

We already have `.github/workflows/ci.yml` set up!

This automatically runs:
- ✅ Backend tests
- ✅ Frontend linting
- ✅ Docker builds

Every time you push or create a PR.

Check status on GitHub:
```
https://github.com/YOUR_USERNAME/Campus_Action_AI/actions
```

---

## 🎓 Learning Resources

- Git Guide: https://git-scm.com/book/en/v2
- GitHub Guides: https://guides.github.com
- Git Cheat Sheet: https://github.github.com/training-kit/downloads/github-git-cheat-sheet.pdf
- Conventional Commits: https://www.conventionalcommits.org

---

## 📝 When to Create PR (Timeline)

| Sprint | Features | Action |
|--------|----------|--------|
| 1-1 | Setup ✅ | Push to main |
| 1-2 | Auth | Create PR: `develop` ← `feature/auth` |
| 1-3 | Docs | Create PR: `develop` ← `feature/docs` |
| 1-4 | Vectors | Create PR: `develop` ← `feature/vectors` |
| 1-5 | RAG | Create PR: `develop` ← `feature/rag` |
| 1-6 | Feed | Create PR: `develop` ← `feature/feed` |
| Phase 1 Done | Release v0.1 | PR: `main` ← `release/v0.1.0` |

---

**Status:** Ready to push to GitHub! 🚀

**Next Step:** Follow the "Do This First" section above, then update this document with your GitHub URL.
