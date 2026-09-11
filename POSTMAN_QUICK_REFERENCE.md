# Campus Action AI - Postman Quick Reference Card

## Collection Files Location
```
/home/lap-103/Projects/Campus_Action_AI/
├── Campus_Action_AI.postman_collection.json      ← Main collection
├── Campus_Action_AI_Local.postman_environment.json ← Local environment
├── .postman.json                                  ← Config file
├── POSTMAN_GUIDE.md                               ← Full guide
└── POSTMAN_QUICK_REFERENCE.md                     ← This file
```

## Import Steps (1 min)

```bash
# Postman Desktop
1. Click "Import" (top-left)
2. Select Campus_Action_AI.postman_collection.json
3. Click Import
4. Repeat for Campus_Action_AI_Local.postman_environment.json
5. Select "Local Development" from environment dropdown (top-right)
6. Done!
```

## Backend Setup (1 min)

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

API running at: `http://localhost:8000`  
Docs at: `http://localhost:8000/docs`

---

## Test Scenarios (Copy-Paste Ready)

### 1️⃣ Signup & Login (2 min)

**Signup Request:**
```json
{
  "name": "John Doe",
  "email": "john@campus.ai",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGc...",
  "user": { "id": "...", "email": "john@campus.ai" }
}
```

**Copy `access_token` → Postman environment `access_token` variable**

---

### 2️⃣ Upload & List Documents (3 min)

**Upload Request:**
- Endpoint: `POST /api/v1/documents/upload`
- Form fields:
  - `title`: "Placement 2024 Guidelines"
  - `document_type`: "placement"
  - `file`: Select your PDF

**Response:**
```json
{
  "document_id": "550e8400-e29b-41d4-a716-446655440000",
  "chunks_count": 42,
  "file_size": 1048576
}
```

**Copy `document_id` → Postman environment `document_id` variable**

**List Documents:**
- Endpoint: `GET /api/v1/documents?skip=0&limit=20`
- Returns: All documents for current user

---

### 3️⃣ Search Across Documents (2 min)

**Vector Search** (Semantic):
```json
{
  "query": "What is the CGPA requirement for placement?",
  "limit": 10,
  "threshold": 0.5
}
```

**Keyword Search** (Exact terms):
```json
{
  "query": "CGPA cutoff requirements",
  "limit": 10
}
```

**Hybrid Search** (Best of both):
```json
{
  "query": "Placement eligibility criteria",
  "limit": 10,
  "vector_weight": 0.7,
  "keyword_weight": 0.3
}
```

**Response includes:** Matching chunks with page numbers, sections, and relevance scores

---

### 4️⃣ Chat with AI (Document Q&A) (2 min)

**Send Message:**
```json
{
  "conversation_id": null,
  "message": "What are the eligibility requirements?",
  "top_k": 10,
  "temperature": 0.7
}
```

**Response:**
```json
{
  "conversation_id": "conv-123...",
  "response": "Based on the placement guidelines, the eligibility requirements are...",
  "sources": [
    {
      "document_title": "Placement 2024 Guidelines",
      "page_number": 3,
      "section": "Eligibility Criteria"
    }
  ]
}
```

**Copy `conversation_id` → Postman environment `conversation_id` variable**

**Continue conversation:**
- Use same `conversation_id` in next message
- Previous messages automatically included in context

---

### 5️⃣ Update Student Profile (1 min)

```json
{
  "department": "Computer Science",
  "batch": "2024",
  "cgpa": 8.5,
  "backlogs": 0
}
```

**Used for:**
- Eligibility checking
- Personalized recommendations
- Action matching

---

### 6️⃣ Manage Notifications (2 min)

**List all:**
- `GET /api/v1/notifications?skip=0&limit=20`

**Mark as read:**
- `PATCH /api/v1/notifications/{id}`
- Body: `{"is_read": true}`

**Delete one:**
- `DELETE /api/v1/notifications/{id}`

**Mark all as read:**
- `POST /api/v1/notifications/mark-all-read`

---

## Status Codes Guide

| Code | Meaning | Action |
|------|---------|--------|
| **200** | Success | ✅ Request worked |
| **201** | Created | ✅ Resource created |
| **400** | Bad Request | ❌ Check request body format |
| **401** | Unauthorized | ❌ Copy token to environment |
| **403** | Forbidden | ❌ Access denied (inactive user?) |
| **404** | Not Found | ❌ Resource doesn't exist |
| **422** | Invalid Input | ❌ Required field missing |
| **429** | Rate Limited | ⏳ Too many requests - wait |
| **500** | Server Error | 🔴 Backend issue |

