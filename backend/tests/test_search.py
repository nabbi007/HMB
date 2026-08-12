from fastapi.testclient import TestClient

from app.models.nurse_profile import NurseProfile, VerificationStatus
from tests.conftest import TestingSessionLocal

V1 = "/api/v1"
# Central Accra
LAT, LNG = 5.6037, -0.1869


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _make_nurse(client: TestClient, phone: str, email: str, *, verified: bool, **profile) -> None:
    token = client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Nurse",
            "last_name": email[:3],
            "phone": phone,
            "email": email,
            "password": "Supersecret1!",
            "role": "nurse",
        },
    ).json()["access_token"]
    body = {"latitude": LAT, "longitude": LNG, **profile}
    client.patch(f"{V1}/nurses/me", headers=_auth(token), json=body)
    if verified:
        db = TestingSessionLocal()
        try:
            p = db.query(NurseProfile).order_by(NurseProfile.created_at.desc()).first()
            p.verification_status = VerificationStatus.verified
            db.commit()
        finally:
            db.close()


def _mother_token(client: TestClient) -> str:
    return client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Efua",
            "last_name": "Mother",
            "phone": "+233200000090",
            "email": "efua@example.com",
            "password": "Supersecret1!",
            "role": "mother",
        },
    ).json()["access_token"]


def test_search_returns_verified_nearby_nurse(client: TestClient) -> None:
    _make_nurse(
        client,
        "+233200000091",
        "n1@example.com",
        verified=True,
        languages=["English", "Twi"],
        care_type="Postpartum",
    )
    token = _mother_token(client)
    resp = client.get(f"{V1}/nurses/search", headers=_auth(token), params={"lat": LAT, "lng": LNG})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["languages"] == ["English", "Twi"]


def test_search_obfuscates_location(client: TestClient) -> None:
    _make_nurse(client, "+233200000097", "obf@example.com", verified=True)
    token = _mother_token(client)
    r = client.get(
        f"{V1}/nurses/search", headers=_auth(token), params={"lat": LAT, "lng": LNG}
    ).json()[0]
    # Never the exact stored point, but within ~1km of it.
    assert (r["lat"], r["lng"]) != (LAT, LNG)
    assert abs(r["lat"] - LAT) < 0.01 and abs(r["lng"] - LNG) < 0.01


def test_search_excludes_unverified(client: TestClient) -> None:
    _make_nurse(client, "+233200000092", "n2@example.com", verified=False)
    token = _mother_token(client)
    resp = client.get(f"{V1}/nurses/search", headers=_auth(token), params={"lat": LAT, "lng": LNG})
    assert resp.json() == []


def test_search_language_filter(client: TestClient) -> None:
    _make_nurse(client, "+233200000093", "n3@example.com", verified=True, languages=["Ga"])
    token = _mother_token(client)
    hit = client.get(
        f"{V1}/nurses/search",
        headers=_auth(token),
        params={"lat": LAT, "lng": LNG, "language": "Ga"},
    )
    assert len(hit.json()) == 1
    miss = client.get(
        f"{V1}/nurses/search",
        headers=_auth(token),
        params={"lat": LAT, "lng": LNG, "language": "French"},
    )
    assert miss.json() == []


def test_nurse_detail_page(client: TestClient) -> None:
    token = client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Ama",
            "last_name": "Detail",
            "phone": "+233200000095",
            "email": "nd@example.com",
            "password": "Supersecret1!",
            "role": "nurse",
        },
    ).json()["access_token"]
    h = _auth(token)
    uid = client.get(f"{V1}/auth/me", headers=h).json()["id"]
    client.patch(
        f"{V1}/nurses/me",
        headers=h,
        json={"community": "Osu", "languages": ["English"]},
    )

    db = TestingSessionLocal()
    try:
        p = db.query(NurseProfile).order_by(NurseProfile.created_at.desc()).first()
        p.verification_status = VerificationStatus.verified
        db.commit()
    finally:
        db.close()

    mom = _mother_token(client)
    detail = client.get(f"{V1}/nurses/{uid}", headers=_auth(mom))
    assert detail.status_code == 200
    body = detail.json()
    assert body["community"] == "Osu"
    assert body["languages"] == ["English"]
    assert body["is_available"] is True

    # Unknown id → 404.
    missing = client.get(f"{V1}/nurses/00000000-0000-0000-0000-000000000000", headers=_auth(mom))
    assert missing.status_code == 404


def test_unverified_nurse_detail_hidden(client: TestClient) -> None:
    token = client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Zoe",
            "last_name": "Pending",
            "phone": "+233200000096",
            "email": "zp@example.com",
            "password": "Supersecret1!",
            "role": "nurse",
        },
    ).json()["access_token"]
    uid = client.get(f"{V1}/auth/me", headers=_auth(token)).json()["id"]
    mom = _mother_token(client)
    # Not verified → not visible.
    assert client.get(f"{V1}/nurses/{uid}", headers=_auth(mom)).status_code == 404


def test_search_radius_excludes_far(client: TestClient) -> None:
    _make_nurse(client, "+233200000094", "n4@example.com", verified=True)
    token = _mother_token(client)
    # Search from Kumasi (~200km away) with a small radius.
    resp = client.get(
        f"{V1}/nurses/search",
        headers=_auth(token),
        params={"lat": 6.6885, "lng": -1.6244, "radius_km": 10},
    )
    assert resp.json() == []
