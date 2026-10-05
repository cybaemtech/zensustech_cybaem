import json
import os
import sys
import logging
from pathlib import Path
from typing import Optional, Dict, Any

import httpx
import uvicorn
from fastapi import FastAPI, HTTPException, Request, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='%(asctime)s [%(levelname)s] %(message)s')
logger = logging.getLogger('zensus-backend')

DATA_DIR = Path(__file__).parent / 'data'
DATA_DIR.mkdir(exist_ok=True)
SESSION_FILE = DATA_DIR / 'sessions.json'

def load_sessions():
    if SESSION_FILE.exists():
        try:
            return json.loads(SESSION_FILE.read_text())
        except Exception:
            return {}
    return {}

def save_sessions(data):
    SESSION_FILE.write_text(json.dumps(data, indent=2))

app = FastAPI(title='ZensusTech API', version='1.0.0', docs_url='/api/v1/docs')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:3000','http://localhost:5173','http://127.0.0.1:3000','http://127.0.0.1:5173'], allow_credentials=True, allow_methods=['*'], allow_headers=['*'])

async def get_azure_token(tenant_id, client_id, client_secret, scope):
    url = f'https://login.microsoftonline.com/{tenant_id}/oauth2/v2.0/token'
    data = {'client_id': client_id, 'client_secret': client_secret, 'grant_type': 'client_credentials', 'scope': scope}
    async with httpx.AsyncClient(timeout=15.0) as client:
        resp = await client.post(url, data=data, headers={'Content-Type': 'application/x-www-form-urlencoded'})
        if resp.is_error:
            raise HTTPException(status_code=401, detail=f'Azure auth failed: {resp.text}')
        token = resp.json().get('access_token')
        if not token:
            raise HTTPException(status_code=401, detail='No access_token in response')
        return token

async def graph_get(graph_token, path, params=None):
    url = f'https://graph.microsoft.com/v1.0{path}'
    headers = {'Authorization': f'Bearer {graph_token}', 'Content-Type': 'application/json'}
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers=headers, params=params or {})
        if resp.is_error:
            logger.warning(f'Graph GET {path} returned {resp.status_code}')
            return None
        return resp.json()

async def mgmt_get(mgmt_token, path, params=None):
    url = f'https://management.azure.com{path}'
    headers = {'Authorization': f'Bearer {mgmt_token}', 'Content-Type': 'application/json'}
    p = params or {}
    if 'api-version' not in p:
        p['api-version'] = '2022-12-01'
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.get(url, headers=headers, params=p)
        if resp.is_error:
            logger.warning(f'Mgmt GET {path} returned {resp.status_code}')
            return None
        return resp.json()

class ConnectRequest(BaseModel):
    tenantId: str
    clientId: str
    clientSecret: str

class GovernanceRequest(BaseModel):
    clientId: str
    clientSecret: str
    tenantId: str
    subscriptionId: str = ''

@app.get('/')
async def root():
    return {'message': 'ZensusTech API is running', 'docs': '/api/v1/docs'}

@app.get('/api/v1/health')
async def health():
    return {'status': 'ok'}

@app.post('/api/v1/connect')
async def connect(req: ConnectRequest):
    logger.info(f'Connect attempt for tenant: {req.tenantId}')
    mgmt_token = await get_azure_token(req.tenantId, req.clientId, req.clientSecret, 'https://management.azure.com/.default')
    graph_token = await get_azure_token(req.tenantId, req.clientId, req.clientSecret, 'https://graph.microsoft.com/.default')
    sessions = load_sessions()
    sessions[req.tenantId] = {'mgmt_token': mgmt_token, 'graph_token': graph_token, 'client_id': req.clientId, 'tenant_id': req.tenantId}
    save_sessions(sessions)
    return {'message': 'Authenticated successfully', 'mgmt_token': mgmt_token, 'graph_token': graph_token, 'tenant_id': req.tenantId}

