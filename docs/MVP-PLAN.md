# HelloMamaBetter (HMB) — MVP Plan

> "Your foster mother to walk you through life."
> Connecting unemployed nurses/midwives with working nursing mothers who need childcare support in their own communities.

**MVP deadline:** 2026-08-12 (~3 weeks)
**Team:** Backend/DevOps (you, FastAPI) + others (frontend, etc.)

---

## 1. Guiding principles for the MVP

1. **Ship one loop, end to end.** Nurse gets listed → Mother books → Payment held → Care happens → Payout + reviews. Nothing else matters until this works.
2. **Web PWA, not native apps.** Mobile-first responsive React app. Runs on every phone. Native comes in v2.
3. **Manual over automated where it's faster.** Admin verifies nurses by hand. No automated ID checks yet.
4. **Mobile Money first.** Most Ghanaian users pay with MoMo, not cards. Paystack handles this.
5. **Cut without guilt.** Chat, recommendations, protection program, milestone escrow → all v2.

---

## 2. Recommended stack

| Layer | Choice | Notes |
|---|---|---|
| Backend | **FastAPI (Python)** | Team strength. Async, great for this. |
| DB | **PostgreSQL + PostGIS** | Geo search: nurses near a mother. |
| ORM / migrations | **SQLAlchemy 2.0 + Alembic** | Standard, reliable. |
| Frontend | **Next.js (React) — mobile-first PWA** | Ships fast, installable on phones. |
| Auth | **JWT** (access + refresh) + **phone OTP** | OTP via Hubtel/Twilio. |
| Payments | **Paystack** | Ghana MoMo + cards. Hold → release flow. |
| SMS/OTP | **Hubtel** (Ghana) or Twilio | Booking notifications + OTP. |
| File storage | **Cloudflare R2** or Supabase Storage | Passport/profile photos (S3-compatible). |
| Backend host | **Render** or **Railway** | Docker, EU region for GH latency. |
| Frontend host | **Vercel** | Next.js native host. |
| CI/CD | **GitHub Actions** | Lint + test + deploy on push. |
| Errors/monitoring | **Sentry** (free tier) | Catch prod errors early. |

---

## 3. MVP scope

### IN
- Nurse: signup, profile (photo, location, bio, job description, rate), "pending verification" state.
- Mother: signup, profile.
- Search: browse/filter nurses by location (distance) + rating.
- Booking: mother picks nurse, number of days, start date/time → request created.
- Payment: Paystack charge, funds **held** by HMB.
- Notifications: SMS/email booking details to both parties.
- Complete booking: mark done → HMB takes 10% → payout to nurse.
- Reviews: both parties leave rating + review after completion.
- Admin: verify nurses, view bookings, handle support.

### OUT (v2 backlog)
- In-app chat/messaging
- Automated identity verification (KYC)
- Milestone / half-day escrow payouts (MVP = single hold + release)
- Recommendation engine
- Customer protection program
- Native iOS/Android apps

---

## 4. Data model (core tables)

- **users** — id, role (nurse|mother|admin), name, phone, email, password_hash, created_at
- **nurse_profiles** — user_id, photo_url, bio, job_description, hourly/daily_rate, location (PostGIS point), community/area, verification_status, avg_rating
- **mother_profiles** — user_id, location, community/area, children_info (optional)
- **bookings** — id, mother_id, nurse_id, start_date, days, start_time, status (requested|confirmed|in_progress|completed|cancelled), agreed_amount, hmb_fee, created_at
- **payments** — id, booking_id, paystack_ref, amount, status (pending|held|released|refunded), payout_ref
- **reviews** — id, booking_id, author_id, target_id, rating (1-5), comment, created_at

Booking status flow: `requested → confirmed → in_progress → completed` (+ `cancelled`).
Payment status flow: `pending → held → released` (+ `refunded`).

---

## 5. Three-week timeline

### Week 1 (Jul 22–28): Foundations
- Repo, monorepo layout, Docker, CI, deploy skeleton to Render + Vercel ("hello world" live).
- Auth: signup/login, JWT, phone OTP.
- DB schema + Alembic migrations. PostGIS enabled.
- Nurse & mother profile CRUD + photo upload.

### Week 2 (Jul 29–Aug 4): Core loop
- Nurse search endpoint (geo + rating filter) + frontend list/detail.
- Booking create + status transitions.
- Paystack integration: charge + hold (use sandbox).
- SMS/email notifications on booking events.
- Admin verify-nurse flow.

### Week 3 (Aug 5–12): Money, reviews, polish
- Complete booking → 10% fee calc → payout to nurse.
- Reviews + ratings; recompute avg_rating.
- End-to-end test of full loop in sandbox.
- Bug bash, empty/error states, basic legal (terms, privacy).
- Production Paystack keys, seed a few real nurses, soft launch.

---

## 6. Repo layout (suggested monorepo)

```
HMB/
  backend/            # FastAPI
    app/
      api/            # routers: auth, nurses, mothers, bookings, payments, reviews, admin
      core/           # config, security, deps
      models/         # SQLAlchemy models
      schemas/        # Pydantic schemas
      services/       # paystack, sms, storage, geo
      db/             # session, migrations (alembic)
    tests/
    Dockerfile
    pyproject.toml
  frontend/           # Next.js PWA
  docs/
    MVP-PLAN.md
    BACKLOG.md
  docker-compose.yml  # local: api + postgres(postgis)
  .github/workflows/
```

---

## 7. Risks & mitigations

| Risk | Mitigation |
|---|---|
| Payments/escrow complexity eats the timeline | MVP = single hold + release. No milestone splits. Use Paystack sandbox from day 1. |
| Scope creep from the feature list | Everything not in the core loop is v2. Guard it. |
| Trust & safety (real children involved) | Manual admin verification; clear terms; capture ID doc even if checked by hand. |
| Only 3 weeks | Web PWA (not native), managed hosting, buy don't build (Paystack/Hubtel/Supabase). |
| MoMo payout mechanics | Confirm Paystack Transfers/payout to MoMo is enabled for your account early — it needs business verification. |
