from __future__ import annotations

import datetime

import asyncpg


async def update_image_status(
    conn: asyncpg.Connection,
    job_id: str,
    status: str,
    error: str | None = None,
) -> None:
    await conn.execute(
        """
        UPDATE images
        SET status = $1,
            error = COALESCE($2, error),
            updated_at = now()
        WHERE job_id = $3
        """,
        status, error, job_id,
    )


async def get_image_id(
    conn: asyncpg.Connection,
    job_id: str,
) -> int | None:
    row = await conn.fetchrow(
        "SELECT id FROM images WHERE job_id = $1",
        job_id,
    )
    return row["id"] if row else None


async def insert_expense(
    conn: asyncpg.Connection,
    image_id: int,
    result: dict,
) -> int:
    raw_date = result.get("date")
    raw_time = result.get("time")
    date = datetime.date.fromisoformat(raw_date) if raw_date else None
    time = datetime.time.fromisoformat(raw_time) if raw_time else None

    row = await conn.fetchrow(
        """
        INSERT INTO expenses (image_id, amount, currency, date, time, category, raw_text)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
        """,
        image_id,
        result.get("amount"),
        result.get("currency", "THB"),
        date,
        time,
        result.get("category"),
        result.get("raw_text"),
    )
    return row["id"]