@app.get('/api/v1/subscriptions')
async def get_subscriptions(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing Authorization header')
    mgmt_token = authorization.replace('Bearer ', '')
    data = await mgmt_get(mgmt_token, '/subscriptions', {'api-version': '2022-12-01'})
    if data is None:
        raise HTTPException(status_code=500, detail='Failed to fetch subscriptions')
    return data

@app.get('/api/v1/subscriptions/{subscription_id}/metadata')
async def get_subscription_metadata(subscription_id: str, authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(status_code=401, detail='Missing Authorization header')
    mgmt_token = authorization.replace('Bearer ', '')
    data = await mgmt_get(mgmt_token, f'/subscriptions/{subscription_id}', {'api-version': '2022-12-01'})
    if data is None:
        raise HTTPException(status_code=500, detail='Failed to fetch metadata')
    return data

@app.get('/api/v1/tenant/users')
async def get_tenant_users(authorization: Optional[str] = Header(None), x_graph_token: Optional[str] = Header(None)):
    graph_token = x_graph_token or (authorization.replace('Bearer ', '') if authorization else None)
    if not graph_token:
        raise HTTPException(status_code=401, detail='Missing graph token')
    users_data = await graph_get(graph_token, '/users', {'': 'id,displayName,userPrincipalName,accountEnabled,createdDateTime,signInActivity,assignedLicenses', '': '999'})
    roles_data = await graph_get(graph_token, '/directoryRoles', {'': 'members'})
    role_map = {}
    if roles_data:
        for role in roles_data.get('value', []):
            role_name = role.get('displayName', '')
            for member in role.get('members', []):
                uid = member.get('id')
                if uid:
                    role_map.setdefault(uid, []).append(role_name)
    mfa_data = await graph_get(graph_token, '/reports/credentialUserRegistrationDetails', {'': '999'})
    mfa_map = {}
    if mfa_data:
        for m in mfa_data.get('value', []):
            mfa_map[m.get('id')] = m.get('isMfaRegistered', False)
    processed = []
    for u in (users_data or {}).get('value', []):
        uid = u.get('id', '')
        last_login = (u.get('signInActivity') or {}).get('lastSignInDateTime', 'N/A')
        user_roles = role_map.get(uid, [])
        if not user_roles:
            user_roles = ['Guest'] if '#EXT#' in u.get('userPrincipalName', '') else ['Member']
        mfa_enabled = mfa_map.get(uid)
        risk = 'Low'
        if not u.get('accountEnabled'):
            risk = 'Medium'
        if any(r in ['Global Administrator', 'Privileged Role Administrator'] for r in user_roles) and mfa_enabled is False:
            risk = 'High'
        processed.append({'id': uid, 'displayName': u.get('displayName', 'Unknown'), 'userPrincipalName': u.get('userPrincipalName', ''), 'accountEnabled': u.get('accountEnabled', True), 'createdDateTime': u.get('createdDateTime'), 'lastLogin': last_login, 'roles': user_roles, 'mfaEnabled': mfa_enabled, 'status': 'Active' if u.get('accountEnabled') else 'Inactive', 'risk': risk, 'user': u.get('displayName', 'Unknown'), 'role': user_roles[0] if user_roles else 'Member', 'mfa': 'Enabled' if mfa_enabled else ('Disabled' if mfa_enabled is False else 'Unknown'), 'subscription': ''})
    (DATA_DIR / 'tenant_users.json').write_text(json.dumps(processed, indent=2, default=str))
    return {'users': processed, 'foreignGroupsCount': None, 'servicePrincipalsCount': None}

@app.get('/api/v1/users')
async def get_subscription_users(subscription_id: str, authorization: Optional[str] = Header(None), x_graph_token: Optional[str] = Header(None)):
    mgmt_token = authorization.replace('Bearer ', '') if authorization and authorization.startswith('Bearer ') else None
    if not mgmt_token:
        raise HTTPException(status_code=401, detail='Missing mgmt token')
    OWNER = '8e3af657-a8ff-443c-a75c-2fe8c4bcb635'
    CONTRIB = 'b24988ac-6180-42a0-ab88-20f7382dd24c'
    READER = 'acdd72a7-3385-48ef-bd42-f606fba81ae7'
    UAA = '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9'
    AZURE_ROLES = {OWNER: 'Owner', CONTRIB: 'Contributor', READER: 'Reader', UAA: 'User Access Administrator'}
    role_assignments = await mgmt_get(mgmt_token, f'/subscriptions/{subscription_id}/providers/Microsoft.Authorization/roleAssignments', {'api-version': '2022-04-01', '': 'principalName'})
    users = []
    sp_count = 0
    for ra in (role_assignments or {}).get('value', []):
        props = ra.get('properties', {})
        if props.get('principalType') == 'ServicePrincipal':
            sp_count += 1
            continue
        role_name = AZURE_ROLES.get(props.get('roleDefinitionId', '').split('/')[-1], 'Custom Role')
        users.append({'id': props.get('principalId', ''), 'displayName': props.get('principalName', 'Unknown'), 'userPrincipalName': props.get('principalName', ''), 'accountEnabled': True, 'role': role_name, 'roles': [role_name], 'status': 'Active', 'mfa': 'Unknown', 'mfaEnabled': None, 'risk': 'Low', 'user': props.get('principalName', 'Unknown'), 'subscription': subscription_id, 'lastLogin': 'N/A'})
    return {'users': users, 'foreignGroupsCount': 0, 'servicePrincipalsCount': sp_count}

@app.get('/api/v1/tenant/applications')
async def get_tenant_applications(authorization: Optional[str] = Header(None), x_graph_token: Optional[str] = Header(None)):
    graph_token = x_graph_token or (authorization.replace('Bearer ', '') if authorization else None)
    if not graph_token:
        raise HTTPException(status_code=401, detail='Missing graph token')
    data = await graph_get(graph_token, '/applications', {'': 'id,appId,displayName,createdDateTime,signInAudience', '': '999'})
    applications = (data or {}).get('value', [])
    (DATA_DIR / 'applications.json').write_text(json.dumps(applications, indent=2))
    return {'applications': applications, 'count': len(applications)}

@app.get('/api/v1/tenant/organization')
async def get_organization(authorization: Optional[str] = Header(None), x_graph_token: Optional[str] = Header(None)):
    graph_token = x_graph_token or (authorization.replace('Bearer ', '') if authorization else None)
    if not graph_token:
        raise HTTPException(status_code=401, detail='Missing graph token')
    data = await graph_get(graph_token, '/organization', {'': 'id,displayName,verifiedDomains,createdDateTime,tenantType,assignedPlans'})
    orgs = (data or {}).get('value', [])
    org = orgs[0] if orgs else {}
    (DATA_DIR / 'organization.json').write_text(json.dumps(org, indent=2))
    return {'organization': org}

@app.get('/api/v1/tenant/audit-logs')
async def get_audit_logs(category: Optional[str] = None, start_date: Optional[str] = None, authorization: Optional[str] = Header(None), x_graph_token: Optional[str] = Header(None)):
    graph_token = x_graph_token or (authorization.replace('Bearer ', '') if authorization else None)
    if not graph_token:
        raise HTTPException(status_code=401, detail='Missing graph token')
    params = {'': '50', '': 'activityDateTime desc'}
    filters = []
    if category and category != 'All':
        filters.append(f"category eq '{category}'")
    if start_date:
        filters.append(f'activityDateTime ge {start_date}')
    if filters:
        params[''] = ' and '.join(filters)
    data = await graph_get(graph_token, '/auditLogs/directoryAudits', params)
    logs = (data or {}).get('value', [])
    (DATA_DIR / 'audit_logs.json').write_text(json.dumps(logs, indent=2, default=str))
    return {'logs': logs}

@app.get('/api/v1/security/tenant-posture')
async def get_tenant_posture(authorization: Optional[str] = Header(None), x_graph_token: Optional[str] = Header(None)):
    graph_token = x_graph_token or (authorization.replace('Bearer ', '') if authorization else None)
    if not graph_token:
        raise HTTPException(status_code=401, detail='Missing graph token')
    score_data = await graph_get(graph_token, '/security/secureScores', {'': '1', '': 'id,currentScore,maxScore,averageComparativeScores,controlScores,createdDateTime'})
    scores = (score_data or {}).get('value', [])
    score = scores[0] if scores else {}
    return {'success': True, 'data': {'overall': {'currentScore': score.get('currentScore', 0), 'maxScore': score.get('maxScore', 0), 'percentage': round((score.get('currentScore', 0) / max(score.get('maxScore', 1), 1)) * 100, 1), 'controlScores': score.get('controlScores', [])}, 'action_plan': score.get('controlScores', []), 'batch_metadata': {'createdDateTime': score.get('createdDateTime')}}}

@app.get('/api/v1/security-audit-report')
async def get_security_audit_report(subscription_id: str, authorization: Optional[str] = Header(None), x_graph_token: Optional[str] = Header(None)):
    mgmt_token = authorization.replace('Bearer ', '') if authorization and authorization.startswith('Bearer ') else None
    graph_token = x_graph_token
    if not mgmt_token:
        raise HTTPException(status_code=401, detail='Missing mgmt token')
    report = {}
    if graph_token:
        score_raw = await graph_get(graph_token, '/security/secureScores', {'': '1', '': 'currentScore,maxScore,controlScores'})
        scores = (score_raw or {}).get('value', [])
        if scores:
            s = scores[0]
            report['scoreData'] = {'properties': {'score': {'currentScore': s.get('currentScore', 0), 'maxScore': s.get('maxScore', 0), 'percentage': round((s.get('currentScore', 0) / max(s.get('maxScore', 1), 1)), 4)}}}
            report['scoreControls'] = {'value': s.get('controlScores', [])}
    assessments = await mgmt_get(mgmt_token, f'/subscriptions/{subscription_id}/providers/Microsoft.Security/assessments', {'api-version': '2021-06-01'})
    all_assessments = (assessments or {}).get('value', [])
    failed = [a for a in all_assessments if a.get('properties', {}).get('status', {}).get('code') == 'Unhealthy']
    report['allAssessments'] = {'value': all_assessments}
    report['failedControls'] = {'value': failed}
    report['recommendations'] = [{'title': a.get('properties', {}).get('displayName', ''), 'severity': a.get('properties', {}).get('metadata', {}).get('severity', 'Medium'), 'status': 'Unhealthy', 'category': a.get('properties', {}).get('metadata', {}).get('category', 'Security')} for a in failed[:20]]
    alerts_data = await mgmt_get(mgmt_token, f'/subscriptions/{subscription_id}/providers/Microsoft.Security/alerts', {'api-version': '2022-01-01'})
    report['activeAlerts'] = (alerts_data or {}).get('value', [])
    nsg_data = await mgmt_get(mgmt_token, f'/subscriptions/{subscription_id}/providers/Microsoft.Network/networkSecurityGroups', {'api-version': '2023-04-01'})
    nsgs = (nsg_data or {}).get('value', [])
    network_findings = []
    for nsg in nsgs[:10]:
        open_rules = [r for r in nsg.get('properties', {}).get('securityRules', []) if r.get('properties', {}).get('access') == 'Allow' and r.get('properties', {}).get('destinationPortRange') in ['*', '22', '3389']]
        if open_rules:
            network_findings.append({'name': nsg.get('name', ''), 'location': nsg.get('location', ''), 'issue': f'{len(open_rules)} overly permissive rule(s)', 'severity': 'High' if len(open_rules) > 2 else 'Medium', 'category': 'network'})
    report['networkFindings'] = network_findings
    resources_data = await mgmt_get(mgmt_token, f'/subscriptions/{subscription_id}/resources', {'api-version': '2021-04-01', '': '100'})
    resources = (resources_data or {}).get('value', [])
    report['resourceInventory'] = {'value': resources}
    alert_rules = await mgmt_get(mgmt_token, f'/subscriptions/{subscription_id}/providers/Microsoft.Insights/activityLogAlerts', {'api-version': '2020-10-01'})
    report['monitoringRules'] = {'value': (alert_rules or {}).get('value', [])}
    unhealthy_count = len(failed)
    total = len(all_assessments)
    report['postureKPI'] = {'total': total, 'healthy': total - unhealthy_count, 'unhealthy': unhealthy_count, 'healthPercentage': round(((total - unhealthy_count) / max(total, 1)) * 100, 1)}
    compliance_data = await mgmt_get(mgmt_token, f'/subscriptions/{subscription_id}/providers/Microsoft.Security/regulatoryComplianceStandards', {'api-version': '2019-01-01-preview'})
    report['complianceStandards'] = {'value': (compliance_data or {}).get('value', [])}
    report['dataSecurity'] = [{'name': r.get('name', ''), 'type': r.get('type', ''), 'location': r.get('location', '')} for r in resources if 'storage' in r.get('type', '').lower() or 'sql' in r.get('type', '').lower()]
    (DATA_DIR / f'security_report_{subscription_id[:8]}.json').write_text(json.dumps(report, indent=2, default=str))
    return report

@app.get('/api/v1/microsoft0365/license_and_usage_details')
async def get_m365_licenses(authorization: Optional[str] = Header(None), x_graph_token: Optional[str] = Header(None)):
    graph_token = x_graph_token or (authorization.replace('Bearer ', '') if authorization else None)
    if not graph_token:
        raise HTTPException(status_code=401, detail='Missing graph token')
    skus_data = await graph_get(graph_token, '/subscribedSkus', {'': 'skuPartNumber,consumedUnits,prepaidUnits,servicePlans'})
    skus = (skus_data or {}).get('value', [])
    FRIENDLY = {'SPE_E3': 'Microsoft 365 E3', 'SPE_E5': 'Microsoft 365 E5', 'ENTERPRISEPACK': 'Office 365 E3', 'ENTERPRISEPREMIUM': 'Office 365 E5', 'BUSINESS_PREMIUM': 'Microsoft 365 Business Premium', 'EMS': 'Enterprise Mobility + Security E3', 'AAD_PREMIUM': 'Azure AD Premium P1', 'AAD_PREMIUM_P2': 'Azure AD Premium P2', 'POWER_BI_PRO': 'Power BI Pro'}
    table_data = []
    total_licensed = 0
    total_consumed = 0
    for sku in skus:
        enabled = sku.get('prepaidUnits', {}).get('enabled', 0)
        consumed = sku.get('consumedUnits', 0)
        sku_part = sku.get('skuPartNumber', '')
        usage_pct = round((consumed / max(enabled, 1)) * 100, 1) if enabled > 0 else 0
        total_licensed += enabled
        total_consumed += consumed
        table_data.append({'key': sku_part, 'product': FRIENDLY.get(sku_part, sku_part), 'totalLicenses': enabled, 'usedLicenses': consumed, 'availableLicenses': max(enabled - consumed, 0), 'usagePercent': usage_pct})
    summary_items = [{'label': 'Total Licensed', 'value': total_licensed, 'icon': 'license'}, {'label': 'Currently Used', 'value': total_consumed, 'icon': 'users'}, {'label': 'Available', 'value': max(total_licensed - total_consumed, 0), 'icon': 'available'}, {'label': 'Products', 'value': len(skus), 'icon': 'product'}]
    return {'success': True, 'tableData': table_data, 'summaryItems': summary_items}

@app.get('/api/v1/microsoft0365/secure/score')
async def get_m365_secure_score(authorization: Optional[str] = Header(None), x_graph_token: Optional[str] = Header(None)):
    graph_token = x_graph_token or (authorization.replace('Bearer ', '') if authorization else None)
    if not graph_token:
        raise HTTPException(status_code=401, detail='Missing graph token')
    score_data = await graph_get(graph_token, '/security/secureScores', {'': '1', '': 'currentScore,maxScore,controlScores,averageComparativeScores,createdDateTime'})
    scores = (score_data or {}).get('value', [])
    score = scores[0] if scores else {}
    control_scores = score.get('controlScores', [])
    action_plan = [{'controlName': cs.get('controlName', ''), 'description': cs.get('description', ''), 'scoreInPercentage': cs.get('scoreInPercentage', 0), 'count': cs.get('count', 0), 'implementationStatus': cs.get('implementationStatus', '')} for cs in control_scores[:30] if cs.get('scoreInPercentage', 100) < 100]
    return {'success': True, 'data': {'overall': {'currentScore': score.get('currentScore', 0), 'maxScore': score.get('maxScore', 0), 'percentage': round((score.get('currentScore', 0) / max(score.get('maxScore', 1), 1)) * 100, 1), 'controlScores': control_scores, 'averageComparativeScores': score.get('averageComparativeScores', [])}, 'action_plan': action_plan, 'batch_metadata': {'createdDateTime': score.get('createdDateTime'), 'totalControls': len(control_scores), 'actionsCompleted': len([c for c in control_scores if c.get('scoreInPercentage', 0) >= 100]), 'actionsToAddress': len([c for c in control_scores if c.get('scoreInPercentage', 0) < 100])}}}

@app.get('/api/v1/microsoft0365/identity/governance')
async def get_m365_governance(authorization: Optional[str] = Header(None), x_graph_token: Optional[str] = Header(None)):
    graph_token = x_graph_token or (authorization.replace('Bearer ', '') if authorization else None)
    if not graph_token:
        raise HTTPException(status_code=401, detail='Missing graph token')
    data = await graph_get(graph_token, '/identityGovernance/accessReviews/definitions', {'': '20'})
    items = (data or {}).get('value', [])
    return [{'id': i.get('id'), 'displayName': i.get('displayName'), 'status': i.get('status'), 'createdDateTime': i.get('createdDateTime')} for i in items]

@app.post('/api/v1/governance/stats')
async def governance_stats(req: GovernanceRequest):
    try:
        mgmt_token = await get_azure_token(req.tenantId, req.clientId, req.clientSecret, 'https://management.azure.com/.default')
        graph_token = await get_azure_token(req.tenantId, req.clientId, req.clientSecret, 'https://graph.microsoft.com/.default')
        users_data = await graph_get(graph_token, '/users', {'': 'id,accountEnabled,userPrincipalName', '': '999'})
        all_users = (users_data or {}).get('value', [])
        inactive = len([u for u in all_users if not u.get('accountEnabled')])
        guests = len([u for u in all_users if '#EXT#' in u.get('userPrincipalName', '')])
        OWNER_ROLE = '8e3af657-a8ff-443c-a75c-2fe8c4bcb635'
        owners_data = await mgmt_get(mgmt_token, f'/subscriptions/{req.subscriptionId}/providers/Microsoft.Authorization/roleAssignments', {'api-version': '2022-04-01'}) if req.subscriptionId else None
        owner_count = sum(1 for ra in (owners_data or {}).get('value', []) if OWNER_ROLE in ra.get('properties', {}).get('roleDefinitionId', ''))
        assessments = await mgmt_get(mgmt_token, f'/subscriptions/{req.subscriptionId}/providers/Microsoft.Security/assessments', {'api-version': '2021-06-01'}) if req.subscriptionId else None
        high_risk = len([a for a in (assessments or {}).get('value', []) if a.get('properties', {}).get('metadata', {}).get('severity') == 'High' and a.get('properties', {}).get('status', {}).get('code') == 'Unhealthy'])
        return {'totalUsers': len(all_users), 'inactiveUsers': inactive, 'mfaDisabled': 0, 'owners': owner_count, 'guestUsers': guests, 'highRiskFindings': high_risk}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post('/api/v1/governance/risk-distribution')
async def governance_risk(req: GovernanceRequest):
    try:
        mgmt_token = await get_azure_token(req.tenantId, req.clientId, req.clientSecret, 'https://management.azure.com/.default')
        assessments = await mgmt_get(mgmt_token, f'/subscriptions/{req.subscriptionId}/providers/Microsoft.Security/assessments', {'api-version': '2021-06-01'}) if req.subscriptionId else None
        findings = (assessments or {}).get('value', [])
        def count(sev): return len([f for f in findings if f.get('properties', {}).get('metadata', {}).get('severity') == sev and f.get('properties', {}).get('status', {}).get('code') == 'Unhealthy'])
        return {'high': count('High'), 'medium': count('Medium'), 'low': count('Low')}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get('/api/v1/ssl-certificates')
async def get_ssl_certificates(tenant_id: str = '', subscription_id: str = ''):
    return [{'domain': 'example.com', 'expiryDate': '2026-02-20', 'daysToExpiry': 30}, {'domain': 'company.net', 'expiryDate': '2026-01-25', 'daysToExpiry': 4}, {'domain': 'brand.org', 'expiryDate': '2026-03-30', 'daysToExpiry': 69}]

if __name__ == '__main__':
    print('Starting ZensusTech Backend at http://localhost:8000')
    uvicorn.run('server:app', host='0.0.0.0', port=8000, reload=True, log_level='info')
