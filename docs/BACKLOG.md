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

**HMB-11 · Signup + login (JWT) — (M) BE — ✅ DONE**
- Story: As a user, I can register and log in.
- Endpoints (under `/api/v1`): `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`.
- Done when: passwords hashed (bcrypt/argon2); access + refresh tokens issued; `me` returns current user.
- Built: `app/api/auth.py`, `app/schemas/auth.py`, `app/api/deps.py`, JWT in `app/core/security.py` (switched passlib→bcrypt direct — passlib breaks on bcrypt 4.x). Signup restricted to nurse/mother (admin → 422), auto-creates the matching profile, login by phone OR email, refresh rotates tokens & rejects access tokens. **16 tests pass** against live Postgres; migrations verified up/down; admin login validated end-to-end.

**HMB-12 · OTP verification — (M) BE — ✅ DONE (email channel)**
- Story: As a user, I verify my account with a one-time code.
- Endpoints (auth-required, under `/api/v1`): `POST /auth/otp/request`, `POST /auth/otp/verify`.
- Done when: OTP delivered; code expires; account marked verified.
- Built: **email OTP via SMTP** — dev delivers to **Mailpit** (docker-compose, UI at :8025), prod swaps `SMTP_*` for a real provider. `otp_codes` table (migration `0004`), codes stored **hashed**, 10-min expiry, 5-attempt limit, 30s resend cooldown. `app/services/email.py` (stdlib smtplib, no new dep). Sets `phone_verified` = "contact verified". **Validated live through Mailpit** + unit tests (`tests/test_otp.py`).
- CHANNEL NOTE: chose email/Mailpit over SMS (Hubtel/Twilio) — free for dev, no provider setup. Swap to SMS later by changing only the delivery function. `phone_verified` currently means "contact verified" regardless of channel.

**HMB-13 · Password reset — (S) BE — ✅ DONE**
- Endpoints: `POST /auth/password/forgot`, `POST /auth/password/reset`.
- Done when: reset via OTP or email link; token single-use + expiring.
- Built: emailed reset code (reuses `otp_codes` with `purpose="reset"`, expiring, single-use, attempt-limited); forgot is anti-enumeration (always 200); reset sets a new hashed password. Frontend `/forgot-password` (2-step) + "Forgot password?" link. **Password rule (6+ chars, 1 number, 1 special)** enforced in `app/core/security.py:password_error` across signup, reset, and `create_admin`; frontend mirrors it (`lib/password.ts` + `PasswordChecklist`). Verified live via Mailpit; 30 backend tests pass.

**HMB-14 · Role-based access control — (S) BE — ✅ DONE (built alongside HMB-11)**
- Done when: dependency guards enforce nurse/mother/admin on protected routes; unauthorized → 403.
- Built in `app/api/deps.py`: `get_current_user` (401 on bad/missing token), `require_role(*roles)` factory (403), and `require_verified_nurse` (dashboard-yes / tasks-no — the gate we designed for HMB-20). Ready to drop onto endpoints as they're built.

**HMB-15 · FE: auth screens — (M) FE — ✅ DONE (core)**
- Done when: signup, login, OTP, forgot-password screens work on mobile; validation + error states shown.
- Built: `src/lib/api.ts` (typed fetch client) + auth-backed `role-context` (real `login`/`signup`/`logout`, loads `/auth/me`). Onboarding→Signup(role+phone)→backend; Login by phone/email; error states shown. Backend `/auth/me` now returns nurse `verification_status`, which drives the real verification gate. TODO (deferred): OTP + forgot-password UI screens (endpoints exist).

**HMB-16 · FE: session handling — (M) FE — ✅ DONE (core)**
- Done when: tokens stored securely; auto-refresh on expiry; protected routes redirect to login; logout clears session.
- Built: access/refresh tokens in localStorage; on load resolves the user via `/auth/me`; `RequireAuth` guard redirects unauthenticated users to `/login`; `logout` clears session. TODO (deferred): silent token auto-refresh on 401 (refresh endpoint exists; currently a failed `/me` just logs out).

---

### EPIC 2 — Profiles

