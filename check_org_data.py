import psycopg2

conn = psycopg2.connect('postgresql://postgres:root@localhost:5432/zensustech')
cur = conn.cursor()

# Check organizations table columns
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='organizations' ORDER BY ordinal_position")
print('=== ORGANIZATIONS TABLE COLUMNS ===')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]}')

print()
# Check actual values for the linked tenant
cur.execute("SELECT * FROM organizations WHERE tenant_id='9414ece9-9039-40b7-a6a7-7ecbe7409245'")
cols = [d[0] for d in cur.description]
rows = cur.fetchall()
print('=== ORGANIZATIONS DATA ===')
for row in rows:
    for c, v in zip(cols, row):
        print(f'  {c}: {repr(v)}')

# Check customers table
print()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='customers' ORDER BY ordinal_position")
print('=== CUSTOMERS TABLE COLUMNS ===')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]}')

cur.execute("SELECT * FROM customers WHERE tenant_id='9414ece9-9039-40b7-a6a7-7ecbe7409245'")
cols2 = [d[0] for d in cur.description]
rows2 = cur.fetchall()
print()
print('=== CUSTOMERS DATA ===')
for row in rows2:
    for c, v in zip(cols2, row):
        print(f'  {c}: {repr(v)}')

# Check m365_licenses
print()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name='m365_licenses' ORDER BY ordinal_position")
print('=== M365_LICENSES TABLE COLUMNS ===')
for r in cur.fetchall():
    print(f'  {r[0]}: {r[1]}')

cur.execute("SELECT * FROM m365_licenses WHERE tenant_id='9414ece9-9039-40b7-a6a7-7ecbe7409245'")
cols3 = [d[0] for d in cur.description]
rows3 = cur.fetchall()
print()
print('=== M365_LICENSES DATA ===')
for row in rows3:
    for c, v in zip(cols3, row):
        print(f'  {c}: {repr(v)}')

conn.close()
print('\nDone.')

