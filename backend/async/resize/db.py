from __future__ import annotations

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
