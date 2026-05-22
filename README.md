# LearnNest

> AI-powered learning assessment platform for parents and children.

## What it does

Parents upload study material (PDF or text). AI generates age-appropriate questions. Parents assign questions to their child. Child submits answers. AI evaluates answers and gives feedback.

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Zod, React Router |
| Backend | Python, FastAPI, PostgreSQL, SQLAlchemy, Alembic |
| Auth | JWT (python-jose), bcrypt |
| AI | Anthropic Claude API |
| Storage | Cloudinary |
| Deploy | Docker, Render, GitHub Actions |

## Project Structure

```
learnnest/
├── backend/
│   ├── app/
│   │   ├── main.py           # FastAPI app entry point
│   │   ├── config.py         # Environment settings
│   │   ├── database.py       # SQLAlchemy engine + session
│   │   ├── models/           # SQLAlchemy ORM models
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   ├── routers/          # API route handlers
│   │   ├── services/         # Business logic
│   │   └── middleware/       # Auth guards
│   ├── alembic/              # Database migrations
│   └── .env                  # Environment variables (not committed)
└── frontend/
    └── src/
        ├── pages/            # Landing, Register, Login, Welcome
        ├── components/       # OwlMascot, ProtectedRoute
        ├── context/          # AuthContext (global auth state)
        ├── types/            # Shared TypeScript types
        ├── services/         # API calls (auth.ts)
        └── schemas/          # Zod validation schemas
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
```

Create a `.env` file in `backend/`:
```
DATABASE_URL=postgresql://learnnest_user:your_pass@localhost:5432/learnnest
JWT_SECRET=your_secret_key
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=30
FRONTEND_ORIGIN=http://localhost:5173
```

Run migrations and start the server:
```bash
alembic upgrade head
uvicorn app.main:app --reload
```

API runs at `http://localhost:8000`. Docs at `http://localhost:8000/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Create a new account |
| POST | `/api/v1/auth/login` | Log in, returns JWT token |
| GET | `/api/v1/auth/me` | Get current user (requires token) |
| GET | `/health` | Health check + DB connectivity |

## Status

**Phase 3 — Auth complete**
- Landing page with owl mascot
- User registration with Zod validation
- Login with JWT authentication
- Protected routes with AuthContext
- Welcome page with user profile
- PostgreSQL with Alembic migrations

**Up next — Phase 4**
- Material upload (PDF + Cloudinary)
- AI question generation via Claude API
- Child answer submission and evaluation
