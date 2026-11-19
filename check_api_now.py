import urllib.request
import json

url = "http://localhost:8010/api/v1/auth/admin/users"
req = urllib.request.Request(url, headers={"X-Admin-Key": "zensustech-admin-2024"})
with urllib.request.urlopen(req, timeout=10) as r:
    data = json.loads(r.read())

users = data.get("users", [])
print(f"Total users: {len(users)}\n")
print(f"{'ID':<4} {'Name':<25} {'Tenant?':<10} {'Plan':<20} {'Tier':<10} {'Exp':<15}")
print("-" * 90)
for u in users:
    has_t = bool(u.get("azure_tenant_id"))
    plan = u.get("plan") or "None"
    tier = u.get("tier") or "None"
    exp = u.get("license_exp_date") or "None"
    tid = u.get("azure_tenant_id") or "-"
    print(f"[{u['id']:<3}] {u['full_name']:<25} {'YES' if has_t else 'NO':<10} {plan:<20} {tier:<10} {exp:<15}")

print("\n--- Raw plan/tier/has_tenant fields for all users ---")
for u in users:
    print(f"  id={u['id']} has_tenant={u.get('has_tenant')} azure_tenant_id={u.get('azure_tenant_id')} plan={u.get('plan')!r} tier={u.get('tier')!r} exp={u.get('license_exp_date')!r}")

