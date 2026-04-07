from __future__ import annotations

import json

import redis.asyncio as aioredis

from config import settings
from services.claude import process_scan


async def publish(channel: str, message: dict) -> None:
    client = aioredis.from_url(settings.redis_url)
    await client.publish(channel, json.dumps(message))
    await client.aclose()


async def subscribe_and_process(db_pool) -> None:
    """Long-running coroutine. Started once in FastAPI lifespan."""
    client = aioredis.from_url(settings.redis_url)
    pubsub = client.pubsub()
    await pubsub.psubscribe("scan:*")

    async for message in pubsub.listen():
        if message["type"] != "pmessage":
            continue
        try:
            data = json.loads(message["data"])
            await process_scan(data["key"], data["job_id"], db_pool)
        except Exception as e:
            print(f"Worker error: {e}")
