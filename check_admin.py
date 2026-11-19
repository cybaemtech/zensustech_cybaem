import urllib.request, json

r = urllib.request.urlopen('http://localhost:8010/api/v1/auth/admin/users')
d = json.loads(r.read())
print('Success:', d.get('success'))
print('Users count:', len(d.get('users', [])))
for u in d.get('users', []):
    uid = u['id']
    name = u['full_name']
    phone = u.get('phone')
    plan = u.get('plan_tier')
    exp = u.get('license_exp_date')
    org_name = u.get('org_display_name')
    org_phone = u.get('org_phone')
    org_city = u.get('org_city')
    org_license = u.get('org_license')
    print(f"  [{uid}] {name} | phone={phone} | plan={plan} | exp={exp} | org={org_name} | org_phone={org_phone} | org_city={org_city} | org_license={org_license}")
