# HMB — Full MVP Backlog (Web App, Mobile-Responsive)

Everything that must be built, in build order, to reach MVP by **2026-08-12**.

**Format:** each ticket has an ID, a user story, acceptance criteria, and the concrete work (endpoints/screens).
**Sizes:** S = <½ day · M = ~1 day · L = ~2–3 days.
**Roles:** BE backend · FE frontend · DO devops · PM/Design.
**Rule:** a ticket is "done" only when its acceptance criteria pass end-to-end (not "code written").

Build order = top to bottom. Later epics depend on earlier ones.

---

## SPRINT 0 — Foundations (Week 1: Jul 22–28)
*Goal: a deployed skeleton, auth, and DB so feature work has ground to stand on.*

### EPIC 0 — Project & infra setup

**HMB-1 · Monorepo scaffold — (S) DO**
- Story: As a dev, I want a clean repo layout so everyone knows where code goes.
- Done when: `backend/`, `frontend/`, `docs/` exist; READMEs explain how to run each; `.gitignore` set.

**HMB-2 · Local dev with Docker Compose — (M) DO**
- Story: As a dev, I want `docker compose up` to give me API + Postgres/PostGIS locally.
- Done when: FastAPI hot-reloads; Postgres has PostGIS extension enabled; connection works from the API.

**HMB-3 · Backend project skeleton — (M) BE**
- Story: As a dev, I want the FastAPI app structured (api/core/models/schemas/services/db) with health check.
- Done when: `GET /health` returns 200; config loads from env; SQLAlchemy session + Alembic wired.

**HMB-4 · Frontend project skeleton (Next.js PWA) — (M) FE**
- Story: As a dev, I want a Next.js app, mobile-first, installable as a PWA.
- Done when: app runs; manifest + service worker present; base layout is responsive; API client configured.

**HMB-5 · CI pipeline — (M) DO — ✅ DONE**
- Story: As a team, I want lint + tests to run on every push/PR.
- Done when: GitHub Actions runs backend (ruff + pytest) and frontend (lint + build) on PR; red blocks merge.
- Built: `backend/.github/workflows/ci.yml` + `frontend/.github/workflows/ci.yml`. NOTE: commit `frontend/package-lock.json` (from `npm install`) or the frontend `npm ci` step fails.

**HMB-6 · Deploy skeleton to prod — ⏸️ OUT / UNDECIDED**
- Deferred: hosting not chosen yet. Revisit before launch week. No deploy config committed.
- (When ready: pick host + region, connect repos, set env vars, provision managed Postgres.)

**HMB-7 · Error monitoring + logging — (S) DO — ✅ DONE**
- Done when: Sentry catches backend + frontend errors; structured request logging on the API.
- Built: backend structured JSON logging + per-request `X-Request-ID` (`app/core/logging.py`, middleware in `app/main.py`); backend + frontend Sentry wired, dormant until a DSN is set.

---

### EPIC 1 — Auth & accounts

**HMB-10 · User model + roles — (S) BE — ✅ DONE**
- Done when: `users` table with role enum (nurse|mother|admin), phone, email, password_hash, timestamps; migration applied.
- Built: `app/models/user.py` (UUID id, role enum, phone-first identity, `is_active`, `phone_verified`), migration `0001_users`, password hashing `app/core/security.py`, controlled admin creation `scripts/create_admin.py` (admins never self-register). Tests in `tests/test_security.py`.

**HMB-11 · Signup + login (JWT) — (M) BE**
- Story: As a user, I can register and log in.
- Endpoints: `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`.
- Done when: passwords hashed (bcrypt/argon2); access + refresh tokens issued; `me` returns current user.

**HMB-12 · Phone OTP verification — (M) BE**
- Story: As a user, I verify my phone so bookings reach me by SMS.
- Endpoints: `POST /auth/otp/request`, `POST /auth/otp/verify`.
- Done when: OTP sent via Hubtel/Twilio; code expires (5 min); phone marked verified.

