from __future__ import annotations

import asyncpg

_MIGRATIONS = """
CREATE TABLE IF NOT EXISTS images (
  id              SERIAL PRIMARY KEY,
  job_id          TEXT NOT NULL UNIQUE,
  storage_key     TEXT NOT NULL,
  url             TEXT NOT NULL,
  original_name   TEXT,
  mime_type       TEXT,
  size_bytes      BIGINT,
  status          TEXT NOT NULL DEFAULT 'pending',
  error           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS expenses (
  id          SERIAL PRIMARY KEY,
  image_id    INTEGER NOT NULL REFERENCES images(id) ON DELETE CASCADE,
  amount      NUMERIC(12, 2),
  currency    TEXT DEFAULT 'THB',
  date        DATE,
  time        TIME,
  category    TEXT,
  sender      TEXT,
  receiver    TEXT,
  note        TEXT,
  raw_text    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_images_job_id ON images(job_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);

ALTER TABLE expenses ADD COLUMN IF NOT EXISTS sender TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receiver TEXT;
ALTER TABLE images  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE expenses ALTER COLUMN image_id DROP NOT NULL;
"""


async def run_migrations(pool: asyncpg.Pool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(_MIGRATIONS)


async def get_expenses(
    conn: asyncpg.Connection,
    month: str,
    sort: str = "date",
) -> tuple[list[dict], list[dict]]:
    """Return (expenses, summary) for the given YYYY-MM month.

    When sort='date'     → filter & order by slip date (e.date).
    When sort='uploaded' → filter & order by upload time (e.created_at).

    summary is sorted DESC by total, ties broken by category ASC.
    """
    if sort == "uploaded":
        where = "TO_CHAR(e.created_at AT TIME ZONE 'UTC', 'YYYY-MM') = $1"
        order = "e.created_at DESC"
    else:
        where = "TO_CHAR(e.date, 'YYYY-MM') = $1"
        order = "e.date DESC NULLS LAST, e.created_at DESC"

    rows = await conn.fetch(
        f"""
        SELECT
            e.id,
            e.image_id,
            i.url           AS image_url,
            i.thumbnail_url AS thumbnail_url,
            e.amount,
            e.currency,
            e.date,
            e.time,
            e.category,
            e.sender,
            e.receiver,
            e.note,
            e.created_at
        FROM expenses e
        LEFT JOIN images i ON i.id = e.image_id
        WHERE {where}
        ORDER BY {order}
        """,
        month,
    )

    summary_rows = await conn.fetch(
        f"""
        SELECT
            e.category,
            SUM(e.amount)::float AS total
        FROM expenses e
        WHERE e.category IS NOT NULL
          AND {where}
        GROUP BY e.category
        ORDER BY total DESC, e.category ASC
        """,
        month,
    )

    return [dict(r) for r in rows], [dict(r) for r in summary_rows]


async def create_expense(conn: asyncpg.Connection, data: dict) -> int:
    return await conn.fetchval(
        """
        INSERT INTO expenses (amount, currency, date, time, category, sender, receiver, note)
        VALUES ($1, 'THB', $2, $3, $4, $5, $6, $7)
        RETURNING id
        """,
        data.get("amount"),
        data.get("date"),
        data.get("time"),
        data.get("category"),
        data.get("sender"),
        data.get("receiver"),
        data.get("note"),
    )


async def get_expense_by_id(conn: asyncpg.Connection, expense_id: int) -> dict | None:
    row = await conn.fetchrow(
        """
        SELECT
            e.id,
            e.image_id,
            i.url           AS image_url,
            i.thumbnail_url AS thumbnail_url,
            e.amount,
            e.currency,
            e.date,
            e.time,
            e.category,
            e.sender,
            e.receiver,
            e.note,
            e.created_at
        FROM expenses e
        LEFT JOIN images i ON i.id = e.image_id
        WHERE e.id = $1
        """,
        expense_id,
    )
    return dict(row) if row else None


async def update_expense(
    conn: asyncpg.Connection,
    expense_id: int,
    update: dict,
) -> None:
    fields = ["updated_at = now()"]
    params: list = []
    for col in ("amount", "date", "time", "sender", "receiver", "category", "note"):
        if col in update and update[col] is not None:
            params.append(update[col])
            fields.append(f"{col} = ${len(params)}")
    params.append(expense_id)
    await conn.execute(
        f"UPDATE expenses SET {', '.join(fields)} WHERE id = ${len(params)}",
        *params,
    )


async def delete_expense(conn: asyncpg.Connection, expense_id: int) -> None:
    image_id = await conn.fetchval(
        "SELECT image_id FROM expenses WHERE id = $1", expense_id
    )
    if image_id:
        # Deleting the image cascades to the expense row.
        await conn.execute("DELETE FROM images WHERE id = $1", image_id)
    else:
        # Manual entry — no image row, delete the expense directly.
        await conn.execute("DELETE FROM expenses WHERE id = $1", expense_id)
