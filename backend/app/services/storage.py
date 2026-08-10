"""File storage. Dev writes to a local directory served at /uploads.

Swap `save_upload` for an R2/Supabase upload (or presigned-URL flow) in prod —
the rest of the app only depends on the returned URL.
"""

import os
import uuid

from app.core.config import settings

# Accepted upload types → file extension.
ALLOWED_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "application/pdf": ".pdf",
}


def save_upload(data: bytes, content_type: str) -> str:
    """Persist bytes and return the public URL path to reach them."""
    ext = ALLOWED_TYPES[content_type]
    os.makedirs(settings.upload_dir, exist_ok=True)
    name = f"{uuid.uuid4().hex}{ext}"
    with open(os.path.join(settings.upload_dir, name), "wb") as f:
        f.write(data)
    return f"{settings.upload_base_url}/{name}"
