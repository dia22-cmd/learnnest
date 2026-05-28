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
| Backend | Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic |
| Auth | JWT (python-jose), bcrypt |
| AI | Anthropic Claude API |
| Storage | Cloudinary |
| Deploy | Render, GitHub Actions |

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
ANTHROPIC_API_KEY=sk-ant-...   # optional until Phase 4
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
| POST | `/api/v1/auth/register` | ❌ | Create account |
| POST | `/api/v1/auth/login` | ❌ | Login, returns JWT |
| GET | `/api/v1/auth/me` | ✅ | Get current user |
| GET | `/health` | ❌ | DB health check |

## Status

**Phase 3 — Auth + Deploy complete** ✅
- Landing page with owl mascot
- User registration with Zod validation
- Login with JWT authentication (30 min expiry)
- Protected routes with AuthContext
- Welcome page with user profile
- PostgreSQL + Alembic auto-migrations
- Deployed to Render (backend + frontend + DB)

**Phase 4 — coming next**
- Material upload (PDF + Cloudinary)
- AI question generation via Claude API
- Child answer submission and evaluation