**HMB-20 · Profile models + migrations — (S) BE — ✅ DONE**
- Done when: `nurse_profiles` (photo_url, bio, job_description, daily_rate, location geo point, community, verification_status, avg_rating) and `mother_profiles` (location, community, children_info) created.
- Built (nurse): `app/models/nurse_profile.py` + migration `0002_nurse_profiles`. Verification lifecycle `pending→verified/rejected` (starts pending, invisible to search), `verified_at`/`verified_by_id` light audit. **NMC PIN** (Ghana Nursing & Midwifery Council reg number the nurse already holds) stored **encrypted** (reversible, so admin can read + check the register) via `app/core/crypto.py`, plus a keyed **blind index** for one-PIN-per-nurse uniqueness. Tests in `tests/test_crypto.py`.
- Built (mother): `app/models/mother_profile.py` + migration `0003_mother_profiles`. Minimal sensitive `number_of_children`/`children_notes` (API-gated, not public), `community`, plus `avg_rating`/`review_count` (reviews run both ways).
- Deferred: exact-location geo point → HMB-30; `require_verified_nurse` authorization gate → wired once auth (HMB-11) exists.

**HMB-21 · Photo/document upload — (M) BE — ✅ DONE (direct upload; presign = prod swap)**
- Story: As a nurse, I upload my passport photo and profile picture.
- Endpoint: `POST /api/v1/uploads` (auth, multipart) → validates type (JPG/PNG/WEBP/PDF) + size (≤5MB) → returns `{ url }`; caller saves it on the profile (`profile_photo_url`/`passport_photo_url` added to nurse update).
- Done when: upload works; type/size validated; URL stored on profile.
- Built: isolated `app/services/storage.py` (local dir in dev, served via StaticFiles at `/uploads`; swap this one file for R2/Supabase presign in prod). Frontend: Verification page uploads profile photo + ID and saves the URLs; Profile shows the photo. Tests in `tests/test_uploads.py`; live-verified (upload → save → served → 415 on bad type). NOTE: chose direct multipart upload over presign because there's no cloud bucket in dev — presign-to-R2 is a config swap later.

**HMB-22 · Nurse profile CRUD — (M) BE — ✅ DONE (me endpoints)**
- Endpoints: `GET/POST/PATCH /nurses/me`, `GET /nurses/{id}`.
- Done when: nurse can create/edit bio, rate, job description, location, community; new nurse defaults to `verification_status = pending`.
- Built: `GET/PATCH /api/v1/nurses/me` (`app/api/profiles.py`), role-guarded; NMC PIN accepted write-only → encrypted + blind-index uniqueness (409 on duplicate); PIN never returned (`has_pin` flag instead). Frontend Profile page loads + saves real data. Tests in `tests/test_profiles.py`. TODO: public `GET /nurses/{id}` (with HMB-31 search); exact location geo (HMB-30).

**HMB-23 · Mother profile CRUD — (S) BE — ✅ DONE**
- Endpoints: `GET/PATCH /api/v1/mothers/me`.
- Done when: mother can set location, community, and (optional) children info.
- Built: role-guarded `GET/PATCH /api/v1/mothers/me` (community, number_of_children, children_notes), wired to the frontend Profile page. Tests included.

**HMB-24 · FE: nurse onboarding + profile — (M) FE**
- Done when: multi-step nurse onboarding (details → photo → location) works on mobile; edit profile screen; "pending verification" banner shown until approved.

**HMB-25 · FE: mother onboarding + profile — (S) FE**
- Done when: mother sets location/community; edit profile screen.

---

## SPRINT 1 — Core loop (Week 2: Jul 29–Aug 4)
*Goal: a mother can find a nurse, book, and pay (sandbox); both get notified.*

### EPIC 3 — Search & discovery

**HMB-30 · Geo storage — (S) BE — ✅ DONE (lat/lng)**
- Done when: nurse location stored; usable for distance queries.
- Built: `latitude`/`longitude` (Numeric) on nurse_proHMB-24 · FE: nurse onboarding + profile — (M) FE

Done when: multi-step nurse onboarding (details → photo → location) works on mobile; edit profile screen; "pending verification" banner shown until approved.
HMB-25 · FE: mother onboarding + profile — (S) FE

Done when: mother sets location/community; edit profile screen.files + mother_profiles (migration `0005`), settable via the profile PATCH endpoints. Frontend `PlaceAutocomplete` (Mapbox Geocoding, Ghana-restricted) sets community + coords; parent Home map centers on the saved location. NOTE: stored as lat/lng columns, not a PostGIS geography point yet — HMB-31 search can use the Haversine formula or migrate to a PostGIS point + GIST index if distance perf needs it.

