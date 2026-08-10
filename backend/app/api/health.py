from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.session import get_db

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@router.get("/health/db")
def health_db(db: Session = Depends(get_db)) -> dict[str, str]:
    """Confirms the DB connection. PostGIS is optional (the schema uses lat/lng, not geometry)."""
    db.execute(text("SELECT 1"))
    try:
        postgis = str(db.execute(text("SELECT PostGIS_Version()")).scalar())
    except Exception:  # noqa: BLE001 - PostGIS not installed is fine
        postgis = "unavailable"
    return {"status": "ok", "postgis": postgis}
