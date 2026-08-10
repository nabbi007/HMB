import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, text
from sqlalchemy.engine import make_url
from sqlalchemy.orm import sessionmaker

import app.models  # noqa: F401  (register models on Base.metadata)
from app.core.config import settings
from app.db.base import Base
from app.db.session import get_db
from app.main import app


def _test_database_url() -> str:
    """Derive an isolated test DB so tests never touch the dev database.

    Uses `<db>_test` (unless already suffixed) and creates it if missing.
    """
    url = make_url(settings.database_url)
    name = url.database or "hmb"
    if not name.endswith("_test"):
        name = f"{name}_test"
    test_url = url.set(database=name)

    admin_engine = create_engine(url.set(database="postgres"), isolation_level="AUTOCOMMIT")
    with admin_engine.connect() as conn:
        exists = conn.execute(
            text("SELECT 1 FROM pg_database WHERE datname = :n"), {"n": name}
        ).scalar()
        if not exists:
            conn.execute(text(f'CREATE DATABASE "{name}"'))
    admin_engine.dispose()
    return test_url.render_as_string(hide_password=False)


engine = create_engine(_test_database_url())
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


def _override_get_db():
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = _override_get_db


@pytest.fixture(scope="session", autouse=True)
def _create_schema():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    yield
    Base.metadata.drop_all(engine)


@pytest.fixture(autouse=True)
def _clean_tables():
    """Empty every table after each test so tests stay independent."""
    yield
    with engine.begin() as conn:
        for table in reversed(Base.metadata.sorted_tables):
            conn.execute(table.delete())


@pytest.fixture
def client() -> TestClient:
    return TestClient(app)
