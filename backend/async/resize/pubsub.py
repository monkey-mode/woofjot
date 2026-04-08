from __future__ import annotations

import json
import logging

import redis.asyncio as aioredis

from config import settings
from resizer import process_resize

logger = logging.getLogger("resize.worker.pubsub")


async def publish(channel: str, message: dict) -> None:
    async with aioredis.from_url(settings.redis_url) as client:
        await client.publish(channel, json.dumps(message))
    logger.debug("Published to %s: %s", channel, message)


async def subscribe_and_process(db_pool) -> None:
    """Subscribe to resize:*, resize image, publish to scan:* on success."""
    client = aioredis.from_url(settings.redis_url)
    pubsub = client.pubsub()
    await pubsub.psubscribe("resize:*")
    logger.info("Subscribed to resize:*")

    async for message in pubsub.listen():
        if message["type"] != "pmessage":
            continue
        try:
            data = json.loads(message["data"])
            job_id = data["job_id"]
            original_key = data["key"]

            optimized_key = await process_resize(original_key, job_id, db_pool)
            if optimized_key:
                await publish(f"scan:{job_id}", {"key": optimized_key, "job_id": job_id})
        except Exception as e:
            logger.error("Resize worker error: %s", e, exc_info=True)
