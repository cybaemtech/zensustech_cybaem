import urllib.request
import json

r = urllib.request.urlopen('http://localhost:8010/api/v1/auth/admin/users')
d = json.loads(r.read())
print('Success:', d.get('success'))
print('Users count:', len(d.get('users', [])))
for u in d.get('users', []):
    print(f"[{u['id']}] {u['full_name']} | Role: {u['role']} | Plan: {u.get('plan')} | Tier: {u.get('tier')} | PlanTier: {u.get('plan_tier')} | Exp: {u.get('license_exp_date')}")

print("\nTesting CSV export endpoint:")
r_csv = urllib.request.urlopen('http://localhost:8010/api/v1/auth/admin/users/export')
csv_bytes = r_csv.read()
print(f"CSV response length: {len(csv_bytes)} bytes")
print("First 3 lines of CSV:")
for line in csv_bytes.decode('utf-8-sig').splitlines()[:4]:
    print(" ", line)
