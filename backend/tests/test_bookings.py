from fastapi.testclient import TestClient

from app.models.nurse_profile import NurseProfile, VerificationStatus
from tests.conftest import TestingSessionLocal

V1 = "/api/v1"


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _verified_nurse(client: TestClient, phone: str, email: str) -> tuple[str, str]:
    token = client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Ama",
            "last_name": "Nurse",
            "phone": phone,
            "email": email,
            "password": "Supersecret1!",
            "role": "nurse",
        },
    ).json()["access_token"]
    uid = client.get(f"{V1}/auth/me", headers=_auth(token)).json()["id"]
    client.patch(f"{V1}/nurses/me", headers=_auth(token), json={"daily_rate": "180"})
    db = TestingSessionLocal()
    try:
        p = db.query(NurseProfile).filter(NurseProfile.user_id == uid).first()
        p.verification_status = VerificationStatus.verified
        db.commit()
    finally:
        db.close()
    return uid, token


def _mother(client: TestClient, phone: str, email: str) -> str:
    return client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Efua",
            "last_name": "Mum",
            "phone": phone,
            "email": email,
            "password": "Supersecret1!",
            "role": "mother",
        },
    ).json()["access_token"]


def _request_booking(client: TestClient, mom: str, nurse_id: str) -> dict:
    return client.post(
        f"{V1}/bookings",
        headers=_auth(mom),
        json={"nurse_id": nurse_id, "care_date": "2026-12-01", "start_time": "09:00", "hours": 8},
    )


def test_mother_requests_and_both_see_it(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000301", "n1@example.com")
    mom = _mother(client, "+233200000302", "m1@example.com")

    created = _request_booking(client, mom, nurse_id)
    assert created.status_code == 201
    body = created.json()
    assert body["status"] == "requested"
    assert body["estimated_amount"] == "180.00"

    assert len(client.get(f"{V1}/bookings", headers=_auth(mom)).json()) == 1
    nurse_view = client.get(f"{V1}/bookings", headers=_auth(nurse_tok)).json()
    assert len(nurse_view) == 1
    assert nurse_view[0]["mother_name"] == "Efua Mum"


def test_request_unverified_nurse_404(client: TestClient) -> None:
    nurse_tok = client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Zoe",
            "last_name": "Pending",
            "phone": "+233200000303",
            "email": "zp@example.com",
            "password": "Supersecret1!",
            "role": "nurse",
        },
    ).json()["access_token"]
    uid = client.get(f"{V1}/auth/me", headers=_auth(nurse_tok)).json()["id"]
    mom = _mother(client, "+233200000304", "m2@example.com")
    assert _request_booking(client, mom, uid).status_code == 404


def test_nurse_accepts(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000305", "n3@example.com")
    mom = _mother(client, "+233200000306", "m3@example.com")
    bid = _request_booking(client, mom, nurse_id).json()["id"]

    resp = client.post(f"{V1}/bookings/{bid}/accept", headers=_auth(nurse_tok))
    assert resp.status_code == 200
    assert resp.json()["status"] == "accepted"
    # Can't accept again.
    assert client.post(f"{V1}/bookings/{bid}/accept", headers=_auth(nurse_tok)).status_code == 409


def test_nurse_declines(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000307", "n4@example.com")
    mom = _mother(client, "+233200000308", "m4@example.com")
    bid = _request_booking(client, mom, nurse_id).json()["id"]
    resp = client.post(f"{V1}/bookings/{bid}/decline", headers=_auth(nurse_tok))
    assert resp.status_code == 200
    assert resp.json()["status"] == "declined"


def test_other_nurse_cannot_accept(client: TestClient) -> None:
    nurse_id, _ = _verified_nurse(client, "+233200000309", "n5@example.com")
    mom = _mother(client, "+233200000310", "m5@example.com")
    bid = _request_booking(client, mom, nurse_id).json()["id"]
    _, other_tok = _verified_nurse(client, "+233200000311", "n6@example.com")
    assert client.post(f"{V1}/bookings/{bid}/accept", headers=_auth(other_tok)).status_code == 404


def test_mother_cancels(client: TestClient) -> None:
    nurse_id, _ = _verified_nurse(client, "+233200000312", "n7@example.com")
    mom = _mother(client, "+233200000313", "m7@example.com")
    bid = _request_booking(client, mom, nurse_id).json()["id"]
    resp = client.post(f"{V1}/bookings/{bid}/cancel", headers=_auth(mom))
    assert resp.status_code == 200
    assert resp.json()["status"] == "cancelled"


def test_mother_cannot_accept(client: TestClient) -> None:
    nurse_id, _ = _verified_nurse(client, "+233200000314", "n8@example.com")
    mom = _mother(client, "+233200000315", "m8@example.com")
    bid = _request_booking(client, mom, nurse_id).json()["id"]
    assert client.post(f"{V1}/bookings/{bid}/accept", headers=_auth(mom)).status_code == 403


def test_booking_carries_child_allergies_to_nurse(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000316", "n9@example.com")
    mom = _mother(client, "+233200000317", "m9@example.com")
    child = client.post(
        f"{V1}/mothers/me/children",
        headers=_auth(mom),
        json={"name": "Kwame", "age_years": 2, "allergies": "Peanuts", "notes": "Nap at 1pm"},
    ).json()

    booked = client.post(
        f"{V1}/bookings",
        headers=_auth(mom),
        json={
            "nurse_id": nurse_id,
            "child_id": child["id"],
            "care_date": "2026-12-01",
            "start_time": "09:00",
            "hours": 8,
        },
    )
    assert booked.status_code == 201

    # The matched nurse sees the child's name, age and allergies on the booking.
    nurse_view = client.get(f"{V1}/bookings", headers=_auth(nurse_tok)).json()[0]
    assert nurse_view["child_name"] == "Kwame"
    assert nurse_view["child_age_years"] == 2
    assert nurse_view["child_allergies"] == "Peanuts"
    assert nurse_view["child_notes"] == "Nap at 1pm"


def test_cannot_book_with_another_mothers_child(client: TestClient) -> None:
    nurse_id, _ = _verified_nurse(client, "+233200000318", "n10@example.com")
    mom_a = _mother(client, "+233200000319", "ma@example.com")
    mom_b = _mother(client, "+233200000320", "mb@example.com")
    child_b = client.post(
        f"{V1}/mothers/me/children", headers=_auth(mom_b), json={"name": "Abena"}
    ).json()

    resp = client.post(
        f"{V1}/bookings",
        headers=_auth(mom_a),
        json={
            "nurse_id": nurse_id,
            "child_id": child_b["id"],
            "care_date": "2026-12-01",
            "start_time": "09:00",
            "hours": 8,
        },
    )
    assert resp.status_code == 404
