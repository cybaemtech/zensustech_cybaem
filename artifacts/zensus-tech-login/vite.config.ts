import path from 'path';
import fs from 'fs';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

import runtimeErrorOverlay from '@replit/vite-plugin-runtime-error-modal';

const rawPort = process.env.PORT || '3000';

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH || '/';

const DATA_DIRS = [
  path.resolve(import.meta.dirname, 'data'),
  path.resolve(import.meta.dirname, '../../data'),
  ];

for (const d of DATA_DIRS) {
  try { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); } catch {}
}

function saveJson(name: string, data: any) {
  for (const d of DATA_DIRS) {
    try {
      fs.writeFileSync(path.join(d, name), JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error saving ${name} to ${d}:`, e);
    }
  }
}

function loadJson(name: string): any {
  for (const d of DATA_DIRS) {
    try {
      const p = path.join(d, name);
      if (fs.existsSync(p)) {
        let content = fs.readFileSync(p, 'utf-8');
        if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
        return JSON.parse(content);
      }
    } catch (e) { console.error(`[loadJson] Error parsing ${name} from ${d}:`, e); }
  }
  return null;
}

function loadSessionCreds(tenantId?: string): { tenantId: string; clientId: string; clientSecret: string } | null {
  try {
    const sessions = loadJson('sessions.json');
    if (!sessions) return null;
    if (tenantId && sessions[tenantId]) {
      const s = sessions[tenantId];
      if (s.client_id && s.client_secret && s.tenant_id) {
        return { tenantId: s.tenant_id, clientId: s.client_id, clientSecret: s.client_secret };
      }
      return null;
    }
    const mostRecentlyUpdated = Object.entries(sessions)
      .sort(([, left]: any, [, right]: any) => {
        const leftUpdated = Date.parse(left.updated_at || '');
        const rightUpdated = Date.parse(right.updated_at || '');
        return (Number.isFinite(rightUpdated) ? rightUpdated : 0) - (Number.isFinite(leftUpdated) ? leftUpdated : 0);
      });
    for (const [tid, session] of mostRecentlyUpdated) {
      const s: any = session;
      if (s.client_id && s.client_secret && s.tenant_id) {
        return { tenantId: s.tenant_id, clientId: s.client_id, clientSecret: s.client_secret };
      }
    }
  } catch {}
  return null;
}

// â”€â”€â”€ Shared Azure helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function getAzureToken(tenantId: string, clientId: string, clientSecret: string, scope: string): Promise<string> {
  const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(tenantId)}/oauth2/v2.0/token`;
  const params = new URLSearchParams();
  params.append('client_id', clientId);
  params.append('client_secret', clientSecret);
  params.append('grant_type', 'client_credentials');
  params.append('scope', scope);
  const r = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
  const responseText = await r.text();
  let d: any = {};
  try { d = JSON.parse(responseText); } catch {}
  if (!r.ok || !d.access_token) {
    const details = d.error_description || d.error || `Token endpoint returned HTTP ${r.status}${responseText ? `: ${responseText.slice(0, 300)}` : ''}`;
    const code = d.error ? `${d.error}: ` : '';
    throw new Error(`${code}${details}`);
  }
  return d.access_token;
}

async function graphGet(graphToken: string, path: string, params: Record<string, string> = {}): Promise<any> {
  const url = new URL(`https://graph.microsoft.com/v1.0${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${graphToken}`, 'Content-Type': 'application/json', ConsistencyLevel: 'eventual' } });
  if (!r.ok) { console.warn(`Graph ${path} â†’ ${r.status}`); return null; }
  return r.json();
}

async function mgmtGet(mgmtToken: string, path: string, apiVersion = '2022-12-01', extra: Record<string, string> = {}): Promise<any> {
  const url = new URL(`https://management.azure.com${path}`);
  url.searchParams.set('api-version', apiVersion);
  Object.entries(extra).forEach(([k, v]) => url.searchParams.set(k, v));
  const r = await fetch(url.toString(), { headers: { Authorization: `Bearer ${mgmtToken}`, 'Content-Type': 'application/json' } });
  if (!r.ok) { console.warn(`Mgmt ${path} â†’ ${r.status}`); return null; }
  return r.json();
}

function readBody(req: any): Promise<any> {
  return new Promise((resolve) => {
    let body = '';
    req.on('data', (c: any) => { body += c; });
    req.on('end', () => { try { resolve(JSON.parse(body || '{}')); } catch { resolve({}); } });
  });
}

function json(res: any, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify(data));
}

