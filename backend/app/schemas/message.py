import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class SendMessage(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class MessageOut(BaseModel):
    id: uuid.UUID
    sender_user_id: uuid.UUID
    recipient_user_id: uuid.UUID
    body: str
    created_at: datetime


class ConversationOut(BaseModel):
    other_user_id: uuid.UUID
    other_name: str
    other_photo_url: str | None
    last_message: str
    last_at: datetime
    unread_count: int
