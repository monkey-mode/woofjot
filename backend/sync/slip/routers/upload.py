from __future__ import annotations

import uuid

from fastapi import APIRouter, Request

import db
import storage
from models import PresignRequest, PresignResponse

router = APIRouter()


@router.post("/upload/presign", response_model=PresignResponse)
async def presign(body: PresignRequest, request: Request):
    ext = body.filename.rsplit(".", 1)[-1] if "." in body.filename else "jpg"
    job_id = uuid.uuid4().hex
    key = f"{job_id}.{ext}"

    upload_url = storage.generate_presigned_put(key, body.content_type)
    image_url = storage.object_url(key)

    async with request.app.state.db.acquire() as conn:
        await db.insert_image(
            conn,
            job_id=job_id,
            storage_key=key,
            url=image_url,
            original_name=body.filename,
            mime_type=body.content_type,
        )

    return PresignResponse(
        upload_url=upload_url,
        key=key,
        job_id=job_id,
        expires_in=900,
    )
