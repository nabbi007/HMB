import uuid
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, require_role
from app.db.session import get_db
from app.models.booking import Booking, BookingStatus
from app.models.child import Child
from app.models.nurse_profile import NurseProfile, VerificationStatus
from app.models.payment import Payment, PaymentStatus
from app.models.user import User, UserRole
from app.schemas.booking import BookingCreate, BookingOut
from app.services import email as email_service
from app.services import payments as gateway
from app.services import pricing

router = APIRouter(tags=["bookings"])


def _payment(db: Session, booking_id: uuid.UUID) -> Payment | None:
    return db.query(Payment).filter(Payment.booking_id == booking_id).first()


def _booking_out(db: Session, b: Booking) -> BookingOut:
    nurse = db.get(User, b.nurse_user_id)
    mother = db.get(User, b.mother_user_id)
    profile = db.query(NurseProfile).filter(NurseProfile.user_id == b.nurse_user_id).first()
    pay = _payment(db, b.id)
    child = db.get(Child, b.child_id) if b.child_id else None
    return BookingOut(
        id=b.id,
        status=b.status.value,
        care_date=b.care_date,
        start_time=b.start_time,
        hours=b.hours,
        days=b.days,
        note=b.note,
        estimated_amount=b.estimated_amount,
        created_at=b.created_at,
        mother_completed=b.mother_completed_at is not None,
        nurse_completed=b.nurse_completed_at is not None,
        nurse_user_id=b.nurse_user_id,
        nurse_name=nurse.full_name if nurse else "",
        nurse_photo_url=profile.profile_photo_url if profile else None,
        mother_user_id=b.mother_user_id,
        mother_name=mother.full_name if mother else "",
        payment_status=pay.status.value if pay else None,
        hmb_fee=pay.hmb_fee if pay else None,
        nurse_payout=pay.nurse_payout if pay else None,
        child_id=child.id if child else None,
        child_name=child.name if child else None,
        child_age_years=child.age_years if child else None,
        child_allergies=child.allergies if child else None,
        child_notes=child.notes if child else None,
    )


@router.post("/bookings", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking(
    data: BookingCreate,
    mother: User = Depends(require_role(UserRole.mother)),
    db: Session = Depends(get_db),
) -> BookingOut:
    row = (
        db.query(NurseProfile, User)
        .join(User, User.id == NurseProfile.user_id)
        .filter(
            NurseProfile.user_id == data.nurse_id,
            NurseProfile.verification_status == VerificationStatus.verified,
            User.is_active.is_(True),
        )
        .first()
    )
    if row is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="That caregiver isn't available"
        )
    _profile, nurse = row

    # If a child is named, it must be the mother's own.
    if data.child_id is not None:
        child = (
            db.query(Child)
            .filter(Child.id == data.child_id, Child.mother_user_id == mother.id)
            .first()
        )
        if child is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Child not found"
            )

    # HMB sets the price (caregivers don't). Base + overage, less any multi-day discount.
    total = pricing.quote(data.hours, data.days)["total"]
    booking = Booking(
        mother_user_id=mother.id,
        nurse_user_id=nurse.id,
        child_id=data.child_id,
        care_date=data.care_date,
        start_time=data.start_time,
        hours=data.hours,
        days=data.days,
        note=data.note,
        estimated_amount=total,
        status=BookingStatus.requested,
    )
    db.add(booking)
    db.commit()
    db.refresh(booking)
    if nurse.email:
        try:
            email_service.send_booking_request_email(
                nurse.email, mother.full_name, str(data.care_date)
            )
        except Exception:  # noqa: BLE001
            pass
    return _booking_out(db, booking)


@router.get("/bookings", response_model=list[BookingOut])
def list_bookings(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[BookingOut]:
    q = db.query(Booking)
    if user.role == UserRole.mother:
        q = q.filter(Booking.mother_user_id == user.id)
    elif user.role == UserRole.nurse:
        q = q.filter(Booking.nurse_user_id == user.id)
    # admin sees all
    q = q.order_by(Booking.created_at.desc())
    return [_booking_out(db, b) for b in q.all()]


def _nurse_booking(db: Session, nurse: User, booking_id: uuid.UUID) -> Booking:
    b = db.get(Booking, booking_id)
    if b is None or b.nurse_user_id != nurse.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    return b


def _decide(db: Session, nurse: User, booking_id: uuid.UUID, accepted: bool) -> BookingOut:
    b = _nurse_booking(db, nurse, booking_id)
    if b.status != BookingStatus.requested:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only a requested booking can be accepted or declined",
        )
    b.status = BookingStatus.accepted if accepted else BookingStatus.declined
    db.commit()
    db.refresh(b)
    mother = db.get(User, b.mother_user_id)
    if mother and mother.email:
        try:
            email_service.send_booking_decision_email(mother.email, nurse.full_name, accepted)
        except Exception:  # noqa: BLE001
            pass
    return _booking_out(db, b)


