from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request

import db
from models import ScanResult, ScanStatusResponse

router = APIRouter()


@router.get("/scan/{job_id}", response_model=ScanStatusResponse)
async def get_scan(job_id: str, request: Request):
    async with request.app.state.db.acquire() as conn:
        row = await db.get_scan_status(conn, job_id)

    if row is None:
        raise HTTPException(status_code=404, detail="Job not found")

    result = None
    if row["status"] == "done" and row["expense_id"] is not None:
        result = ScanResult(
            expense_id=row["expense_id"],
            image_id=row["image_id"],
            image_url=row["image_url"],
            amount=row["amount"],
            currency=row["currency"] or "THB",
            date=row["date"],
            time=row["time"],
        )

    return ScanStatusResponse(
        job_id=job_id,
        status=row["status"],
        result=result,
        error=row.get("error"),
    )
