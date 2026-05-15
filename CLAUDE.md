# LearnNest — Claude Context

## Stack
Backend: FastAPI, PostgreSQL, SQLAlchemy, Alembic
Frontend: React + TypeScript, Vite, TailwindCSS
Auth: JWT (30min), bcrypt via passlib
AI: Anthropic Claude API
Storage: Cloudinary
Deploy: Docker, Render, GitHub Actions

## Architecture rules — ALWAYS follow
- Routers: receive request, call service, return response ONLY
- Services: ALL business logic lives here
- Models: DB shape only — no methods, no logic
- Frontend: components render, hooks manage state, services contain API calls

## Code standards
- UUID primary keys everywhere
- Every table: created_at TIMESTAMP
- Error shape: { success, data, message }
- Hash passwords — never plain text
- Filter DB queries by user_id always

## Current phase
Phase 3 Step 4 — Auth complete. Login + Landing page in progress.

## NOT in MVP
- Child login (replaced by share link)
- Adaptive difficulty
- Progress tracking
