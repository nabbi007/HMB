import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.deps import require_role
from app.db.session import get_db
from app.models.nurse_profile import NurseProfile, VerificationStatus
from app.models.user import User, UserRole
from app.schemas.admin import AdminNurseOut, RejectRequest
from app.services import email as email_service

router = APIRouter(prefix="/admin", tags=["admin"])


def _admin_out(profile: NurseProfile, user: User) -> AdminNurseOut:
    return AdminNurseOut(
        user_id=user.id,
        first_name=user.first_name,
        last_name=user.last_name,
        full_name=user.full_name,
        email=user.email,
        phone=user.phone,
        community=profile.community,
        languages=profile.languages or [],
        bio=profile.bio,
        verification_status=profile.verification_status.value,
        verification_reason=profile.verification_reason,
        profile_photo_url=profile.profile_photo_url,
        passport_photo_url=profile.passport_photo_url,
        nmc_pin_photo_url=profile.nmc_pin_photo_url,
        certifications=profile.certifications,
        created_at=profile.created_at,
    )


def _get(db: Session, user_id: uuid.UUID) -> tuple[NurseProfile, User]:
    row = (
        db.query(NurseProfile, User)
        .join(User, User.id == NurseProfile.user_id)
        .filter(NurseProfile.user_id == user_id)
        .first()
    )
    if row is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Nurse not found")
    return row


@router.get("/nurses", response_model=list[AdminNurseOut])
def list_nurses(
    status_filter: VerificationStatus | None = Query(None, alias="status"),
    _admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
) -> list[AdminNurseOut]:
    q = db.query(NurseProfile, User).join(User, User.id == NurseProfile.user_id)
    if status_filter is not None:
        q = q.filter(NurseProfile.verification_status == status_filter)
    q = q.order_by(NurseProfile.created_at.desc())
    return [_admin_out(profile, user) for profile, user in q.all()]


@router.post("/nurses/{user_id}/verify", response_model=AdminNurseOut)
def verify_nurse(
    user_id: uuid.UUID,
    admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
) -> AdminNurseOut:
    profile, user = _get(db, user_id)
    profile.verification_status = VerificationStatus.verified
    profile.verification_reason = None
    profile.verified_at = datetime.now(UTC)
    profile.verified_by_id = admin.id
    db.commit()
    db.refresh(profile)
    if user.email:
        try:
            email_service.send_verification_approved_email(user.email)
        except Exception:  # noqa: BLE001 - notification failure shouldn't fail the action
            pass
    return _admin_out(profile, user)


@router.post("/nurses/{user_id}/reject", response_model=AdminNurseOut)
def reject_nurse(
    user_id: uuid.UUID,
    data: RejectRequest,
    admin: User = Depends(require_role(UserRole.admin)),
    db: Session = Depends(get_db),
) -> AdminNurseOut:
    profile, user = _get(db, user_id)
    profile.verification_status = VerificationStatus.rejected
    profile.verification_reason = data.reason
    profile.verified_at = datetime.now(UTC)
    profile.verified_by_id = admin.id
    db.commit()
    db.refresh(profile)
    if user.email:
        try:
            email_service.send_verification_rejected_email(user.email, data.reason)
        except Exception:  # noqa: BLE001
            pass
    return _admin_out(profile, user)
