"""Seed a few verified demo nurses around Accra (for demos / the search UI).

Run from backend/:
    python -m scripts.seed_demo

Idempotent: skips a nurse if its email already exists.
"""

from decimal import Decimal

from app.core.security import hash_password
from app.db.session import SessionLocal
from app.models.nurse_profile import NurseProfile, VerificationStatus
from app.models.user import User, UserRole

DEMO_NURSES = [
    # (first, last, email, phone, community, lat, lng, care_type, languages, rate, rating, reviews)
    (
        "Ama",
        "Boateng",
        "ama.demo@hmb.app",
        "+233240000001",
        "Osu, Accra",
        5.556,
        -0.182,
        "Postpartum",
        ["English", "Twi"],
        180,
        "4.9",
        124,
    ),
    (
        "Zainab",
        "Iddrisu",
        "zainab.demo@hmb.app",
        "+233240000002",
        "Madina, Accra",
        5.668,
        -0.166,
        "Night nurse",
        ["English", "Hausa"],
        200,
        "4.8",
        92,
    ),
    (
        "Efua",
        "Mensah",
        "efua.demo@hmb.app",
        "+233240000003",
        "Dzorwulu, Accra",
        5.607,
        -0.196,
        "Babysitter",
        ["English", "Ga"],
        120,
        "4.7",
        63,
    ),
    (
        "Abena",
        "Asante",
        "abena.demo@hmb.app",
        "+233240000004",
        "East Legon, Accra",
        5.635,
        -0.166,
        "Lactation support",
        ["English", "Twi", "French"],
        160,
        "4.6",
        41,
    ),
    (
        "Grace",
        "Tetteh",
        "grace.demo@hmb.app",
        "+233240000005",
        "Achimota, Accra",
        5.618,
        -0.223,
        "Twins & multiples",
        ["English", "Ga", "Twi"],
        200,
        "4.95",
        57,
    ),
]


def main() -> None:
    db = SessionLocal()
    created = 0
    try:
        for (
            first,
            last,
            email,
            phone,
            community,
            lat,
            lng,
            care_type,
            languages,
            rate,
            rating,
            reviews,
        ) in DEMO_NURSES:
            if db.query(User).filter(User.email == email).first() is not None:
                print(f"skip (exists): {email}")
                continue
            user = User(
                role=UserRole.nurse,
                first_name=first,
                last_name=last,
                phone=phone,
                email=email,
                password_hash=hash_password("Demopass1!"),
                is_active=True,
                phone_verified=True,
            )
            db.add(user)
            db.flush()
            db.add(
                NurseProfile(
                    user_id=user.id,
                    verification_status=VerificationStatus.verified,
                    community=community,
                    latitude=Decimal(str(lat)),
                    longitude=Decimal(str(lng)),
                    care_type=care_type,
                    languages=languages,
                    daily_rate=Decimal(rate),
                    avg_rating=Decimal(rating),
                    review_count=reviews,
                    bio=f"Experienced {care_type.lower()} caregiver based in {community}.",
                )
            )
            created += 1
            print(f"created: {first} {last} — {care_type} @ {community}")
        db.commit()
    finally:
        db.close()
    print(f"\nDone. {created} demo nurse(s) created (password: Demopass1!).")


if __name__ == "__main__":
    main()
