const fs = require('fs');

const filePath = 'd:/ZensusTech-Login/artifacts/zensus-tech-login/vite.config.ts';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Clean subscriptions middleware (lines ~200-240)
const oldSubBlock = `      // ── GET /api/v1/subscriptions ─────────────────────────────────────────
      server.middlewares.use('/api/v1/subscriptions', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        const url = new URL(req.url, 'http://localhost');
        const metaMatch = url.pathname.match(/\\/api\\/v1\\/subscriptions\\/([^/]+)\\/metadata/);
        if (metaMatch) {
          const subId = metaMatch[1];
          const mgmtToken = (req.headers['authorization'] || '').replace('Bearer ', '');
          if (mgmtToken) {
            try {
              const data = await mgmtGet(mgmtToken, \`/subscriptions/\${subId}\`);
              if (data) { json(res, 200, data); return; }
            } catch {}
          }
          const cached = loadJson(\`sub_\${subId}_meta.json\`) || { id: \`/subscriptions/\${subId}\`, subscriptionId: subId, displayName: 'Production Cloud Workloads', state: 'Enabled' };
          saveJson(\`sub_\${subId}_meta.json\`, cached);
          json(res, 200, cached);
          return;
        }
        const mgmtToken = (req.headers['authorization'] || '').replace('Bearer ', '');
        if (mgmtToken) {
          try {
            const data = await mgmtGet(mgmtToken, '/subscriptions');
            if (data?.value?.length) {
              saveJson('subscriptions.json', data);
              json(res, 200, data);
              return;
            }
          } catch {}
        }
        const cached = loadJson('subscriptions.json');
        if (cached) { json(res, 200, cached); return; }
        const fallbackSubs = {
          value: [
            { id: '/subscriptions/184c50d4-6226-4d7c-966f-d6d3fe70e107', subscriptionId: '184c50d4-6226-4d7c-966f-d6d3fe70e107', displayName: 'Prod-ERP-Azure-UK', state: 'Enabled', subscriptionPolicies: { locationPlacementId: 'Public_2014-09-01', quotaId: 'PayAsYouGo_2014-09-01', spendingLimit: 'Off' } },
            { id: '/subscriptions/9a32c10b-5421-4f92-b430-8a9d1234abcd', subscriptionId: '9a32c10b-5421-4f92-b430-8a9d1234abcd', displayName: 'NonProd-Apps-India', state: 'Enabled', subscriptionPolicies: { locationPlacementId: 'Public_2014-09-01', quotaId: 'PayAsYouGo_2014-09-01', spendingLimit: 'Off' } }
          ]
        };
        saveJson('subscriptions.json', fallbackSubs);
        json(res, 200, fallbackSubs);
      });`;

const newSubBlock = `      // ── GET /api/v1/subscriptions (Direct from Azure ARM - No JSON) ─────────
      server.middlewares.use('/api/v1/subscriptions', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        const url = new URL(req.url, 'http://localhost');
        let mgmtToken = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
        const creds = loadSessionCreds();
        if (!mgmtToken && creds) {
          try { mgmtToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://management.azure.com/.default'); } catch {}
        }
        const metaMatch = url.pathname.match(/\\/api\\/v1\\/subscriptions\\/([^/]+)\\/metadata/);
        if (metaMatch) {
          const subId = metaMatch[1];
          if (mgmtToken) {
            try {
              const data = await mgmtGet(mgmtToken, \`/subscriptions/\${subId}\`);
              if (data) { json(res, 200, data); return; }
            } catch {}
          }
          json(res, 200, { id: \`/subscriptions/\${subId}\`, subscriptionId: subId, displayName: 'Azure Subscription', state: 'Enabled' });
          return;
        }
        if (mgmtToken) {
          try {
            const data = await mgmtGet(mgmtToken, '/subscriptions', { 'api-version': '2022-12-01' });
            if (data?.value) { json(res, 200, data); return; }
          } catch {}
        }
        json(res, 200, { value: [], count: { type: 'Total', value: 0 } });
      });`;

if (code.includes(oldSubBlock)) {
  code = code.replace(oldSubBlock, newSubBlock);
  console.log('Replaced subscriptions block successfully');
} else {
  console.log('Subscriptions block signature mismatch, using regex');
  const subRegex = /\/\/\s*──\s*GET \/api\/v1\/subscriptions[\s\S]*?server\.middlewares\.use\('\/api\/v1\/tenant\/users'/;
  code = code.replace(subRegex, newSubBlock + "\n\n      server.middlewares.use('/api/v1/tenant/users'");
}

// 2. Clean TIER 3 in /api/v1/tenant/users so it NEVER loads tenant_users.json
const oldTier3Block = `        // TIER 3: Real Microsoft 365 & Entra ID User Directory
        const savedUsers = loadJson('tenant_users.json');
        if (Array.isArray(savedUsers) && savedUsers.length > 0) {
          console.log('[tenant/users] TIER 3: Serving ' + savedUsers.length + ' saved real users');
          json(res, 200, { users: savedUsers, liveData: false, source: 'saved', count: savedUsers.length, error: graphError || 'Live Graph API requires Admin Consent for User.Read.All in Azure Portal.' });
          return;
        }
        json(res, 200, { users: [], liveData: false, source: 'none', count: 0, error: graphError || 'No user data available. Please grant admin consent in Azure Portal.' });`;

const newTier3Block = `        // TIER 3: Direct from Microsoft Business - No JSON fallback
        console.log('[tenant/users] Microsoft Graph query ended. Live users:', 0, 'Error:', graphError || 'None');
        json(res, 200, {
          users: [],
          liveData: false,
          source: 'microsoft-business',
          count: 0,
          error: graphError || 'Microsoft Graph API 403: Application Permissions (User.Read.All) need Admin Consent in Microsoft Entra ID.'
        });`;

if (code.includes(oldTier3Block)) {
  code = code.replace(oldTier3Block, newTier3Block);
  console.log('Replaced TIER 3 block successfully');
} else {
  console.log('TIER 3 string mismatch, using regex');
  code = code.replace(/\/\/ TIER 3: Real Microsoft 365[\s\S]*?json\(res, 200, \{ users: \[\], liveData: false[\s\S]*?\}\);/, newTier3Block);
}

// 3. Remove saveJson('tenant_users.json', body.users)
code = code.replace(/saveJson\('tenant_users\.json', body\.users\);/g, `// JSON save disabled - direct Microsoft Business only`);

// 4. Clean tenant_posture fallback
const postureRegex = /\/\/\s*──\s*GET \/api\/v1\/security\/tenant-posture[\s\S]*?\/\/ ── GET \/api\/v1\/security-audit-report/;
const newPostureBlock = `// ── GET /api/v1/security/tenant-posture (Direct Microsoft Graph - No JSON) ──
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
      });\n\n      // ── GET /api/v1/security-audit-report`;

code = code.replace(postureRegex, newPostureBlock);

// 5. Clean security-audit-report fallback (remove fallbackReport and saveJson)
const secReportRegex = /const fallbackReport = \{[\s\S]*?saveJson\('security_audit_report\.json', fallbackReport\);[\s\S]*?json\(res, 200, fallbackReport\);/;
const cleanSecReportFallback = `json(res, 200, {
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
        });`;

code = code.replace(secReportRegex, cleanSecReportFallback);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Cleaned vite.config.ts completely of all JSON fallbacks!');
