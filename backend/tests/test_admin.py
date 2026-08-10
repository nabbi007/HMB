from fastapi.testclient import TestClient

from app.core.security import create_access_token, hash_password
from app.models.user import User, UserRole
from tests.conftest import TestingSessionLocal

V1 = "/api/v1"


def _admin_token() -> str:
    db = TestingSessionLocal()
    try:
        admin = User(
            role=UserRole.admin,
            first_name="Adisa",
            last_name="Admin",
            phone="+233555999000",
            email="admin@hmb.app",
            password_hash=hash_password("Adminpass1!"),
            is_active=True,
            phone_verified=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        return create_access_token(str(admin.id))
    finally:
        db.close()


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def _pending_nurse(client: TestClient, phone: str, email: str) -> str:
    token = client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Ama",
            "last_name": "Pending",
            "phone": phone,
            "email": email,
            "password": "Supersecret1!",
            "role": "nurse",
        },
    ).json()["access_token"]
    # give the reviewer a PIN to check
    client.patch(f"{V1}/nurses/me", headers=_auth(token), json={"nmc_pin": "AP-77001"})
    return client.get(f"{V1}/auth/me", headers=_auth(token)).json()["id"]


def test_admin_lists_pending_with_decrypted_pin(client: TestClient) -> None:
    _pending_nurse(client, "+233555000201", "p1@example.com")
    admin = _admin_token()
    resp = client.get(f"{V1}/admin/nurses", headers=_auth(admin), params={"status": "pending"})
    assert resp.status_code == 200
    body = resp.json()
    assert len(body) == 1
    assert body[0]["verification_status"] == "pending"
    assert body[0]["nmc_pin"] == "AP-77001"  # decrypted for the admin


def test_admin_verify(client: TestClient) -> None:
    uid = _pending_nurse(client, "+233555000202", "p2@example.com")
    admin = _admin_token()
    resp = client.post(f"{V1}/admin/nurses/{uid}/verify", headers=_auth(admin))
    assert resp.status_code == 200
    assert resp.json()["verification_status"] == "verified"


def test_admin_reject_with_reason(client: TestClient) -> None:
    uid = _pending_nurse(client, "+233555000203", "p3@example.com")
    admin = _admin_token()
    resp = client.post(
        f"{V1}/admin/nurses/{uid}/reject",
        headers=_auth(admin),
        json={"reason": "ID photo unreadable"},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["verification_status"] == "rejected"
    assert body["verification_reason"] == "ID photo unreadable"


def test_non_admin_forbidden(client: TestClient) -> None:
    nurse = client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Not",
            "last_name": "Admin",
            "phone": "+233555000204",
            "email": "na@example.com",
            "password": "Supersecret1!",
            "role": "nurse",
        },
    ).json()["access_token"]
    assert client.get(f"{V1}/admin/nurses", headers=_auth(nurse)).status_code == 403


def test_admin_verify_unknown_404(client: TestClient) -> None:
    admin = _admin_token()
    resp = client.post(
        f"{V1}/admin/nurses/00000000-0000-0000-0000-000000000000/verify", headers=_auth(admin)
    )
    assert resp.status_code == 404
