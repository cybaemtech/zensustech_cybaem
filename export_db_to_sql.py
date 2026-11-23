import psycopg
from psycopg.rows import dict_row
import json
import datetime

conn = psycopg.connect('postgresql://postgres:root@localhost:5432/zensustech', row_factory=dict_row)
cur = conn.cursor()

# Get all tables
cur.execute("""
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name
""")
tables = [r['table_name'] for r in cur.fetchall()]
print("Tables to export:", tables)

sql_lines = [
    "-- ZensusTech PostgreSQL Complete Database Export & Seed",
    f"-- Generated: {datetime.datetime.now().isoformat()}",
    "-- Compatible with Render PostgreSQL, Docker, and Local PostgreSQL",
    "",
    "BEGIN;",
    ""
]

for table in tables:
    # Get columns
    cur.execute(f"""
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = '{table}'
        ORDER BY ordinal_position
    """)
    cols = cur.fetchall()
    
    # Get rows
    cur.execute(f"SELECT * FROM {table}")
    rows = cur.fetchall()
    
    sql_lines.append(f"-- Table: {table} ({len(rows)} rows)")
    sql_lines.append(f"-- ----------------------------------------")
    
    if rows:
        col_names = [c['column_name'] for c in cols]
        cols_str = ", ".join([f'"{c}"' for c in col_names])
        for row in rows:
            vals = []
            for c in col_names:
                v = row[c]
                if 'secret' in c.lower() and v:
                    vals.append("'***** [PROTECTED]'")
                elif table == 'sessions' and c in ('mgmt_token', 'graph_token') and v:
                    vals.append("NULL")
                elif v is None:
                    vals.append("NULL")
                elif isinstance(v, bool):
                    vals.append("TRUE" if v else "FALSE")
                elif isinstance(v, (int, float)):
                    vals.append(str(v))
                elif isinstance(v, (dict, list)):
                    s = json.dumps(v).replace("'", "''")
                    vals.append(f"'{s}'::jsonb")
                elif isinstance(v, (datetime.datetime, datetime.date)):
                    vals.append(f"'{v.isoformat()}'")
                else:
                    s = str(v).replace("'", "''")
                    vals.append(f"'{s}'")
            vals_str = ", ".join(vals)
            
            # Use ON CONFLICT DO NOTHING for safe repeated execution
            sql_lines.append(f"INSERT INTO {table} ({cols_str}) VALUES ({vals_str}) ON CONFLICT DO NOTHING;")
        sql_lines.append("")

sql_lines.append("-- Synchronize sequences for all tables")
for table in tables:
    sql_lines.append(f"DO $$ BEGIN PERFORM setval(pg_get_serial_sequence('{table}', 'id'), COALESCE((SELECT MAX(id) FROM {table}), 0) + 1, false); EXCEPTION WHEN OTHERS THEN NULL; END $$;")
sql_lines.append("")

sql_lines.append("COMMIT;")
sql_lines.append("")

export_sql = "\n".join(sql_lines)

with open("d:/ZensusTech-Login/zensustech_dump.sql", "w", encoding="utf-8") as f:
    f.write(export_sql)

print(f"Exported {len(tables)} tables to d:/ZensusTech-Login/zensustech_dump.sql successfully!")
conn.close()

