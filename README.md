# LearnNest

> AI-powered learning assessment platform for parents and children.

[![Backend](https://img.shields.io/badge/API-live-brightgreen)](https://learnnest-ripm.onrender.com/health)

## What it does

Parents upload study material (PDF or text). AI generates age-appropriate questions. Parents assign questions to their child. Child submits answers. AI evaluates answers and gives feedback.

## Live

| Service | URL |
|---------|-----|
| Frontend | https://learnnest-p1fz.onrender.com |
| Backend API | https://learnnest-ripm.onrender.com |
| API Docs | https://learnnest-ripm.onrender.com/docs |

> **Free tier note:** The backend spins down after 15 min of inactivity. First request after idle takes ~30s to wake up. Free PostgreSQL expires after 90 days.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Zod, React Router, Axios |
| Backend | Python 3.10, FastAPI, PostgreSQL, SQLAlchemy, Alembic |
| Auth | JWT (python-jose), bcrypt |
| AI | Google Gemini API (gemini-2.5-flash) |
| DevOps & Containerization | Docker, Docker Compose, GitHub Actions |
| Storage | Cloudinary |
| Deploy | Render |

## Project Structure

```
learnnest/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Environment settings (Pydantic)
│   │   ├── database.py       # SQLAlchemy engine + session
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── routers/          # API route handlers
│   │   ├── services/         # Business logic
│   │   └── middleware/       # Auth guards
│   ├── alembic/              # Database migrations
│   └── .env.example          # Environment variable template
└── frontend/
    └── src/
        ├── pages/            # Landing, Register, Login, Welcome
        ├── components/       # OwlMascot, ProtectedRoute
        ├── context/          # AuthContext (global auth state)
        ├── services/         # API calls (auth.ts)
        ├── schemas/          # Zod validation schemas
        └── types/            # Shared TypeScript types
```

## Local Development

You can run the entire LearnNest stack (Frontend, Backend, and PostgreSQL database) locally using either Docker Compose (recommended) or manual step-by-step setup.

### 1. Running with Docker Compose (Recommended)

1. Make sure you have Docker installed and running.
2. Create `backend/.env` using the template below (adjusting credentials if necessary).
3. Run the following command in the root directory:
   ```bash
   docker compose up --build
   ```
4. Access the applications:
   - **Frontend client**: `http://localhost:5173`
   - **Backend API**: `http://localhost:8000`
   - **API Docs (Swagger UI)**: `http://localhost:8000/docs`

---

### 2. Manual Step-by-Step Setup

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
```

Create `backend/.env`:
```
DATABASE_URL=postgresql://learnnest_user:your_pass@localhost:5432/learnnest
JWT_SECRET=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
FRONTEND_ORIGIN=http://localhost:5173
GEMINI_API_KEY=AIzaSy...       # optional until Phase 4
CLOUDINARY_URL=cloudinary://...  # optional until Phase 4
```

```bash
uvicorn app.main:app --reload
# migrations run automatically on startup
```

API: `http://localhost:8000` · Docs: `http://localhost:8000/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| **Auth** | | | |
| POST | `/api/v1/auth/register` | ❌ | Create account |
| POST | `/api/v1/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/v1/auth/me` | ✅ | Get current user |
| **Materials** | | | |
| POST | `/api/v1/materials/upload` | ✅ | Upload PDF material to Cloudinary |
| GET | `/api/v1/materials/` | ✅ | List all materials uploaded by parent |
| **Questions** | | | |
| POST | `/api/v1/questions/generate/{material_id}` | ✅ | Generate draft questions via Gemini 2.5 Flash |
| GET | `/api/v1/questions/{material_id}` | 🔓 | List questions (all for parent, only selected for child) |
| PATCH | `/api/v1/questions/{question_id}/select` | ✅ | Toggle selection of a question |
| **Submissions** | | | |
| POST | `/api/v1/submissions/` | ❌ | Submit child's answer for AI scoring & feedback |
| GET | `/api/v1/submissions/{material_id}` | ✅ | List child submissions for a material |
| **System** | | | |
| GET | `/health` | ❌ | DB health check |

## Testing

The backend includes a comprehensive automated test suite utilizing `pytest` running against an isolated SQLite in-memory database. Gemini API and Cloudinary uploads are mocked to ensure tests run offline without consuming live quotas.

### Running Backend Tests
```bash
cd backend
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
python -m pytest
```

### Running Frontend Type-Checks
```bash
cd frontend
npx tsc --noEmit
```

## CI/CD Pipeline

A GitHub Actions pipeline (`.github/workflows/ci.yml`) is configured to run automatically on every push or pull request to the `main` branch:
1. Installs Python packages and runs the backend test suite via `pytest`.
2. Installs npm packages and validates type safety for the React client via `npx tsc --noEmit`.

## Status

**Phase 3 — Auth & Deploy complete** ✅
- Landing page with animated owl mascot.
- User registration and login with JWT authentication (30-minute expiry).
- Protected dashboard routes with React Context.
- PostgreSQL + Alembic database auto-migrations.
- Deployed to Render.

**Phase 4 — Materials, AI Generation & Child Solving complete** ✅
- Client-side validation: instantaneous file picker validation restricting non-PDF formats or files >10MB.
- In-memory PDF text extraction using `pypdf`.
- Storage backup uploading to Cloudinary.
- Automated question generation (mixed MCQ and short answer) via `gemini-2.5-flash`.
- Slide-based student solver interface with responsive SVG mascot animations.
- Dynamic student answer evaluation and feedback scoring via Gemini.
- Parent dashboard reports to track child answers and scores.

**Phase 5 & 6 — Analytics, Docker Containerization & CI/CD complete** ✅
- Parent analytics dashboard with correct answer rates and visual streak tracking.
- Multi-container virtualization using Docker and Docker Compose (`db`, `backend`, `frontend`).
- GitHub Actions automated integration workflows running tests and ESLint.

**Phase 7 — Interactive Question Types complete** ✅
- Support for True/False, Fill-in-the-Blank, and Match the Following.
- Deterministic scoring calculations and key schema validation.
- Complete isolated unit tests verification suite.

**Phase 8 — Advanced Core Features complete** ✅
- Child profile creation, management, and private solver URLs.
- Worksheet assignments checklists with togglable states.
- Performance-based symmetrical adaptive difficulty escalations (using consecutive quiz histories).
- Subject tagging for category performance reports.
