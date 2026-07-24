# HMB Backend (FastAPI)

## Run with Docker (recommended)

From the repo root:

```bash
docker compose up --build
```

- API: http://localhost:8000
- Interactive docs: http://localhost:8000/docs
- Postgres/PostGIS: localhost:5432 (user `hmb`, password `hmb`, db `hmb`)

## Run locally (without Docker)

```bash
cd backend
python -m venv .venv
# Windows PowerShell:
.venv\Scripts\Activate.ps1
# macOS/Linux:
# source .venv/bin/activate

pip install -r requirements.txt
cp .env.example .env   # then edit DATABASE_URL to point at your Postgres
uvicorn app.main:app --reload
```

You still need a Postgres **with PostGIS** running. Easiest is just the db service:

```bash
docker compose up db
```

## Health checks

- `GET /health` → `{"status": "ok"}`
- `GET /health/db` → confirms DB connectivity + PostGIS version

## Database migrations (Alembic)

Create a migration after adding/changing models:

```bash
alembic revision --autogenerate -m "add users table"
alembic upgrade head
```

Import new models in `alembic/env.py` so autogenerate can see them.

## Project layout

```
app/
  api/        # routers (health now; auth, nurses, bookings... next)
  core/       # config / settings
  db/         # Base, engine, session
  models/     # SQLAlchemy models (added in HMB-10+)
  schemas/    # Pydantic schemas
  services/   # paystack, sms, storage, geo (added later)
alembic/      # migrations
```

## Next tickets (Sprint 0)

- HMB-10 User model + roles
- HMB-11 Signup + login (JWT)
- HMB-12 Phone OTP
- HMB-20+ Profiles
