from fastapi.testclient import TestClient

from app.models.nurse_profile import NurseProfile, VerificationStatus
from tests.conftest import TestingSessionLocal

V1 = "/api/v1"


def _auth(t: str) -> dict:
    return {"Authorization": f"Bearer {t}"}


def _verified_nurse(client: TestClient, phone: str, email: str) -> tuple[str, str]:
    tok = client.post(
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
    uid = client.get(f"{V1}/auth/me", headers=_auth(tok)).json()["id"]
    db = TestingSessionLocal()
    try:
        p = db.query(NurseProfile).filter(NurseProfile.user_id == uid).first()
        p.verification_status = VerificationStatus.verified
        db.commit()
    finally:
        db.close()
    return uid, tok


def _mother(client: TestClient, phone: str, email: str) -> tuple[str, str]:
    tok = client.post(
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
    uid = client.get(f"{V1}/auth/me", headers=_auth(tok)).json()["id"]
    return uid, tok


def _book(client: TestClient, mom_tok: str, nurse_id: str) -> None:
    client.post(
        f"{V1}/bookings",
        headers=_auth(mom_tok),
        json={"nurse_id": nurse_id, "care_date": "2026-12-01", "start_time": "09:00", "hours": 8},
    )


def test_message_requires_a_booking(client: TestClient) -> None:
    nurse_id, _ = _verified_nurse(client, "+233200000401", "n1@example.com")
    _, mom_tok = _mother(client, "+233200000402", "m1@example.com")
    # No booking yet → forbidden.
    resp = client.post(
        f"{V1}/conversations/{nurse_id}/messages", headers=_auth(mom_tok), json={"body": "Hi"}
    )
    assert resp.status_code == 403


def test_message_flow(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000403", "n2@example.com")
    mom_id, mom_tok = _mother(client, "+233200000404", "m2@example.com")
    _book(client, mom_tok, nurse_id)

    sent = client.post(
        f"{V1}/conversations/{nurse_id}/messages",
        headers=_auth(mom_tok),
        json={"body": "Hi, are you free Saturday?"},
    )
    assert sent.status_code == 201

    # Nurse replies.
    reply = client.post(
        f"{V1}/conversations/{mom_id}/messages",
        headers=_auth(nurse_tok),
        json={"body": "Yes, I am!"},
    )
    assert reply.status_code == 201

    # Mother's thread has both, in order.
    thread = client.get(f"{V1}/conversations/{nurse_id}/messages", headers=_auth(mom_tok)).json()
    assert [m["body"] for m in thread] == ["Hi, are you free Saturday?", "Yes, I am!"]

    # Conversations list shows the nurse.
    convos = client.get(f"{V1}/conversations", headers=_auth(mom_tok)).json()
    assert len(convos) == 1
    assert convos[0]["other_user_id"] == nurse_id


def test_unread_then_read(client: TestClient) -> None:
    nurse_id, nurse_tok = _verified_nurse(client, "+233200000405", "n3@example.com")
    mom_id, mom_tok = _mother(client, "+233200000406", "m3@example.com")
    _book(client, mom_tok, nurse_id)
    client.post(
        f"{V1}/conversations/{mom_id}/messages", headers=_auth(nurse_tok), json={"body": "Hello"}
    )
    # Mother has 1 unread before opening.
    convos = client.get(f"{V1}/conversations", headers=_auth(mom_tok)).json()
    assert convos[0]["unread_count"] == 1
    # Opening the thread marks it read.
    client.get(f"{V1}/conversations/{nurse_id}/messages", headers=_auth(mom_tok))
    convos = client.get(f"{V1}/conversations", headers=_auth(mom_tok)).json()
    assert convos[0]["unread_count"] == 0


def test_cannot_message_self(client: TestClient) -> None:
    mom_id, mom_tok = _mother(client, "+233200000407", "m4@example.com")
    resp = client.post(
        f"{V1}/conversations/{mom_id}/messages", headers=_auth(mom_tok), json={"body": "hi"}
    )
    assert resp.status_code == 400