**HMB-31 · Nurse search endpoint — (L) BE — ✅ DONE (BE)**
- Story: As a mother, I see verified nurses near me, sortable by rating and distance.
- Endpoint: `GET /api/v1/nurses/search?lat=&lng=&radius_km=&min_rating=&language=&religion=&care_type=&limit=` (auth required).
- Done when: returns only verified + active nurses within radius; rating + values filters; sorted by distance.
- Built: Haversine distance, values-matching filters (language via ARRAY contains, religion, care_type), returns approximate community location only. **Values attributes** added to nurse profile (`languages`/`religion`/`care_type`, migration `0007`) + editable in the Profile nurse form. Tests in `tests/test_search.py`; live-verified (nurse appears at 0.9 km; Twi→hit, French→miss).

**HMB-32 · FE: search screen — (M) FE — ✅ DONE**
- Done when: mother sets/uses her location; filters; results list + map markers with name, rate, rating, distance.
- Built: `pages/Home.tsx` rewritten to fetch `/nurses/search` (centred on the mother's saved location, else Accra), render real nurses as **map markers + a list** (photo or initials), with a **search box** and **care-type filter chips**; each result links to the detail page (HMB-33). Demo seed `scripts/seed_demo.py` creates 5 verified Accra nurses. Live-verified: 6 nurses returned + rendered.

**HMB-33 · FE: nurse detail page — (M) FE — ✅ DONE**
- Built: `pages/CaregiverProfile.tsx` fetches `GET /api/v1/nurses/{id}` (new public endpoint) — photo, rating, care type, community, languages, rate, bio, empty-reviews state, and a **Book** CTA (booking flow is HMB-40). Tests in `tests/test_search.py`.

**HMB-NEW · Children profiles — ✅ DONE**
- `children` table (migration `0006`) + `GET/POST/PATCH/DELETE /api/v1/mothers/me/children` (role-guarded, ownership-checked). Frontend "My children" section in the mother's Profile (add/list/delete). Tests in `tests/test_children.py`.

**HMB-33 · FE: nurse detail page — (M) FE — ✅ DONE** (see also the entry under EPIC 2)
- Real detail page (`GET /nurses/{id}`): photo, rate, community, languages, bio, reviews empty-state, working Book CTA.

**HMB-34 · Approximate-location data for map — (M) BE — ✅ DONE (search half)**
- Done: search results return an **obfuscated** point — each nurse's coordinate deterministically jittered ~300–500m (`_obfuscate` in `app/api/profiles.py`); **distance is computed from the true point**, marker is never precise. Verified live (~390m offset). Nurses already set only a community centroid via place autocomplete, so no exact home is stored anyway. Test in `tests/test_search.py`.
- Deferred: the "exact coordinate only after confirmed+paid" half → needs payments (HMB-36).

**HMB-35 · FE: map view of caretakers — (L) FE — ✅ DONE (Mapbox; point markers)**
- Done: map centered on the mother's location; verified nurses as markers (at the obfuscated point) + a synced list; tap → detail; mobile. Deviations from ticket: **Mapbox** (team choice + token), not Leaflet/OSM; point markers, not shaded areas.

**HMB-36 · FE: exact location after booking — (S) FE — ⛔ BLOCKED (needs payments)**
- Needs a `confirmed + paid` booking state (payments deferred) AND collecting a nurse's exact address separately (not currently gathered). Do after payments.

---

### EPIC 4 — Bookings

**HMB-40/41/42 · Booking request + lifecycle — (M) BE — ✅ DONE (slim; payment deferred)**
- Built: `bookings` table (migration `0009`) with status `requested → accepted/declined/cancelled/completed`; `app/api/bookings.py` — `POST /bookings` (mother; nurse must be verified+active; stores flat daily-rate `estimated_amount`), `GET /bookings` (role-scoped), `POST /bookings/{id}/accept|decline` (nurse), `POST /bookings/{id}/cancel` (mother), with 403/404/409 guards. Emails both parties (Mailpit). Tests in `tests/test_bookings.py` (8). Live-verified request→accept→both see it.
- Deferred to payments: escrow hold, `hmb_fee` (10%), `confirm/start/complete`, real amount from days×rate.

**HMB-43 · Booking notifications — (M) BE — ✅ DONE (email; SMS later)**
- Email on request (→ nurse) and accept/decline (→ mother) via the existing SMTP/Mailpit service. SMS (Hubtel/Twilio) is the prod channel swap.

**HMB-44 · FE: booking request flow — (M) FE — ✅ DONE**
- Built: **Book** CTA on the nurse detail page opens an inline request form (date, start time, hours, note) → `POST /bookings` → redirects to Bookings. (Price×10% breakdown lands with payments.)

**HMB-45 · FE: booking dashboards — (M) FE — ✅ DONE**
- Built: mother's **Bookings** page lists her bookings + statuses (+ cancel); nurse dashboard **Requests** tab shows real incoming bookings with **Accept/Decline** (replacing the mock). Both live-verified.

**HMB-NEW · Messaging / chat — ✅ DONE (was v2)**
- `messages` table (migration `0010`) + `app/api/messages.py`: `GET /conversations`, `GET/POST /conversations/{other_id}/messages`. **Gated** — you can only message someone you share a booking with (403 otherwise); opening a thread marks incoming read (unread counts). Frontend `pages/Chat.tsx` rewritten to real conversations + thread + composer (polls for replies); **Message** entry points on the mother's Bookings and the nurse's Requests. Tests in `tests/test_messages.py` (5). Live-verified: no-booking 403 → booking → two-way thread + unread.

---

### EPIC 5 — Payments (start)

> **Built against a SIMULATED gateway** (`app/services/payments.py`) — one swappable module. The full state machine (charge → held → released/refunded, 10% fee) is real and DB-backed; only the provider calls are mocked. Swapping in Paystack = replacing that module's bodies + adding init/verify/webhook plumbing. No keys were available, and live MoMo payouts need Paystack business (transfer) verification regardless.

**HMB-50 · Charge for a booking — (L) BE — ✅ DONE (simulated)**
- `POST /bookings/{id}/pay` (mother): charges an **accepted** booking via the gateway, stores a `payments` row + provider ref. Paystack init/verify goes here later. 200/card selection is a Paystack-checkout concern deferred with real keys.

**HMB-51 · Hold funds on payment — (M) BE — ✅ DONE**
- On pay: `payments.status = held`, `hmb_fee` (10%) + `nurse_payout` computed and stored, booking moves **accepted → confirmed**; funds not released to nurse yet. Tests in `tests/test_payments.py`.

**HMB-52 · Paystack webhooks — (M) BE — ⏳ DEFERRED (needs real Paystack)**
- No async provider events with the simulated gateway (charge resolves inline). Add `POST /payments/webhook` (signature-verified, idempotent) when Paystack keys land.

**HMB-55 · FE: payment screen — (M) FE — ✅ DONE**
- Mother's Bookings: **Pay GHS x** on accepted bookings → confirmed/"paid" + "held securely" note; **Cancel & refund** on paid bookings. Caregiver dashboard: "awaiting payment" → **Mark visit complete** on confirmed, with payout (after-fee) shown. (Real Paystack checkout redirect replaces the inline Pay button later.)

---

## SPRINT 2 — Money-out, reviews, trust, launch (Week 3: Aug 5–12)
*Goal: close the loop — payout, reviews, admin, then ship.*

### EPIC 5 — Payments (finish)

**HMB-53 · Payout to nurse + 10% fee — (L) BE — ✅ DONE (simulated release)**
- `POST /bookings/{id}/complete` (nurse): booking `confirmed → completed`, payment `held → released`, `nurse_payout` (amount − 10% fee) recorded with a payout ref. Real Paystack **Transfer to MoMo** replaces `gateway.payout()` once the account is transfer-verified.
- MVP = single release on completion (no milestone split — v2).

**HMB-54 · Refund / cancellation path — (M) BE — ✅ DONE (simulated refund)**
- Mother cancelling a **confirmed** booking: payment `held → refunded`, booking → `cancelled`, refund email sent. Real Paystack refund replaces `gateway.refund()`.

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

**HMB-70 · Admin: nurse verification — (M) BE — ✅ DONE (BE + FE)**
- Story: As an admin, I review a nurse's docs and approve/reject them.
- Endpoints: `GET /api/v1/admin/nurses?status=`, `POST /api/v1/admin/nurses/{id}/verify|reject` (admin-only).
- Done when: approve flips nurse to verified (appears in search); reject notifies with reason.
- Built: `app/api/admin.py` — list returns the **decrypted NMC PIN** (admin-only) + doc links; verify/reject set status + `verified_by`/`reason` and **email the nurse** (Mailpit). Frontend `pages/AdminDashboard.tsx` at `/admin` (admins routed there on login; page guards on `isAdmin`) — pending/verified/rejected tabs, per-nurse review card, Verify + Reject-with-reason. Tests in `tests/test_admin.py`. Live-verified: admin sees pending PIN → verify → nurse appears in search. Admin login: **admin@hmb.app / Adminpass1!**.

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
