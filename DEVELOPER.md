# LearnNest — Developer Context

## Stack
Backend: FastAPI, PostgreSQL, SQLAlchemy, Alembic
Frontend: React + TypeScript, Vite, TailwindCSS
Auth: JWT (30min), bcrypt via passlib
AI: Google Gemini API
Storage: Cloudinary
Deploy: Docker, Render, GitHub Actions

## Architecture Rules — ALWAYS follow
- Routers: receive request, call service, return response ONLY
- Services: ALL business logic lives here
- Models: DB shape only — no methods, no logic
- Schemas: API shapes only — NEVER expose password_hash in responses
- Frontend: components render, hooks manage state, services contain API calls

## Code Standards
- UUID primary keys everywhere
- Every table: created_at TIMESTAMP + deleted_at (soft delete, never hard delete)
- Error shape: { success, data, message }
- Hash passwords — never plain text
- Filter DB queries by user_id always
- Prefer maintainable code over clever hacks

## Current Phase
Phase 7 — Interactive Question Types (T/F, Blank, Match) Complete. End-to-end grading, client solver widgets, and parent portal metrics are fully operational.

## NOT in MVP
- Child login (replaced by share link)
- Adaptive difficulty

---

## Engineering Workflow Rules

You must NEVER directly implement features without planning first.

For EVERY feature, task, refactor, bugfix, or architectural change:

1. First create a detailed implementation plan.
2. Explain:
   - objective
   - affected files
   - data flow
   - database/schema changes
   - API changes
   - UI changes
   - risks
   - edge cases
   - testing strategy
3. Break the work into milestones/phases.
4. Wait for explicit user approval BEFORE writing or modifying code.
5. Do not auto-apply edits.
6. Ask: "Do you approve this plan?" / "Should I proceed with implementation?"

---

## Milestone Rules

Treat EVERY feature as a milestone.

### Milestone Template — USE THIS EVERY TIME

```
Milestone N — [Feature Name]

Goal: [one sentence]
Scope: [what's included AND what's not]

Files affected:
- backend/app/models/x.py
- backend/app/services/x.py
- backend/app/routers/x.py
- frontend/src/pages/x.tsx

Risks:
- [risk 1]
- [risk 2]

Completion checklist:
- [ ] [feature works end to end]
- [ ] [edge case handled]

Test checklist:
- [ ] Happy path tested
- [ ] Edge cases tested
- [ ] Error cases tested
- [ ] Existing tests still pass
```

### Example — Milestone 1: Authentication Backend
Files: models/user.py, services/auth_service.py, routers/auth.py

Completion checklist:
- [ ] Register works
- [ ] Login works
- [ ] Password hashed
- [ ] Invalid credentials rejected
- [ ] JWT validated

---

## Implementation Rules

Before editing ANY code:
- explain what will change
- explain WHY it will change
- explain possible side effects

After implementation:
- summarize all changes
- list every modified file
- explain architectural decisions
- mention technical debt if introduced

---

## Git & PR Workflow

After every completed feature:

1. Remind user to:
   - review code manually
   - test end to end
   - commit changes
   - open PR

2. Always generate:
   - commit message (Conventional Commits format)
   - PR title
   - PR description
   - testing notes

Never skip PR review reminders. Ever.

### Conventional Commits format
```
feat(scope): short description
fix(scope): short description
chore(scope): short description
refactor(scope): short description
test(scope): short description
docs(scope): short description
```

---

## Code Safety Rules

### NEVER:
- silently change architecture
- introduce dependencies without approval
- perform destructive database actions without confirmation
- remove code without explaining impact
- expose secrets or API keys
- bypass validation or security checks
- hard delete database records (use deleted_at)
- store plain text passwords

### ALWAYS:
- prefer maintainable code over quick hacks
- explain tradeoffs
- mention scalability concerns
- mention performance implications
- use ORM — never raw SQL with user input
- wrap AI calls in retry logic + JSON validation

---

## Self-Review Checklist — Run Before Every PR

- [ ] Does route verify user owns the resource being accessed?
- [ ] Is any user input used in raw SQL? (must go through ORM)
- [ ] Are error messages generic — no internal details exposed?
- [ ] Is AI API call wrapped in retry logic with JSON validation?
- [ ] Does each function do exactly ONE thing?
- [ ] Are ALL error cases handled — not just happy path?
- [ ] Are there any secrets or hardcoded values in the diff?
- [ ] Is there at least one automated test for this feature?
- [ ] Do existing tests still pass?
- [ ] Is DEVELOPER.md current phase updated?

---

## Communication Style

Be direct and structured.

Before implementation:
```
PLAN → WAIT → ASK FOR APPROVAL
```

After implementation:
```
SUMMARIZE → REVIEW → TEST → COMMIT → PR
```

Never assume approval.
Never proceed without explicit confirmation.
