from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
import db
from routers import scan, upload, webhook

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("slip")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = await asyncpg.create_pool(dsn=settings.database_url)
    await db.run_migrations(app.state.db)
    logger.info("Database ready")
    yield
    await app.state.db.close()


app = FastAPI(title="WoofJot Slip API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(webhook.router)
app.include_router(scan.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
