"""
Unified database engine: PostgreSQL (primary / Render) with SQLite fallback.
Provides an async-compatible interface for FastAPI routes.
"""
import os
import re
import asyncio
import sqlite3
from pathlib import Path
from typing import Any, List, Optional, Tuple, Union

try:
    import psycopg
    from psycopg.rows import dict_row
    PSYCOPG_AVAILABLE = True
except ImportError:
    PSYCOPG_AVAILABLE = False

DEFAULT_PG_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/zensustech")
if DEFAULT_PG_URL.startswith("postgres://"):
    DEFAULT_PG_URL = "postgresql://" + DEFAULT_PG_URL[len("postgres://"):]

SQLITE_PATH = os.getenv("DB_PATH", str(Path(__file__).resolve().parents[2] / "data" / "zensus_auth.db"))

USE_POSTGRES = False


def _check_postgres() -> bool:
    if not PSYCOPG_AVAILABLE:
        return False
    try:
        with psycopg.connect(DEFAULT_PG_URL, connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                return True
    except Exception:
        return False


class DbCursor:
    def __init__(self, raw_cursor, is_postgres: bool):
        self._cur = raw_cursor
        self._is_postgres = is_postgres

    async def fetchone(self) -> Optional[dict]:
        row = await asyncio.to_thread(self._cur.fetchone)
        if row is None:
            return None
        if isinstance(row, dict):
            return row
        return dict(row)

    async def fetchall(self) -> List[dict]:
        rows = await asyncio.to_thread(self._cur.fetchall)
        if not rows:
            return []
        if isinstance(rows[0], dict):
            return rows
        return [dict(r) for r in rows]

    @property
    def rowcount(self) -> int:
        return self._cur.rowcount


class DbCursorContext:
    def __init__(self, db_conn, sql: str, params: tuple):
        self.db_conn = db_conn
        self.sql = sql
        self.params = params
        self.cursor: Optional[DbCursor] = None

    def __await__(self):
        return self._get_cursor().__await__()

    async def _get_cursor(self) -> DbCursor:
        prep_sql = self.db_conn._prepare_sql(self.sql)
        prep_params = self.db_conn._prepare_params(self.params)
        raw_cur = await asyncio.to_thread(self.db_conn._sync_execute, prep_sql, prep_params)
        self.cursor = DbCursor(raw_cur, self.db_conn.is_postgres)
        return self.cursor

    async def __aenter__(self) -> DbCursor:
        return await self._get_cursor()

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        if self.cursor and hasattr(self.cursor._cur, "close"):
            try:
                self.cursor._cur.close()
            except Exception:
                pass


class DbConnection:
    """Wrapper that exposes async execute/commit for both PostgreSQL and SQLite."""

    def __init__(self, conn, is_postgres: bool):
        self._conn = conn
        self.is_postgres = is_postgres

    def _prepare_sql(self, sql: str) -> str:
        if self.is_postgres:
            s = sql.replace("?", "%s")
            s = re.sub(r"datetime\('now'\)", "CURRENT_TIMESTAMP", s, flags=re.IGNORECASE)
            return s
        return sql

    def _prepare_params(self, params: tuple) -> tuple:
        if not params:
            return ()
        if not self.is_postgres:
            return tuple(1 if p is True else 0 if p is False else p for p in params)
        return params

    def _sync_execute(self, sql: str, params: tuple):
        cur = self._conn.cursor()
        cur.execute(sql, params)
        return cur

    def execute(self, sql: str, params: tuple = ()) -> DbCursorContext:
        return DbCursorContext(self, sql, params)

    async def commit(self):
        await asyncio.to_thread(self._conn.commit)

    async def close(self):
        await asyncio.to_thread(self._conn.close)


async def get_db():
    """FastAPI Dependency: yields a database connection per request."""
    global USE_POSTGRES
    if USE_POSTGRES and PSYCOPG_AVAILABLE:
        conn = await asyncio.to_thread(
            psycopg.connect, DEFAULT_PG_URL, row_factory=dict_row
        )
        wrapped = DbConnection(conn, is_postgres=True)
        try:
            yield wrapped
        finally:
            await wrapped.close()
    else:
        def _get_sqlite():
            c = sqlite3.connect(SQLITE_PATH, check_same_thread=False)
            c.row_factory = sqlite3.Row
            return c

        conn = await asyncio.to_thread(_get_sqlite)
        wrapped = DbConnection(conn, is_postgres=False)
        try:
            yield wrapped
        finally:
            await wrapped.close()


async def init_db():
    """Initializes schemas for whichever database is active."""
    global USE_POSTGRES
    if _check_postgres():
        USE_POSTGRES = True
        print(f"[DB] Initializing PostgreSQL at {DEFAULT_PG_URL.split('@')[-1] if '@' in DEFAULT_PG_URL else DEFAULT_PG_URL}")
        try:
            from scripts.setup_postgres_auth import setup_postgres
            await asyncio.to_thread(setup_postgres)
        except Exception as e:
            print(f"[DB] PostgreSQL setup note: {e}")
    else:
        USE_POSTGRES = False
        print(f"[DB] PostgreSQL not reachable, using SQLite at {SQLITE_PATH}")
        def _init_sqlite():
            with sqlite3.connect(SQLITE_PATH) as db:
                db.executescript("""
                    PRAGMA journal_mode=WAL;

                    CREATE TABLE IF NOT EXISTS users (
                        id          INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id     TEXT,
                        full_name   TEXT NOT NULL,
                        email       TEXT NOT NULL UNIQUE,
                        password_hash TEXT NOT NULL,
                        role        TEXT NOT NULL DEFAULT 'END_CUSTOMER',
                        phone       TEXT,
                        organization TEXT,
                        customer    TEXT,
                        vendor_code TEXT,
                        email_verified INTEGER NOT NULL DEFAULT 0,
                        account_status TEXT NOT NULL DEFAULT 'active',
                        created_at  TEXT NOT NULL DEFAULT (datetime('now')),
                        updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
                    );

                    CREATE TABLE IF NOT EXISTS email_verifications (
                        id          INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        otp_hash    TEXT NOT NULL,
                        expires_at  TEXT NOT NULL,
                        attempts    INTEGER NOT NULL DEFAULT 0,
                        verified_at TEXT,
                        created_at  TEXT NOT NULL DEFAULT (datetime('now'))
                    );

                    CREATE TABLE IF NOT EXISTS tenants (
                        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                        tenant_id           TEXT NOT NULL,
                        tenant_name         TEXT,
                        provider_type       TEXT NOT NULL,
                        provider_name       TEXT,
                        subscription_plan   TEXT NOT NULL DEFAULT 'Trial',
                        connection_status   TEXT NOT NULL DEFAULT 'active',
                        created_at          TEXT NOT NULL DEFAULT (datetime('now')),
                        updated_at          TEXT NOT NULL DEFAULT (datetime('now')),
                        UNIQUE(tenant_id, provider_type)
                    );

                    CREATE TABLE IF NOT EXISTS user_tenants (
                        id              INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        tenant_id       INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                        association_role TEXT,
                        is_primary      INTEGER NOT NULL DEFAULT 1,
                        created_at      TEXT NOT NULL DEFAULT (datetime('now')),
                        UNIQUE(user_id, tenant_id)
                    );

                    CREATE TABLE IF NOT EXISTS subscriptions (
                        id                  INTEGER PRIMARY KEY AUTOINCREMENT,
                        tenant_id           INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                        plan_name           TEXT NOT NULL,
                        provider_type       TEXT NOT NULL,
                        subscription_status TEXT NOT NULL DEFAULT 'active',
                        start_date          TEXT NOT NULL DEFAULT (datetime('now')),
                        expiry_date         TEXT,
                        created_at          TEXT NOT NULL DEFAULT (datetime('now'))
                    );

                    CREATE TABLE IF NOT EXISTS login_sessions (
                        id              INTEGER PRIMARY KEY AUTOINCREMENT,
                        user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                        session_token_hash TEXT NOT NULL UNIQUE,
                        expires_at      TEXT NOT NULL,
                        revoked_at      TEXT,
                        created_at      TEXT NOT NULL DEFAULT (datetime('now'))
                    );
                """)
                db.commit()
        await asyncio.to_thread(_init_sqlite)
