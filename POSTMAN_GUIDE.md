# Campus Action AI - Postman API Testing Guide

## Overview

This guide explains how to use the Postman collection to test the Campus Action AI API endpoints.

**Collection Files:**
- `Campus_Action_AI.postman_collection.json` - Main API collection with all endpoints
- `Campus_Action_AI_Local.postman_environment.json` - Local development environment
- `.postman.json` - Configuration file tracking workspace/collection IDs

**API Version:** 0.3.0  
**Base URL:** http://localhost:8000

---

## Quick Start

### 1. Import Collection & Environment into Postman

1. Open [Postman](https://www.postman.com/downloads/)
2. Click **Import** (top-left)
3. Select **Upload Files** and choose:
   - `Campus_Action_AI.postman_collection.json`
   - `Campus_Action_AI_Local.postman_environment.json`
4. Click **Import**

### 2. Select Environment

In Postman's top-right dropdown, select **"Local Development"** environment.

### 3. Start API Server

```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

The API should be running at `http://localhost:8000`

---

## API Endpoints Overview

### Health & Status
- `GET /health` - API health check
- `GET /` - API root endpoint with version info

### Authentication (No Token Required)
- `POST /api/v1/auth/signup` - Register new user
- `POST /api/v1/auth/login` - Login and get access token
- `GET /api/v1/auth/me` - Get current user (requires token)
- `POST /api/v1/auth/refresh` - Refresh access token

### Documents (Requires Auth)
- `POST /api/v1/documents/upload` - Upload PDF
- `GET /api/v1/documents` - List user's documents
- `GET /api/v1/documents/{id}` - Get document details
- `GET /api/v1/documents/{id}/view` - View document chunks
- `GET /api/v1/documents/{id}/pdf` - Download PDF
- `DELETE /api/v1/documents/{id}` - Delete document

### Search (Requires Auth)
- `POST /api/v1/search/vector` - Semantic search
- `POST /api/v1/search/keyword` - Keyword search (BM25)
- `POST /api/v1/search/hybrid` - Hybrid search (vector + keyword)
- `GET /api/v1/search/embedding-info` - Embedding service info

### Chat & RAG (Requires Auth)
- `POST /api/v1/chat/send` - Send message and get AI response
- `GET /api/v1/chat/conversations` - List conversations
- `GET /api/v1/chat/conversations/{id}` - Get conversation
- `DELETE /api/v1/chat/conversations/{id}` - Delete conversation
- `POST /api/v1/rag/answer` - Answer question with RAG

### Student Profile (Requires Auth)
- `GET /api/v1/students/profile` - Get student profile
- `PUT /api/v1/students/profile` - Update student profile

### Notifications (Requires Auth)
- `GET /api/v1/notifications` - List notifications
- `GET /api/v1/notifications/{id}` - Get notification
- `PATCH /api/v1/notifications/{id}` - Mark as read
- `DELETE /api/v1/notifications/{id}` - Delete notification
- `POST /api/v1/notifications/mark-all-read` - Mark all as read

### Actions & Eligibility (Requires Auth)
- `GET /api/v1/actions` - List eligible actions
- `GET /api/v1/actions/{id}` - Get action
- `POST /api/v1/actions/{id}/check-eligibility` - Check eligibility

---

## Testing Workflow

### Step 1: Create User Account

1. Go to **Authentication > Signup**
2. Update request body with:
   ```json
   {
     "name": "Test Student",
     "email": "test@campus.ai",
     "password": "TestPassword123!"
   }
   ```
3. Click **Send**
4. Copy the `access_token` from response

### Step 2: Store Token

1. In Postman, click the **Local Development** environment tab
2. Find `access_token` variable
3. Paste the token into the **Current Value** field
4. Click **Save** (Ctrl+S)

### Step 3: Verify Authentication

1. Go to **Authentication > Get Current User**
2. Click **Send**
3. Should return your user info with status **200 OK**

### Step 4: Update Student Profile

1. Go to **Student Profile > Update Student Profile**
2. Update body with your CGPA, department, batch, etc.
3. Click **Send**
4. Verify status **200 OK**

### Step 5: Upload a Document

1. Go to **Documents > Upload Document**
2. Fill in:
   - **title**: e.g., "Placement Guidelines 2024"
   - **document_type**: e.g., "placement"
   - **file**: Select a PDF file from your computer
3. Click **Send**
4. Copy the `document_id` from response into the Postman environment variable
5. Verify status **200 OK**

### Step 6: Test Document Operations

1. **List Documents** - `GET /api/v1/documents`
2. **View Document** - `GET /api/v1/documents/{document_id}/view`
3. **Download PDF** - `GET /api/v1/documents/{document_id}/pdf` (opens in browser)

### Step 7: Test Search

1. **Vector Search** - `POST /api/v1/search/vector`
   ```json
   {
     "query": "What are placement eligibility criteria?",
     "limit": 10
   }
   ```
2. **Keyword Search** - `POST /api/v1/search/keyword`
   ```json
   {
     "query": "CGPA cutoff",
     "limit": 10
   }
   ```

### Step 8: Test Chat & RAG

1. **Send Chat Message** - `POST /api/v1/chat/send`
   ```json
   {
     "conversation_id": null,
     "message": "What are the placement requirements?",
     "top_k": 10,
     "temperature": 0.7
   }
   ```
2. Copy `conversation_id` from response into environment variable
3. **Get Conversation** - `GET /api/v1/chat/conversations/{conversation_id}`
4. **List Conversations** - `GET /api/v1/chat/conversations`

---

## Common Issues & Solutions

### Issue: `401 Unauthorized`
**Solution:** 
- Token has expired - run Login again
- Token not set in environment - verify `access_token` in Local Development environment
- Wrong header format - should be `Bearer <token>`, not just `<token>`

### Issue: `403 Forbidden`
**Solution:**
- User account is inactive
- Trying to access another user's document
- Missing required user profile data (department, CGPA, batch)

### Issue: `404 Not Found`
**Solution:**
- Document ID doesn't exist or was deleted
- Conversation was deleted
- Notification was removed

### Issue: `422 Unprocessable Entity`
**Solution:**
- Request body validation failed
- Check required fields in request
- Verify field formats (e.g., document_type must be: placement, exam, scholarship, internship, event, announcement, policy, notice, other)

### Issue: `413 Request Entity Too Large`
**Solution:**
- PDF file exceeds 50MB limit
- Reduce file size or split into multiple documents

### Issue: File Upload Shows `"mime_type": null`
**Solution:**
- Postman may not auto-detect MIME type for PDFs
- Make sure file has `.pdf` extension
- Verify file is actual PDF (not renamed text file)

### Issue: Search Returns No Results
**Solution:**
- Make sure PDF was fully processed (check status after upload)
- Vector embeddings may still be computing - wait a few seconds
- Query might not match document content
- Use Keyword Search as fallback for exact terms

---

## Testing Best Practices

### 1. Use Pre-request Scripts (Optional)

Add automatic token refresh before each request:

```javascript
// In Pre-request Script tab of a request
if (pm.environment.get("access_token")) {
  pm.request.headers.add({
    key: "Authorization",
    value: "Bearer " + pm.environment.get("access_token")
  });
}
```

### 2. Use Post-request Tests (Optional)

Automatically extract IDs for next request:

```javascript
// In Tests tab of Upload Document request
if (pm.response.code === 200) {
  var responseData = pm.response.json();
  pm.environment.set("document_id", responseData.document_id);
}
```

### 3. Run Collection as Test Suite

1. Click **Runner** (top-right)
2. Select **Campus Action AI** collection
3. Select **Local Development** environment
4. Click **Run Campus Action AI**
5. Tests will run in sequence with results summary

### 4. Export Results

After running collection:
1. Click **Export Results** button
2. Choose format (JSON, CSV, or HTML)
3. Save for documentation/audits

---

## Advanced Testing

### Load Testing

Use **Postman Cloud** to run collection at scale:

1. Upgrade to Postman Pro/Business
2. Click **Cloud** in top menu
3. Run collection with custom iterations/concurrency
4. Monitor performance metrics

### Scheduled Testing

1. Click **Schedule Collection** (top-right)
2. Configure frequency (hourly, daily, weekly)
3. API health continuously monitored
4. Get alerts on failures

### Monitoring

Set up **Postman Monitoring**:

1. Click **Monitor** (top-right)
2. Select collection + environment
3. Set check frequency
4. Get email/Slack alerts on failures

---

## Documentation

### Generate OpenAPI/Swagger

The API automatically generates OpenAPI documentation at:
```
http://localhost:8000/openapi.json
```

View interactive docs at:
```
http://localhost:8000/docs
```

### Export Collection as Documentation

1. Right-click collection name
2. Select **View in web**
3. Share public documentation link

---

## Example Test Sequence

**Complete workflow to test all major features:**

```
1. Signup                           (POST /auth/signup)
2. Login                            (POST /auth/login)
3. Get Current User                 (GET /auth/me)
4. Update Student Profile           (PUT /students/profile)
5. Upload Document                  (POST /documents/upload)
6. List Documents                   (GET /documents)
7. Vector Search                    (POST /search/vector)
8. Keyword Search                   (POST /search/keyword)
9. Send Chat Message                (POST /chat/send)
10. Get Conversation                (GET /chat/conversations/{id})
11. List Conversations              (GET /chat/conversations)
12. List Notifications              (GET /notifications)
13. Check Action Eligibility        (POST /actions/{id}/check-eligibility)
14. Delete Conversation             (DELETE /chat/conversations/{id})
15. Delete Document                 (DELETE /documents/{id})
```

---

## Support & Troubleshooting

### Enable Request Logging

```bash
# Backend: check console output
# Verify DATABASE_URL and GROQ_API_KEY in .env

# Frontend: open browser console (F12)
# Check Network tab for API calls
```

### Check Backend Logs

```bash
cd backend
# Watch logs while running requests
tail -f logs/*.log
```

### Validate Configuration

```bash
# Verify backend is running
curl http://localhost:8000/health

# Verify database connection
# Check .env file for DATABASE_URL

# Verify LLM configuration
# Check .env file for GROQ_API_KEY
```

---

## Related Documentation

- **API Roadmap**: `IMPLEMENTATION_ROADMAP.md`
- **Design Guide**: `FRONT_FIX.md`
- **Architecture**: See backend `README.md`
- **Frontend Setup**: See `frontend/README.md`

---

**Last Updated**: 2024-01-01  
**Collection Version**: 0.3.0  
**API Version**: 0.3.0
