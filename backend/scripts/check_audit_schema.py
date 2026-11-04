"""Check actual audit_logs schema."""
import psycopg
from psycopg.rows import dict_row

url = "postgresql://postgres:root@localhost:5432/zensustech"

with psycopg.connect(url, row_factory=dict_row) as conn:
    with conn.cursor() as cur:
        cur.execute("""
            SELECT column_name, data_type
            FROM information_schema.columns
            WHERE table_name = 'audit_logs'
            ORDER BY ordinal_position;
        """)
        print("audit_logs columns:")
        for r in cur.fetchall():
            print(f"  {r['column_name']}  ({r['data_type']})")

        cur.execute("SELECT * FROM audit_logs LIMIT 2;")
        rows = cur.fetchall()
        for r in rows:
            print(r)
