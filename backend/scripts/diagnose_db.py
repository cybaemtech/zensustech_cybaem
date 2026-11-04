"""
Diagnose and fix all database data issues:
1. Duplicate m365_licenses rows (same tenant+sku but multiple inserts)
2. Customer count accuracy
3. Stale/orphaned data
"""
import psycopg
from psycopg.rows import dict_row

url = "postgresql://postgres:root@localhost:5432/zensustech"

with psycopg.connect(url, row_factory=dict_row) as conn:
    with conn.cursor() as cur:

        # --- 1. Show current tables and row counts ---
        cur.execute("""
            SELECT table_name FROM information_schema.tables
            WHERE table_schema = 'public' ORDER BY table_name;
        """)
        tables = [r["table_name"] for r in cur.fetchall()]
        print("=== TABLES ===")
        for t in tables:
            cur.execute(f"SELECT COUNT(*) AS cnt FROM {t};")
            cnt = cur.fetchone()["cnt"]
            print(f"  {t}: {cnt} rows")

        # --- 2. Duplicate m365_licenses analysis ---
        print("\n=== m365_licenses duplicates (tenant_id + sku_id) ===")
        cur.execute("""
            SELECT tenant_id, sku_id, sku_name, COUNT(*) AS cnt
            FROM m365_licenses
            GROUP BY tenant_id, sku_id, sku_name
            HAVING COUNT(*) > 1
            ORDER BY cnt DESC;
        """)
        dups = cur.fetchall()
        for d in dups:
            print(f"  [{d['cnt']}x] {d['sku_name']}  |  sku_id: {d['sku_id'][:8]}...")

        # --- 3. Check customers ---
        print("\n=== customers ===")
        cur.execute("SELECT customer_id, name FROM customers ORDER BY customer_id;")
        for r in cur.fetchall():
            print(f"  {r['customer_id']}  |  {r['name']}")

        # --- 4. Check unique constraint on m365_licenses ---
        print("\n=== m365_licenses constraints ===")
        cur.execute("""
            SELECT conname, contype, pg_get_constraintdef(oid)
            FROM pg_constraint
            WHERE conrelid = 'm365_licenses'::regclass;
        """)
        for c in cur.fetchall():
            print(f"  {c['conname']} ({c['contype']}): {c['pg_get_constraintdef']}")

