"""
PostgreSQL schema initializer for Zensus Authentication & Tenant Management.
Works locally and on Render (reading DATABASE_URL).
"""
import os
import psycopg
from psycopg.rows import dict_row

DEFAULT_PG_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/zensustech")
# Normalize postgres:// to postgresql:// for psycopg
if DEFAULT_PG_URL.startswith("postgres://"):
    DEFAULT_PG_URL = "postgresql://" + DEFAULT_PG_URL[len("postgres://"):]


def setup_postgres():
    print(f"Connecting to PostgreSQL: {DEFAULT_PG_URL.split('@')[-1] if '@' in DEFAULT_PG_URL else DEFAULT_PG_URL}")
    with psycopg.connect(DEFAULT_PG_URL, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. Create or alter users table
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

            # Ensure all columns exist if users was previously created
            existing_cols = set()
            cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users';")
            for r in cur.fetchall():
                existing_cols.add(r["column_name"])

            if "id" not in existing_cols:
                cur.execute("ALTER TABLE users ADD COLUMN id SERIAL UNIQUE;")
                print("Added id SERIAL UNIQUE to users")

            for col, ctype in [
                ("email_verified", "BOOLEAN NOT NULL DEFAULT FALSE"),
                ("account_status", "VARCHAR(50) NOT NULL DEFAULT 'active'"),
                ("updated_at", "TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP"),
                ("phone", "VARCHAR(50)"),
                ("organization", "VARCHAR(255)"),
                ("customer", "VARCHAR(255)"),
                ("vendor_code", "VARCHAR(100)"),
                ("user_id", "VARCHAR(100)"),
                ("is_first_time", "INTEGER DEFAULT 0"),
            ]:
                if col not in existing_cols:
                    cur.execute(f"ALTER TABLE users ADD COLUMN {col} {ctype};")
                    print(f"Added {col} to users")

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

            # Indexes
            cur.execute("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_ev_user_id ON email_verifications(user_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_ut_user_id ON user_tenants(user_id);")
            cur.execute("CREATE INDEX IF NOT EXISTS idx_sessions_hash ON login_sessions(session_token_hash);")

            conn.commit()
            print("PostgreSQL setup completed successfully!")


if __name__ == "__main__":
    setup_postgres()

