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


async def process_resize(key: str, job_id: str, db_pool) -> str | None:
    try:
        logger.info("Resizing [%s] key=%s", job_id, key)
        async with db_pool.acquire() as conn:
            await db.update_image_status(conn, job_id, "resizing")

        original_bytes = await storage.download(key)
        logger.debug("Downloaded %d bytes for [%s]", len(original_bytes), job_id)

        # 1. Storage-optimised original — high-res compressed, replaces raw upload in UI
        store_bytes = _resize_bytes(
            original_bytes, settings.resize_store_max_px, settings.resize_store_quality,
        )
        store_key = f"{job_id}_store.jpg"
        await storage.upload(store_key, store_bytes, "image/jpeg")

        # 2. LLM-optimised copy — sent to Claude
        opt_bytes = _resize_bytes(
            original_bytes, settings.resize_max_px, settings.resize_quality,
        )
        opt_key = f"{job_id}_opt.jpg"
        await storage.upload(opt_key, opt_bytes, "image/jpeg")

        # 3. Thumbnail — shown inline in the expense row
        thumb_bytes = _resize_bytes(
            original_bytes, settings.resize_thumb_max_px, settings.resize_thumb_quality,
        )
        thumb_key = f"{job_id}_thumb.jpg"
        await storage.upload(thumb_key, thumb_bytes, "image/jpeg")

        logger.info(
            "Resize done [%s]: orig=%d store=%d opt=%d thumb=%d bytes",
            job_id, len(original_bytes), len(store_bytes), len(opt_bytes), len(thumb_bytes),
        )

        # Update images.url → storage-optimised; images.thumbnail_url → thumbnail
        async with db_pool.acquire() as conn:
            await db.update_image_urls(
                conn, job_id,
                url=storage.object_url(store_key),
                thumbnail_url=storage.object_url(thumb_key),
            )

        return opt_key

    except Exception as e:
        logger.error("Resize failed [%s]: %s", job_id, e, exc_info=True)
        async with db_pool.acquire() as conn:
            await db.update_image_status(conn, job_id, "failed", error=str(e))
        return None