@router.post("/bookings/{booking_id}/accept", response_model=BookingOut)
def accept_booking(
    booking_id: uuid.UUID,
    nurse: User = Depends(require_role(UserRole.nurse)),
    db: Session = Depends(get_db),
) -> BookingOut:
    return _decide(db, nurse, booking_id, accepted=True)


@router.post("/bookings/{booking_id}/decline", response_model=BookingOut)
def decline_booking(
    booking_id: uuid.UUID,
    nurse: User = Depends(require_role(UserRole.nurse)),
    db: Session = Depends(get_db),
) -> BookingOut:
    return _decide(db, nurse, booking_id, accepted=False)


@router.post("/bookings/{booking_id}/pay", response_model=BookingOut)
def pay_booking(
    booking_id: uuid.UUID,
    mother: User = Depends(require_role(UserRole.mother)),
    db: Session = Depends(get_db),
) -> BookingOut:
    """Mother pays for an accepted booking. Funds are held in escrow until the shift completes."""
    b = db.get(Booking, booking_id)
    if b is None or b.mother_user_id != mother.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if b.status != BookingStatus.accepted:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only an accepted booking can be paid",
        )
    if _payment(db, b.id) is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="This booking is already paid"
        )
    if b.estimated_amount is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="This booking has no amount to charge"
        )

    amount = Decimal(b.estimated_amount)
    fee = (amount * Decimal(str(gateway.HMB_FEE_RATE))).quantize(
        Decimal("0.01"), rounding=ROUND_HALF_UP
    )
    payout = amount - fee
    ref = gateway.charge(float(amount))

    db.add(
        Payment(
            booking_id=b.id,
            amount=amount,
            hmb_fee=fee,
            nurse_payout=payout,
            status=PaymentStatus.held,
            provider_ref=ref,
        )
    )
    b.status = BookingStatus.confirmed
    db.commit()
    db.refresh(b)

    nurse = db.get(User, b.nurse_user_id)
    if nurse and nurse.email:
        try:
            email_service.send_payment_received_email(
                nurse.email, mother.full_name, str(b.care_date)
            )
        except Exception:  # noqa: BLE001
            pass
    return _booking_out(db, b)


@router.post("/bookings/{booking_id}/complete", response_model=BookingOut)
def complete_booking(
    booking_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> BookingOut:
    """Either party confirms the assignment is complete. HMB holds the funds in escrow
    and releases them to the caregiver ONLY once BOTH the parent and caregiver confirm."""
    b = db.get(Booking, booking_id)
    if b is None or user.id not in (b.mother_user_id, b.nurse_user_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if b.status != BookingStatus.confirmed:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Only a confirmed (paid) booking can be completed",
        )

    now = datetime.now(UTC)
    if user.id == b.mother_user_id:
        b.mother_completed_at = b.mother_completed_at or now
    else:
        b.nurse_completed_at = b.nurse_completed_at or now

    # Release escrow to the caregiver only when BOTH sides have confirmed.
    if b.mother_completed_at and b.nurse_completed_at:
        pay = _payment(db, b.id)
        if pay and pay.status == PaymentStatus.held:
            pay.provider_ref = gateway.payout(float(pay.nurse_payout), str(b.nurse_user_id))
            pay.status = PaymentStatus.released
            nurse = db.get(User, b.nurse_user_id)
            if nurse and nurse.email:
                try:
                    email_service.send_payout_email(nurse.email, str(pay.nurse_payout))
                except Exception:  # noqa: BLE001
                    pass
        b.status = BookingStatus.completed

    db.commit()
    db.refresh(b)
    return _booking_out(db, b)


@router.post("/bookings/{booking_id}/cancel", response_model=BookingOut)
def cancel_booking(
    booking_id: uuid.UUID,
    mother: User = Depends(require_role(UserRole.mother)),
    db: Session = Depends(get_db),
) -> BookingOut:
    b = db.get(Booking, booking_id)
    if b is None or b.mother_user_id != mother.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found")
    if b.status not in (
        BookingStatus.requested,
        BookingStatus.accepted,
        BookingStatus.confirmed,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="This booking can't be cancelled"
        )

    # A paid (confirmed) booking is refunded from escrow on cancel.
    pay = _payment(db, b.id)
    if pay and pay.status == PaymentStatus.held:
        pay.provider_ref = gateway.refund(pay.provider_ref)
        pay.status = PaymentStatus.refunded
        if mother.email:
            try:
                email_service.send_refund_email(mother.email, str(pay.amount))
            except Exception:  # noqa: BLE001
                pass

    b.status = BookingStatus.cancelled
    db.commit()
    db.refresh(b)
    return _booking_out(db, b)
