const fs = require('fs');
const path = require('path');

const filePath = 'd:/ZensusTech-Login/artifacts/zensus-tech-login/vite.config.ts';
let code = fs.readFileSync(filePath, 'utf8');

// 1. Clean up fallbackReport and saveJson in /api/v1/security-audit-report
const oldSecReportFallback = `        const fallbackReport = {
          scoreData: { properties: { score: { currentScore: 68, maxScore: 100, percentage: 0.68 } } },
          scoreControls: { value: [] },
          allAssessments: { value: [] },
          failedControls: { value: [{ properties: { displayName: 'MFA Disabled on Administrative Accounts', metadata: { severity: 'High', category: 'Identity' } } }] },
          recommendations: [
            { title: 'Enable MFA for all users', severity: 'High', status: 'Unhealthy', category: 'Identity' },
            { title: 'Restrict inbound SSH/RDP access on Network Security Groups', severity: 'High', status: 'Unhealthy', category: 'Network' },
            { title: 'Enable Azure Backup on production VMs', severity: 'Medium', status: 'Healthy', category: 'Storage' }
          ],
          activeAlerts: [],
          networkFindings: [{ name: 'nsg-prod-erp', location: 'westeurope', issue: 'Port 22 SSH open to internet', severity: 'High', category: 'network' }],
          resourceInventory: { value: [] },
          monitoringRules: { value: [] },
          complianceStandards: { value: [] },
          dataSecurity: [{ name: 'stproderpdata', type: 'Microsoft.Storage/storageAccounts', location: 'westeurope' }],
          postureKPI: { total: 45, healthy: 36, unhealthy: 9, healthPercentage: 80 }
        };
        saveJson('security_audit_report.json', fallbackReport);
        json(res, 200, fallbackReport);`;

const newSecReportFallback = `        json(res, 200, {
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

code = code.replace(oldSecReportFallback, newSecReportFallback);

// 2. Remove saveJson from governance trends/roles/certs
code = code.replace(`        saveJson('user_activity_trend.json', trend);`, `// saveJson removed - real-time mode`);
code = code.replace(`        saveJson('role_counts.json', roles);`, `// saveJson removed - real-time mode`);
code = code.replace(`        saveJson('inactivity_analysis.json', inactivity);`, `// saveJson removed - real-time mode`);
code = code.replace(`        saveJson('external_users.json', external);`, `// saveJson removed - real-time mode`);
code = code.replace(`        saveJson('ssl_certificates.json', certs);`, `// saveJson removed - real-time mode`);

// 3. Remove saveJson & loadJson from applications, organization, audit-logs, tenant-posture
code = code.replace(`              saveJson('applications.json', data.value);\n              json(res, 200, { applications: data.value, count: data.value.length });\n              return;`,
`              json(res, 200, { applications: data.value, count: data.value.length, liveData: true });\n              return;`);
code = code.replace(`        const cached = loadJson('applications.json');\n        if (cached) { json(res, 200, { applications: cached, count: cached.length }); return; }`, ``);

code = code.replace(`              saveJson('organization.json', enrichedOrg);\n              json(res, 200, { organization: enrichedOrg, liveData: true });\n              return;`,
`              json(res, 200, { organization: enrichedOrg, liveData: true });\n              return;`);
code = code.replace(`        const cached = loadJson('organization.json');\n        if (cached) { json(res, 200, { organization: cached, liveData: false }); return; }\n        json(res, 200, { organization: { displayName: 'ZensusTech', countryLetterCode: 'IN', primaryDomain: 'zensustech.com', city: 'Pune', state: 'MH', street: '', license: 'Microsoft Entra ID Free', usersCount: 0, groupsCount: 0, appsCount: 0, devicesCount: 0 }, liveData: false });`,
`        json(res, 200, { organization: { displayName: 'Microsoft 365 Organization', countryLetterCode: 'IN', primaryDomain: 'zensustech.com', city: 'Pune', state: 'MH', street: '', license: 'Microsoft 365 Business Basic', usersCount: 0, groupsCount: 0, appsCount: 0, devicesCount: 0 }, liveData: false });`);

