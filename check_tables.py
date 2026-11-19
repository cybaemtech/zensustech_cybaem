import psycopg2

conn = psycopg2.connect('postgresql://postgres:root@localhost:5432/zensustech')
cur = conn.cursor()

# List all tables
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name")
print('=== ALL TABLES ===')
for r in cur.fetchall():
    print(f'  {r[0]}')

print()
# Check sessions table
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='sessions' ORDER BY ordinal_position")
print('=== SESSIONS COLUMNS ===')
for r in cur.fetchall():
    print(f'  {r[0]}')

# Check if azure_subscriptions has user data
cur.execute("SELECT column_name FROM information_schema.columns WHERE table_name='azure_subscriptions' ORDER BY ordinal_position")
print('\n=== AZURE_SUBSCRIPTIONS COLUMNS ===')
for r in cur.fetchall():
    print(f'  {r[0]}')

# Check raw_json in organizations for user/group details
cur.execute("SELECT raw_json FROM organizations WHERE tenant_id='9414ece9-9039-40b7-a6a7-7ecbe7409245'")
row = cur.fetchone()
if row and row[0]:
    import json
    rj = row[0]
    print('\n=== ORGANIZATIONS RAW_JSON KEYS ===')
    print(json.dumps(rj, indent=2))

conn.close()