**HMB-13 · Password reset — (S) BE**
- Endpoints: `POST /auth/password/forgot`, `POST /auth/password/reset`.
- Done when: reset via OTP or email link; token single-use + expiring.

**HMB-14 · Role-based access control — (S) BE**
- Done when: dependency guards enforce nurse/mother/admin on protected routes; unauthorized → 403.

**HMB-15 · FE: auth screens — (M) FE**
- Done when: signup, login, OTP, forgot-password screens work on mobile; validation + error states shown.

**HMB-16 · FE: session handling — (M) FE**
- Done when: tokens stored securely; auto-refresh on expiry; protected routes redirect to login; logout clears session.

---

### EPIC 2 — Profiles

**HMB-20 · Profile models + migrations — (S) BE — ✅ DONE**
- Done when: `nurse_profiles` (photo_url, bio, job_description, daily_rate, location geo point, community, verification_status, avg_rating) and `mother_profiles` (location, community, children_info) created.
- Built (nurse): `app/models/nurse_profile.py` + migration `0002_nurse_profiles`. Verification lifecycle `pending→verified/rejected` (starts pending, invisible to search), `verified_at`/`verified_by_id` light audit. **NMC PIN** (Ghana Nursing & Midwifery Council reg number the nurse already holds) stored **encrypted** (reversible, so admin can read + check the register) via `app/core/crypto.py`, plus a keyed **blind index** for one-PIN-per-nurse uniqueness. Tests in `tests/test_crypto.py`.
- Built (mother): `app/models/mother_profile.py` + migration `0003_mother_profiles`. Minimal sensitive `number_of_children`/`children_notes` (API-gated, not public), `community`, plus `avg_rating`/`review_count` (reviews run both ways).
- Deferred: exact-location geo point → HMB-30; `require_verified_nurse` authorization gate → wired once auth (HMB-11) exists.

**HMB-21 · Photo/document upload — (M) BE**
- Story: As a nurse, I upload my passport photo and profile picture.
- Endpoints: `POST /uploads/presign`, then direct upload to R2/Supabase.
- Done when: presigned URL flow works; file type/size validated; URL stored on profile.

**HMB-22 · Nurse profile CRUD — (M) BE**
- Endpoints: `GET/POST/PATCH /nurses/me`, `GET /nurses/{id}`.
- Done when: nurse can create/edit bio, rate, job description, location, community; new nurse defaults to `verification_status = pending`.

**HMB-23 · Mother profile CRUD — (S) BE**
- Endpoints: `GET/POST/PATCH /mothers/me`.
- Done when: mother can set location, community, and (optional) children info.

**HMB-24 · FE: nurse onboarding + profile — (M) FE**
- Done when: multi-step nurse onboarding (details → photo → location) works on mobile; edit profile screen; "pending verification" banner shown until approved.

**HMB-25 · FE: mother onboarding + profile — (S) FE**
- Done when: mother sets location/community; edit profile screen.

---

## SPRINT 1 — Core loop (Week 2: Jul 29–Aug 4)
*Goal: a mother can find a nurse, book, and pay (sandbox); both get notified.*

### EPIC 3 — Search & discovery

**HMB-30 · Geo storage (PostGIS) — (S) BE**
- Done when: nurse location stored as geography point; index added for distance queries.

**HMB-31 · Nurse search endpoint — (L) BE**
- Story: As a mother, I see verified nurses near me, sortable by rating and distance.
- Endpoint: `GET /nurses/search?lat=&lng=&radius_km=&min_rating=&sort=`.
- Done when: returns only verified nurses within radius; supports rating filter; paginated; sorted by distance/rating.

**HMB-32 · FE: search screen — (M) FE**
- Done when: mother sets/uses her location; filters (radius, rating); results list with photo, name, rate, rating, distance.

**HMB-33 · FE: nurse detail page — (M) FE**
- Done when: full nurse profile with reviews, rate, community, and a "Book" CTA.

**HMB-34 · Approximate-location data for map — (M) BE**
- Story: As a nurse, my exact home isn't exposed publicly; browsers see only my rough area.
- Done when: search results return an **obfuscated** location (community centroid, or the real point snapped/jittered to ~300–500m) + distance — never the precise coordinate. Exact coordinate is only returned to a mother on a booking that is `confirmed` and paid.

