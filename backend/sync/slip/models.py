from __future__ import annotations

from datetime import date, time
from typing import Literal

from pydantic import BaseModel


class PresignRequest(BaseModel):
    filename: str
    content_type: str


class PresignResponse(BaseModel):
    upload_url: str
    key: str
    job_id: str
    expires_in: int


class ScanResult(BaseModel):
    expense_id: int
    image_id: int
    image_url: str
    thumbnail_url: str | None
    amount: float | None
    currency: str
    date: date | None
    time: time | None


class ScanStatusResponse(BaseModel):
    job_id: str
    status: Literal["pending", "uploaded", "resizing", "processing", "done", "failed"]
    result: ScanResult | None = None
    error: str | None = None
