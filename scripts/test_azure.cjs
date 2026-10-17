const fs = require('fs');

const path = require('path');

async function testAll() {
  try {
    const credsPath = path.resolve(__dirname, '../data/sessions.json');
    const creds = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
    const session = Object.values(creds)[0];
    const { tenant_id, client_id, client_secret } = session;
    console.log('Testing with tenant:', tenant_id, 'client:', client_id);

    const params = new URLSearchParams({
      client_id,
      client_secret,
      grant_type: 'client_credentials',
      scope: 'https://graph.microsoft.com/.default'
    });
    const tRes = await fetch(`https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params
    });
    const tData = await tRes.json();
    console.log('Graph Token status:', tRes.status);
    const token = tData.access_token;
    if (!token) {
      console.log('Failed to get token:', tData);
      return;
    }

    const endpoints = [
      '/organization',
      '/subscribedSkus',
      '/applications',
      '/servicePrincipals',
      '/groups',
      '/directoryRoles?$expand=members',
      '/devices',
      '/reports/credentialUserRegistrationDetails?$top=999',
      '/security/secureScores?$top=1',
      '/identityGovernance/accessReviews/definitions',
      '/auditLogs/directoryAudits?$top=10',
      '/users?$top=5',
      '/users?$count=true',
      '/users'
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch('https://graph.microsoft.com/v1.0' + ep, {
          headers: { Authorization: 'Bearer ' + token, ConsistencyLevel: 'eventual' }
        });
        const text = await res.text();
        let parsed;
        try { parsed = JSON.parse(text); } catch {}
        if (parsed?.value) {
          console.log(`[${res.status}] ${ep} -> value.length: ${parsed.value.length}`);
          if (ep.includes('/subscribedSkus')) {
            console.log('Skus:', JSON.stringify(parsed.value.map(s => ({ sku: s.skuPartNumber, prepaid: s.prepaidUnits, consumed: s.consumedUnits }))));
          }
          if (ep.includes('/organization')) {
            console.log('Org:', parsed.value[0]?.displayName, parsed.value[0]?.verifiedDomains?.map(d => d.name));
          }
          if (ep.includes('/directoryRoles')) {
            console.log('Roles:', JSON.stringify(parsed.value.map(r => ({ name: r.displayName, members: r.members?.length }))));
          }
          if (ep.includes('/users')) {
            console.log('Users sample:', JSON.stringify(parsed.value.map(u => ({ name: u.displayName, upn: u.userPrincipalName }))));
          }
        } else if (parsed?.error) {
          console.log(`[${res.status}] ${ep} -> Error: ${parsed.error.code}: ${parsed.error.message}`);
        } else {
          console.log(`[${res.status}] ${ep} -> ${text.substring(0, 100)}`);
        }
      } catch (err) {
        console.log(`ERR on ${ep}:`, err.message);
      }
    }

    // Azure Management API
    const mParams = new URLSearchParams({
      client_id,
      client_secret,
      grant_type: 'client_credentials',
      scope: 'https://management.azure.com/.default'
    });
    const mtRes = await fetch(`https://login.microsoftonline.com/${tenant_id}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: mParams
    });
    const mtData = await mtRes.json();
    console.log('Mgmt Token status:', mtRes.status);
    if (mtData.access_token) {
      const mh = { Authorization: 'Bearer ' + mtData.access_token };
      const sRes = await fetch('https://management.azure.com/subscriptions?api-version=2022-12-01', { headers: mh });
      const sJson = await sRes.json();
      console.log('Subscriptions:', sRes.status, JSON.stringify(sJson));
    }
  } catch (e) {
    console.error('Fatal test error:', e);
  }
}

testAll();
