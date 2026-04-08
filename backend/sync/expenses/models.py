from __future__ import annotations

from datetime import date, datetime, time

from pydantic import BaseModel


class ExpenseResponse(BaseModel):
    id: int
    image_id: int
    image_url: str
    amount: float | None
    currency: str
    date: date | None
    time: time | None
    category: str | None
    note: str | None
    created_at: datetime


class ExpenseUpdate(BaseModel):
    category: str | None = None
    note: str | None = None
