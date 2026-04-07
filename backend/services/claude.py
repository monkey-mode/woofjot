from __future__ import annotations

import base64
import json

import anthropic

from config import settings
from services import db, storage

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
        model="claude-opus-4-5",
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
    return json.loads(raw)


async def process_scan(key: str, job_id: str, db_pool) -> None:
    try:
        async with db_pool.acquire() as conn:
            await db.update_image_status(conn, job_id, "processing")

        image_bytes = await storage.download(key)

        # Detect media type from key extension
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

        async with db_pool.acquire() as conn:
            image = await db.get_scan_status(conn, job_id)
            await db.insert_expense(conn, image["image_id"], result)
            await db.update_image_status(conn, job_id, "done")

    except Exception as e:
        async with db_pool.acquire() as conn:
            await db.update_image_status(conn, job_id, "failed", error=str(e))