**HMB-35 · FE: map view of caretakers — (L) FE**
- Story: As a mother, I see nearby verified nurses on a map so I can pick by area.
- Done when: Leaflet + OpenStreetMap map centered on the mother's location; nurses shown as **approximate markers / shaded areas** (from HMB-34), not exact pins; tap a marker → nurse summary card → open detail; map and list views stay in sync; works on mobile.

**HMB-36 · FE: exact location after booking — (S) FE**
- Done when: once a booking is confirmed + paid, that mother sees the nurse's exact location + directions link; nobody else does.

---

### EPIC 4 — Bookings

**HMB-40 · Booking model + state machine — (M) BE**
- Done when: `bookings` table (mother_id, nurse_id, start_date, days, start_time, status, agreed_amount, hmb_fee, timestamps); status flow `requested→confirmed→in_progress→completed` + `cancelled` enforced in code.

**HMB-41 · Create booking request — (M) BE**
- Story: As a mother, I request a nurse for N days starting on a date/time.
- Endpoint: `POST /bookings`.
- Done when: validates nurse is verified + available; computes agreed_amount (rate × days) and hmb_fee (10%); status `requested`.

**HMB-42 · Booking lifecycle transitions — (M) BE**
- Endpoints: `POST /bookings/{id}/confirm|start|complete|cancel`, `GET /bookings` (role-scoped), `GET /bookings/{id}`.
- Done when: only valid transitions allowed by the right role; nurse confirms; mother/nurse can cancel per rules.

**HMB-43 · Booking notifications — (M) BE**
- Story: As a mother/nurse, I get SMS + email when a booking is requested/confirmed/completed.
- Done when: events trigger SMS (Hubtel/Twilio) + email; template includes booking details + location.

**HMB-44 · FE: booking request flow — (M) FE**
- Done when: from nurse detail, mother picks start date, days, start time, sees price + 10% breakdown, confirms.

**HMB-45 · FE: booking dashboards — (M) FE**
- Done when: mother sees her bookings + statuses; nurse sees incoming requests with confirm/decline; both see detail view.

---

### EPIC 5 — Payments (start)

**HMB-50 · Paystack charge (sandbox) — (L) BE**
- Story: As a mother, I pay for a booking with Mobile Money or card.
- Endpoints: `POST /payments/init`, `POST /payments/verify`.
- Done when: Paystack transaction initialized for booking amount; MoMo + card supported in sandbox; verify confirms success.

**HMB-51 · Hold funds on payment — (M) BE**
- Done when: on successful charge, `payments` row set to `held`; booking auto-moves `requested→confirmed`; funds not yet released to nurse.

**HMB-52 · Paystack webhooks — (M) BE**
- Endpoint: `POST /payments/webhook` (signature-verified).
- Done when: async success/failure events update payment + booking reliably; idempotent.

**HMB-55 · FE: payment screen — (M) FE**
- Done when: mother completes Paystack checkout from the booking; sees held/confirmed status after.

---

## SPRINT 2 — Money-out, reviews, trust, launch (Week 3: Aug 5–12)
*Goal: close the loop — payout, reviews, admin, then ship.*

### EPIC 5 — Payments (finish)

