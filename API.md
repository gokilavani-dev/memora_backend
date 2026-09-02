# Memora Backend API

Base URL (local dev): `http://localhost:4000`
Base URL (production): `https://memora-backend-hjbf.onrender.com`

All request/response bodies are JSON. Send `Content-Type: application/json` on requests with a body.

---

## Auth

### Signup

Creates a new user account.

**Endpoint**

```
POST /api/auth/signup
```

**Request Body**
| Field | Type | Required | Notes |
|----------|--------|----------|---------------------------------|
| name | string | yes | |
| email | string | yes | must be unique |
| password | string | yes | stored as bcrypt hash, never returned |

**Request Example**

```json
{
  "name": "Test",
  "email": "test@x.com",
  "password": "123456"
}
```

**Success Response — 201 Created**

```json
{
  "id": "20d60a14-28b2-4997-818d-444e23f5a92e",
  "name": "Test",
  "email": "test@x.com"
}
```

**Error Response — 409 Conflict** (email already registered)

```json
{
  "message": "Email already registered"
}
```

---

### Login

```
POST /api/auth/login
```

**Request Body**
| Field | Type | Required |
|----------|--------|----------|
| email | string | yes |
| password | string | yes |

**Success Response — 200 OK**

```json
{
  "accessToken": "<jwt, expires in 7d>",
  "user": {
    "id": "20d60a14-28b2-4997-818d-444e23f5a92e",
    "name": "Test",
    "email": "test@x.com"
  }
}
```

**Error Response — 401 Unauthorized** (wrong email or password)

```json
{
  "message": "Invalid credentials"
}
```

---

### Get Current User (Me)

Returns the ID of the currently authenticated user. Used to verify a token is valid.

**Endpoint**

```
GET /api/auth/me
```

**Headers**
| Key | Value | Required |
|---------------|--------------------|----------|
| Authorization | `Bearer <accessToken>` | yes |

**Success Response — 200 OK**

```json
{
  "userId": "20d60a14-28b2-4997-818d-444e23f5a92e"
}
```

**Error Response — 401 Unauthorized**

```json
{
  "message": "No token"
}
```

or

```json
{
  "message": "Invalid or expired token"
}
```

---

## Notes

All Notes endpoints require the header:
`Authorization: Bearer <accessToken>`

When a note is created with a `fileId`, the backend automatically chunks the file's extracted text, generates embeddings, and stores them for later semantic search (see **Ask a Question**, below). This adds a short delay to the create request while embeddings are generated.

### Create Note

**Endpoint**

```
POST /api/notes
```

**Request Body**
| Field | Type | Required | Notes |
|----------|--------|----------|-------------------------------------------------|
| title | string | yes | |
| content | string | yes | |
| fileId | string | no | attach a previously uploaded, summarized file |
| fileName | string | no | display name of the attached file |

**Request Example**

```json
{
  "title": "Whatsapp API",
  "content": "Register for meta account"
}
```

**Success Response — 201 Created**

```json
{
  "userId": "20d60a14-28b2-4997-818d-444e23f5a92e",
  "noteId": "ff5d64f8-d126-43f5-a122-f8ad2b5fd811",
  "title": "Whatsapp API",
  "content": "Register for meta account",
  "createdAt": "2026-07-09T10:44:14.926Z",
  "updatedAt": "2026-07-09T10:44:14.926Z"
}
```

**Error Response — 500 Internal Server Error**

```json
{
  "message": "Something went wrong"
}
```

---

### Get All Notes

```
GET /api/notes
```

**Success Response — 200 OK**

```json
[
  {
    "userId": "20d60a14-28b2-4997-818d-444e23f5a92e",
    "noteId": "ff5d64f8-d126-43f5-a122-f8ad2b5fd811",
    "title": "Whatsapp API",
    "content": "Register for meta account",
    "createdAt": "2026-07-09T10:44:14.926Z",
    "updatedAt": "2026-07-09T10:44:14.926Z"
  }
]
```

---

### Get One Note

```
GET /api/notes/:noteId
```

**Success Response — 200 OK**

```json
{
  "userId": "20d60a14-28b2-4997-818d-444e23f5a92e",
  "noteId": "ff5d64f8-d126-43f5-a122-f8ad2b5fd811",
  "title": "Whatsapp API",
  "content": "Register for meta account",
  "createdAt": "2026-07-09T10:44:14.926Z",
  "updatedAt": "2026-07-09T10:44:14.926Z"
}
```

---

### Update Note

```
PUT /api/notes/:noteId
```

**Request Body**
| Field | Type | Required |
|---------|--------|----------|
| title | string | yes |
| content | string | yes |

**Success Response — 200 OK**

```json
{
  "userId": "20d60a14-28b2-4997-818d-444e23f5a92e",
  "noteId": "ff5d64f8-d126-43f5-a122-f8ad2b5fd811",
  "title": "Whatsapp API",
  "content": "Register for meta account in FB",
  "createdAt": "2026-07-09T10:44:14.926Z",
  "updatedAt": "2026-07-09T11:44:38.190Z"
}
```

