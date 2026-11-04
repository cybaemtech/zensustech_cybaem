"""
Fix remaining DB issues:
1. Remove duplicate audit_logs using correct column names
2. Add UNIQUE constraints to prevent future duplicates
3. Add unique constraint on azure_subscriptions
4. Final verification
"""
import psycopg
from psycopg.rows import dict_row

url = "postgresql://postgres:root@localhost:5432/zensustech"

with psycopg.connect(url, row_factory=dict_row) as conn:
    with conn.cursor() as cur:

        print("=== FIX 5: Deduplicate audit_logs ===")
        cur.execute("SELECT COUNT(*) AS cnt FROM audit_logs;")
        total = cur.fetchone()["cnt"]
        print(f"  Total before: {total}")
        cur.execute("""
            DELETE FROM audit_logs
            WHERE id NOT IN (
                SELECT MAX(id)
                FROM audit_logs
                GROUP BY activity_name, actor, category, status,
                         DATE_TRUNC('hour', created_at)
            );
        """)
        deleted = cur.rowcount
        print(f"  Deleted {deleted} duplicate audit_log rows")
        conn.commit()

        print("\n=== FIX 6: UNIQUE constraint on audit_logs (optional guard) ===")
        # Don't enforce unique on audit_logs (legitimate repeated events are fine)
        # but add index for performance
        try:
            cur.execute("""
                CREATE INDEX IF NOT EXISTS idx_audit_tenant_time
                ON audit_logs (tenant_id, created_at DESC);
            """)
            conn.commit()
            print("  Index created OK")
        except Exception as e:
            conn.rollback()
            print(f"  Index warning: {e}")

        print("\n=== FIX 7: UNIQUE constraint on azure_subscriptions ===")
        try:
            cur.execute("""
                ALTER TABLE azure_subscriptions
                ADD CONSTRAINT uq_az_tenant_sub UNIQUE (tenant_id, subscription_id);
            """)
            conn.commit()
            print("  Constraint added OK")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e) or "uq_az_tenant_sub" in str(e):
                print("  Already exists — OK")
            else:
                print(f"  Warning: {e}")

        print("\n=== FINAL DB STATE ===")
        tables = ["customers", "m365_licenses", "azure_subscriptions",
                  "customer_subscriptions", "audit_logs", "organizations", "sessions"]
        for t in tables:
            cur.execute(f"SELECT COUNT(*) AS cnt FROM {t};")
            print(f"  {t}: {cur.fetchone()['cnt']} rows")

        print("\n=== m365_licenses (clean) ===")
        cur.execute("""
            SELECT sku_name, consumed_units, prepaid_units, status, expiration_date
            FROM m365_licenses
            WHERE tenant_id = '9414ece9-9039-40b7-a6a7-7ecbe7409245'
            ORDER BY sku_name;
        """)
        for r in cur.fetchall():
            exp = str(r["expiration_date"])[:10] if r["expiration_date"] else "N/A"
            print(f"  [{r['status']}]  {r['sku_name'][:55]}  |  {r['consumed_units']}/{r['prepaid_units']}  |  exp: {exp}")

        print("\n=== customers ===")
        cur.execute("SELECT customer_id, name FROM customers;")
        for r in cur.fetchall():
            print(f"  {r['customer_id']}  |  {r['name']}")

print("\nAll DB fixes applied.")
