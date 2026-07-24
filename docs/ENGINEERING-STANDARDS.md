# HMB — Engineering Standards

The rules every contributor follows. Kept short on purpose; where a tool can enforce a rule, the tool is the source of truth (pre-commit + CI), not this doc.

Repo topology: **two separate repos** — `hmb-backend` (FastAPI) and `hmb-frontend` (Next.js). Each has its own CI, pre-commit, and version history. This doc applies to both.

---

## 1. Git & branching

- **Default branch:** `main`. Always deployable. No direct pushes — protected.
- **Branch names:** `feat/HMB-11-signup-login`, `fix/HMB-42-booking-status`, `chore/...`, `docs/...`.
- **One ticket ≈ one branch ≈ one PR.** Keep PRs small (< ~400 lines diff where possible).
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`. Reference the ticket: `feat(auth): add JWT login (HMB-11)`.
- **PRs:** must pass CI, have a green review, and fill the PR template. Squash-merge to keep `main` history clean.
- **Never commit secrets.** `.env` is gitignored; only `.env.example` is tracked.

## 2. Code style & quality (enforced)

**Backend (Python):**
- **Ruff** for lint + format (config in `pyproject.toml`). Run on save + pre-commit + CI.
- **Type hints everywhere.** Public functions annotated. Pydantic models for all request/response bodies.
- No print debugging in committed code — use the logger.

**Frontend (TS/React):**
- **ESLint + Prettier**, TypeScript **strict** mode on. No `any` without a comment justifying it.
- Components small and typed; colocate component + styles + test.

## 3. Testing

- **Every PR that changes behavior adds/updates a test.** CI runs them; red blocks merge.
- Backend: `pytest`. At minimum a happy-path test per endpoint + auth/permission tests. Use a throwaway test DB.
- Frontend: component tests for core flows (auth, search, booking) with Vitest/RTL.
- Target ~70% coverage on business logic (services, not boilerplate). Don't chase 100%.

## 4. API design

- **REST, JSON, plural nouns:** `/nurses`, `/bookings/{id}`.
- **Version the API:** prefix routes with `/api/v1`.
- **Consistent errors:** always `{ "detail": "..." }` (FastAPI default); use correct status codes (400/401/403/404/409/422).
- **Validation at the edge:** Pydantic schemas validate every input. Never trust the client.
- **Pagination** on all list endpoints (`?limit=&offset=` or cursor). No unbounded queries.
- **OpenAPI** is the contract — keep `/docs` accurate; frontend generates its client types from it where possible.

## 5. Security (non-negotiable — real people & money involved)

- **Secrets** only via environment variables. Rotate the sample `JWT_SECRET` before any deploy.
- **Passwords** hashed with bcrypt/argon2 (passlib). Never logged, never returned.
- **Auth:** short-lived access tokens + refresh tokens. Enforce role checks (nurse/mother/admin) with FastAPI dependencies.
- **Location privacy:** exact coordinates are gated — obfuscated in public responses, revealed only to a matched+paid mother (HMB-34/36). Do the fuzzing server-side.
- **Rate-limit** auth + OTP endpoints (brute-force / SMS-cost abuse).
- **HTTPS only** in prod. Set CORS to known origins (no `*` in prod).
- **Webhooks** (Paystack) must verify the signature. Payment state changes are idempotent.
- **PII / uploads:** passport photos are sensitive — private buckets, presigned URLs, never public.
- **Dependency scanning:** enable Dependabot/`pip-audit` + `npm audit` in CI.

## 6. Database

- **All schema changes via Alembic migrations.** No manual edits to prod DB. Migrations are reviewed like code.
- **Index** foreign keys and columns you filter/sort on (location, rating, status).
- **No secrets or raw SQL string interpolation** — use the ORM / bound params.
- Every table has `created_at`; use UTC everywhere.

## 7. Config & environments (12-factor)

- Config comes from env, not code. Same image runs in dev/staging/prod with different envs.
- Three environments: **local** (docker compose), **staging** (test Paystack keys), **prod** (live keys).
- Never point local/staging at prod data or live payment keys.

## 8. Observability

- **Structured logging** (JSON in prod) with a request ID per call.
- **Sentry** for errors in both repos.
- Health endpoints (`/health`, `/health/db`) used by the host's uptime checks.

## 9. CI/CD (enforced in `.github/workflows/`)

- On PR: install → lint → type-check → test → build. All must pass.
- On merge to `main`: auto-deploy backend (Render) / frontend (Vercel) to staging; promote to prod manually or via tag.
- No merge with red CI. No skipping hooks (`--no-verify`) without team agreement.

## 10. Documentation

- Each repo's `README` explains: what it is, how to run, how to test, how to deploy.
- Architectural decisions worth remembering → short ADR note in `docs/adr/`.
- Keep `docs/BACKLOG.md` and `docs/MVP-PLAN.md` current as scope shifts.

---

### The short version
Small PRs, one ticket each · tests + CI green before merge · secrets in env only · validate every input · gate location & money carefully · migrations for all DB changes · let the tools (ruff/eslint/pre-commit/CI) do the enforcing.
