# Memora Backend API

Base URL (local dev): `http://localhost:4000`

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
| Field    | Type   | Required | Notes                          |
|----------|--------|----------|---------------------------------|
| name     | string | yes      |                                  |
| email    | string | yes      | must be unique                  |
| password | string | yes      | stored as bcrypt hash, never returned |

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
| Field    | Type   | Required |
|----------|--------|----------|
| email    | string | yes      |
| password | string | yes      |

**Success Response — 200 OK**
```json
{
  "accessToken": "<jwt, expires in 15m>",
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

### Get Current User (Me)

Returns the ID of the currently authenticated user. Used to verify a token is valid.

**Endpoint**
```
GET /api/auth/me
```

**Headers**
| Key           | Value              | Required |
|---------------|--------------------|----------|
| Authorization | `Bearer <accessToken>` | yes  |

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

### Create Note

**Endpoint**
```
POST /api/notes
```

**Request Body**
| Field   | Type   | Required |
|---------|--------|----------|
| title   | string | yes      |
| content | string | yes      |

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

### Update Note

```
PUT /api/notes/:noteId
```

**Request Body**
| Field   | Type   | Required |
|---------|--------|----------|
| title   | string | yes      |
| content | string | yes      |

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

### Delete Note

```
DELETE /api/notes/:noteId
```

**Success Response — 204 No Content** (empty body)

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

- No auth token is required yet for signup/login itself.
- Once login is implemented, protected routes will require the header:
  `Authorization: Bearer <accessToken>`
- This doc will be updated as new endpoints (Notes CRUD, file upload, etc.) are added.
