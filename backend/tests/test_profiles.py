from fastapi.testclient import TestClient

V1 = "/api/v1"


def _signup(client: TestClient, **overrides) -> str:
    payload = {
        "first_name": "Ama",
        "last_name": "Nurse",
        "phone": "+233200000001",
        "email": "ama@example.com",
        "password": "Supersecret1!",
        "role": "nurse",
    }
    payload.update(overrides)
    return client.post(f"{V1}/auth/signup", json=payload).json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_nurse_gets_own_profile(client: TestClient) -> None:
    token = _signup(client)
    resp = client.get(f"{V1}/nurses/me", headers=_auth(token))
    assert resp.status_code == 200
    body = resp.json()
    assert body["verification_status"] == "pending"
    assert body["nmc_pin_photo_url"] is None


def test_nurse_updates_profile_and_pin_photo(client: TestClient) -> None:
    token = _signup(client)
    resp = client.patch(
        f"{V1}/nurses/me",
        headers=_auth(token),
        json={
            "bio": "10 years neonatal care",
            "daily_rate": "150.00",
            "community": "East Legon",
            "nmc_pin_photo_url": "/uploads/nmc-abc.jpg",
        },
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["bio"] == "10 years neonatal care"
    assert body["community"] == "East Legon"
    # The NMC PIN is now a photo, not a number.
    assert body["nmc_pin_photo_url"] == "/uploads/nmc-abc.jpg"
    assert "nmc_pin" not in body


def test_mother_profile_crud(client: TestClient) -> None:
    token = _signup(client, phone="+233200000003", email="mum@example.com", role="mother")
    got = client.get(f"{V1}/mothers/me", headers=_auth(token))
    assert got.status_code == 200

    upd = client.patch(
        f"{V1}/mothers/me",
        headers=_auth(token),
        json={"community": "Osu", "number_of_children": 2, "children_notes": "peanut allergy"},
    )
    assert upd.status_code == 200
    body = upd.json()
    assert body["community"] == "Osu"
    assert body["number_of_children"] == 2


def test_role_enforcement(client: TestClient) -> None:
    mother_token = _signup(client, phone="+233200000004", email="m2@example.com", role="mother")
    # A mother cannot access nurse endpoints.
    assert client.get(f"{V1}/nurses/me", headers=_auth(mother_token)).status_code == 403
