"""PostgreSQL Local Database Checker for ZensusTech.
Tests connectivity, verifies tables, displays row counts, and previews stored data.
"""

import sys
import json
import psycopg
from psycopg.rows import dict_row

DB_URL = "postgresql://postgres:root@localhost:5432/zensustech"

def check_postgres():
    print("=" * 65)
    print("       ZENSUSTECH - LOCAL POSTGRESQL VERIFICATION REPORT")
    print("=" * 65)
    print(f"Connecting to: {DB_URL.replace('root', '*****')}")

    try:
        conn = psycopg.connect(DB_URL, connect_timeout=5, row_factory=dict_row)
        print(">> Status: [OK] Connected to PostgreSQL Server successfully!\n")
    except Exception as e:
        print(f">> Status: [FAILED] Could not connect: {e}")
        return

    try:
        with conn.cursor() as cur:
            # 1. Version & Server Info
            cur.execute("SELECT version();")
            ver = cur.fetchone()["version"]
            print(f"Server Engine : {ver.split(',')[0]}")

            cur.execute("SELECT current_database(), current_user, inet_server_port();")
            info = cur.fetchone()
            print(f"Database Name : {info['current_database']}")
            print(f"Connected User: {info['current_user']}")
            print(f"Server Port   : {info['inet_server_port']}")
            print("-" * 65)

            # 2. List all tables in public schema
            cur.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                ORDER BY table_name;
            """)
            tables = [r["table_name"] for r in cur.fetchall()]
            print(f"Tables Found ({len(tables)}): {', '.join(tables)}")
            print("-" * 65)

            # 3. Table row counts & sample preview
            for tbl in tables:
                cur.execute(f"SELECT COUNT(*) as count FROM {tbl};")
                count = cur.fetchone()["count"]
                print(f"\n[TABLE: {tbl}] --> {count} record(s)")

                cur.execute(f"SELECT * FROM {tbl} LIMIT 2;")
                sample_rows = cur.fetchall()
                if sample_rows:
                    for i, row in enumerate(sample_rows, 1):
                        display_row = {}
                        for k, v in row.items():
                            if k in ("client_secret", "mgmt_token", "graph_token"):
                                display_row[k] = f"{str(v)[:15]}... [PROTECTED]"
                            elif isinstance(v, (dict, list)):
                                display_row[k] = f"JSON({len(v)} keys/items)"
                            elif hasattr(v, "isoformat"):
                                display_row[k] = v.isoformat()
                            else:
                                display_row[k] = v
                        print(f"   Record #{i}: {display_row}")
                else:
                    print("   (Table is currently empty)")

        print("\n" + "=" * 65)
        print(">> Verification Complete: All PostgreSQL tables and records verified.")
        print("=" * 65)

    except Exception as e:
        print(f"Query Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_postgres()
