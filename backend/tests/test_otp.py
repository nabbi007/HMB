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
    return client.post(f"{V1}/auth/signup", json=payload).json()


def test_otp_request_and_verify(client: TestClient, monkeypatch) -> None:
    captured: dict[str, str] = {}
    monkeypatch.setattr(
        email_service, "send_otp_email", lambda to, code: captured.update(to=to, code=code)
    )

    token = _signup(client)["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Request a code — it's "emailed" (captured here instead of hitting SMTP).
    req = client.post(f"{V1}/auth/otp/request", headers=headers)
    assert req.status_code == 200
    assert captured["to"] == "ama@example.com"
    assert len(captured["code"]) == 6

    # Wrong code is rejected.
    bad = client.post(f"{V1}/auth/otp/verify", json={"code": "000000"}, headers=headers)
    assert bad.status_code == 400

    # Correct code verifies the account.
    ok = client.post(f"{V1}/auth/otp/verify", json={"code": captured["code"]}, headers=headers)
    assert ok.status_code == 200

    me = client.get(f"{V1}/auth/me", headers=headers)
    assert me.json()["phone_verified"] is True


def test_otp_request_requires_email(client: TestClient, monkeypatch) -> None:
    monkeypatch.setattr(email_service, "send_otp_email", lambda to, code: None)
    token = _signup(client, email=None)["access_token"]
    resp = client.post(f"{V1}/auth/otp/request", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 400


def test_otp_requires_auth(client: TestClient) -> None:
    assert client.post(f"{V1}/auth/otp/request").status_code == 401
