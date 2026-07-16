"""PostgreSQL database helpers — connection pooling and query execution."""

from __future__ import annotations

from typing import Any, Sequence
import psycopg2
import psycopg2.pool
from ..config import config


_pool: psycopg2.pool.ThreadedConnectionPool | None = None


def _get_pool() -> psycopg2.pool.ThreadedConnectionPool:
    global _pool
    if _pool is None:
        if not config.db_host:
            raise RuntimeError("Database not configured — set DB_HOST env var")
        _pool = psycopg2.pool.ThreadedConnectionPool(
            minconn=1, maxconn=4,
            host=config.db_host, port=config.db_port,
            dbname=config.db_name, user=config.db_user,
            password=config.db_password,
        )
    return _pool


def _query(
    sql: str, params: Sequence[Any] = (), fetch: str = "all"
) -> list[dict[str, Any]] | dict[str, Any] | None:
    pool = _get_pool()
    conn = pool.getconn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            if fetch == "none":
                conn.commit()
                return None
            rows = cur.fetchall()
            cols = [desc[0] for desc in cur.description] if cur.description else []
            result = [dict(zip(cols, row)) for row in rows]
            conn.commit()
            return result[0] if fetch == "one" and result else (result if fetch == "all" else None)
    finally:
        pool.putconn(conn)


def fetch_all(sql: str, params: Sequence[Any] = ()) -> list[dict[str, Any]]:
    r = _query(sql, params, fetch="all")
    return r if isinstance(r, list) else []


def fetch_one(sql: str, params: Sequence[Any] = ()) -> dict[str, Any] | None:
    r = _query(sql, params, fetch="one")
    return r if isinstance(r, dict) else None


def execute(sql: str, params: Sequence[Any] = ()) -> None:
    _query(sql, params, fetch="none")


def health_check() -> bool:
    """Check if the database is reachable."""
    try:
        _query("SELECT 1", fetch="one")
        return True
    except Exception:
        return False
