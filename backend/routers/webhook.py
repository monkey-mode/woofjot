from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from config import settings
from services import db, pubsub

router = APIRouter()


@router.post("/webhook/minio")
async def minio_webhook(request: Request):
    auth = request.headers.get("Authorization", "")
    if auth != f"Bearer {settings.webhook_secret}":
        raise HTTPException(status_code=403, detail="Forbidden")

    payload = await request.json()

    try:
        record = payload["Records"][0]["s3"]["object"]
        key = record["key"]
        size_bytes = record.get("size")
    except (KeyError, IndexError):
        raise HTTPException(status_code=400, detail="Invalid S3 event payload")

    job_id = key.rsplit(".", 1)[0]

    async with request.app.state.db.acquire() as conn:
        await db.update_image_status(conn, job_id, "uploaded", size_bytes=size_bytes)

    await pubsub.publish(f"scan:{job_id}", {"key": key, "job_id": job_id})

    return {"ok": True}
