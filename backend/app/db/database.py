"""
Unified database engine: PostgreSQL (primary / local & Render) with SQLite fallback.
Provides an async-compatible interface for FastAPI routes.
"""
from __future__ import annotations

import os
import re
import asyncio
import sqlite3
from pathlib import Path
from typing import Any, List, Optional

# Load environment variables from .env files
try:
    from dotenv import load_dotenv
    _backend_dir = Path(__file__).resolve().parents[2]
    _root_dir = _backend_dir.parent
    for env_path in [_backend_dir / ".env", _root_dir / ".env"]:
        if env_path.is_file():
            load_dotenv(str(env_path), override=False)
except Exception:
    pass

try:
    import psycopg
    from psycopg.rows import dict_row
    PSYCOPG_AVAILABLE = True
except ImportError:
    PSYCOPG_AVAILABLE = False


def get_pg_url() -> str:
    """Return the normalized PostgreSQL connection URL."""
    url = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/zensustech")
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    return url


SQLITE_PATH = os.getenv("DB_PATH", str(Path(__file__).resolve().parents[2] / "data" / "zensus_auth.db"))

USE_POSTGRES: Optional[bool] = None


def check_postgres() -> bool:
    """Check if PostgreSQL is reachable and set USE_POSTGRES."""
    global USE_POSTGRES
    if not PSYCOPG_AVAILABLE:
        USE_POSTGRES = False
        return False
    url = get_pg_url()
    try:
        with psycopg.connect(url, connect_timeout=3) as conn:
            with conn.cursor() as cur:
                cur.execute("SELECT 1")
                USE_POSTGRES = True
                return True
    except Exception as e:
        safe_url = url.split("@")[-1] if "@" in url else url
        print(f"[DB] PostgreSQL check failed ({safe_url}): {e}")
        USE_POSTGRES = False
        return False


def is_postgres() -> bool:
    """Return whether PostgreSQL is currently active."""
    global USE_POSTGRES
    if USE_POSTGRES is None:
        check_postgres()
    return bool(USE_POSTGRES)


class DbCursor:
    def __init__(self, raw_cursor, is_pg: bool):
        self._cur = raw_cursor
        self._is_postgres = is_pg

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

    def __init__(self, conn, is_pg: bool):
        self._conn = conn
        self.is_postgres = is_pg

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
        def _close_sync():
            try:
                if not getattr(self._conn, "closed", False):
                    self._conn.close()
            except Exception:
                pass
        await asyncio.to_thread(_close_sync)


async def get_db():
    """FastAPI Dependency: yields a database connection per request."""
    if is_postgres():
        url = get_pg_url()
        conn = await asyncio.to_thread(
            psycopg.connect, url, row_factory=dict_row
        )
        wrapped = DbConnection(conn, is_pg=True)
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
        wrapped = DbConnection(conn, is_pg=False)
        try:
            yield wrapped
        finally:
            await wrapped.close()


