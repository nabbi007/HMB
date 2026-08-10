import logging
import os
import time
import uuid

import sentry_sdk
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api import admin, auth, bookings, health, messages, profiles, uploads
from app.core.config import settings
from app.core.logging import configure_logging, request_id_ctx

configure_logging()
logger = logging.getLogger("hmb.access")

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, environment=settings.environment)

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging(request: Request, call_next):
    """Assign a request id, log the access line with duration, echo id in the response."""
    rid = request.headers.get("X-Request-ID") or uuid.uuid4().hex[:12]
    token = request_id_ctx.set(rid)
    start = time.perf_counter()
    try:
        response = await call_next(request)
        duration_ms = (time.perf_counter() - start) * 1000
        logger.info(
            "%s %s -> %s (%.1fms)",
            request.method,
            request.url.path,
            response.status_code,
            duration_ms,
        )
        response.headers["X-Request-ID"] = rid
        return response
    except Exception:
        logger.exception("unhandled error %s %s", request.method, request.url.path)
        raise
    finally:
        request_id_ctx.reset(token)


app.include_router(health.router)
app.include_router(auth.router, prefix="/api/v1")
app.include_router(profiles.router, prefix="/api/v1")
app.include_router(uploads.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(bookings.router, prefix="/api/v1")
app.include_router(messages.router, prefix="/api/v1")

# Serve uploaded files in dev (prod would serve these from R2/Supabase/CDN).
os.makedirs(settings.upload_dir, exist_ok=True)
app.mount(settings.upload_base_url, StaticFiles(directory=settings.upload_dir), name="uploads")


@app.get("/")
def root() -> dict[str, str]:
    return {"app": settings.app_name, "docs": "/docs"}
