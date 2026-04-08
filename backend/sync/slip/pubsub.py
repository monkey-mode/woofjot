from __future__ import annotations

import json
import logging

import redis.asyncio as aioredis

from config import settings

logger = logging.getLogger("slip.pubsub")


async def publish(channel: str, message: dict) -> None:
    async with aioredis.from_url(settings.redis_url) as client:
        await client.publish(channel, json.dumps(message))
    logger.debug("Published to %s: %s", channel, message)
