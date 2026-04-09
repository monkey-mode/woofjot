from __future__ import annotations

import logging
import sys
from contextlib import asynccontextmanager

import asyncpg
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from models import ExpenseResponse, ExpenseUpdate
import db

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)-8s %(name)s: %(message)s",
    datefmt="%Y-%m-%dT%H:%M:%S",
    stream=sys.stdout,
)
logger = logging.getLogger("expenses")


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.db = await asyncpg.create_pool(dsn=settings.database_url)
    await db.run_migrations(app.state.db)
    logger.info("Database ready")
    yield
    await app.state.db.close()


app = FastAPI(title="WoofJot Expenses API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/expenses", response_model=list[ExpenseResponse])
async def list_expenses(request: Request):
    async with request.app.state.db.acquire() as conn:
        rows = await db.get_expenses(conn)
    return [ExpenseResponse(**r) for r in rows]


@app.patch("/expenses/{expense_id}", response_model=None, status_code=204)
async def update_expense(expense_id: int, body: ExpenseUpdate, request: Request):
    async with request.app.state.db.acquire() as conn:
        await db.update_expense(conn, expense_id, body.model_dump(exclude_unset=True))


@app.delete("/expenses/{expense_id}", response_model=None, status_code=204)
async def delete_expense(expense_id: int, request: Request):
    async with request.app.state.db.acquire() as conn:
        await db.delete_image_by_expense_id(conn, expense_id)
