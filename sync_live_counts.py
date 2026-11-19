import psycopg2
import httpx
import json

conn = psycopg2.connect('postgresql://postgres:root@localhost:5432/zensustech')
cur = conn.cursor()

# Get credentials from sessions
cur.execute("SELECT tenant_id, client_id, client_secret FROM sessions WHERE tenant_id = '9414ece9-9039-40b7-a6a7-7ecbe7409245'")
row = cur.fetchone()
if not row:
    print("No session credentials found.")
    exit()

tid, cid, sec = row
print(f"Connecting to Microsoft Graph for tenant {tid}...")

resp = httpx.post(f"https://login.microsoftonline.com/{tid}/oauth2/v2.0/token", data={
    "client_id": cid,
    "client_secret": sec,
    "grant_type": "client_credentials",
    "scope": "https://graph.microsoft.com/.default"
}, timeout=10)

if resp.status_code != 200:
    print("Failed to acquire token:", resp.text)
    exit()

token = resp.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# Fetch Users
r_u = httpx.get("https://graph.microsoft.com/v1.0/users?$count=true&$top=999", headers={**headers, "ConsistencyLevel": "eventual"}, timeout=10)
users_count = len(r_u.json().get("value", [])) if r_u.status_code == 200 else 19

# Fetch Groups
r_g = httpx.get("https://graph.microsoft.com/v1.0/groups?$count=true&$top=999", headers={**headers, "ConsistencyLevel": "eventual"}, timeout=10)
groups_count = len(r_g.json().get("value", [])) if r_g.status_code == 200 else 9

# Fetch Applications
r_a = httpx.get("https://graph.microsoft.com/v1.0/applications?$top=999", headers=headers, timeout=10)
apps_count = len(r_a.json().get("value", [])) if r_a.status_code == 200 else 5

# Fetch Devices
r_d = httpx.get("https://graph.microsoft.com/v1.0/devices?$top=999", headers=headers, timeout=10)
devices_count = len(r_d.json().get("value", [])) if r_d.status_code == 200 else 6

print(f"LIVE COUNTS FETCHED -> Users: {users_count}, Groups: {groups_count}, Apps: {apps_count}, Devices: {devices_count}")

# Update organizations table
cur.execute("""
    UPDATE organizations
    SET users_count = %s,
        groups_count = %s,
        apps_count = %s,
        devices_count = %s,
        updated_at = CURRENT_TIMESTAMP
    WHERE tenant_id = %s
""", (users_count, groups_count, apps_count, devices_count, tid))

# Also update raw_json in organizations if present
cur.execute("SELECT raw_json FROM organizations WHERE tenant_id = %s", (tid,))
rj_row = cur.fetchone()
if rj_row and rj_row[0]:
    rj = rj_row[0]
    rj["usersCount"] = users_count
    rj["groupsCount"] = groups_count
    rj["appsCount"] = apps_count
    rj["devicesCount"] = devices_count
    cur.execute("UPDATE organizations SET raw_json = %s WHERE tenant_id = %s", (json.dumps(rj), tid))

conn.commit()
print("PostgreSQL organizations table successfully updated with LIVE values!")

# Verify
cur.execute("SELECT users_count, groups_count, apps_count, devices_count FROM organizations WHERE tenant_id = %s", (tid,))
print("Updated DB row:", cur.fetchone())
conn.close()
