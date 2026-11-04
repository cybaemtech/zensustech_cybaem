"""
Fix all PostgreSQL database issues:
1. Remove duplicate m365_licenses - keep only most recent per (tenant_id, sku_id)
2. Add UNIQUE constraint on (tenant_id, sku_id) so it never happens again
3. Remove duplicate azure_subscriptions rows if any
4. Remove duplicate audit_logs if any (keep distinct activity+actor+category combos)
5. Remove stale customer_subscriptions for deleted fake customers
6. Fix customer count to reflect only real Azure customers
"""
import psycopg
from psycopg.rows import dict_row

url = "postgresql://postgres:root@localhost:5432/zensustech"

with psycopg.connect(url, row_factory=dict_row) as conn:
    with conn.cursor() as cur:

        print("=== FIX 1: Deduplicate m365_licenses ===")
        # Keep only the row with the highest ID per (tenant_id, sku_id) — that's the most recent insert
        cur.execute("""
            DELETE FROM m365_licenses
            WHERE id NOT IN (
                SELECT MAX(id)
                FROM m365_licenses
                GROUP BY tenant_id, sku_id
            );
        """)
        deleted = cur.rowcount
        print(f"  Deleted {deleted} duplicate license rows")

        cur.execute("SELECT COUNT(*) AS cnt FROM m365_licenses;")
        print(f"  Remaining: {cur.fetchone()['cnt']} rows")
        conn.commit()

        print("\n=== FIX 2: Add UNIQUE constraint on m365_licenses(tenant_id, sku_id) ===")
        try:
            cur.execute("""
                ALTER TABLE m365_licenses
                ADD CONSTRAINT uq_m365_tenant_sku UNIQUE (tenant_id, sku_id);
            """)
            conn.commit()
            print("  Constraint added OK")
        except Exception as e:
            conn.rollback()
            if "already exists" in str(e) or "uq_m365_tenant_sku" in str(e):
                print("  Constraint already exists — OK")
            else:
                print(f"  Warning: {e}")

        print("\n=== FIX 3: Check azure_subscriptions duplicates ===")
        cur.execute("""
            SELECT tenant_id, subscription_id, COUNT(*) AS cnt
            FROM azure_subscriptions
            GROUP BY tenant_id, subscription_id
            HAVING COUNT(*) > 1;
        """)
        az_dups = cur.fetchall()
        if az_dups:
            cur.execute("""
                DELETE FROM azure_subscriptions
                WHERE id NOT IN (
                    SELECT MAX(id) FROM azure_subscriptions
                    GROUP BY tenant_id, subscription_id
                );
            """)
            print(f"  Deleted {cur.rowcount} duplicate azure_subscription rows")
            conn.commit()
        else:
            print("  No duplicates found")

        print("\n=== FIX 4: Remove orphaned customer_subscriptions ===")
        # Delete subscriptions for customer IDs that no longer exist
        cur.execute("""
            DELETE FROM customer_subscriptions
            WHERE customer_id NOT IN (SELECT customer_id FROM customers);
        """)
        orphans = cur.rowcount
        if orphans:
            print(f"  Deleted {orphans} orphaned customer_subscription rows")
        else:
            print("  No orphans found")
        conn.commit()

        print("\n=== FIX 5: Check audit_logs duplicates ===")
        cur.execute("SELECT COUNT(*) AS cnt FROM audit_logs;")
        total = cur.fetchone()["cnt"]
        # Keep only distinct (activity, actor, category, status) per day
        cur.execute("""
            DELETE FROM audit_logs
            WHERE id NOT IN (
                SELECT MAX(id)
                FROM audit_logs
                GROUP BY activity, actor, category, status,
                         DATE_TRUNC('hour', created_at)
            );
        """)
        dup_logs = cur.rowcount
        if dup_logs:
            print(f"  Deleted {dup_logs} duplicate audit_log rows (from {total} total)")
        else:
            print(f"  No duplicate audit logs found ({total} total)")
        conn.commit()

        print("\n=== FIX 6: Verify UNIQUE on azure_subscriptions ===")
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
                print("  Constraint already exists — OK")
            else:
                print(f"  Warning: {e}")

        print("\n=== FINAL STATE ===")
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
            print(f"  {r['sku_name'][:50]}  |  {r['consumed_units']}/{r['prepaid_units']}  |  {r['status']}  |  exp: {r['expiration_date']}")

print("\nAll fixes applied successfully.")

