from app.core.crypto import decrypt_pin, encrypt_pin, pin_blind_index


def test_encrypt_decrypt_roundtrip() -> None:
    token = encrypt_pin("AP12345")
    assert token != "AP12345"  # stored value is not readable
    assert decrypt_pin(token) == "AP12345"  # admin can read it back


def test_encryption_is_nondeterministic() -> None:
    # Same PIN encrypts to different ciphertext each time (Fernet uses a random IV).
    assert encrypt_pin("AP12345") != encrypt_pin("AP12345")


def test_blind_index_is_deterministic_and_normalized() -> None:
    # Normalization means spacing/case don't create false "different PIN" values.
    assert pin_blind_index("AP12345") == pin_blind_index("ap 12345")
    # Different PINs → different index (so uniqueness works).
    assert pin_blind_index("AP12345") != pin_blind_index("AP99999")


def test_blind_index_is_not_reversible_plaintext() -> None:
    idx = pin_blind_index("AP12345")
    assert "AP12345" not in idx
    assert len(idx) == 64  # sha256 hex
