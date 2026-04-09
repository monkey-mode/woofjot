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
"""


async def run_migrations(pool: asyncpg.Pool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(_MIGRATIONS)


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
            e.sender,
            e.receiver,
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
