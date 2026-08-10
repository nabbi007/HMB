from fastapi.testclient import TestClient

V1 = "/api/v1"


def _mother_token(client: TestClient, **overrides) -> str:
    payload = {
        "first_name": "Efua",
        "last_name": "Mother",
        "phone": "+233200000060",
        "email": "efua@example.com",
        "password": "Supersecret1!",
        "role": "mother",
    }
    payload.update(overrides)
    return client.post(f"{V1}/auth/signup", json=payload).json()["access_token"]


def _auth(token: str) -> dict:
    return {"Authorization": f"Bearer {token}"}


def test_add_list_children(client: TestClient) -> None:
    token = _mother_token(client)
    created = client.post(
        f"{V1}/mothers/me/children",
        headers=_auth(token),
        json={"name": "Kwame", "age_years": 2, "notes": "peanut allergy"},
    )
    assert created.status_code == 201
    assert created.json()["name"] == "Kwame"

    listed = client.get(f"{V1}/mothers/me/children", headers=_auth(token))
    assert listed.status_code == 200
    assert len(listed.json()) == 1


def test_update_and_delete_child(client: TestClient) -> None:
    token = _mother_token(client)
    child_id = client.post(
        f"{V1}/mothers/me/children", headers=_auth(token), json={"name": "Ama", "age_years": 1}
    ).json()["id"]

    upd = client.patch(
        f"{V1}/mothers/me/children/{child_id}", headers=_auth(token), json={"age_years": 3}
    )
    assert upd.status_code == 200
    assert upd.json()["age_years"] == 3

    assert (
        client.delete(f"{V1}/mothers/me/children/{child_id}", headers=_auth(token)).status_code
        == 204
    )
    assert len(client.get(f"{V1}/mothers/me/children", headers=_auth(token)).json()) == 0


def test_cannot_touch_another_mothers_child(client: TestClient) -> None:
    t1 = _mother_token(client)
    child_id = client.post(
        f"{V1}/mothers/me/children", headers=_auth(t1), json={"name": "Kojo"}
    ).json()["id"]

    t2 = _mother_token(client, phone="+233200000061", email="two@example.com")
    resp = client.patch(
        f"{V1}/mothers/me/children/{child_id}", headers=_auth(t2), json={"name": "Hacked"}
    )
    assert resp.status_code == 404


def test_nurse_cannot_use_children_endpoints(client: TestClient) -> None:
    nurse = client.post(
        f"{V1}/auth/signup",
        json={
            "first_name": "Nana",
            "last_name": "Nurse",
            "phone": "+233200000062",
            "email": "n@example.com",
            "password": "Supersecret1!",
            "role": "nurse",
        },
    ).json()["access_token"]
    assert client.get(f"{V1}/mothers/me/children", headers=_auth(nurse)).status_code == 403
