from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import expenses, scan, upload, webhook
from services import db, pubsub


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = await asyncpg.create_pool(dsn=settings.database_url)
    await db.run_migrations(app.state.db)

    worker_task = asyncio.create_task(
        pubsub.subscribe_and_process(app.state.db)
    )

    yield

    worker_task.cancel()
    await app.state.db.close()


app = FastAPI(title="หมาจด / WoofJot API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(webhook.router)
app.include_router(scan.router)
app.include_router(expenses.router)


@app.get("/health")
async def health():
    return {"status": "ok"}
