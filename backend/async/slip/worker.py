from __future__ import annotations

import asyncio
import logging
import sys

import asyncpg

from config import settings
from pubsub import subscribe_and_process

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("slip.worker")


async def main() -> None:
    logger.info("Slip worker starting...")
    pool = await asyncpg.create_pool(dsn=settings.database_url)
    logger.info("Connected to database")
    await subscribe_and_process(pool)


if __name__ == "__main__":
    asyncio.run(main())
