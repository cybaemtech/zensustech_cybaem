"""
PostgreSQL Database Inspector for ZensusTech.
Run with: python backend/scripts/inspect_db.py
"""
import os
import psycopg
from psycopg.rows import dict_row

DB_URL = os.getenv("DATABASE_URL", "postgresql://postgres:root@localhost:5432/zensustech")
if DB_URL.startswith("postgres://"):
    DB_URL = "postgresql://" + DB_URL[len("postgres://"):]

def print_header(title):
    print("\n" + "=" * 70)
    print(f"  {title}")
    print("=" * 70)

def inspect():
    print(f"Connecting to: {DB_URL.split('@')[-1] if '@' in DB_URL else DB_URL}")
    with psycopg.connect(DB_URL, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            # 1. Users
            print_header("1. USERS (Sign-up / Sign-in Accounts)")
            cur.execute("""
                SELECT id, user_id, full_name, email, role, 
                       email_verified, account_status, created_at 
                FROM users 
                ORDER BY id DESC LIMIT 10
            """)
            users = cur.fetchall()
            if not users:
                print("  No users registered yet.")
            for u in users:
                print(f"  [ID: {u['id']}] {u['full_name']} | {u['email']} | Role: {u['role']} | Verified: {u['email_verified']} | Created: {u['created_at']}")

            # 2. Tenants (Connected Azure / Cloud Tenants)
            print_header("2. TENANTS (Saved Azure Tenant / App Registrations)")
            cur.execute("""
                SELECT id, tenant_id, tenant_name, client_id,
                       CASE WHEN client_secret IS NOT NULL AND client_secret != '' THEN '***SAVED***' ELSE 'NULL' END as secret_status,
                       provider_type, subscription_plan, connection_status, created_at
                FROM tenants 
                ORDER BY id DESC LIMIT 10
            """)
            tenants = cur.fetchall()
            if not tenants:
                print("  No tenants connected yet.")
            for t in tenants:
                print(f"  [ID: {t['id']}] {t['tenant_name'] or 'Unnamed'} | Tenant ID: {t['tenant_id']} | Client ID: {t['client_id']} | Secret: {t['secret_status']} | Status: {t['connection_status']}")

            # 3. User ↔ Tenant Associations
            print_header("3. USER_TENANTS (Which user owns which tenant)")
            cur.execute("""
                SELECT ut.id, ut.user_id, u.email as user_email, u.full_name,
                       ut.tenant_id, t.tenant_name, t.tenant_id as azure_tenant_id,
                       ut.is_primary, ut.created_at
                FROM user_tenants ut
                JOIN users u ON u.id = ut.user_id
                JOIN tenants t ON t.id = ut.tenant_id
                ORDER BY ut.id DESC LIMIT 10
            """)
            links = cur.fetchall()
            if not links:
                print("  No user-tenant links yet.")
            for l in links:
                print(f"  User: {l['user_email']} ({l['full_name']}) ---> Tenant: {l['tenant_name']} [{l['azure_tenant_id']}] (Primary: {l['is_primary']})")

            # 4. Email Verifications & OTPs
            print_header("4. EMAIL_VERIFICATIONS (One-time OTP verification logs)")
            cur.execute("""
                SELECT ev.id, ev.user_id, u.email, ev.attempts, ev.verified_at, ev.expires_at, ev.created_at
                FROM email_verifications ev
                LEFT JOIN users u ON u.id = ev.user_id
                ORDER BY ev.id DESC LIMIT 5
            """)
            otps = cur.fetchall()
            if not otps:
                print("  No verification attempts logged.")
            for o in otps:
                print(f"  User: {o['email']} | Attempts: {o['attempts']} | Verified At: {o['verified_at']} | Created: {o['created_at']}")

            # 5. Auth Emails (Emails Dispatched via noreply@cybaemtech.com)
            print_header("5. AUTH_EMAILS (Dispatched Email Delivery Log)")
            cur.execute("""
                SELECT id, recipient_email, sender_email, subject, delivery_method, delivery_status, created_at
                FROM auth_emails
                ORDER BY id DESC LIMIT 5
            """)
            emails = cur.fetchall()
            if not emails:
                print("  No emails dispatched yet.")
            for e in emails:
                print(f"  To: {e['recipient_email']} | From: {e['sender_email']} | Method: {e['delivery_method']} | Status: {e['delivery_status']} | Date: {e['created_at']}")

            # 6. Active Login Sessions
            print_header("6. LOGIN_SESSIONS (Current Authenticated Sessions)")
            cur.execute("""
                SELECT s.id, s.user_id, u.email, s.expires_at, s.revoked_at, s.created_at
                FROM login_sessions s
                JOIN users u ON u.id = s.user_id
                ORDER BY s.id DESC LIMIT 5
            """)
            sessions = cur.fetchall()
            if not sessions:
                print("  No active sessions logged.")
            for s in sessions:
                print(f"  Session ID: {s['id']} | User: {s['email']} | Expires: {s['expires_at']}")

    print("\n" + "=" * 70 + "\n")

if __name__ == "__main__":
    inspect()
