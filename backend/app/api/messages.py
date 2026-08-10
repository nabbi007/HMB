import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, or_
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.session import get_db
from app.models.booking import Booking
from app.models.message import Message
from app.models.nurse_profile import NurseProfile
from app.models.user import User
from app.schemas.message import ConversationOut, MessageOut, SendMessage

router = APIRouter(tags=["messages"])


def _can_message(db: Session, a: uuid.UUID, b: uuid.UUID) -> bool:
    """Allowed only between a mother and nurse who share at least one booking."""
    return (
        db.query(Booking)
        .filter(
            or_(
                and_(Booking.mother_user_id == a, Booking.nurse_user_id == b),
                and_(Booking.mother_user_id == b, Booking.nurse_user_id == a),
            )
        )
        .first()
        is not None
    )


def _display(db: Session, user_id: uuid.UUID) -> tuple[str, str | None]:
    user = db.get(User, user_id)
    if user is None:
        return "", None
    photo = None
    profile = db.query(NurseProfile).filter(NurseProfile.user_id == user_id).first()
    if profile is not None:
        photo = profile.profile_photo_url
    return user.full_name, photo


@router.get("/conversations", response_model=list[ConversationOut])
def list_conversations(
    user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[ConversationOut]:
    msgs = (
        db.query(Message)
        .filter(or_(Message.sender_user_id == user.id, Message.recipient_user_id == user.id))
        .order_by(Message.created_at.desc())
        .all()
    )
    seen: dict[uuid.UUID, ConversationOut] = {}
    for m in msgs:
        other_id = m.recipient_user_id if m.sender_user_id == user.id else m.sender_user_id
        if other_id not in seen:
            name, photo = _display(db, other_id)
            seen[other_id] = ConversationOut(
                other_user_id=other_id,
                other_name=name,
                other_photo_url=photo,
                last_message=m.body,
                last_at=m.created_at,
                unread_count=0,
            )
        if m.recipient_user_id == user.id and m.read_at is None:
            seen[other_id].unread_count += 1
    return list(seen.values())


@router.get("/conversations/{other_id}/messages", response_model=list[MessageOut])
def get_thread(
    other_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[Message]:
    msgs = (
        db.query(Message)
        .filter(
            or_(
                and_(Message.sender_user_id == user.id, Message.recipient_user_id == other_id),
                and_(Message.sender_user_id == other_id, Message.recipient_user_id == user.id),
            )
        )
        .order_by(Message.created_at.asc())
        .all()
    )
    # Mark the ones sent to me as read.
    now = datetime.now(UTC)
    for m in msgs:
        if m.recipient_user_id == user.id and m.read_at is None:
            m.read_at = now
    db.commit()
    return msgs


@router.post(
    "/conversations/{other_id}/messages",
    response_model=MessageOut,
    status_code=status.HTTP_201_CREATED,
)
def send_message(
    other_id: uuid.UUID,
    data: SendMessage,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Message:
    if other_id == user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="You can't message yourself"
        )
    if db.get(User, other_id) is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    if not _can_message(db, user.id, other_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only message someone you have a booking with",
        )
    msg = Message(sender_user_id=user.id, recipient_user_id=other_id, body=data.body)
    db.add(msg)
    db.commit()
    db.refresh(msg)
    return msg
