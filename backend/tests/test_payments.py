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
    client.patch(f"{V1}/nurses/me", headers=_auth(token), json={"daily_rate": "200"})
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


def _accepted_booking(client: TestClient, mom: str, nurse_id: str, nurse_tok: str) -> str:
    bid = client.post(
        f"{V1}/bookings",
        headers=_auth(mom),
        json={"nurse_id": nurse_id, "care_date": "2026-12-01", "start_time": "09:00", "hours": 8},
    ).json()["id"]
    client.post(f"{V1}/bookings/{bid}/accept", headers=_auth(nurse_tok))
    return bid


def test_pay_holds_funds_and_confirms(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000401", "p1@example.com")
    mom = _mother(client, "+233200000402", "pm1@example.com")
    bid = _accepted_booking(client, mom, nurse_id, nurse_tok)

    resp = client.post(f"{V1}/bookings/{bid}/pay", headers=_auth(mom))
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "confirmed"
    assert body["payment_status"] == "held"
    # 10% fee on a 200.00 daily rate.
    assert body["hmb_fee"] == "20.00"
    assert body["nurse_payout"] == "180.00"


def test_cannot_pay_unaccepted(client: TestClient) -> None:
    nurse_id, _ = _verified_nurse(client, "+233200000403", "p2@example.com")
    mom = _mother(client, "+233200000404", "pm2@example.com")
    bid = client.post(
        f"{V1}/bookings",
        headers=_auth(mom),
        json={"nurse_id": nurse_id, "care_date": "2026-12-01", "start_time": "09:00", "hours": 8},
    ).json()["id"]
    # Still 'requested' → can't pay.
    assert client.post(f"{V1}/bookings/{bid}/pay", headers=_auth(mom)).status_code == 409


def test_double_pay_rejected(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000405", "p3@example.com")
    mom = _mother(client, "+233200000406", "pm3@example.com")
    bid = _accepted_booking(client, mom, nurse_id, nurse_tok)
    assert client.post(f"{V1}/bookings/{bid}/pay", headers=_auth(mom)).status_code == 200
    assert client.post(f"{V1}/bookings/{bid}/pay", headers=_auth(mom)).status_code == 409


def test_complete_releases_payout(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000407", "p4@example.com")
    mom = _mother(client, "+233200000408", "pm4@example.com")
    bid = _accepted_booking(client, mom, nurse_id, nurse_tok)
    client.post(f"{V1}/bookings/{bid}/pay", headers=_auth(mom))

    resp = client.post(f"{V1}/bookings/{bid}/complete", headers=_auth(nurse_tok))
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "completed"
    assert body["payment_status"] == "released"


def test_cannot_complete_before_payment(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000409", "p5@example.com")
    mom = _mother(client, "+233200000410", "pm5@example.com")
    bid = _accepted_booking(client, mom, nurse_id, nurse_tok)
    # Accepted but unpaid → can't complete.
    assert client.post(f"{V1}/bookings/{bid}/complete", headers=_auth(nurse_tok)).status_code == 409


def test_cancel_paid_booking_refunds(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000411", "p6@example.com")
    mom = _mother(client, "+233200000412", "pm6@example.com")
    bid = _accepted_booking(client, mom, nurse_id, nurse_tok)
    client.post(f"{V1}/bookings/{bid}/pay", headers=_auth(mom))

    resp = client.post(f"{V1}/bookings/{bid}/cancel", headers=_auth(mom))
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "cancelled"
    assert body["payment_status"] == "refunded"


def test_nurse_cannot_complete_others_booking(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000413", "p7@example.com")
    mom = _mother(client, "+233200000414", "pm7@example.com")
    bid = _accepted_booking(client, mom, nurse_id, nurse_tok)
    client.post(f"{V1}/bookings/{bid}/pay", headers=_auth(mom))

    _, other_tok = _verified_nurse(client, "+233200000415", "p8@example.com")
    assert client.post(f"{V1}/bookings/{bid}/complete", headers=_auth(other_tok)).status_code == 404
