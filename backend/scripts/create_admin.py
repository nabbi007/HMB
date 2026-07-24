"""Create an HMB admin user.

Admins are NEVER created via public signup — only through this controlled script.

Usage (from backend/):
    python -m scripts.create_admin --name "Ama Admin" --phone "+233200000000" --email admin@hmb.app

Password is read from the ADMIN_PASSWORD env var, or prompted (not passed on the
command line, so it doesn't leak into shell history).
"""
import argparse
import getpass
import os

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.user import User, UserRole


def main() -> None:
    parser = argparse.ArgumentParser(description="Create an HMB admin user.")
    parser.add_argument("--name", required=True, help="Full name")
    parser.add_argument("--phone", required=True, help="Phone, e.g. +233200000000")
    parser.add_argument("--email", required=True, help="Login email")
    args = parser.parse_args()

    password = os.environ.get("ADMIN_PASSWORD") or getpass.getpass("Admin password: ")
    if len(password) < 8:
        raise SystemExit("Password must be at least 8 characters.")

    db = SessionLocal()
    try:
        existing = (
            db.query(User)
            .filter((User.phone == args.phone) | (User.email == args.email))
            .first()
        )
        if existing is not None:
            raise SystemExit("A user with that phone or email already exists.")

        admin = User(
            role=UserRole.admin,
            full_name=args.name,
            phone=args.phone,
            email=args.email,
            password_hash=hash_password(password),
            is_active=True,
            phone_verified=True,
        )
        db.add(admin)
        db.commit()
        db.refresh(admin)
        print(f"Created admin {admin.email} (id={admin.id})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
