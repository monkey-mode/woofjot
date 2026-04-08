from __future__ import annotations

import io
import logging

from PIL import Image

from config import settings
import db
import storage

logger = logging.getLogger("resize.worker.resizer")


def _resize_bytes(data: bytes, max_px: int, quality: int) -> bytes:
    img = Image.open(io.BytesIO(data))
    img = img.convert("RGB")

    w, h = img.size
    scale = min(1.0, max_px / max(w, h))
    if scale < 1.0:
        new_size = (int(w * scale), int(h * scale))
        img = img.resize(new_size, Image.LANCZOS)

    out = io.BytesIO()
    img.save(out, format="JPEG", quality=quality, optimize=True)
    return out.getvalue()


async def process_resize(key: str, job_id: str, db_pool) -> None:
    try:
        logger.info("Resizing [%s] key=%s", job_id, key)
        async with db_pool.acquire() as conn:
            await db.update_image_status(conn, job_id, "resizing")

        original_bytes = await storage.download(key)
        logger.debug("Downloaded %d bytes for [%s]", len(original_bytes), job_id)

        optimized_bytes = _resize_bytes(
            original_bytes,
            settings.resize_max_px,
            settings.resize_quality,
        )
        logger.debug(
            "Resized [%s]: %d → %d bytes", job_id,
            len(original_bytes), len(optimized_bytes),
        )

        optimized_key = f"{job_id}_opt.jpg"
        await storage.upload(optimized_key, optimized_bytes, "image/jpeg")
        logger.info("Resize done [%s] → %s", job_id, optimized_key)

        return optimized_key

    except Exception as e:
        logger.error("Resize failed [%s]: %s", job_id, e, exc_info=True)
        async with db_pool.acquire() as conn:
            await db.update_image_status(conn, job_id, "failed", error=str(e))
        return None
