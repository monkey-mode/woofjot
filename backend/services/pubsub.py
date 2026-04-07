from __future__ import annotations

import json
import logging

import redis.asyncio as aioredis

from config import settings
from services.claude import process_scan

logger = logging.getLogger("woofjot.pubsub")


async def publish(channel: str, message: dict) -> None:
    client = aioredis.from_url(settings.redis_url)
    await client.publish(channel, json.dumps(message))
    await client.aclose()
    logger.debug("Published to %s: %s", channel, message)


async def subscribe_and_process(db_pool) -> None:
    """Long-running coroutine. Started once in FastAPI lifespan."""
    client = aioredis.from_url(settings.redis_url)
    pubsub = client.pubsub()
    await pubsub.psubscribe("scan:*")
    logger.info("Subscribed to scan:*")

    async for message in pubsub.listen():
        if message["type"] != "pmessage":
            continue
        try:
            data = json.loads(message["data"])
            logger.info("Received scan job: %s", data["job_id"])
            await process_scan(data["key"], data["job_id"], db_pool)
        except Exception as e:
            logger.error("Worker error: %s", e, exc_info=True)