---

### Delete Note

```
DELETE /api/notes/:noteId
```

**Success Response — 204 No Content** (empty body)

---

### Ask a Question (RAG)

Answers a question using only the content of the specified note, via Retrieval-Augmented Generation (chunking + embeddings + semantic search + Gemini). The note must belong to the authenticated user, or the request is rejected.

**Endpoint**

```
POST /api/notes/:noteId/ask
```

**Request Body**
| Field | Type | Required |
|----------|--------|----------|
| question | string | yes |

**Request Example**

```json
{
  "question": "What is the difference between StatelessWidget and StatefulWidget?"
}
```

**Success Response — 200 OK**

```json
{
  "answer": "Based on the provided context, ...",
  "sources": ["chunk-0", "chunk-2"]
}
```

**Error Response — 403 Forbidden** (note does not belong to the authenticated user)

```json
{
  "message": "Not authorized to access this note"
}
```

**Error Response — 400 Bad Request**

```json
{
  "message": "noteId is required"
}
```

---

## Files

All Files endpoints require the header:
`Authorization: Bearer <accessToken>`

The typical upload flow is: **1) get a presigned upload URL → 2) upload the file directly to S3 → 3) confirm the upload → 4) summarize (optional)**.

### Get Upload URL

Returns a presigned S3 URL. The file itself is uploaded directly to S3, not through this backend.

**Endpoint**

```
POST /api/files/upload-url
```

**Request Body**
| Field | Type | Required |
|----------|--------|----------|
| fileName | string | yes |
| fileType | string | yes | e.g. `"application/pdf"` |

**Success Response — 200 OK**

```json
{
  "uploadUrl": "https://<bucket>.s3.amazonaws.com/...(presigned, expires in 5 min)",
  "key": "20d60a14-.../abc123-notes.pdf",
  "fileId": "abc123-..."
}
```

> After receiving `uploadUrl`, `PUT` the raw file bytes directly to that URL (not to this backend).

---

### Confirm Upload

Called after the file has been successfully `PUT` to S3. Downloads the file from S3, extracts its text (PDF), and stores it against the `fileId`.

**Endpoint**

```
POST /api/files/:fileId/confirm-upload
```

**Success Response — 200 OK**

```json
{
  "userId": "20d60a14-28b2-4997-818d-444e23f5a92e",
  "fileId": "abc123-...",
  "fileName": "notes.pdf",
  "status": "processed",
  "extractedText": "..."
}
```

**Error Response — 404 Not Found**

```json
{
  "message": "File not found"
}
```

---

### Summarize File

Generates a 3–4 sentence AI summary and a list of action items from the file's extracted text.

**Endpoint**

```
POST /api/files/:fileId/summarize
```

**Success Response — 200 OK**

```json
{
  "userId": "20d60a14-28b2-4997-818d-444e23f5a92e",
  "fileId": "abc123-...",
  "status": "summarized",
  "summary": "This document covers ...",
  "actionItems": ["Notify the publisher...", "Review section 3..."]
}
```

**Error Response — 400 Bad Request** (confirm-upload not called yet)

```json
{
  "message": "File not yet processed"
}
```

---

### Transcribe Audio

Transcribes an audio file and generates a summary + action items, using Gemini's multimodal audio input.

**Endpoint**

```
POST /api/files/:fileId/transcribe
```

**Success Response — 200 OK**

```json
{
  "userId": "20d60a14-28b2-4997-818d-444e23f5a92e",
  "fileId": "abc123-...",
  "status": "transcribed",
  "transcript": "...",
  "summary": "...",
  "actionItems": ["..."]
}
```

---

### Get Download URL

Returns a presigned S3 URL to download/view the original file.

**Endpoint**

```
GET /api/files/:fileId/download-url
```

**Success Response — 200 OK**

```json
{
  "downloadUrl": "https://<bucket>.s3.amazonaws.com/...(presigned, expires in 5 min)",
  "fileName": "notes.pdf"
}
```

---

## Health Check

```
GET /health
```

**Response — 200 OK**

```json
{
  "status": "okay"
}
```

---

## Notes for Frontend Team

- No auth token is required for signup/login itself.
- All other routes (`/api/notes/*`, `/api/files/*`) require the header:
  `Authorization: Bearer <accessToken>`
- Tokens expire after 7 days; there is currently no refresh-token flow.
- The RAG pipeline (chunking + embeddings) runs synchronously during `POST /api/notes` when a `fileId` is attached — expect this request to take longer than a plain note creation.
- Gemini free-tier rate limits apply to `/summarize`, `/transcribe`, and `/:noteId/ask` — repeated rapid testing may return a `429`/`503` from the underlying model; this is expected under free-tier quotas, not an application bug.
