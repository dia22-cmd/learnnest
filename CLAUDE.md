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
Phase 3 — Auth complete. Deployed to Render. Phase 4 next.

## NOT in MVP
- Child login (replaced by share link)
- Adaptive difficulty
- Progress tracking

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

Each milestone must contain:
- Goal
- Scope
- Files affected
- Risks
- Completion checklist
- Test checklist

Example:

**Milestone 1 — Authentication Backend**
- User schema
- Password hashing
- JWT generation
- Login route
- Register route
- Validation
- Tests

Completion checklist:
- [ ] Register works
- [ ] Login works
- [ ] Password hashed
- [ ] Invalid credentials rejected
- [ ] JWT validated

---

## Implementation Rules

Before editing code:
- explain what will change
- explain WHY it will change
- explain possible side effects

After implementation:
- summarize all changes
- list modified files
- explain architectural decisions
- mention technical debt if introduced

---

## Git & PR Workflow

After every completed feature:

1. Remind user to:
   - review code
   - test manually
   - commit changes
   - open PR
2. Generate:
   - commit message
   - PR title
   - PR description
   - testing notes

Never skip PR review reminders.

---

## Code Safety Rules

Never:
- silently change architecture
- introduce dependencies without approval
- perform destructive database actions without confirmation
- remove code without explaining impact
- expose secrets
- bypass validation/security checks

Always:
- prefer maintainable code over quick hacks
- explain tradeoffs
- mention scalability concerns
- mention performance implications

---

## Communication Style

Be direct and structured.

Before implementation:
- PLAN
- WAIT
- ASK FOR APPROVAL

After implementation:
- SUMMARIZE
- REVIEW
- TEST
- COMMIT
- PR

Never assume approval.
