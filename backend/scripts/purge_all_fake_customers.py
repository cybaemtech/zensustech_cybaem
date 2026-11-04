"""
Purge ALL non-Azure demo customers from PostgreSQL.
Only 'cust-1' (Zensus Technologies, real Azure tenant) is kept.
"""
import psycopg
from psycopg.rows import dict_row

url = "postgresql://postgres:root@localhost:5432/zensustech"

# IDs to keep - only real Azure-authenticated customers
KEEP_IDS = {"cust-1"}

try:
    with psycopg.connect(url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT customer_id, name, tenant_id FROM customers ORDER BY customer_id;")
            before = cur.fetchall()
            print("=== BEFORE ===")
            for r in before:
                flag = "KEEP" if r["customer_id"] in KEEP_IDS else "DELETE"
                print(f"  [{flag}]  {r['customer_id']}  |  {r['name']}")

            fake_ids = [r["customer_id"] for r in before if r["customer_id"] not in KEEP_IDS]
            if fake_ids:
                placeholders = ", ".join([f"'{fid}'" for fid in fake_ids])
                cur.execute(f"DELETE FROM customers WHERE customer_id IN ({placeholders});")
                conn.commit()
                print(f"\nDeleted {len(fake_ids)} fake customers: {fake_ids}")
            else:
                print("\nNo fake customers found.")

            cur.execute("SELECT customer_id, name FROM customers ORDER BY customer_id;")
            after = cur.fetchall()
            print("\n=== AFTER (only real Azure customers) ===")
            for r in after:
                print(f"  {r['customer_id']}  |  {r['name']}")

except Exception as e:
    print(f"Error: {e}")
