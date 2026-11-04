"""One-time script: remove fake demo customers cust-2 / cust-3 from PostgreSQL."""
import psycopg
from psycopg.rows import dict_row

url = "postgresql://postgres:root@localhost:5432/zensustech"

try:
    with psycopg.connect(url, row_factory=dict_row) as conn:
        with conn.cursor() as cur:
            cur.execute(
                "DELETE FROM customers WHERE customer_id IN ('cust-2', 'cust-3');"
            )
            conn.commit()
            cur.execute("SELECT customer_id, name FROM customers;")
            rows = cur.fetchall()
            print("Remaining customers:", rows)
except Exception as e:
    print("Error:", e)

