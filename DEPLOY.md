# Deploying HelloMamaBetter on an AWS EC2 spot instance

The whole stack runs in containers on one host via `docker-compose.prod.yml`:

```
                    ┌─────────────── EC2 spot instance ───────────────┐
  Internet ──80──►  │  web (nginx)                                     │
                    │    ├─ serves the React build (SPA)              │
                    │    ├─ /api/*     → api:8000  (same-origin)      │
                    │    └─ /uploads/* → api:8000                     │
                    │  api (FastAPI, uvicorn ×2)  ── volume: uploads  │
                    │  db  (Postgres/PostGIS)     ── volume: pgdata   │
                    └──────────────────────────────────────────────────┘
```

Only port 80 is public; `api` and `db` stay on the internal Docker network.

---

## ⚠️ Read first: spot instances and your data

A spot instance can be **reclaimed by AWS with a 2-minute warning**. By default its
root EBS volume is **deleted on termination — you lose the database and uploads.**
Pick one:

- **Simplest (demo-grade):** accept the risk. Fine for a short-lived demo; take a DB
  dump before anything important (see *Backups*).
- **Persist across interruptions (recommended):** request the spot as a **persistent**
  request with **interruption behavior = _stop_** (not terminate). The instance stops
  instead of being destroyed, and its EBS volume — with `pgdata`/`uploads` — survives
  until you start it again.
- **Most durable:** put the database on **managed Postgres (RDS or Supabase)** and set
  `DATABASE_URL` accordingly; keep only `api`/`web` on the spot instance. No schema
  changes needed.

---

## 1. Launch the instance

- **AMI:** Ubuntu 22.04 LTS (x86_64).
- **Type:** `t3.small` minimum (2 GB RAM — the frontend build OOMs on `t3.micro`;
  if you must use micro, add swap, see step 2).
- **Purchasing option:** Spot. For durability set *Persistent request* +
  *Interruption behavior: Stop* (see above).
- **Security group (inbound):**
  - `22/tcp` from **your IP only** (SSH)
  - `80/tcp` from anywhere
  - `443/tcp` from anywhere (only if you add HTTPS)
- **Key pair:** create/download so you can SSH in.

SSH in: `ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>`

## 2. Install Docker

```bash
sudo apt-get update && sudo apt-get install -y ca-certificates curl git
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
  https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker ubuntu && newgrp docker   # run docker without sudo
```

Optional swap (only for a 1 GB instance, so the build doesn't OOM):
```bash
sudo fallocate -l 2G /swapfile && sudo chmod 600 /swapfile && sudo mkswap /swapfile && sudo swapon /swapfile
```

## 3. Get the code and configure secrets

```bash
git clone <YOUR_REPO_URL> hmb && cd hmb

# Root infra/env
cp .env.example .env
nano .env            # set POSTGRES_PASSWORD, PUBLIC_ORIGIN (http://<EC2_PUBLIC_IP>), VITE_MAPBOX_TOKEN

# Backend runtime secrets
cp backend/.env.prod.example backend/.env.prod
nano backend/.env.prod   # set JWT_SECRET, PIN_*, and the Gmail SMTP password
```

Generate strong secrets (run locally or on the box with Python available):
```bash
python -c "import secrets; print('JWT_SECRET=' + secrets.token_urlsafe(48))"
python -c "from cryptography.fernet import Fernet; print('PIN_ENCRYPTION_KEY=' + Fernet.generate_key().decode())"
python -c "import secrets; print('PIN_INDEX_KEY=' + secrets.token_urlsafe(32))"
```

> `PIN_ENCRYPTION_KEY` must be set **before** any nurse saves a PIN — changing it later
> makes existing encrypted PINs unreadable.

## 4. Bring it up

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

This builds the images, starts Postgres, **runs `alembic upgrade head`** automatically,
then serves. Watch logs: `docker compose -f docker-compose.prod.yml logs -f api`.

## 5. Create an admin

```bash
docker compose -f docker-compose.prod.yml exec api \
  python scripts/create_admin.py --first-name Admin --last-name HMB \
  --email admin@hellomamabetter.com --phone +233XXXXXXXXX
```

## 6. Verify

```bash
curl -s http://<EC2_PUBLIC_IP>/api/v1/health          # {"status":"ok"}
curl -s http://<EC2_PUBLIC_IP>/api/v1/health/db       # {"status":"ok","postgis":...}
```
Open `http://<EC2_PUBLIC_IP>/` in a browser and run through signup → verify → book → pay.

---

## Redeploying after code changes

```bash
cd hmb && git pull
docker compose -f docker-compose.prod.yml up -d --build
```
Migrations run on api startup, so schema changes apply automatically.

## Backups (do this before anything you care about)

```bash
# Dump
docker compose -f docker-compose.prod.yml exec db pg_dump -U hmb hmb > hmb_$(date +%F).sql
# Uploaded files
docker run --rm -v hmb_uploads:/u -v "$PWD":/b alpine tar czf /b/uploads_$(date +%F).tgz -C /u .
```

## Adding HTTPS (recommended before real users)

Plain `http://<IP>` is fine to demo, but **browsers treat it as an insecure context**,
which disables the geolocation ("use my location") API and looks untrustworthy. To fix:

1. Point a domain's DNS **A record** at the instance's public IP.
2. Put **Caddy** in front (automatic Let's Encrypt certs). Minimal `Caddyfile`:
   ```
   app.hellomamabetter.com {
       reverse_proxy web:80
   }
   ```
   Add a `caddy` service to the compose file (ports 80/443) that depends on `web`, stop
   publishing `web`'s port 80, and set `PUBLIC_ORIGIN=https://app.hellomamabetter.com`.
   Ping me and I'll wire this into `docker-compose.prod.yml` for you.