code = code.replace(`              saveJson('audit_logs.json', data.value);\n              json(res, 200, { logs: data.value });\n              return;`,
`              json(res, 200, { logs: data.value });\n              return;`);
code = code.replace(`        const cached = loadJson('audit_logs.json');\n        if (cached) { json(res, 200, { logs: cached }); return; }`, ``);

// 4. In tenant-posture: remove fake 68 score fallback
const oldPosture = `        const cached = loadJson('tenant_posture.json');
        if (cached) { json(res, 200, cached); return; }
        const fallbackPosture = {
          success: true,
          data: {
            overall: { currentScore: 68, maxScore: 100, percentage: 68, controlScores: [] },
            action_plan: [
              { controlName: "Enable MFA for all admin accounts", description: "Protects privileged accounts against brute-force and credential stuffing.", scoreInPercentage: 70, count: 4, implementationStatus: "In Progress" },
              { controlName: "Require phishing-resistant MFA", description: "Use FIDO2 security keys or Windows Hello for Business.", scoreInPercentage: 45, count: 12, implementationStatus: "Planned" }
            ],
            batch_metadata: { createdDateTime: new Date().toISOString() }
          }
        };
        saveJson('tenant_posture.json', fallbackPosture);
        json(res, 200, fallbackPosture);`;

const newPosture = `        json(res, 200, {
          success: false,
          data: {
            overall: { currentScore: 0, maxScore: 0, percentage: 0, controlScores: [] },
            action_plan: [],
            batch_metadata: { createdDateTime: new Date().toISOString() }
          }
        });`;

code = code.replace(oldPosture, newPosture);
code = code.replace(`              saveJson('tenant_posture.json', result);\n              json(res, 200, result);`, `              json(res, 200, result);`);

// 5. Add /api/v1/subscriptions endpoint
const subEndpoint = `      // ── GET /api/v1/subscriptions ──────────────────────────────────────────
      server.middlewares.use('/api/v1/subscriptions', async (req: any, res: any) => {
        if (req.method !== 'GET') return;
        const url = new URL(req.url, 'http://localhost');
        const creds = loadSessionCreds();
        let mgmtToken = (req.headers['authorization'] || '').replace('Bearer ', '').trim();
        if (!mgmtToken && creds) {
          try { mgmtToken = await getAzureToken(creds.tenantId, creds.clientId, creds.clientSecret, 'https://management.azure.com/.default'); } catch {}
        }
        if (mgmtToken) {
          try {
            const data = await mgmtGet(mgmtToken, '/subscriptions', { 'api-version': '2022-12-01' });
            if (data?.value) {
              json(res, 200, data);
              return;
            }
          } catch (e: any) { console.warn('[subscriptions] failed:', e.message); }
        }
        json(res, 200, { value: [], count: { type: 'Total', value: 0 } });
      });\n\n`;

if (!code.includes("'/api/v1/subscriptions'")) {
  code = code.replace("      // ── GET /api/v1/users ──────────────────────────────────────────────────", subEndpoint + "      // ── GET /api/v1/users ──────────────────────────────────────────────────");
}

// 6. Update /api/v1/tenant/users to check saved users as fallback if Graph 403
const oldTier3 = `        // TIER 3: Real Microsoft 365 & Entra ID User Directory
        json(res, 200, { users: [], liveData: false, source: 'none', error: 'No user data available' });`;

const newTier3 = `        // TIER 3: Real Microsoft 365 & Entra ID User Directory
        const savedUsers = loadJson('tenant_users.json');
        if (Array.isArray(savedUsers) && savedUsers.length > 0) {
          console.log('[tenant/users] TIER 3: Serving ' + savedUsers.length + ' saved real users');
          json(res, 200, { users: savedUsers, liveData: false, source: 'saved', count: savedUsers.length, error: graphError || 'Live Graph API requires Admin Consent for User.Read.All in Azure Portal.' });
          return;
        }
        json(res, 200, { users: [], liveData: false, source: 'none', count: 0, error: graphError || 'No user data available. Please grant admin consent in Azure Portal.' });`;

code = code.replace(oldTier3, newTier3);

fs.writeFileSync(filePath, code, 'utf8');
console.log('Successfully updated vite.config.ts!');
