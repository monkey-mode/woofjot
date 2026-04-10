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

-- idempotent column additions for existing databases
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS sender TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS receiver TEXT;
ALTER TABLE images  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
"""


async def run_migrations(pool: asyncpg.Pool) -> None:
    async with pool.acquire() as conn:
        await conn.execute(_MIGRATIONS)


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


async def transition_image_to_uploaded(
    conn: asyncpg.Connection,
    job_id: str,
    size_bytes: int | None = None,
) -> bool:
    """Update status to 'uploaded' only if currently 'pending'. Returns True if updated."""
    result = await conn.execute(
        """
        UPDATE images
        SET status = 'uploaded',
            size_bytes = COALESCE($1, size_bytes),
            updated_at = now()
        WHERE job_id = $2 AND status = 'pending'
        """,
        size_bytes, job_id,
    )
    return result == "UPDATE 1"


async def get_scan_status(
    conn: asyncpg.Connection,
    job_id: str,
) -> dict | None:
    row = await conn.fetchrow(
        """
        SELECT
            i.id            AS image_id,
            i.job_id,
            i.url           AS image_url,
            i.thumbnail_url AS thumbnail_url,
            i.status,
            i.error,
            e.id            AS expense_id,
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
