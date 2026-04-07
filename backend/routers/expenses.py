from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

from models import ExpenseResponse, ExpenseUpdate
from services import db

router = APIRouter()


@router.get("/expenses", response_model=list[ExpenseResponse])
async def list_expenses(request: Request):
    async with request.app.state.db.acquire() as conn:
        rows = await db.get_expenses(conn)
    return [ExpenseResponse(**r) for r in rows]


@router.patch("/expenses/{expense_id}", response_model=None, status_code=204)
async def update_expense(expense_id: int, body: ExpenseUpdate, request: Request):
    async with request.app.state.db.acquire() as conn:
        await db.update_expense(conn, expense_id, body.category, body.note)


@router.delete("/expenses/{expense_id}", response_model=None, status_code=204)
async def delete_expense(expense_id: int, request: Request):
    async with request.app.state.db.acquire() as conn:
        await db.delete_image_by_expense_id(conn, expense_id)
