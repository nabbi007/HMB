import hashlib
import math
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.child import Child
from app.models.mother_profile import MotherProfile
from app.models.nurse_profile import NurseProfile, VerificationStatus
from app.models.user import User, UserRole
from app.schemas.child import ChildCreate, ChildOut, ChildUpdate
from app.schemas.profile import (
    MotherProfileOut,
    MotherProfileUpdate,
    NurseProfileOut,
    NurseProfileUpdate,
    NursePublic,
    NurseSearchResult,
)

router = APIRouter(tags=["profiles"])


def _haversine_km(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dlmb / 2) ** 2
    return r * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _obfuscate(lat: float, lng: float, key: str) -> tuple[float, float]:
    """Shift a point ~300–500m in a fixed direction derived from `key`.

    Deterministic (same nurse → same offset, so the marker doesn't jump), and the
    precise coordinate is never exposed to browsers (HMB-34).
    """
    h = hashlib.sha256(key.encode()).digest()
    mag = int.from_bytes(h[:4], "big") / 2**32  # 0..1
    ang = int.from_bytes(h[4:8], "big") / 2**32  # 0..1
    radius_deg = 0.0027 + 0.0018 * mag  # ~300–500m in latitude degrees
    theta = 2 * math.pi * ang
    dlat = radius_deg * math.cos(theta)
    dlng = radius_deg * math.sin(theta) / max(math.cos(math.radians(lat)), 0.01)
    return round(lat + dlat, 6), round(lng + dlng, 6)


