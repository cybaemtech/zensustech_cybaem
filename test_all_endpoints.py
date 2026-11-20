import urllib.request
import json

base = 'http://localhost:8010/api/v1'

def check_ep(path, headers=None):
    if headers is None:
        headers = {}
    req = urllib.request.Request(base + path, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.status, json.loads(r.read())
    except Exception as e:
        return 'ERR', str(e)

# 1. Admin users
st, d = check_ep('/auth/admin/users', {'X-Admin-Key': 'zensustech-admin-2024'})
print('1. /auth/admin/users ->', st)
for u in d.get('users', []):
    if u['id'] == 22:
        print('   Priyanka: Users=' + str(u.get('org_users_count')) + 
              ', Groups=' + str(u.get('org_groups_count')) + 
              ', Apps=' + str(u.get('org_apps_count')) + 
              ', Devices=' + str(u.get('org_devices_count')))

# 2. Tenant organization (auto-token)
st2, d2 = check_ep('/tenant/organization')
print('2. /tenant/organization ->', st2)
if st2 == 200:
    org = d2.get('organization', {})
    print('   Org: Users=' + str(org.get('usersCount')) + 
          ', Groups=' + str(org.get('groupsCount')) + 
          ', Apps=' + str(org.get('appsCount')) + 
          ', Devices=' + str(org.get('devicesCount')))

# 3. Tenant groups (auto-token)
st3, d3 = check_ep('/tenant/groups')
print('3. /tenant/groups ->', st3)
if st3 == 200:
    groups = d3.get('groups', [])
    print('   Groups count: ' + str(d3.get('count')) + ' (list len=' + str(len(groups)) + ')')

# 4. Tenant devices (auto-token)
st4, d4 = check_ep('/tenant/devices')
print('4. /tenant/devices ->', st4)
if st4 == 200:
    devices = d4.get('devices', [])
    print('   Devices count: ' + str(d4.get('count')) + ' (list len=' + str(len(devices)) + ')')

# 5. Tenant users (auto-token)
st5, d5 = check_ep('/tenant/users')
print('5. /tenant/users ->', st5)
if st5 == 200:
    users = d5.get('users', [])
    print('   Users count: list len=' + str(len(users)))