**HMB-53 · Payout to nurse + 10% fee — (L) BE**
- Story: When a booking completes, HMB keeps 10% and pays the nurse.
- Endpoint: triggered by `POST /bookings/{id}/complete`.
- Done when: on completion, fee retained, remainder transferred to nurse (Paystack Transfer to MoMo); payment → `released`; payout ref stored.
- Note: MVP = single release on completion (no half-day/milestone split — that's v2).

**HMB-54 · Refund / cancellation path — (M) BE**
- Done when: cancel before start refunds the held amount; payment → `refunded`; booking → `cancelled`; both notified.

---

### EPIC 6 — Reviews & reputation

**HMB-60 · Reviews model + endpoints — (M) BE**
- Story: After a completed booking, mother and nurse rate each other.
- Endpoints: `POST /bookings/{id}/reviews`, `GET /nurses/{id}/reviews`.
- Done when: review allowed only after `completed`; one review per party per booking; rating 1–5 + comment.

**HMB-61 · Rating aggregation — (S) BE**
- Done when: creating a review recomputes the target's avg_rating + review count; reflected in search.

**HMB-62 · FE: reviews — (M) FE**
- Done when: post-completion prompt to review; nurse detail page shows rating + review list.

---

### EPIC 7 — Admin & trust

**HMB-70 · Admin: nurse verification — (M) BE**
- Story: As an admin, I review a nurse's docs and approve/reject them.
- Endpoints: `GET /admin/nurses?status=pending`, `POST /admin/nurses/{id}/verify|reject`.
- Done when: approve flips nurse to verified (appears in search); reject notifies with reason.

**HMB-71 · Admin: bookings & payments view — (S) BE**
- Endpoints: `GET /admin/bookings`, `GET /admin/payments`.
- Done when: admin can list/inspect bookings + payment statuses for support.

**HMB-72 · FE: admin dashboard — (M) FE**
- Done when: minimal internal dashboard: pending nurses queue with doc preview + approve/reject; bookings/payments table.

**HMB-73 · Legal pages — (S) PM**
- Done when: Terms of Service + Privacy Policy pages published and linked in signup + footer.

**HMB-74 · Support contact — (S) FE**
- Done when: visible support channel (WhatsApp/email/phone) + basic FAQ page.

---

### EPIC 8 — Launch prep

**HMB-80 · End-to-end loop test (sandbox) — (M) All**
- Done when: full journey passes — nurse signup→verify→search→book→pay(hold)→complete→payout→reviews — documented as a test script.

**HMB-81 · Polish: empty/error/loading states — (M) FE**
- Done when: every screen handles loading, empty, and error gracefully on mobile.

**HMB-82 · Production Paystack + business verification — (S) PM/DO**
- Done when: live keys installed; business verified so MoMo **payouts** work; webhook URL points to prod. *(Start this in Week 1 — approval takes time.)*

**HMB-83 · Seed nurses + soft launch — (M) PM**
- Done when: a handful of real, verified nurses in one pilot community; small group of mothers invited.

**HMB-84 · Bug bash + go/no-go — (M) All**
- Done when: team runs through app on real phones; blocker list triaged; go/no-go decision made.

---

## Dependency map (what blocks what)

```
Sprint 0: HMB-1..7  →  HMB-10..16 (auth)  →  HMB-20..25 (profiles)
                                                   │
Sprint 1:            HMB-30..33 (search) ──────────┤
                     HMB-40..45 (bookings) ────────┤
                     HMB-50,51,52,55 (pay-in) ──────┘
                                                   │
Sprint 2:            HMB-53,54 (pay-out) ──────────┤ (needs bookings + pay-in)
                     HMB-60..62 (reviews) ─────────┤ (needs completed bookings)
                     HMB-70..74 (admin/trust) ─────┤ (verification gates search)
                     HMB-80..84 (launch) ──────────┘
```

Critical path: **auth → profiles → search → bookings → payments → payout → launch.**
Reviews and admin can be built in parallel once bookings exist. Start **HMB-82 (Paystack business verification) in Week 1** — it's the longest external lead time.

---

## Definition of Done (applies to every ticket)
- Acceptance criteria pass end-to-end (not just "code compiles").
- Works on a real phone screen (mobile-first).
- Has at least a happy-path test (BE) / renders without console errors (FE).
- Merged via PR with CI green.
- Handles the obvious error case (bad input, not-found, unauthorized).

---

## v2 backlog (explicitly NOT in MVP — do not build yet)
- In-app chat between mother and nurse
- Automated KYC / identity verification
- Milestone / half-day escrow payouts
- Smart matching / recommendation engine
- Customer protection program
- Native iOS/Android apps
- Multi-city rollout & analytics tooling
- Availability calendar / recurring bookings
