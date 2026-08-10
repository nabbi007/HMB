from fastapi.testclient import TestClient

import app.services.email as email_service

V1 = "/api/v1"


def _signup(client: TestClient, **overrides) -> dict:
    payload = {
        "first_name": "Ama",
        "last_name": "Nurse",
        "phone": "+233200000001",
        "email": "ama@example.com",
        "password": "Supersecret1!",
        "role": "nurse",
    }
    payload.update(overrides)
    return client.post(f"{V1}/auth/signup", json=payload)


def test_signup_returns_tokens(client: TestClient) -> None:
    resp = _signup(client)
    assert resp.status_code == 201
    body = resp.json()
    assert body["access_token"] and body["refresh_token"]
    assert body["token_type"] == "bearer"


def test_signup_rejects_admin_role(client: TestClient) -> None:
    resp = _signup(client, role="admin", phone="+233200000009", email="x@example.com")
    assert resp.status_code == 422  # blocked by schema validator


def test_signup_duplicate_phone_conflicts(client: TestClient) -> None:
    assert _signup(client).status_code == 201
    dup = _signup(client, email="other@example.com")  # same phone
    assert dup.status_code == 409


def test_login_success_and_wrong_password(client: TestClient) -> None:
    _signup(client)
    ok = client.post(
        f"{V1}/auth/login", json={"identifier": "+233200000001", "password": "Supersecret1!"}
    )
    assert ok.status_code == 200 and ok.json()["access_token"]

    bad = client.post(f"{V1}/auth/login", json={"identifier": "+233200000001", "password": "wrong"})
    assert bad.status_code == 401


def test_me_returns_current_user(client: TestClient) -> None:
    token = _signup(client).json()["access_token"]
    resp = client.get(f"{V1}/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    body = resp.json()
    assert body["phone"] == "+233200000001"
    assert body["role"] == "nurse"
    assert body["first_name"] == "Ama"
    assert body["last_name"] == "Nurse"
    assert body["full_name"] == "Ama Nurse"


def test_me_requires_auth(client: TestClient) -> None:
    assert client.get(f"{V1}/auth/me").status_code == 401


def test_refresh_issues_new_tokens(client: TestClient) -> None:
    refresh_token = _signup(client).json()["refresh_token"]
    resp = client.post(f"{V1}/auth/refresh", json={"refresh_token": refresh_token})
    assert resp.status_code == 200
    assert resp.json()["access_token"]


def test_access_token_not_accepted_as_refresh(client: TestClient) -> None:
    access_token = _signup(client).json()["access_token"]
    resp = client.post(f"{V1}/auth/refresh", json={"refresh_token": access_token})
    assert resp.status_code == 401


def test_update_phone(client: TestClient) -> None:
    token = _signup(client).json()["access_token"]
    resp = client.patch(
        f"{V1}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"phone": "+233209999999"},
    )
    assert resp.status_code == 200
    assert resp.json()["phone"] == "+233209999999"


def test_email_cannot_be_changed(client: TestClient) -> None:
    token = _signup(client).json()["access_token"]
    resp = client.patch(
        f"{V1}/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        json={"email": "hacker@example.com"},  # ignored — email is immutable here
    )
    assert resp.status_code == 200
    assert resp.json()["email"] == "ama@example.com"


def test_signup_rejects_weak_password(client: TestClient) -> None:
    # No number and no special character.
    resp = _signup(client, password="weakpass", phone="+233200000050", email="w@example.com")
    assert resp.status_code == 422


def test_password_reset_flow(client: TestClient, monkeypatch) -> None:
    captured: dict[str, str] = {}
    monkeypatch.setattr(
        email_service, "send_password_reset_email", lambda to, code: captured.update(code=code)
    )
    _signup(client)  # ama@example.com / +233200000001 / Supersecret1!

    forgot = client.post(f"{V1}/auth/password/forgot", json={"identifier": "ama@example.com"})
    assert forgot.status_code == 200
    code = captured["code"]

    reset = client.post(
        f"{V1}/auth/password/reset",
        json={"identifier": "ama@example.com", "code": code, "new_password": "Newpass1!"},
    )
    assert reset.status_code == 200

    # New password works, old one no longer does.
    assert (
        client.post(
            f"{V1}/auth/login", json={"identifier": "ama@example.com", "password": "Newpass1!"}
        ).status_code
        == 200
    )
    assert (
        client.post(
            f"{V1}/auth/login",
            json={"identifier": "ama@example.com", "password": "Supersecret1!"},
        ).status_code
        == 401
    )


def test_password_reset_rejects_weak_new_password(client: TestClient) -> None:
    resp = client.post(
        f"{V1}/auth/password/reset",
        json={"identifier": "x@example.com", "code": "123456", "new_password": "weak"},
    )
    assert resp.status_code == 422


def test_update_phone_conflict(client: TestClient) -> None:
    _signup(client, phone="+233200000010", email="a10@example.com")
    token2 = _signup(client, phone="+233200000011", email="a11@example.com").json()["access_token"]
    resp = client.patch(
        f"{V1}/auth/me",
        headers={"Authorization": f"Bearer {token2}"},
        json={"phone": "+233200000010"},  # already taken by the first user
    )
    assert resp.status_code == 409
