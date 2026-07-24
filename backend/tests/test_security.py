from app.core.security import hash_password, verify_password
from app.models.user import UserRole


def test_hash_is_not_plaintext_and_verifies() -> None:
    h = hash_password("s3cret-password")
    assert h != "s3cret-password"
    assert verify_password("s3cret-password", h) is True
    assert verify_password("wrong", h) is False


def test_user_roles() -> None:
    assert {r.value for r in UserRole} == {"nurse", "mother", "admin"}
