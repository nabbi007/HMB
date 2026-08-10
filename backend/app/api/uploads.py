from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from app.api.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.services import storage

router = APIRouter(tags=["uploads"])


@router.post("/uploads", status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = File(...),
    _user: User = Depends(get_current_user),
) -> dict[str, str]:
    """Upload an image/PDF (photo, ID, certificate) and get back its URL.

    The caller then stores the returned URL on the relevant profile field.
    """
    if file.content_type not in storage.ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Unsupported file type. Use JPG, PNG, WEBP, or PDF.",
        )
    data = await file.read()
    if not data:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Empty file")
    if len(data) > settings.max_upload_mb * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large (max {settings.max_upload_mb} MB)",
        )
    return {"url": storage.save_upload(data, file.content_type)}
