from __future__ import annotations

from datetime import date, datetime, time

from pydantic import BaseModel

# Aliases avoid Pydantic annotation evaluation bug where field names with
# defaults (e.g. `date: date | None = None`) shadow the imported type.
_Date = date
_Time = time


class ExpenseResponse(BaseModel):
    id: int
    image_id: int | None
    image_url: str | None
    thumbnail_url: str | None
    amount: float | None
    currency: str
    date: _Date | None
    time: _Time | None
    category: str | None
    sender: str | None
    receiver: str | None
    note: str | None
    created_at: datetime


class ExpenseCreate(BaseModel):
    amount: float | None = None
    date: _Date | None = None
    time: _Time | None = None
    sender: str | None = None
    receiver: str | None = None
    category: str | None = None
    note: str | None = None


class CategorySummary(BaseModel):
    category: str
    total: float


class ExpensesResponse(BaseModel):
    expenses: list[ExpenseResponse]
    summary: list[CategorySummary]


class ExpenseUpdate(BaseModel):
    amount: float | None = None
    date: _Date | None = None
    time: _Time | None = None
    sender: str | None = None
    receiver: str | None = None
    category: str | None = None
    note: str | None = None
