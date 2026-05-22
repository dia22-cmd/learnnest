# LearnNest — API Documentation

## Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR | Unique, not null |
| password_hash | VARCHAR | bcrypt hashed — never plain text |
| full_name | VARCHAR | Optional |
| is_active | BOOLEAN | Default true |
| created_at | TIMESTAMP | Auto set |
| deleted_at | TIMESTAMP | Soft delete — null means active |

### materials _(planned)_
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| parent_id | UUID | FK → users.id |
| title | VARCHAR | Not null |
| file_url | VARCHAR | Cloudinary URL |
| raw_text | TEXT | Extracted from PDF |
| created_at | TIMESTAMP | Auto set |

### questions _(planned)_
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| material_id | UUID | FK → materials.id |
| type | ENUM | `mcq` or `short_answer` |
| question | TEXT | Not null |
| options | JSONB | MCQ only |
| answer | TEXT | Correct answer |
| is_selected | BOOLEAN | Default false |
| created_at | TIMESTAMP | Auto set |

### submissions _(planned)_
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| question_id | UUID | FK → questions.id |
| child_name | VARCHAR | No child login in MVP |
| answer_given | TEXT | Child's answer |
| score | INTEGER | 0–100, null until evaluated |
| feedback | TEXT | AI feedback |
| suggestions | TEXT | AI improvement tips |
| submitted_at | TIMESTAMP | Auto set |

---

## Auth Endpoints

### `POST /api/v1/auth/register`
Creates a new parent account. No token required.

**Request**
```json
{
  "email": "parent@example.com",
  "password": "SecurePass123",
  "full_name": "Jane Smith"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "token_type": "bearer"
  }
}
```

**Response 400** — email already exists
```json
{
  "success": false,
  "message": "Email already registered"
}
```

---

### `POST /api/v1/auth/login`
Validates credentials and returns a JWT token.

**Request**
```json
{
  "email": "parent@example.com",
  "password": "SecurePass123"
}
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "token_type": "bearer"
  }
}
```

**Response 401** — wrong credentials
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

---

### `GET /api/v1/auth/me`
Returns the currently logged-in user's profile.

**Headers:** `Authorization: Bearer <token>`

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "parent@example.com",
    "full_name": "Jane Smith",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

**Response 401** — missing or invalid token
```json
{
  "success": false,
  "message": "Not authenticated"
}
```

---

## Materials Endpoints _(planned)_

### `POST /api/v1/materials/upload`
Uploads a PDF, extracts text, saves to DB.

**Headers:** `Authorization: Bearer <token>`, `Content-Type: multipart/form-data`

**Request** (form data)
```
file:  <PDF file>
title: "Chapter 3 - Photosynthesis"
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Chapter 3 - Photosynthesis",
    "file_url": "https://res.cloudinary.com/...",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

**Response 400** — wrong file type
```json
{ "success": false, "message": "Only PDF files are accepted" }
```

**Response 413** — file too large
```json
{ "success": false, "message": "File size must be under 10MB" }
```

---

### `GET /api/v1/materials/`
Returns all materials owned by the logged-in parent.

**Headers:** `Authorization: Bearer <token>`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "Chapter 3 - Photosynthesis",
      "file_url": "https://res.cloudinary.com/...",
      "created_at": "2024-01-01T00:00:00"
    }
  ]
}
```

---

### `GET /api/v1/materials/:id`
Returns one material with full detail including extracted text.

**Headers:** `Authorization: Bearer <token>`

**Response 200**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Chapter 3 - Photosynthesis",
    "file_url": "https://res.cloudinary.com/...",
    "raw_text": "Photosynthesis is the process by which...",
    "created_at": "2024-01-01T00:00:00"
  }
}
```

**Response 403** — material belongs to another user
```json
{ "success": false, "message": "Access denied" }
```

**Response 404**
```json
{ "success": false, "message": "Material not found" }
```

---

## Question Endpoints _(planned)_

### `POST /api/v1/questions/generate/:material_id`
Sends material text to Claude, saves generated questions.

**Headers:** `Authorization: Bearer <token>`

**Request**
```json
{ "count": 5 }
```

**Response 201**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "mcq",
      "question": "What is the primary product of photosynthesis?",
      "options": ["A. Oxygen", "B. Glucose", "C. Water", "D. Carbon dioxide"],
      "is_selected": false
    },
    {
      "id": "uuid",
      "type": "short_answer",
      "question": "Explain why sunlight is needed for photosynthesis.",
      "options": null,
      "is_selected": false
    }
  ]
}
```

**Response 400** — material has no text
```json
{ "success": false, "message": "Material has no extractable text" }
```

---

### `GET /api/v1/questions/:material_id`
Returns all generated questions for a material.

**Headers:** `Authorization: Bearer <token>`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "type": "mcq",
      "question": "What is the primary product of photosynthesis?",
      "options": ["A. Oxygen", "B. Glucose", "C. Water", "D. Carbon dioxide"],
      "is_selected": true
    }
  ]
}
```

---

### `PATCH /api/v1/questions/:id/select`
Toggles `is_selected` on a question (parent picks which ones to assign).

**Headers:** `Authorization: Bearer <token>`

**Request**
```json
{ "is_selected": true }
```

**Response 200**
```json
{
  "success": true,
  "data": { "id": "uuid", "is_selected": true }
}
```

---

## Submission Endpoints _(planned)_

### `POST /api/v1/submissions/`
Saves child's answer and triggers AI evaluation. No token required (child has no login).

**Request**
```json
{
  "question_id": "uuid",
  "child_name": "Arjun",
  "answer_given": "Glucose is produced during photosynthesis"
}
```

**Response 201**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "score": 85,
    "feedback": "Good answer. You correctly identified glucose as the product.",
    "suggestions": "Also mention the role of chlorophyll to complete the answer."
  }
}
```

**Response 400** — question not assigned
```json
{ "success": false, "message": "This question is not available" }
```

---

### `GET /api/v1/submissions/:material_id`
Returns all child submissions for a material. Parent only.

**Headers:** `Authorization: Bearer <token>`

**Response 200**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "question": "What is the primary product of photosynthesis?",
      "child_name": "Arjun",
      "answer_given": "Glucose is produced during photosynthesis",
      "score": 85,
      "feedback": "Good answer...",
      "suggestions": "Also mention chlorophyll...",
      "submitted_at": "2024-01-01T10:30:00"
    }
  ]
}
```
