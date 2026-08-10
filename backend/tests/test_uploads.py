from fastapi.testclient import TestClient

V1 = "/api/v1"


def _token(client: TestClient) -> str:
    return client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Ama",
            "last_name": "Nurse",
            "phone": "+233200000070",
            "email": "up@example.com",
            "password": "Supersecret1!",
            "role": "nurse",
        },
    ).json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_upload_image_returns_url(client: TestClient) -> None:
    token = _token(client)
    resp = client.post(
        f"{V1}/uploads",
        headers=_auth(token),
        files={"file": ("photo.png", b"\x89PNG\r\n fake image bytes", "image/png")},
    )
    assert resp.status_code == 201
    url = resp.json()["url"]
    assert url.startswith("/uploads/") and url.endswith(".png")


def test_upload_rejects_unsupported_type(client: TestClient) -> None:
    token = _token(client)
    resp = client.post(
        f"{V1}/uploads",
        headers=_auth(token),
        files={"file": ("note.txt", b"hello", "text/plain")},
    )
    assert resp.status_code == 415


def test_upload_rejects_too_large(client: TestClient) -> None:
    token = _token(client)
    big = b"\x00" * (5 * 1024 * 1024 + 1)
    resp = client.post(
        f"{V1}/uploads",
        headers=_auth(token),
        files={"file": ("big.png", big, "image/png")},
    )
    assert resp.status_code == 413


def test_upload_requires_auth(client: TestClient) -> None:
    resp = client.post(f"{V1}/uploads", files={"file": ("photo.png", b"x", "image/png")})
    assert resp.status_code == 401


def test_uploaded_url_saves_on_nurse_profile(client: TestClient) -> None:
    token = _token(client)
    url = client.post(
        f"{V1}/uploads",
        headers=_auth(token),
        files={"file": ("photo.png", b"\x89PNG data", "image/png")},
    ).json()["url"]

    patched = client.patch(f"{V1}/nurses/me", headers=_auth(token), json={"profile_photo_url": url})
    assert patched.status_code == 200
    assert patched.json()["profile_photo_url"] == url
