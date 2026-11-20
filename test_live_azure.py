import psycopg2
import httpx

conn = psycopg2.connect('postgresql://postgres:root@localhost:5432/zensustech')
cur = conn.cursor()
cur.execute("SELECT tenant_id, client_id, client_secret FROM sessions WHERE tenant_id = '9414ece9-9039-40b7-a6a7-7ecbe7409245'")
row = cur.fetchone()
conn.close()

if not row:
    print('No session found')
    exit()

tid, cid, sec = row
print(f'Acquiring live Azure Graph token for tenant: {tid}...')
url = f'https://login.microsoftonline.com/{tid}/oauth2/v2.0/token'
data = {
    'client_id': cid,
    'client_secret': sec,
    'grant_type': 'client_credentials',
    'scope': 'https://graph.microsoft.com/.default'
}
resp = httpx.post(url, data=data, timeout=10)
print('Token status:', resp.status_code)
if resp.status_code != 200:
    print('Error acquiring token:', resp.text)
    exit()

token = resp.json().get('access_token')
headers = {'Authorization': f'Bearer {token}'}

# 1. Users count
r_users = httpx.get('https://graph.microsoft.com/v1.0/users?$count=true&$top=999', headers={**headers, 'ConsistencyLevel': 'eventual'}, timeout=10)
print('Users status:', r_users.status_code)
live_users = []
if r_users.status_code == 200:
    live_users = r_users.json().get('value', [])
    print(f'LIVE GRAPH USERS COUNT: {len(live_users)}')
    for u in live_users:
        print(f"  - {u.get('displayName')} ({u.get('userPrincipalName')})")

# 2. Groups count
r_groups = httpx.get('https://graph.microsoft.com/v1.0/groups?$count=true&$top=999', headers={**headers, 'ConsistencyLevel': 'eventual'}, timeout=10)
print('Groups status:', r_groups.status_code)
live_groups = []
if r_groups.status_code == 200:
    live_groups = r_groups.json().get('value', [])
    print(f'LIVE GRAPH GROUPS COUNT: {len(live_groups)}')
    for g in live_groups:
        print(f"  - {g.get('displayName')} (id: {g.get('id')})")

# 3. Applications count
r_apps = httpx.get('https://graph.microsoft.com/v1.0/applications?$top=999', headers=headers, timeout=10)
print('Apps status:', r_apps.status_code)
live_apps = []
if r_apps.status_code == 200:
    live_apps = r_apps.json().get('value', [])
    print(f'LIVE GRAPH APPS COUNT: {len(live_apps)}')

# 4. Devices count
r_dev = httpx.get('https://graph.microsoft.com/v1.0/devices?$top=999', headers=headers, timeout=10)
print('Devices status:', r_dev.status_code)
live_dev = []
if r_dev.status_code == 200:
    live_dev = r_dev.json().get('value', [])
    print(f'LIVE GRAPH DEVICES COUNT: {len(live_dev)}')

