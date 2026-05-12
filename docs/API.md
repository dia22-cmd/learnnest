# LearnNest — Technical Documentation

## Database Schema

### users
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| email | VARCHAR | Unique, not null |
| password | VARCHAR | bcrypt hashed |
| role | ENUM | 'admin' or 'parent' |
| created_at | TIMESTAMP | Auto set |
| deleted_at | TIMESTAMP | Soft delete |

### materials
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| parent_id | UUID | FK → users.id |
| title | VARCHAR | Not null |
| file_url | VARCHAR | Cloudinary URL |
| raw_text | TEXT | Extracted from PDF |
| created_at | TIMESTAMP | Auto set |

### questions
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| material_id | UUID | FK → materials.id |
| type | ENUM | 'mcq' or 'short_answer' |
| question | TEXT | Not null |
| options | JSONB | MCQ only |
| answer | TEXT | Correct answer |
| is_selected | BOOLEAN | Default false |
| created_at | TIMESTAMP | Auto set |

### submissions
| Column | Type | Notes |
|---|---|---|
| id | UUID | Primary key |
| question_id | UUID | FK → questions.id |
| child_name | VARCHAR | No login in MVP |
| answer_given | TEXT | Child's answer |
| score | INTEGER | 0–100, null until evaluated |
| feedback | TEXT | AI feedback |
| suggestions | TEXT | AI improvement tips |
| submitted_at | TIMESTAMP | Auto set |

POST /api/v1/auth/register
Who calls it:  Anyone (no login required)
What it does:  Creates a new parent account

Request Body:
{
  "email": "parent@example.com",
  "password": "SecurePass123"
}

Response 201 (created):
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "token_type": "bearer"
  }
}

Response 400 (email already exists):
{
  "success": false,
  "error": "Email already registered"
}

POST /api/v1/auth/login
Who calls it:  Registered parent
What it does:  Validates credentials, returns token

Request Body:
{
  "email": "parent@example.com",
  "password": "SecurePass123"
}

Response 200:
{
  "success": true,
  "data": {
    "access_token": "eyJhbG...",
    "token_type": "bearer"
  }
}

Response 401 (wrong credentials):
{
  "success": false,
  "error": "Invalid email or password"
}

GET /api/v1/auth/me
Who calls it:  Logged-in parent
What it does:  Returns the current user's profile
Headers:       Authorization: Bearer <token>

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "parent@example.com",
    "role": "parent",
    "created_at": "2024-01-01T00:00:00"
  }
}

Response 401 (no/invalid token):
{
  "success": false,
  "error": "Not authenticated"
}

POST /api/v1/materials/upload
Who calls it:  Logged-in parent
What it does:  Uploads PDF, extracts text, saves to DB
Headers:       Authorization: Bearer <token>
Content-Type:  multipart/form-data

Request Body (form data, not JSON):
  file:  <PDF file>
  title: "Chapter 3 - Photosynthesis"

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Chapter 3 - Photosynthesis",
    "file_url": "https://res.cloudinary.com/...",
    "created_at": "2024-01-01T00:00:00"
  }
}

Response 400 (wrong file type):
{
  "success": false,
  "error": "Only PDF files are accepted"
}

Response 413 (file too large):
{
  "success": false,
  "error": "File size must be under 10MB"
}

GET /api/v1/materials/
Who calls it:  Logged-in parent
What it does:  Returns all materials owned by this parent
Headers:       Authorization: Bearer <token>

Response 200:
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

GET /api/v1/materials/:id
Who calls it:  Logged-in parent
What it does:  Returns one material with full detail
Headers:       Authorization: Bearer <token>

Response 200:
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

Response 403 (material belongs to someone else):
{
  "success": false,
  "error": "Access denied"
}

Response 404 (material doesn't exist):
{
  "success": false,
  "error": "Material not found"
}

POST /api/v1/questions/generate/:material_id
Who calls it:  Logged-in parent
What it does:  Sends material text to Claude, saves generated questions
Headers:       Authorization: Bearer <token>

Request Body:
{
  "count": 5
}

Response 201:
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

Response 400 (material has no text):
{
  "success": false,
  "error": "Material has no extractable text"
}

GET /api/v1/questions/:material_id
Who calls it:  Logged-in parent
What it does:  Returns all questions for a material
Headers:       Authorization: Bearer <token>

Response 200:
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


PATCH /api/v1/questions/:id/select
Who calls it:  Logged-in parent (on question review page)
What it does:  Toggles is_selected true/false for one question
Headers:       Authorization: Bearer <token>

Request Body:
{
  "is_selected": true
}

Response 200:
{
  "success": true,
  "data": {
    "id": "uuid",
    "is_selected": true
  }
}

POST /api/v1/submissions/
Who calls it:  Child (no login, no token)
What it does:  Saves child's answer, triggers AI evaluation

Request Body:
{
  "question_id": "uuid",
  "child_name": "Arjun",
  "answer_given": "Glucose is produced during photosynthesis"
}

Response 201:
{
  "success": true,
  "data": {
    "id": "uuid",
    "score": 85,
    "feedback": "Good answer. You correctly identified glucose as the product.",
    "suggestions": "Also mention the role of chlorophyll to complete the answer."
  }
}

Response 400 (question not selected/assigned):
{
  "success": false,
  "error": "This question is not available"
}

GET /api/v1/submissions/:material_id
Who calls it:  Logged-in parent (results page)
What it does:  Returns all submissions for a material
Headers:       Authorization: Bearer <token>

Response 200:
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

