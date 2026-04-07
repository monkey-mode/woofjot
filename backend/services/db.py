from __future__ import annotations

import asyncpg

MIGRATIONS = """
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
  note        TEXT,
  raw_text    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_images_job_id ON images(job_id);
CREATE INDEX IF NOT EXISTS idx_images_status ON images(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date DESC);
"""


async def run_migrations(pool: asyncpg.Pool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(MIGRATIONS)


async def insert_image(
    conn: asyncpg.Connection,
    job_id: str,
    storage_key: str,
    url: str,
    original_name: str | None,
    mime_type: str | None,
) -> int:
    row = await conn.fetchrow(
        """
        INSERT INTO images (job_id, storage_key, url, original_name, mime_type, status)
        VALUES ($1, $2, $3, $4, $5, 'pending')
        RETURNING id
        """,
        job_id, storage_key, url, original_name, mime_type,
    )
    return row["id"]


async def update_image_status(
    conn: asyncpg.Connection,
    job_id: str,
    status: str,
    size_bytes: int | None = None,
    error: str | None = None,
) -> None:
    await conn.execute(
        """
        UPDATE images
        SET status = $1,
            size_bytes = COALESCE($2, size_bytes),
            error = COALESCE($3, error),
            updated_at = now()
        WHERE job_id = $4
        """,
        status, size_bytes, error, job_id,
    )


async def insert_expense(
    conn: asyncpg.Connection,
    image_id: int,
    result: dict,
) -> int:
    row = await conn.fetchrow(
        """
        INSERT INTO expenses (image_id, amount, currency, date, time, raw_text)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        """,
        image_id,
        result.get("amount"),
        result.get("currency", "THB"),
        result.get("date"),
        result.get("time"),
        result.get("raw_text"),
    )
    return row["id"]


async def get_scan_status(
    conn: asyncpg.Connection,
    job_id: str,
) -> dict | None:
    row = await conn.fetchrow(
        """
        SELECT
            i.id AS image_id,
            i.job_id,
            i.url AS image_url,
            i.status,
            i.error,
            e.id AS expense_id,
            e.amount,
            e.currency,
            e.date,
            e.time
        FROM images i
        LEFT JOIN expenses e ON e.image_id = i.id
        WHERE i.job_id = $1
        """,
        job_id,
    )
    return dict(row) if row else None


async def get_expenses(conn: asyncpg.Connection) -> list[dict]:
    rows = await conn.fetch(
        """
        SELECT
            e.id,
            e.image_id,
            i.url AS image_url,
            e.amount,
            e.currency,
            e.date,
            e.time,
            e.category,
            e.note,
            e.created_at
        FROM expenses e
        JOIN images i ON i.id = e.image_id
        ORDER BY e.date DESC NULLS LAST, e.created_at DESC
        """
    )
    return [dict(r) for r in rows]


async def update_expense(
    conn: asyncpg.Connection,
    expense_id: int,
    category: str | None,
    note: str | None,
) -> None:
    await conn.execute(
        """
        UPDATE expenses
        SET category = COALESCE($1, category),
            note = COALESCE($2, note),
            updated_at = now()
        WHERE id = $3
        """,
        category, note, expense_id,
    )


async def delete_image_by_expense_id(
    conn: asyncpg.Connection,
    expense_id: int,
) -> None:
    await conn.execute(
        """
        DELETE FROM images
        WHERE id = (SELECT image_id FROM expenses WHERE id = $1)
        """,
        expense_id,
    )