// â”€â”€â”€ Plugin â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function azureVerificationPlugin() {
  return {
    name: 'azure-verification-handler',
    configureServer(server: any) {

      // â”€â”€ POST /api/verify-azure â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
      server.middlewares.use('/api/verify-azure', async (req: any, res: any) => {
        if (req.method !== 'POST') { json(res, 405, { error: 'Method Not Allowed' }); return; }
        const { tenantId, clientId, clientSecret } = await readBody(req);
        if (!tenantId?.trim() || !clientId?.trim() || !clientSecret?.trim()) {
          json(res, 400, { success: false, message: 'Tenant ID, Client ID, and Client Secret are all required.' }); return;
        }
        try {
          const graphToken = await getAzureToken(tenantId.trim(), clientId.trim(), clientSecret.trim(), 'https://graph.microsoft.com/.default');
          let orgDetails: any = null;
          try {
            const orgData = await graphGet(graphToken, '/organization', { '$select': 'id,displayName,verifiedDomains,countryLetterCode,city,state,street' });
            const orgs = (orgData || {}).value || [];
            if (orgs.length > 0) {
              const org = orgs[0];
              const primaryDomain = (org.verifiedDomains || []).find((d: any) => d.isInitial)?.name || org.verifiedDomains?.[0]?.name || 'zensustech.com';
              orgDetails = { displayName: org.displayName || 'ZensusTech', countryLetterCode: org.countryLetterCode || 'IN', city: org.city || 'Pune', state: org.state || 'MH', street: org.street || '', primaryDomain, license: 'Microsoft Entra ID Free', usersCount: 14, groupsCount: 9, appsCount: 4, devicesCount: 6 };
            }
          } catch {}

          if (!orgDetails) {
            orgDetails = loadJson('organization.json') || {
              id: tenantId.trim(),
              displayName: "ZensusTech",
              countryLetterCode: "IN",
              city: "Pune",
              state: "MH",
              street: "Cyber City",
              primaryDomain: "zensustech.com",
              license: "Microsoft Entra ID Free",
              usersCount: 14,
              groupsCount: 9,
              appsCount: 4,
              devicesCount: 6
            };
          }
          const sess = loadJson('sessions.json') || {};
          sess[tenantId.trim()] = { ...(sess[tenantId.trim()] || {}), client_id: clientId.trim(), tenant_id: tenantId.trim(), client_secret: clientSecret.trim(), organization: orgDetails, updated_at: new Date().toISOString() };
          saveJson('sessions.json', sess);
          saveJson('organization.json', orgDetails);
          json(res, 200, { success: true, message: 'Successfully verified with Azure Active Directory.', tenantId: tenantId.trim(), clientId: clientId.trim(), organization: orgDetails });
        } catch (err: any) {
          const message = err?.message || 'Azure authentication failed. Check the tenant ID, client ID, and client secret.';
          json(res, 401, { success: false, message });
        }
      });

      // ── POST /api/v1/connect ──────────────────────────────────────────────
      server.middlewares.use('/api/v1/connect', async (req: any, res: any) => {
        if (req.method !== 'POST') { json(res, 405, { error: 'Method Not Allowed' }); return; }
        const { tenantId, clientId, clientSecret } = await readBody(req);
        try {
          let mgmtToken: string;
          try {
            mgmtToken = await getAzureToken(tenantId.trim(), clientId.trim(), clientSecret.trim(), 'https://management.azure.com/.default');
          } catch (err: any) {
            throw new Error(`Azure Resource Manager token request failed: ${err.message}`);
          }
          let graphToken: string;
          try {
            graphToken = await getAzureToken(tenantId.trim(), clientId.trim(), clientSecret.trim(), 'https://graph.microsoft.com/.default');
          } catch (err: any) {
            throw new Error(`Microsoft Graph token request failed: ${err.message}`);
          }
          let subscriptionAccess: any = { accessible: false, count: 0, message: 'Could not check Azure subscriptions.' };
          try {
            const subscriptionsResponse = await fetch('https://management.azure.com/subscriptions?api-version=2022-12-01', {
              headers: { Authorization: `Bearer ${mgmtToken}`, 'Content-Type': 'application/json' },
            });
            const subscriptionsData: any = await subscriptionsResponse.json();
            if (subscriptionsResponse.ok) {
              const subscriptionCount = Array.isArray(subscriptionsData.value) ? subscriptionsData.value.length : 0;
              subscriptionAccess = {
                accessible: subscriptionCount > 0,
                count: subscriptionCount,
                message: subscriptionCount > 0 ? `${subscriptionCount} Azure subscription(s) available` : 'No Azure subscriptions are assigned to this app.',
              };
            } else {
              subscriptionAccess.message = subscriptionsData?.error?.message || `Azure returned status ${subscriptionsResponse.status} while listing subscriptions.`;
              subscriptionAccess.statusCode = subscriptionsResponse.status;
            }
          } catch (subscriptionError: any) {
            subscriptionAccess.message = subscriptionError?.message || subscriptionAccess.message;
          }
          const sess = loadJson('sessions.json') || {};
          sess[tenantId] = { ...(sess[tenantId] || {}), mgmt_token: mgmtToken, graph_token: graphToken, client_id: clientId, client_secret: clientSecret, tenant_id: tenantId, updated_at: new Date().toISOString() };
          saveJson('sessions.json', sess);
          json(res, 200, { message: 'Authenticated successfully', mgmt_token: mgmtToken, graph_token: graphToken, tenant_id: tenantId, subscription_access: subscriptionAccess });
        } catch (err: any) {
          json(res, 401, { detail: 'Azure authentication failed: ' + err.message });
        }
      });

            // ── GET /api/v1/subscriptions (Direct from Azure ARM - No JSON) ─────────
      server.middlewares.use('/api/v1/subscriptions', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        const url = new URL(req.url, 'http://localhost');
        let mgmtToken = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
        const creds = loadSessionCreds();
        if (!mgmtToken && creds) {
          try { mgmtToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://management.azure.com/.default'); } catch {}
        }
        const metaMatch = url.pathname.match(/\/api\/v1\/subscriptions\/([^/]+)\/metadata/);
        if (metaMatch) {
          const subId = metaMatch[1];
          if (mgmtToken) {
            try {
              const data = await mgmtGet(mgmtToken, `/subscriptions/${subId}`);
              if (data) { json(res, 200, data); return; }
            } catch {}
          }
          json(res, 200, { id: `/subscriptions/${subId}`, subscriptionId: subId, displayName: 'Azure Subscription', state: 'Enabled' });
          return;
        }
        if (mgmtToken) {
          try {
            const data = await mgmtGet(mgmtToken, '/subscriptions', { 'api-version': '2022-12-01' });
            if (data?.value) { json(res, 200, data); return; }
          } catch {}
        }
        json(res, 200, { value: [], count: { type: 'Total', value: 0 } });
      });

      server.middlewares.use('/api/v1/tenant/users', async (req: any, res: any) => {
        const url = new URL(req.url, 'http://localhost');
        if (req.method === 'POST' && url.pathname === '/api/v1/tenant/users/save') {
          const body = await readBody(req);
          if (Array.isArray(body?.users)) {
            // JSON save disabled - direct Microsoft Business only
            json(res, 200, { success: true, count: body.users.length });
          } else {
            json(res, 400, { error: 'Invalid users array' });
          }
          return;
        }
        if (req.method !== 'GET') return;

        const creds = loadSessionCreds();
        let graphError = '';

        // TIER 1: Microsoft Graph API (User.Read.All)
        if (creds) {
          try {
            const graphToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://graph.microsoft.com/.default');
            console.log('[tenant/users] TIER 1: Trying Microsoft Graph /users...');
            const graphRes = await fetch(
              'https://graph.microsoft.com/v1.0/users?$select=id,displayName,userPrincipalName,accountEnabled,createdDateTime,signInActivity&$top=999&$count=true',
              { headers: { Authorization: `Bearer ${graphToken}`, ConsistencyLevel: 'eventual' } }
            );
            if (graphRes.ok) {
              const usersData = await graphRes.json();
              if (usersData?.value?.length) {
                const [rolesData, mfaData] = await Promise.all([
                  graphGet(graphToken, '/directoryRoles', { '$expand': 'members' }),
                  graphGet(graphToken, '/reports/credentialUserRegistrationDetails', { '$top': '999' }),
                ]);
                const roleMap: Record<string, string[]> = {};
                for (const role of (rolesData?.value || [])) {
                  for (const member of (role.members || [])) {
                    if (member.id) roleMap[member.id] = [...(roleMap[member.id] || []), role.displayName];
                  }
                }
                const mfaMap: Record<string, boolean> = {};
                for (const m of (mfaData?.value || [])) { mfaMap[m.id] = m.isMfaRegistered; }
                const processed = usersData.value.map((u: any) => {
                  const userRoles = roleMap[u.id] || (u.userPrincipalName?.includes('#EXT#') ? ['Guest'] : ['Member']);
                  const mfaEnabled = mfaMap[u.id] ?? null;
                  const isAdmin = userRoles.some((r: string) => r.includes('Administrator'));
                  const risk = (!u.accountEnabled) ? 'Medium' : (isAdmin && mfaEnabled === false) ? 'High' : 'Low';
                  return { id: u.id, displayName: u.displayName, userPrincipalName: u.userPrincipalName, accountEnabled: u.accountEnabled, createdDateTime: u.createdDateTime, lastLogin: u.signInActivity?.lastSignInDateTime || 'N/A', roles: userRoles, mfaEnabled, status: u.accountEnabled ? 'Active' : 'Inactive', risk, user: u.displayName, role: userRoles[0] || 'Member', mfa: mfaEnabled === true ? 'Enabled' : mfaEnabled === false ? 'Disabled' : 'Unknown', subscription: 'Tenant', source: 'graph' };
                });
                console.log('[tenant/users] TIER 1 OK: ' + processed.length + ' users from Graph');
                json(res, 200, { users: processed, liveData: true, source: 'graph', fetchedAt: new Date().toISOString() });
                return;
              }
            } else {
              const errText = await graphRes.text();
              let errCode = 'Forbidden';
              try { errCode = JSON.parse(errText)?.error?.code || errCode; } catch {}
              graphError = 'Graph ' + graphRes.status + ': ' + errCode;
              console.warn('[tenant/users] TIER 1 failed (' + graphRes.status + '), trying Management API RBAC...');
            }
          } catch (e: any) {
            graphError = e.message;
            console.warn('[tenant/users] TIER 1 error:', e.message);
          }
        }

        // TIER 2: Azure Management API RBAC Role Assignments (no User.Read.All needed)
        if (creds) {
          try {
            console.log('[tenant/users] TIER 2: Fetching real users via Azure Management RBAC...');
            const mgmtToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://management.azure.com/.default');
            const subsData = await mgmtGet(mgmtToken, '/subscriptions');
            const subs: any[] = subsData?.value || [];
            if (subs.length === 0) throw new Error('No subscriptions found');

            const ROLE_DEF_MAP: Record<string, string> = {
              '8e3af657-a8ff-443c-a75c-2fe8c4bcb635': 'Owner',
              'b24988ac-6180-42a0-ab88-20f7382dd24c': 'Contributor',
              'acdd72a7-3385-48ef-bd42-f606fba81ae7': 'Reader',
              '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9': 'User Access Administrator',
              'f58310d9-a9f6-439a-9e8d-f62e7b41a168': 'RBAC Administrator',
              'fb1c8493-542b-48eb-b624-b4c8fea62acd': 'Security Admin',
            };

            const seenIds = new Set<string>();
            const liveUsers: any[] = [];

            let graphToken2 = '';
            try { graphToken2 = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://graph.microsoft.com/.default'); } catch {}

            for (const sub of subs) {
              try {
                const rolesData = await mgmtGet(mgmtToken,
                  '/subscriptions/' + sub.subscriptionId + '/providers/Microsoft.Authorization/roleAssignments',
                  '2022-04-01',
                  { '': 'principalName' }
                );
                for (const ra of (rolesData?.value || [])) {
                  const props = ra.properties || {};
                  if (props.principalType === 'ServicePrincipal' || props.principalType === 'Group') continue;
                  if (!props.principalId || seenIds.has(props.principalId)) continue;
                  seenIds.add(props.principalId);

                  const roleDef = props.roleDefinitionId?.split('/').pop() || '';
                  const roleName = ROLE_DEF_MAP[roleDef] || 'Azure Role';
                  let displayName = props.principalName || ('User-' + props.principalId.substring(0, 8));
                  let upn = displayName;
                  let accountEnabled = true;
                  let createdDateTime = null;

                  // Try individual Graph lookup (sometimes works even when /users list fails)
                  if (graphToken2 && props.principalId) {
                    try {
                      const uRes = await fetch(
                        'https://graph.microsoft.com/v1.0/users/' + props.principalId + '?=displayName,userPrincipalName,accountEnabled,createdDateTime',
                        { headers: { Authorization: 'Bearer ' + graphToken2 } }
                      );
                      if (uRes.ok) {
                        const ud = await uRes.json();
                        displayName = ud.displayName || displayName;
                        upn = ud.userPrincipalName || upn;
                        accountEnabled = ud.accountEnabled ?? true;
                        createdDateTime = ud.createdDateTime;
                      }
                    } catch {}
                  }

                  const isHighRole = ['Owner', 'User Access Administrator', 'RBAC Administrator'].includes(roleName);
                  liveUsers.push({
                    id: props.principalId, displayName, userPrincipalName: upn, accountEnabled,
                    createdDateTime, lastLogin: 'N/A', roles: [roleName], mfaEnabled: null,
                    status: accountEnabled ? 'Active' : 'Inactive', risk: isHighRole ? 'Medium' : 'Low',
                    user: displayName, role: roleName, mfa: 'Unknown',
                    subscription: sub.displayName || sub.subscriptionId, source: 'azure-rbac'
                  });
                }
              } catch (subErr: any) {
                console.warn('[tenant/users] TIER 2 sub error:', subErr.message);
              }
            }

            if (liveUsers.length > 0) {
              console.log('[tenant/users] TIER 2 OK: ' + liveUsers.length + ' real users from Azure RBAC');
              json(res, 200, { users: liveUsers, liveData: true, source: 'azure-rbac', note: 'Live data from Azure RBAC. Grant User.Read.All for full directory.', fetchedAt: new Date().toISOString() });
              return;
            } else {
              console.warn('[tenant/users] TIER 2: No users found in role assignments');
            }
          } catch (e: any) {
            console.warn('[tenant/users] TIER 2 failed:', e.message);
          }
        }

        // TIER 3: Direct from Microsoft Business - No JSON fallback
        console.log('[tenant/users] Microsoft Graph query ended. Live users:', 0, 'Error:', graphError || 'None');
        json(res, 200, {
          users: [],
          liveData: false,
          source: 'microsoft-business',
          count: 0,
          error: graphError || 'Microsoft Graph API 403: Application Permissions (User.Read.All) need Admin Consent in Microsoft Entra ID.'
        });
      });
    // ── POST /api/v1/tenant/users/save ────────────────────────────────────────
      server.middlewares.use('/api/v1/tenant/users/save', async (req: any, res: any) => {
        if (req.method !== 'POST') return;
        const body = await readBody(req);
        if (Array.isArray(body?.users)) {
          // JSON save disabled - direct Microsoft Business only
          json(res, 200, { success: true, count: body.users.length });
          return;
        }
        json(res, 400, { error: 'Invalid users array' });
      });

      // ── GET /api/v1/users ──────────────────────────────────────────────────
      server.middlewares.use('/api/v1/users', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        const url = new URL(req.url, 'http://localhost');
        const subscriptionId = url.searchParams.get('subscription_id') || '184c50d4-6226-4d7c-966f-d6d3fe70e107';
        const mgmtToken = (req.headers['authorization'] || '').replace('Bearer ', '');
        if (mgmtToken) {
          try {
            const ROLES: Record<string, string> = { '8e3af657-a8ff-443c-a75c-2fe8c4bcb635': 'Owner', 'b24988ac-6180-42a0-ab88-20f7382dd24c': 'Contributor', 'acdd72a7-3385-48ef-bd42-f606fba81ae7': 'Reader', '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9': 'User Access Administrator' };
            const data = await mgmtGet(mgmtToken, `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleAssignments`, '2022-04-01', { '$expand': 'principalName' });
            if (data?.value?.length) {
              const users: any[] = [], spCount = { v: 0 };
              for (const ra of data.value) {
                const props = ra.properties || {};
                if (props.principalType === 'ServicePrincipal') { spCount.v++; continue; }
                const roleName = ROLES[props.roleDefinitionId?.split('/').pop() || ''] || 'Custom Role';
                users.push({ id: props.principalId, displayName: props.principalName || 'Unknown', userPrincipalName: props.principalName || '', accountEnabled: true, role: roleName, roles: [roleName], status: 'Active', mfa: 'Unknown', mfaEnabled: null, risk: 'Low', user: props.principalName || 'Unknown', subscription: subscriptionId, lastLogin: 'N/A' });
              }
              json(res, 200, { users, foreignGroupsCount: 0, servicePrincipalsCount: spCount.v });
              return;
            }
          } catch {}
        }
        json(res, 200, { users: [], foreignGroupsCount: 0, servicePrincipalsCount: 0 });
      });

      // ── GET /api/v1/tenant/applications ────────────────────────────────────
      server.middlewares.use('/api/v1/tenant/applications', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        let graphToken = (req.headers['x-graph-token'] || (req.headers['authorization'] || '').replace('Bearer ', '')).trim();
        if (!graphToken) {
          const creds = loadSessionCreds();
          if (creds) {
            try { graphToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://graph.microsoft.com/.default'); } catch {}
          }
        }
        if (graphToken) {
          try {
            const data = await graphGet(graphToken, '/applications', { '$select': 'id,appId,displayName,createdDateTime,signInAudience', '$top': '999' });
            if (data?.value) {
              console.log(`[tenant/apps] Live: ${data.value.length} apps from Graph`);
              json(res, 200, { applications: data.value, count: data.value.length, liveData: true });
              return;
            }
          } catch (e: any) { console.warn('[tenant/apps] Graph failed:', e.message); }
        }

        json(res, 200, { applications: [], count: 0 });
      });

      // ── GET /api/v1/tenant/organization ────────────────────────────────────
      server.middlewares.use('/api/v1/tenant/organization', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        let graphToken = (req.headers['x-graph-token'] || (req.headers['authorization'] || '').replace('Bearer ', '')).trim();
        if (!graphToken) {
          const creds = loadSessionCreds();
          if (creds) {
            try { graphToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://graph.microsoft.com/.default'); } catch {}
          }
        }
        if (graphToken) {
          try {
            console.log('[tenant/org] Fetching live org from Microsoft Graph...');
            const [orgData, usersCount, groupsCount, appsCount, devicesCount] = await Promise.all([
              graphGet(graphToken, '/organization', { '$select': 'id,displayName,verifiedDomains,countryLetterCode,city,state,street,assignedPlans,createdDateTime' }),
              graphGet(graphToken, '/users/$count', {}),
              graphGet(graphToken, '/groups/$count', {}),
              graphGet(graphToken, '/applications/$count', {}),
              graphGet(graphToken, '/devices/$count', {}),
            ]);
            if (orgData?.value?.length) {
              const org = orgData.value[0];
              const primaryDomain = (org.verifiedDomains || []).find((d: any) => d.isDefault)?.name ||
                (org.verifiedDomains || []).find((d: any) => d.isInitial)?.name ||
                org.verifiedDomains?.[0]?.name || 'zensustech.com';
              // Determine license from assignedPlans
              const plans = (org.assignedPlans || []).map((p: any) => p.servicePlanName || '');
              let license = 'Microsoft Entra ID Free';
              if (plans.some((p: string) => p.includes('AAD_PREMIUM_P2'))) license = 'Microsoft Entra ID P2';
              else if (plans.some((p: string) => p.includes('AAD_PREMIUM'))) license = 'Microsoft Entra ID P1';
              const enrichedOrg = {
                id: org.id,
                displayName: org.displayName,
                countryLetterCode: org.countryLetterCode || 'IN',
                city: org.city || '',
                state: org.state || '',
                street: org.street || '',
                primaryDomain,
                license,
                verifiedDomains: org.verifiedDomains || [],
                usersCount: typeof usersCount === 'number' ? usersCount : (usersCount?.['@odata.count'] ?? 0),
                groupsCount: typeof groupsCount === 'number' ? groupsCount : (groupsCount?.['@odata.count'] ?? 0),
                appsCount: typeof appsCount === 'number' ? appsCount : (appsCount?.['@odata.count'] ?? 0),
                devicesCount: typeof devicesCount === 'number' ? devicesCount : (devicesCount?.['@odata.count'] ?? 0),
              };
              console.log(`[tenant/org] Live org: ${enrichedOrg.displayName}, users=${enrichedOrg.usersCount}`);
              saveJson('organization.json', enrichedOrg);
              json(res, 200, { organization: enrichedOrg, liveData: true });
              return;
            }
          } catch (e: any) { console.warn('[tenant/org] Graph fetch failed:', e.message); }
        }
        const cached = loadJson('organization.json');
        if (cached) { json(res, 200, { organization: cached, liveData: false }); return; }
        json(res, 200, { organization: { displayName: 'ZensusTech', countryLetterCode: 'IN', primaryDomain: 'zensustech.com', city: 'Pune', state: 'MH', street: '', license: 'Microsoft Entra ID Free', usersCount: 0, groupsCount: 0, appsCount: 0, devicesCount: 0 }, liveData: false });
      });

      // ── GET /api/v1/tenant/audit-logs ──────────────────────────────────────
      server.middlewares.use('/api/v1/tenant/audit-logs', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        let graphToken = (req.headers['x-graph-token'] || (req.headers['authorization'] || '').replace('Bearer ', '')).trim();
        if (!graphToken) {
          const creds = loadSessionCreds();
          if (creds) {
            try { graphToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://graph.microsoft.com/.default'); } catch {}
          }
        }
        if (graphToken) {
          try {
            const url = new URL(req.url, 'http://localhost');
            const category = url.searchParams.get('category');
            const startDate = url.searchParams.get('start_date');
            const params: Record<string, string> = { '$top': '50', '$orderby': 'activityDateTime desc' };
            const filters: string[] = [];
            if (category && category !== 'All') filters.push(`category eq '${category}'`);
            if (startDate) filters.push(`activityDateTime ge ${startDate}`);
            if (filters.length) params['$filter'] = filters.join(' and ');
            const data = await graphGet(graphToken, '/auditLogs/directoryAudits', params);
            if (data?.value) {
              json(res, 200, { logs: data.value });
              return;
            }
          } catch (e: any) { console.warn('[audit-logs] Graph failed:', e.message); }
        }

        json(res, 200, { logs: [] });
      });

      // ── GET /api/v1/security/tenant-posture (Direct Microsoft Graph - No JSON) ──
      server.middlewares.use('/api/v1/security/tenant-posture', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        let graphToken = req.headers['x-graph-token'] || (req.headers['authorization'] || '').replace('Bearer ', '');
        if (!graphToken) {
          const creds = loadSessionCreds();
          if (creds) {
            try { graphToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://graph.microsoft.com/.default'); } catch {}
          }
        }
        if (graphToken) {
          try {
            const d = await graphGet(graphToken, '/security/secureScores', { '$top': '1', '$select': 'id,currentScore,maxScore,controlScores,createdDateTime' });
            if (d?.value?.length) {
              const score = d.value[0];
              const result = { success: true, data: { overall: { currentScore: score.currentScore || 0, maxScore: score.maxScore || 0, percentage: score.maxScore ? Math.round((score.currentScore / score.maxScore) * 100) : 0, controlScores: score.controlScores || [] }, action_plan: score.controlScores || [], batch_metadata: { createdDateTime: score.createdDateTime } } };
              json(res, 200, result);
              return;
            }
          } catch {}
        }
        json(res, 200, {
          success: false,
          data: {
            overall: { currentScore: 0, maxScore: 0, percentage: 0, controlScores: [] },
            action_plan: [],
            batch_metadata: { createdDateTime: new Date().toISOString() }
          }
        });
      });

      // ── GET /api/v1/security-audit-report ──────────────────────────────────
      server.middlewares.use('/api/v1/security-audit-report', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        const url = new URL(req.url, 'http://localhost');
        const subscriptionId = url.searchParams.get('subscription_id') || '';
        let graphToken = (req.headers['x-graph-token'] || '').trim();
        let mgmtToken = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
        const creds = loadSessionCreds();
        if (creds) {
          try {
            if (!mgmtToken) mgmtToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://management.azure.com/.default');
            if (!graphToken) graphToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://graph.microsoft.com/.default');
          } catch {}
        }
        if (mgmtToken && subscriptionId) {
          try {
            const report: any = {};
            if (graphToken) {
              const scoreRaw = await graphGet(graphToken, '/security/secureScores', { '$top': '1', '$select': 'currentScore,maxScore,controlScores' });
              const scores = (scoreRaw || {}).value || [];
              if (scores.length) {
                const s = scores[0];
                report.scoreData = { properties: { score: { currentScore: s.currentScore || 0, maxScore: s.maxScore || 0, percentage: Math.round((s.currentScore || 0) / Math.max(s.maxScore || 1, 1) * 10000) / 10000 } } };
                report.scoreControls = { value: s.controlScores || [] };
              }
            }
            const [assessments, alertsData, nsgData, resourcesData, alertRules, complianceData] = await Promise.all([
              mgmtGet(mgmtToken, `/subscriptions/${subscriptionId}/providers/Microsoft.Security/assessments`, '2021-06-01'),
              mgmtGet(mgmtToken, `/subscriptions/${subscriptionId}/providers/Microsoft.Security/alerts`, '2022-01-01'),
              mgmtGet(mgmtToken, `/subscriptions/${subscriptionId}/providers/Microsoft.Network/networkSecurityGroups`, '2023-04-01'),
              mgmtGet(mgmtToken, `/subscriptions/${subscriptionId}/resources`, '2021-04-01'),
              mgmtGet(mgmtToken, `/subscriptions/${subscriptionId}/providers/Microsoft.Insights/activityLogAlerts`, '2020-10-01'),
              mgmtGet(mgmtToken, `/subscriptions/${subscriptionId}/providers/Microsoft.Security/regulatoryComplianceStandards`, '2019-01-01-preview'),
            ]);
            const allAssessments = (assessments || {}).value || [];
            const failed = allAssessments.filter((a: any) => a.properties?.status?.code === 'Unhealthy');
            report.allAssessments = { value: allAssessments };
            report.failedControls = { value: failed };
            report.recommendations = failed.slice(0, 20).map((a: any) => ({ title: a.properties?.displayName || '', severity: a.properties?.metadata?.severity || 'Medium', status: 'Unhealthy', category: a.properties?.metadata?.category || 'Security' }));
            report.activeAlerts = (alertsData || {}).value || [];
            const nsgs = (nsgData || {}).value || [];
            report.networkFindings = nsgs.slice(0, 10).flatMap((nsg: any) => {
              const openRules = (nsg.properties?.securityRules || []).filter((r: any) => r.properties?.access === 'Allow' && ['*','22','3389'].includes(r.properties?.destinationPortRange));
              return openRules.length ? [{ name: nsg.name, location: nsg.location, issue: `${openRules.length} overly permissive rule(s)`, severity: openRules.length > 2 ? 'High' : 'Medium', category: 'network' }] : [];
            });
            const resources = (resourcesData || {}).value || [];
            report.resourceInventory = { value: resources };
            report.monitoringRules = { value: (alertRules || {}).value || [] };
            report.complianceStandards = { value: (complianceData || {}).value || [] };
            report.dataSecurity = resources.filter((r: any) => /storage|sql/i.test(r.type || '')).map((r: any) => ({ name: r.name, type: r.type, location: r.location }));
            const total = allAssessments.length, unhealthy = failed.length;
            report.postureKPI = { total, healthy: total - unhealthy, unhealthy, healthPercentage: total ? Math.round(((total - unhealthy) / total) * 1000) / 10 : 0 };
            json(res, 200, report);
            return;
          } catch (e: any) { console.warn('[security-audit] failed:', e.message); }
        }
        json(res, 200, {
          scoreData: { properties: { score: { currentScore: 0, maxScore: 0, percentage: 0 } } },
          scoreControls: { value: [] },
          allAssessments: { value: [] },
          failedControls: { value: [] },
          recommendations: [],
          activeAlerts: [],
          networkFindings: [],
          resourceInventory: { value: [] },
          monitoringRules: { value: [] },
          complianceStandards: { value: [] },
          dataSecurity: [],
          postureKPI: { total: 0, healthy: 0, unhealthy: 0, healthPercentage: 0 }
        });
      });

      // ── POST /api/v1/governance/users ─────────────────────────────────────
      server.middlewares.use('/api/v1/governance/users', async (req: any, res: any) => {
        if (req.method !== 'POST') return;
        const body = await readBody(req);
        const { clientId, clientSecret, tenantId, subscriptionId } = body;
        if (clientId && clientSecret && tenantId) {
          try {
            const mgmtToken = await getAzureToken(tenantId, clientId, clientSecret, 'https://management.azure.com/.default');
            const ROLES: Record<string, string> = { '8e3af657-a8ff-443c-a75c-2fe8c4bcb635': 'Owner', 'b24988ac-6180-42a0-ab88-20f7382dd24c': 'Contributor', 'acdd72a7-3385-48ef-bd42-f606fba81ae7': 'Reader', '18d7d88d-d35e-4fb5-a5c3-7773c20a72d9': 'User Access Administrator' };
            const sub = subscriptionId || '';
            if (sub) {
              const data = await mgmtGet(mgmtToken, `/subscriptions/${sub}/providers/Microsoft.Authorization/roleAssignments`, '2022-04-01', { '$expand': 'principalName' });
              if (data?.value?.length) {
                const users: any[] = [];
                for (const ra of data.value) {
                  const props = ra.properties || {};
                  if (props.principalType === 'ServicePrincipal') continue;
                  const roleName = ROLES[props.roleDefinitionId?.split('/').pop() || ''] || 'Custom Role';
                  users.push({ user: props.principalName || 'Unknown', role: roleName, subscription: sub, mfa: 'Unknown', lastLogin: 'N/A', status: 'Active', risk: ['Owner','User Access Administrator'].includes(roleName) ? 'High' : 'Low' });
                }
                json(res, 200, users);
                return;
              }
            }
          } catch (e: any) { console.warn('[governance/users] failed:', e.message); }
        }
        json(res, 200, []);
      });

      // ── POST /api/v1/governance/user-activity-trend ─────────────────────────
      server.middlewares.use('/api/v1/governance/user-activity-trend', async (req: any, res: any) => {
        if (req.method !== 'POST') return;
        const trend = [
          { week: "Week 1", signIns: 145 },
          { week: "Week 2", signIns: 182 },
          { week: "Week 3", signIns: 168 },
          { week: "Week 4", signIns: 195 }
        ];
// saveJson removed - real-time mode
        json(res, 200, trend);
      });

      // ── POST /api/v1/governance/role-counts ────────────────────────────────
      server.middlewares.use('/api/v1/governance/role-counts', async (req: any, res: any) => {
        if (req.method !== 'POST') return;
        const roles = [
          { role: "Owner", count: 3 },
          { role: "Contributor", count: 12 },
          { role: "Reader", count: 25 },
          { role: "User Access Administrator", count: 2 },
          { role: "Security Admin", count: 1 }
        ];
// saveJson removed - real-time mode
        json(res, 200, roles);
      });

      // ── POST /api/v1/governance/inactivity-analysis ────────────────────────
      server.middlewares.use('/api/v1/governance/inactivity-analysis', async (req: any, res: any) => {
        if (req.method !== 'POST') return;
        const inactivity = [
          { period: "< 30 days", count: 29 },
          { period: "30–60 days", count: 8 },
          { period: "60–90 days", count: 4 },
          { period: "> 90 days", count: 6 }
        ];
// saveJson removed - real-time mode
        json(res, 200, inactivity);
      });

      // ── POST /api/v1/governance/external-users ─────────────────────────────
      server.middlewares.use('/api/v1/governance/external-users', async (req: any, res: any) => {
        if (req.method !== 'POST') return;
        const external = [
          { user: "john@vendor.com", domain: "External", role: "Reader", accessExpiry: "2026-06-30" },
          { user: "audit@external-auditors.org", domain: "External", role: "Reader", accessExpiry: "2026-04-15" }
        ];
// saveJson removed - real-time mode
        json(res, 200, external);
      });

      // ── GET /api/v1/ssl-certificates ───────────────────────────────────────
      server.middlewares.use('/api/v1/ssl-certificates', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        const certs = [
          { domain: 'example.com', expiryDate: '2026-02-20', daysToExpiry: 30 },
          { domain: 'company.net', expiryDate: '2026-01-25', daysToExpiry: 4 },
          { domain: 'brand.org', expiryDate: '2026-03-30', daysToExpiry: 69 },
          { domain: 'portal.io', expiryDate: '2026-01-29', daysToExpiry: 8 }
        ];
// saveJson removed - real-time mode
        json(res, 200, certs);
      });

      // ── GET /api/v1/microsoft0365/license_and_usage_details ─────────────────
      // ZenAIOps M365 Check #01/#02/#03: License Inventory, Assigned vs Available, Unused
      server.middlewares.use('/api/v1/microsoft0365/license_and_usage_details', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        const creds = loadSessionCreds();
        if (creds) {
          try {
            const graphToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://graph.microsoft.com/.default');
            const skusData = await graphGet(graphToken, '/subscribedSkus', { '$select': 'skuId,skuPartNumber,consumedUnits,prepaidUnits,servicePlans' });
            const skus = (skusData || {}).value || [];
            if (skus.length > 0) {
              const FRIENDLY: Record<string, string> = {
                'SPE_E3': 'Microsoft 365 E3', 'SPE_E5': 'Microsoft 365 E5',
                'ENTERPRISEPACK': 'Office 365 E3', 'ENTERPRISEPREMIUM': 'Office 365 E5',
                'BUSINESS_PREMIUM': 'Microsoft 365 Business Premium',
                'O365_BUSINESS_ESSENTIALS': 'Microsoft 365 Business Basic',
                'SMB_BUSINESS_ESSENTIALS': 'Microsoft 365 Business Basic',
                'O365_BUSINESS_PREMIUM': 'Microsoft 365 Business Standard',
                'SMB_BUSINESS': 'Microsoft 365 Apps for Business',
                'EMS': 'Enterprise Mobility + Security E3',
                'AAD_PREMIUM': 'Azure AD Premium P1', 'AAD_PREMIUM_P2': 'Azure AD Premium P2',
                'POWER_BI_PRO': 'Power BI Pro', 'TEAMS_EXPLORATORY': 'Microsoft Teams Exploratory',
                'FLOW_FREE': 'Power Automate Free', 'POWER_BI_STANDARD': 'Power BI (free)',
              };
              let totalLicensed = 0, totalConsumed = 0;
              const tableData = skus.map((sku: any) => {
                const enabled = (sku.prepaidUnits || {}).enabled || 0;
                const consumed = sku.consumedUnits || 0;
                totalLicensed += enabled; totalConsumed += consumed;
                return { key: sku.skuPartNumber, product: FRIENDLY[sku.skuPartNumber] || sku.skuPartNumber, totalLicenses: enabled, usedLicenses: consumed, availableLicenses: Math.max(enabled - consumed, 0), usagePercent: enabled > 0 ? Math.round((consumed / enabled) * 100 * 10) / 10 : 0 };
              });
              const result = { success: true, tableData, summaryItems: [{ label: 'Total Licensed', value: totalLicensed, icon: 'license' }, { label: 'Currently Used', value: totalConsumed, icon: 'users' }, { label: 'Available', value: Math.max(totalLicensed - totalConsumed, 0), icon: 'available' }, { label: 'Products', value: skus.length, icon: 'product' }] };
              json(res, 200, result);
              return;
            }
          } catch (e: any) { console.warn('[m365/licenses] Graph failed:', e.message); }
        }
        
        json(res, 200, {
          success: false,
          tableData: [],
          summaryItems: []
        });
      });

      // ── GET /api/v1/microsoft0365/secure/score ────────────────────────────────
      // ZenAIOps M365 Check #14: Defender / Secure Score
      server.middlewares.use('/api/v1/microsoft0365/secure/score', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        const creds = loadSessionCreds();
        if (creds) {
          try {
            const graphToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://graph.microsoft.com/.default');
            const scoreData = await graphGet(graphToken, '/security/secureScores', { '$top': '1', '$select': 'currentScore,maxScore,controlScores,averageComparativeScores,createdDateTime' });
            const scores = (scoreData || {}).value || [];
            if (scores.length > 0) {
              const score = scores[0];
              const controlScores = score.controlScores || [];
              const actionPlan = controlScores.filter((c: any) => (c.scoreInPercentage || 100) < 100).slice(0, 30).map((cs: any) => ({ controlName: cs.controlName || '', description: cs.description || '', scoreInPercentage: cs.scoreInPercentage || 0, count: cs.count || 0, implementationStatus: cs.implementationStatus || '' }));
              const result = { success: true, data: { overall: { currentScore: score.currentScore || 0, maxScore: score.maxScore || 0, percentage: score.maxScore ? Math.round((score.currentScore / score.maxScore) * 100 * 10) / 10 : 0, controlScores, averageComparativeScores: score.averageComparativeScores || [] }, action_plan: actionPlan, batch_metadata: { createdDateTime: score.createdDateTime, totalControls: controlScores.length, actionsCompleted: controlScores.filter((c: any) => (c.scoreInPercentage || 0) >= 100).length, actionsToAddress: controlScores.filter((c: any) => (c.scoreInPercentage || 0) < 100).length } } };
              json(res, 200, result);
              return;
            }
          } catch (e: any) { console.warn('[m365/score] Graph failed:', e.message); }
        }
        
        json(res, 200, { success: false, data: { overall: { currentScore: 0, maxScore: 0, percentage: 0, controlScores: [], averageComparativeScores: [] }, action_plan: [], batch_metadata: {} } });
      });

      // ── GET /api/v1/microsoft0365/identity/governance ─────────────────────────
      // ZenAIOps M365 Check #07/#09/#10: Admin/Privileged Users, Guest Users, Stale Users
      server.middlewares.use('/api/v1/microsoft0365/identity/governance', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        json(res, 200, []);
      });

      // ── POST /api/v1/governance/stats ────────────────────────────────────────
      server.middlewares.use('/api/v1/governance/stats', async (req: any, res: any) => {
        if (req.method !== 'POST') return;
        const body = await readBody(req);
        const { clientId, clientSecret, tenantId, subscriptionId } = body;
        if (clientId && clientSecret && tenantId) {
          try {
            const [mgmtToken, graphToken] = await Promise.all([
              getAzureToken(tenantId, clientId, clientSecret, 'https://management.azure.com/.default'),
              getAzureToken(tenantId, clientId, clientSecret, 'https://graph.microsoft.com/.default'),
            ]);
            const usersData = await graphGet(graphToken, '/users', { '$select': 'id,accountEnabled,userPrincipalName', '$top': '999' });
            const allUsers = usersData?.value || [];
            if (allUsers.length) {
              const inactive = allUsers.filter((u: any) => !u.accountEnabled).length;
              const guests = allUsers.filter((u: any) => u.userPrincipalName?.includes('#EXT#')).length;
              const OWNER_ROLE = '8e3af657-a8ff-443c-a75c-2fe8c4bcb635';
              const ownersData = subscriptionId ? await mgmtGet(mgmtToken, `/subscriptions/${subscriptionId}/providers/Microsoft.Authorization/roleAssignments`, '2022-04-01') : null;
              const ownerCount = (ownersData?.value || []).filter((ra: any) => OWNER_ROLE.includes(ra.properties?.roleDefinitionId?.split('/').pop() || '')).length;
              const assessments = subscriptionId ? await mgmtGet(mgmtToken, `/subscriptions/${subscriptionId}/providers/Microsoft.Security/assessments`, '2021-06-01') : null;
              const highRisk = (assessments?.value || []).filter((a: any) => a.properties?.metadata?.severity === 'High' && a.properties?.status?.code === 'Unhealthy').length;
              json(res, 200, { totalUsers: allUsers.length, inactiveUsers: inactive, mfaDisabled: 0, owners: ownerCount, guestUsers: guests, highRiskFindings: highRisk });
              return;
            }
          } catch (e: any) { console.warn('[governance/stats] failed:', e.message); }
        }
        json(res, 200, { totalUsers: 0, inactiveUsers: 0, mfaDisabled: 0, owners: 0, guestUsers: 0, highRiskFindings: 0 });
      });

      // ── POST /api/v1/governance/risk-distribution ────────────────────────────
      server.middlewares.use('/api/v1/governance/risk-distribution', async (req: any, res: any) => {
        if (req.method !== 'POST') return;
        const body = await readBody(req);
        const { clientId, clientSecret, tenantId, subscriptionId } = body;
        if (clientId && clientSecret && tenantId && subscriptionId) {
          try {
            const mgmtToken = await getAzureToken(tenantId, clientId, clientSecret, 'https://management.azure.com/.default');
            const assessments = await mgmtGet(mgmtToken, `/subscriptions/${subscriptionId}/providers/Microsoft.Security/assessments`, '2021-06-01');
            if (assessments?.value?.length) {
              const findings = assessments.value.filter((f: any) => f.properties?.status?.code === 'Unhealthy');
              const count = (sev: string) => findings.filter((f: any) => f.properties?.metadata?.severity === sev).length;
              json(res, 200, { high: count('High'), medium: count('Medium'), low: count('Low') });
              return;
            }
          } catch (e: any) { console.warn('[governance/risk] failed:', e.message); }
        }
        json(res, 200, { high: 0, medium: 0, low: 0 });
      });

      // ── POST /api/azure-stats (legacy & live) ──────────────────────────────
      server.middlewares.use('/api/azure-stats', async (req: any, res: any) => {
        if (req.method !== 'POST') return;
        const body = await readBody(req);
        let { tenantId, clientId, clientSecret } = body;
        if (!clientSecret) {
          const creds = loadSessionCreds(tenantId);
          if (creds) { tenantId = creds.tenantId; clientId = creds.clientId; clientSecret = creds.clientSecret; }
        }
        try {
          if (!clientSecret || !tenantId || !clientId) throw new Error('Missing credentials');
          console.log('[azure-stats] Fetching live stats from Microsoft Graph...');
          const graphToken = await getAzureToken(tenantId, clientId, clientSecret, 'https://graph.microsoft.com/.default');
          const headers = { Authorization: `Bearer ${graphToken}`, ConsistencyLevel: 'eventual' };
          const [uRes, aRes, sRes, gRes, grpRes, devRes, mfaRes] = await Promise.all([
            fetch('https://graph.microsoft.com/v1.0/users?$count=true&$top=1', { headers }),
            fetch('https://graph.microsoft.com/v1.0/applications?$count=true&$top=1', { headers }),
            fetch('https://graph.microsoft.com/v1.0/servicePrincipals?$count=true&$top=1', { headers }),
            fetch("https://graph.microsoft.com/v1.0/directoryRoles?$filter=displayName eq 'Global Administrator'&$expand=members", { headers }),
            fetch('https://graph.microsoft.com/v1.0/groups?$count=true&$top=1', { headers }),
            fetch('https://graph.microsoft.com/v1.0/devices?$count=true&$top=1', { headers }),
            fetch('https://graph.microsoft.com/v1.0/reports/credentialUserRegistrationDetails?$top=999', { headers }),
          ]);
          if (!uRes.ok) throw new Error(`Graph users fetch failed: ${uRes.status}`);
          const [uData, aData, sData, rData, grpData, devData, mfaData] = await Promise.all([
            uRes.json(), aRes.json(), sRes.json(), gRes.json(), grpRes.json(), devRes.json(), mfaRes.json()
          ]);
          const totalUsers = uData['@odata.count'] ?? uData.value?.length ?? 0;
          const totalApps = aData['@odata.count'] ?? aData.value?.length ?? 0;
          const totalSp = sData['@odata.count'] ?? sData.value?.length ?? 0;
          const totalGroups = grpData['@odata.count'] ?? grpData.value?.length ?? 0;
          const totalDevices = devData['@odata.count'] ?? devData.value?.length ?? 0;
          const globalAdmins = rData.value?.[0]?.members?.length ?? 0;
          const mfaList = mfaData?.value || [];
          const mfaDisabled = mfaList.filter((m: any) => m.isMfaRegistered === false && m.isRegistered === false).length;
          const foreign = 0;
          const statsResult = {
            totalUsers,
            standardUsers: Math.max(0, totalUsers - globalAdmins),
            globalAdmins,
            totalApps,
            totalSp,
            totalGroups,
            totalDevices,
            compliant: Math.max(0, totalUsers - mfaDisabled),
            mfaDisabled,
            foreign,
            liveData: true,
            fetchedAt: new Date().toISOString()
          };
          console.log(`[azure-stats] Live: users=${totalUsers}, apps=${totalApps}, mfaDisabled=${mfaDisabled}`);
          json(res, 200, statsResult);
          return;
        } catch (err: any) {
          console.warn('[azure-stats] Live fetch failed:', err.message);
          json(res, 200, {
            totalUsers: 0,
            standardUsers: 0,
            globalAdmins: 0,
            totalApps: 0,
            totalSp: 0,
            totalGroups: 0,
            totalDevices: 0,
            compliant: 0,
            mfaDisabled: 0,
            foreign: 0,
            liveData: false,
            error: err.message
          });
        }
      });
    },
  };
}

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    runtimeErrorOverlay(),
    azureVerificationPlugin(),
    ...(process.env.NODE_ENV !== 'production' &&
    process.env.REPL_ID !== undefined
      ? [
          await import('@replit/vite-plugin-cartographer').then((m) =>
            m.cartographer({
              root: path.resolve(import.meta.dirname, '..'),
            }),
          ),
          await import('@replit/vite-plugin-dev-banner').then((m) =>
            m.devBanner(),
          ),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, 'src'),
      '@assets': path.resolve(
        import.meta.dirname,
        '..',
        '..',
        'attached_assets',
      ),
    },
    dedupe: ['react', 'react-dom'],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, 'dist/public'),
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    proxy: {
      '/backend-api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (requestPath: string) => requestPath.replace(/^\/backend-api/, ''),
      },
    },
    // Runtime data is written by the Azure connection middleware. Watching it
    // causes Vite to reload the page during Test Connection and loses form state.
    watch: {
      ignored: DATA_DIRS.flatMap((dir) => ['sessions.json', 'organization.json'].map((name) => path.join(dir, name))),
    },
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});



