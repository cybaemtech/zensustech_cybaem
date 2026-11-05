"""
SQLite database setup using aiosqlite for async operations.
"""
import aiosqlite
import os
from pathlib import Path

DB_PATH = os.getenv("DB_PATH", str(Path(__file__).resolve().parents[2] / "data" / "zensus_auth.db"))


async def get_db() -> aiosqlite.Connection:
    """Dependency: yields an async DB connection per request."""
    async with aiosqlite.connect(DB_PATH) as db:
        db.row_factory = aiosqlite.Row
        yield db


async def init_db():
    """Create all tables if they do not exist."""
    async with aiosqlite.connect(DB_PATH) as db:
        await db.executescript("""
            PRAGMA journal_mode=WAL;
            PRAGMA foreign_keys=ON;

            CREATE TABLE IF NOT EXISTS users (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
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

            CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
            CREATE INDEX IF NOT EXISTS idx_ev_user_id  ON email_verifications(user_id);
            CREATE INDEX IF NOT EXISTS idx_ut_user_id  ON user_tenants(user_id);
            CREATE INDEX IF NOT EXISTS idx_sessions_hash ON login_sessions(session_token_hash);
        """)
        await db.commit()

