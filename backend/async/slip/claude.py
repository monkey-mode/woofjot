from __future__ import annotations

import base64
import json
import logging

import anthropic

from config import settings
import db
import storage

logger = logging.getLogger("slip.worker.claude")

_PROMPT = """Extract the following fields from this Thai bank transfer slip and return \
ONLY a JSON object with no extra text, preamble, or markdown fences:

{
  "amount": <number only, no commas or currency symbol>,
  "currency": "THB",
  "date": <YYYY-MM-DD, convert Buddhist Era to CE>,
  "time": <HH:MM:SS or null>,
  "raw_text": <all visible text as a single string>
}

If a field cannot be found, set it to null."""


async def extract_slip(image_bytes: bytes, media_type: str = "image/jpeg") -> dict:
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    b64 = base64.standard_b64encode(image_bytes).decode()

    message = await client.messages.create(
        model=settings.claude_model,
        max_tokens=512,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": b64,
                        },
                    },
                    {"type": "text", "text": _PROMPT},
                ],
            }
        ],
    )

    raw = message.content[0].text.strip()
    logger.info("Claude raw response: %s", raw)
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
        raw = raw.strip()
    if not raw:
        raise ValueError("Claude returned an empty response")
    return json.loads(raw)


async def process_scan(key: str, job_id: str, db_pool) -> None:
    try:
        logger.info("Processing scan [%s] key=%s", job_id, key)
        async with db_pool.acquire() as conn:
            await db.update_image_status(conn, job_id, "processing")

        image_bytes = await storage.download(key)
        logger.debug("Downloaded %d bytes for [%s]", len(image_bytes), job_id)

        ext = key.rsplit(".", 1)[-1].lower() if "." in key else "jpeg"
        media_type_map = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "gif": "image/gif",
            "webp": "image/webp",
        }
        media_type = media_type_map.get(ext, "image/jpeg")

        result = await extract_slip(image_bytes, media_type)
        logger.info(
            "Extraction result [%s]: amount=%s date=%s",
            job_id, result.get("amount"), result.get("date"),
        )

        async with db_pool.acquire() as conn:
            image_id = await db.get_image_id(conn, job_id)
            await db.insert_expense(conn, image_id, result)
            await db.update_image_status(conn, job_id, "done")

        logger.info("Scan done [%s]", job_id)

    except Exception as e:
        logger.error("Scan failed [%s]: %s", job_id, e, exc_info=True)
        async with db_pool.acquire() as conn:
            await db.update_image_status(conn, job_id, "failed", error=str(e))
