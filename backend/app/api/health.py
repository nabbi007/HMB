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
    """Confirms the DB connection and that PostGIS is available."""
    db.execute(text("SELECT 1"))
    postgis = db.execute(text("SELECT PostGIS_Version()")).scalar()
    return {"status": "ok", "postgis": str(postgis)}