@router.get("/nurses/search", response_model=list[NurseSearchResult])
def search_nurses(
    lat: float = Query(..., ge=-90, le=90),
    lng: float = Query(..., ge=-180, le=180),
    radius_km: float = Query(25, gt=0, le=200),
    min_rating: float = Query(0, ge=0, le=5),
    language: str | None = None,
    religion: str | None = None,
    care_type: str | None = None,
    limit: int = Query(50, ge=1, le=100),
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[NurseSearchResult]:
    """Verified nurses near a point, filtered by rating and values (language/religion/care type).

    Location returned is the nurse's approximate community point — never an exact home.
    """
    q = (
        db.query(NurseProfile, User)
        .join(User, User.id == NurseProfile.user_id)
        .filter(
            NurseProfile.verification_status == VerificationStatus.verified,
            User.is_active.is_(True),
            NurseProfile.latitude.isnot(None),
            NurseProfile.longitude.isnot(None),
            NurseProfile.avg_rating >= min_rating,
        )
    )
    if religion:
        q = q.filter(NurseProfile.religion == religion)
    if care_type:
        q = q.filter(NurseProfile.care_type == care_type)
    if language:
        q = q.filter(NurseProfile.languages.contains([language]))

    results: list[NurseSearchResult] = []
    for profile, user in q.all():
        # Distance uses the true point; the returned marker is obfuscated.
        distance = _haversine_km(lat, lng, float(profile.latitude), float(profile.longitude))
        if distance > radius_km:
            continue
        olat, olng = _obfuscate(float(profile.latitude), float(profile.longitude), str(user.id))
        results.append(
            NurseSearchResult(
                id=user.id,
                name=user.full_name,
                care_type=profile.care_type,
                bio=profile.bio,
                daily_rate=profile.daily_rate,
                community=profile.community,
                languages=profile.languages or [],
                religion=profile.religion,
                rating=profile.avg_rating,
                review_count=profile.review_count,
                distance_km=round(distance, 1),
                lat=olat,
                lng=olng,
                profile_photo_url=profile.profile_photo_url,
            )
        )

    results.sort(key=lambda r: r.distance_km)
    return results[:limit]


# --- Nurse ---


def _nurse_profile(db: Session, user: User) -> NurseProfile:
    profile = db.query(NurseProfile).filter(NurseProfile.user_id == user.id).first()
    if profile is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nurse profile not found")
    return profile


@router.get("/nurses/me", response_model=NurseProfileOut)
def get_my_nurse_profile(
    user: User = Depends(require_role(UserRole.nurse)), db: Session = Depends(get_db)
) -> NurseProfile:
    return _nurse_profile(db, user)


@router.patch("/nurses/me", response_model=NurseProfileOut)
def update_my_nurse_profile(
    data: NurseProfileUpdate,
    user: User = Depends(require_role(UserRole.nurse)),
    db: Session = Depends(get_db),
) -> NurseProfile:
    profile = _nurse_profile(db, user)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/nurses/{user_id}", response_model=NursePublic)
def get_nurse(
    user_id: uuid.UUID,
    _user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> NursePublic:
    """Public detail for a single verified nurse (the nurse detail page)."""
    row = (
        db.query(NurseProfile, User)
        .join(User, User.id == NurseProfile.user_id)
        .filter(
            NurseProfile.user_id == user_id,
            NurseProfile.verification_status == VerificationStatus.verified,
            User.is_active.is_(True),
        )
        .first()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nurse not found")
    profile, user = row
    return NursePublic(
        id=user.id,
        name=user.full_name,
        care_type=profile.care_type,
        bio=profile.bio,
        daily_rate=profile.daily_rate,
        community=profile.community,
        languages=profile.languages or [],
        religion=profile.religion,
        rating=profile.avg_rating,
        review_count=profile.review_count,
        profile_photo_url=profile.profile_photo_url,
    )


# --- Mother ---


def _mother_profile(db: Session, user: User) -> MotherProfile:
    profile = db.query(MotherProfile).filter(MotherProfile.user_id == user.id).first()
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mother profile not found"
        )
    return profile


@router.get("/mothers/me", response_model=MotherProfileOut)
def get_my_mother_profile(
    user: User = Depends(require_role(UserRole.mother)), db: Session = Depends(get_db)
) -> MotherProfile:
    return _mother_profile(db, user)


@router.patch("/mothers/me", response_model=MotherProfileOut)
def update_my_mother_profile(
    data: MotherProfileUpdate,
    user: User = Depends(require_role(UserRole.mother)),
    db: Session = Depends(get_db),
) -> MotherProfile:
    profile = _mother_profile(db, user)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, key, value)
    db.commit()
    db.refresh(profile)
    return profile


# --- Children (a mother's own) ---


def _own_child(db: Session, user: User, child_id: uuid.UUID) -> Child:
    child = db.query(Child).filter(Child.id == child_id, Child.mother_user_id == user.id).first()
    if child is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    return child


@router.get("/mothers/me/children", response_model=list[ChildOut])
def list_children(
    user: User = Depends(require_role(UserRole.mother)), db: Session = Depends(get_db)
) -> list[Child]:
    return db.query(Child).filter(Child.mother_user_id == user.id).order_by(Child.created_at).all()


@router.post("/mothers/me/children", response_model=ChildOut, status_code=status.HTTP_201_CREATED)
def add_child(
    data: ChildCreate,
    user: User = Depends(require_role(UserRole.mother)),
    db: Session = Depends(get_db),
) -> Child:
    child = Child(mother_user_id=user.id, **data.model_dump())
    db.add(child)
    db.commit()
    db.refresh(child)
    return child


@router.patch("/mothers/me/children/{child_id}", response_model=ChildOut)
def update_child(
    child_id: uuid.UUID,
    data: ChildUpdate,
    user: User = Depends(require_role(UserRole.mother)),
    db: Session = Depends(get_db),
) -> Child:
    child = _own_child(db, user, child_id)
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(child, key, value)
    db.commit()
    db.refresh(child)
    return child


@router.delete("/mothers/me/children/{child_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_child(
    child_id: uuid.UUID,
    user: User = Depends(require_role(UserRole.mother)),
    db: Session = Depends(get_db),
) -> None:
    child = _own_child(db, user, child_id)
    db.delete(child)
    db.commit()