def _init_postgres_sync(url: str):
    """Run full PostgreSQL schema and migration setup."""
    with psycopg.connect(url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. users table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(100),
                full_name VARCHAR(255) NOT NULL,
                email VARCHAR(255) NOT NULL UNIQUE,
                password_hash TEXT NOT NULL,
                role VARCHAR(50) NOT NULL DEFAULT 'END_CUSTOMER',
                phone VARCHAR(50),
                organization VARCHAR(255),
                customer VARCHAR(255),
                vendor_code VARCHAR(100),
                email_verified BOOLEAN NOT NULL DEFAULT FALSE,
                account_status VARCHAR(50) NOT NULL DEFAULT 'active',
                is_first_time INTEGER DEFAULT 0,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Ensure columns exist if table was created previously with older schema
            for col_def in [
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS user_id VARCHAR(100);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(50);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS organization VARCHAR(255);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS customer VARCHAR(255);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS vendor_code VARCHAR(100);",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS account_status VARCHAR(50) NOT NULL DEFAULT 'active';",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS is_first_time INTEGER DEFAULT 0;",
                "ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP;",
            ]:
                try:
                    cur.execute(col_def)
                except Exception:
                    pass

            # 2. email_verifications table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS email_verifications (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                otp_hash TEXT NOT NULL,
                expires_at TIMESTAMPTZ NOT NULL,
                attempts INTEGER NOT NULL DEFAULT 0,
                verified_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # 3. tenants table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS tenants (
                id SERIAL PRIMARY KEY,
                tenant_id VARCHAR(255) NOT NULL,
                tenant_name VARCHAR(255),
                provider_type VARCHAR(50) NOT NULL,
                provider_name VARCHAR(50),
                subscription_plan VARCHAR(50) NOT NULL DEFAULT 'Trial',
                connection_status VARCHAR(50) NOT NULL DEFAULT 'active',
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(tenant_id, provider_type)
            );
            """)

            # 4. user_tenants table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS user_tenants (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                association_role VARCHAR(100),
                is_primary BOOLEAN NOT NULL DEFAULT TRUE,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, tenant_id)
            );
            """)

            # 5. subscriptions table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS subscriptions (
                id SERIAL PRIMARY KEY,
                tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
                plan_name VARCHAR(50) NOT NULL,
                provider_type VARCHAR(50) NOT NULL,
                subscription_status VARCHAR(50) NOT NULL DEFAULT 'active',
                start_date TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
                expiry_date TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # 6. login_sessions table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS login_sessions (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                session_token_hash VARCHAR(255) NOT NULL UNIQUE,
                expires_at TIMESTAMPTZ NOT NULL,
                revoked_at TIMESTAMPTZ,
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # 7. auth_emails table
            cur.execute("""
            CREATE TABLE IF NOT EXISTS auth_emails (
                id SERIAL PRIMARY KEY,
                user_id INTEGER,
                recipient_email VARCHAR(255) NOT NULL,
                sender_email VARCHAR(255) NOT NULL DEFAULT 'noreply@cybaemtech.com',
                subject VARCHAR(255) NOT NULL,
                otp_code VARCHAR(50) NOT NULL,
                html_body TEXT NOT NULL,
                plain_body TEXT,
                delivery_method VARCHAR(50) NOT NULL DEFAULT 'azure_graph',
                delivery_status VARCHAR(50) NOT NULL DEFAULT 'delivered',
                created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
            );
            """)

            # Indexes
            cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_ev_user_id ON email_verifications(user_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_ut_user_id ON user_tenants(user_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_hash ON login_sessions(session_token_hash);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_auth_emails_recipient ON auth_emails(recipient_email);")

            conn.commit()


def _init_sqlite_sync():
    """Run SQLite fallback schema setup."""
    os.makedirs(os.path.dirname(SQLITE_PATH), exist_ok=True)
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
                is_first_time INTEGER DEFAULT 0,
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

            CREATE TABLE IF NOT EXISTS auth_emails (
                id              INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id         INTEGER,
                recipient_email TEXT NOT NULL,
                sender_email    TEXT NOT NULL DEFAULT 'noreply@cybaemtech.com',
                subject         TEXT NOT NULL,
                otp_code        TEXT NOT NULL,
                html_body       TEXT NOT NULL,
                plain_body      TEXT,
                delivery_method TEXT NOT NULL DEFAULT 'azure_graph',
                delivery_status TEXT NOT NULL DEFAULT 'delivered',
                created_at      TEXT NOT NULL DEFAULT (datetime('now'))
            );
        """)
        db.commit()


async def init_db():
    """Initializes schemas for whichever database is active (PostgreSQL primary, SQLite fallback)."""
    global USE_POSTGRES
    if check_postgres():
        url = get_pg_url()
        safe_url = url.split("@")[-1] if "@" in url else url
        print(f"[DB] Initializing PostgreSQL at {safe_url}")
        try:
            await asyncio.to_thread(_init_postgres_sync, url)
            print("[DB] PostgreSQL schema initialized successfully.")
        except Exception as e:
            print(f"[DB] PostgreSQL schema initialization warning: {e}")
    else:
        print(f"[DB] PostgreSQL not reachable, using SQLite fallback at {SQLITE_PATH}")
        await asyncio.to_thread(_init_sqlite_sync)