---

## Common Errors & Fixes

### ❌ `401 Unauthorized`
**Problem:** Token missing or expired  
**Fix:** 
1. Run Signup → Login
2. Copy `access_token` from response
3. Paste in "Local Development" environment
4. Save (Ctrl+S)

### ❌ `404 Document Not Found`
**Problem:** Document ID doesn't exist  
**Fix:**
1. Run "List Documents" first
2. Copy `id` from response
3. Paste as `document_id` variable

### ❌ `422 Unprocessable Entity`
**Problem:** Invalid input  
**Fix:** Check request body matches schema:
- `document_type`: must be `placement`, `exam`, `scholarship`, etc.
- `email`: must be valid email format
- `cgpa`: must be 0-10 (number)

### ❌ `500 Internal Server Error`
**Problem:** Backend crash  
**Fix:**
1. Check backend console for error
2. Verify `.env` file has: `DATABASE_URL`, `GROQ_API_KEY`
3. Restart backend: `python -m uvicorn app.main:app --reload`

---

## Request Templates

### Empty for New Request:
Use Postman's **Collections** sidebar:
1. Right-click "Campus Action AI" collection
2. Select "Add request"
3. Name it
4. Use templates below

### Copy & Modify:

```bash
# Replace {{variable}} with actual values
Base URL: {{base_url}}
Token: Authorization: Bearer {{access_token}}
```

---

## Advanced Tips

### 🔄 Auto-Extract IDs
In Postman request **Tests** tab:
```javascript
if (pm.response.code === 200) {
  var body = pm.response.json();
  pm.environment.set("document_id", body.document_id);
  pm.environment.set("conversation_id", body.conversation_id);
}
```

### ⚡ Quick Auth Flow
1. Run: **Auth > Login**
2. Tests tab auto-extracts token ✅
3. All subsequent requests use it

### 📊 Run Full Collection Test
1. Click **Runner** (top-right)
2. Select collection + environment
3. Click **Run** 
4. See results + export report

### 🎯 Debug Request
1. Click request
2. Scroll down → **Network** tab
3. See actual request/response headers
4. Verify Content-Type, Authorization, etc.

---

## Performance Notes

⚠️ **First Request After Upload** (5-10 sec delay)
- Reason: PDF processing, chunking, embedding generation
- Wait for `chunks_count` in response
- Then search will work instantly

⚠️ **Search on Large Documents** (1-3 sec)
- Reason: Vector similarity calculation
- Normal for 1000+ chunks
- Use `limit` to reduce results if needed

⚠️ **AI Response Generation** (3-5 sec)
- Reason: Groq LLM API call
- Depends on internet speed
- Streaming response shown as "Generating..."

---

## Environment Variables

Always set these in Postman:

| Variable | Example | Use |
|----------|---------|-----|
| `base_url` | `http://localhost:8000` | API endpoint |
| `access_token` | `eyJhbGc...` | Auth token |
| `document_id` | `550e8400...` | Document reference |
| `conversation_id` | `conv-123...` | Chat reference |
| `notification_id` | `notif-456...` | Notification reference |
| `action_id` | `action-789...` | Action reference |

---

## Useful Postman Features

**🔗 Linking Requests**
- Setup → Tests tab to extract IDs
- Pre-request → Use IDs in URL

**📝 Documentation**
- Click request → Description tab
- Write custom notes

**💾 Save Responses**
- Right-click response
- Save as Examples
- See mock responses later

**🌐 Switch Environments**
- Top-right dropdown
- Switch between Local / Staging / Production

---

## Next Steps

1. ✅ Import collection
2. ✅ Start backend
3. ✅ Run "Signup" request
4. ✅ Run "Login" request  
5. ✅ Upload a PDF
6. ✅ Try searches
7. ✅ Try chat
8. ✅ Check notifications

**Complete workflow = 15 minutes**

---

## Support

- **Full Guide**: `POSTMAN_GUIDE.md`
- **API Docs**: `http://localhost:8000/docs`
- **Backend Issues**: Check `backend/.env`
- **File Issues**: Check `backend/logs/`

---

**Last Updated**: 2024-01-01  
**Collection Version**: 0.3.0  
**API Version**: 0.3.0
