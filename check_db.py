"""
ZensusTech DB Inspector — All registered users & key tables
Run: C:\Python314\python.exe check_db.py
"""
import psycopg
from psycopg.rows import dict_row

DSN = "host=localhost port=5432 dbname=zensustech user=postgres password=root"

def sep(title):
    print(f"\n{'='*72}")
    print(f"  {title}")
    print(f"{'='*72}")

with psycopg.connect(DSN, row_factory=dict_row) as conn:

    # ── 1. All users ─────────────────────────────────────────────────────
    sep("1. ALL REGISTERED USERS  (users table)")
    rows = conn.execute("""
        SELECT id, full_name, email, role, email_verified,
               phone, organization, account_status,
               to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') AS registered
        FROM users ORDER BY id DESC
    """).fetchall()

    print(f"{'ID':<5} {'Name':<22} {'Email':<40} {'Role':<16} {'✓':<6} {'Phone':<16} {'Org':<20} {'Registered'}")
    print("-"*145)
    for r in rows:
        v = "✓" if r["email_verified"] else "⏳"
        print(f"{r['id']:<5} {str(r['full_name']):<22} {str(r['email']):<40} {str(r['role']):<16} {v:<6} {str(r['phone'] or '—'):<16} {str(r['organization'] or '—'):<20} {r['registered']}")

    # ── 2. Vendor accounts ───────────────────────────────────────────────
    sep("2. VENDOR ACCOUNTS")
    rows = conn.execute("""
        SELECT id, full_name, email, role, email_verified, vendor_code, organization,
               to_char(created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') AS registered
        FROM users WHERE role IN ('VENDOR','VENDOR_ADMIN') ORDER BY id DESC
    """).fetchall()
    if rows:
        for r in rows:
            v = "✓" if r["email_verified"] else "⏳"
            print(f"  [{r['id']}] {r['full_name']} | {r['email']} | code={r['vendor_code'] or '—'} | verified={v} | {r['registered']}")
    else:
        print("  ⚠  No vendor accounts found.")

    # ── 3. End customers ─────────────────────────────────────────────────
    sep("3. END CUSTOMER ACCOUNTS  (users + customers JOIN via tenant_id)")
    rows = conn.execute("""
        SELECT u.id, u.full_name, u.email, u.email_verified, u.phone, u.organization,
               c.plan_tier, c.license_exp_date, c.licenses_count,
               to_char(u.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') AS registered
        FROM users u
        LEFT JOIN user_tenants ut ON ut.user_id = u.id
        LEFT JOIN tenants t ON t.id = ut.tenant_id
        LEFT JOIN customers c ON c.tenant_id = t.tenant_id
        WHERE u.role = 'END_CUSTOMER' ORDER BY u.id DESC
    """).fetchall()

    print(f"{'ID':<5} {'Name':<22} {'Email':<38} {'✓':<6} {'Phone':<16} {'Plan':<36} {'Exp Date':<12} {'Licenses':<10} {'Registered'}")
    print("-"*160)
    for r in rows:
        v = "✓" if r["email_verified"] else "⏳"
        print(f"{r['id']:<5} {str(r['full_name']):<22} {str(r['email']):<38} {v:<6} {str(r['phone'] or '—'):<16} {str(r['plan_tier'] or '—'):<36} {str(r['license_exp_date'] or '—'):<12} {str(r.get('licenses_count') or '—'):<10} {r['registered']}")

    # ── 4. Email verification status ─────────────────────────────────────
    sep("4. EMAIL VERIFICATION STATUS  (email_verifications table)")
    rows = conn.execute("""
        SELECT u.id, u.full_name, u.email, u.email_verified,
               ev.attempts,
               to_char(ev.verified_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') AS verified_at,
               to_char(ev.created_at AT TIME ZONE 'Asia/Kolkata', 'YYYY-MM-DD HH24:MI') AS otp_sent
        FROM users u
        LEFT JOIN email_verifications ev ON ev.user_id = u.id
        ORDER BY u.id DESC
    """).fetchall()
    for r in rows:
        status = "✓ VERIFIED " if r["email_verified"] else "⏳ PENDING  "
        print(f"  [{r['id']}] {str(r['full_name']):<22} {str(r['email']):<40} {status} attempts={r['attempts'] or 0:<3} verified_at={r['verified_at'] or 'N/A'}")

    # ── 5. Tenant / Org links ────────────────────────────────────────────
    sep("5. TENANT → ORGANIZATION LINKS  (user_tenants → organizations)")
    rows = conn.execute("""
        SELECT u.id, u.full_name, u.email,
               t.tenant_name, t.tenant_id AS azure_tenant_id,
               o.display_name AS org_name, o.primary_domain,
               o.phone_number, o.email AS org_email, o.license,
               o.license_exp_date, o.users_count, o.groups_count,
               o.apps_count, o.devices_count,
               o.city, o.state, o.country, o.street
        FROM users u
        JOIN user_tenants ut ON ut.user_id = u.id
        JOIN tenants t ON t.id = ut.tenant_id
        LEFT JOIN organizations o ON o.tenant_id = t.tenant_id
        ORDER BY u.id DESC
    """).fetchall()
    if rows:
        for r in rows:
            print(f"\n  User    : [{r['id']}] {r['full_name']} ({r['email']})")
            print(f"  Tenant  : {r['tenant_name']}  |  Azure ID: {r['azure_tenant_id']}")
            print(f"  Org     : {r['org_name']}  |  Domain: {r['primary_domain']}")
            print(f"  Phone   : {r['phone_number']}  |  Org Email: {r['org_email']}")
            print(f"  License : {r['license']}  |  Exp: {r['license_exp_date']}")
            print(f"  Stats   : Users={r['users_count']}  Groups={r['groups_count']}  Apps={r['apps_count']}  Devices={r['devices_count']}")
            print(f"  Address : {r['street']}, {r['city']}, {r['state']}, {r['country']}")
    else:
        print("  No tenant-linked users found.")

    # ── 6. Active sessions ───────────────────────────────────────────────
    sep("6. ACTIVE LOGIN SESSIONS  (login_sessions table)")
    rows = conn.execute("""
        SELECT u.full_name, u.email, s.created_at, s.expires_at
        FROM login_sessions s
        JOIN users u ON u.id = s.user_id
        WHERE s.revoked_at IS NULL
        ORDER BY s.created_at DESC LIMIT 20
    """).fetchall()
    if rows:
        for r in rows:
            print(f"  {str(r['full_name']):<22} {str(r['email']):<38} session_start={r['created_at']}  expires={r['expires_at']}")
    else:
        print("  No active sessions.")

    # ── 7. Summary ───────────────────────────────────────────────────────
    sep("7. DATABASE SUMMARY COUNTS")
    total    = conn.execute("SELECT COUNT(*) FROM users").fetchone()["count"]
    vendors  = conn.execute("SELECT COUNT(*) FROM users WHERE role ILIKE '%VENDOR%'").fetchone()["count"]
    custs    = conn.execute("SELECT COUNT(*) FROM users WHERE role = 'END_CUSTOMER'").fetchone()["count"]
    verified = conn.execute("SELECT COUNT(*) FROM users WHERE email_verified = TRUE").fetchone()["count"]
    pending  = conn.execute("SELECT COUNT(*) FROM users WHERE email_verified = FALSE").fetchone()["count"]
    sessions = conn.execute("SELECT COUNT(*) FROM login_sessions WHERE revoked_at IS NULL").fetchone()["count"]
    tenanted = conn.execute("SELECT COUNT(DISTINCT user_id) FROM user_tenants").fetchone()["count"]
    print(f"  Total Users        : {total}")
    print(f"  Vendors            : {vendors}")
    print(f"  End Customers      : {custs}")
    print(f"  Email Verified ✓   : {verified}")
    print(f"  Pending OTP ⏳     : {pending}")
    print(f"  Active Sessions    : {sessions}")
    print(f"  Tenant-Linked Users: {tenanted}")
    print()
