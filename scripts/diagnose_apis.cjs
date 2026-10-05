const fs = require('fs');
const sessions = JSON.parse(fs.readFileSync('d:/ZensusTech-Login/data/sessions.json', 'utf8'));
const tid = Object.keys(sessions)[0];
const s = sessions[tid];

async function run() {
  const tokenUrl = `https://login.microsoftonline.com/${s.tenant_id}/oauth2/v2.0/token`;

  async function getToken(scope) {
    const params = new URLSearchParams({ client_id: s.client_id, client_secret: s.client_secret, grant_type: 'client_credentials', scope });
    const r = await fetch(tokenUrl, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: params.toString() });
    const d = await r.json();
    return d.access_token || null;
  }

  const [graphToken, mgmtToken] = await Promise.all([
    getToken('https://graph.microsoft.com/.default'),
    getToken('https://management.azure.com/.default'),
  ]);

  console.log('Graph token:', !!graphToken);
  console.log('Mgmt token:', !!mgmtToken);

  const graphHeaders = { Authorization: `Bearer ${graphToken}`, ConsistencyLevel: 'eventual', 'Content-Type': 'application/json' };

  const graphPaths = [
    ['GET /organization', 'https://graph.microsoft.com/v1.0/organization?$select=id,displayName,verifiedDomains'],
    ['GET /users/$count', 'https://graph.microsoft.com/v1.0/users/$count'],
    ['GET /groups/$count', 'https://graph.microsoft.com/v1.0/groups/$count'],
    ['GET /devices/$count', 'https://graph.microsoft.com/v1.0/devices/$count'],
    ['GET /applications/$count', 'https://graph.microsoft.com/v1.0/applications/$count'],
    ['GET /subscribedSkus', 'https://graph.microsoft.com/v1.0/subscribedSkus?$select=skuPartNumber,consumedUnits,prepaidUnits'],
    ['GET /security/secureScores', 'https://graph.microsoft.com/v1.0/security/secureScores?$top=1'],
    ['GET /reports/credentialUserRegistrationDetails', 'https://graph.microsoft.com/v1.0/reports/credentialUserRegistrationDetails?$top=1'],
    ['GET /directoryRoles', 'https://graph.microsoft.com/v1.0/directoryRoles'],
    ['GET /auditLogs/directoryAudits', 'https://graph.microsoft.com/v1.0/auditLogs/directoryAudits?$top=1'],
    ['GET /identityGovernance/accessReviews/definitions', 'https://graph.microsoft.com/v1.0/identityGovernance/accessReviews/definitions?$top=1'],
  ];

  for (const [label, url] of graphPaths) {
    const r = await fetch(url, { headers: graphHeaders });
    const data = await r.json();
    if (r.ok) {
      const count = data['@odata.count'] ?? data.value?.length ?? (typeof data === 'number' ? data : 'ok');
      console.log(`✓ ${label} -> ${r.status} | result: ${count}`);
    } else {
      console.log(`✗ ${label} -> ${r.status} | ${data?.error?.code}: ${data?.error?.message?.slice(0, 100)}`);
    }
  }

  // Mgmt API
  const subsR = await fetch('https://management.azure.com/subscriptions?api-version=2022-12-01', { headers: { Authorization: `Bearer ${mgmtToken}` } });
  const subsD = await subsR.json();
  console.log(`\nMgmt /subscriptions -> ${subsR.status} | count: ${subsD?.value?.length ?? 'n/a'}`);
  if (subsD?.value?.length) {
    subsD.value.forEach(sub => console.log(`  sub: ${sub.displayName} | ${sub.subscriptionId}`));

    // Test RBAC for first subscription
    const subId = subsD.value[0].subscriptionId;
    const rbacR = await fetch(`https://management.azure.com/subscriptions/${subId}/providers/Microsoft.Authorization/roleAssignments?api-version=2022-04-01`, { headers: { Authorization: `Bearer ${mgmtToken}` } });
    const rbacD = await rbacR.json();
    console.log(`Mgmt /roleAssignments (sub ${subId.slice(0,8)}) -> ${rbacR.status} | count: ${rbacD?.value?.length ?? 'n/a'}`);
  }
}

run().catch(e => console.error(e));
