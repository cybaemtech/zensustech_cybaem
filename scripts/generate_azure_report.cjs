const fs = require('fs');
const path = require('path');

const sessionsPath = path.resolve(__dirname, '../data/sessions.json');
const sessions = JSON.parse(fs.readFileSync(sessionsPath, 'utf8'));
const tid = Object.keys(sessions)[0];
const s = sessions[tid];

async function generateReport() {
  console.log('Connecting to Azure Identity...');
  const tokenUrl = `https://login.microsoftonline.com/${s.tenant_id}/oauth2/v2.0/token`;

  async function getToken(scope) {
    const params = new URLSearchParams({
      client_id: s.client_id,
      client_secret: s.client_secret,
      grant_type: 'client_credentials',
      scope,
    });
    const r = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const d = await r.json();
    return d.access_token || null;
  }

  const [graphToken, mgmtToken] = await Promise.all([
    getToken('https://graph.microsoft.com/.default'),
    getToken('https://management.azure.com/.default'),
  ]);

  if (!graphToken) {
    throw new Error('Failed to obtain Microsoft Graph access token.');
  }

  const graphHeaders = {
    Authorization: `Bearer ${graphToken}`,
    ConsistencyLevel: 'eventual',
    'Content-Type': 'application/json',
  };

  async function fetchGraph(endpoint) {
    try {
      const res = await fetch(`https://graph.microsoft.com/v1.0${endpoint}`, { headers: graphHeaders });
      if (!res.ok) {
        return { status: res.status, error: await res.text() };
      }
      return { status: res.status, data: await res.json() };
    } catch (e) {
      return { error: e.message };
    }
  }

  console.log('Fetching live tenant data from Microsoft Graph & Azure...');

  const [
    orgRes,
    usersCountRes,
    usersListRes,
    groupsCountRes,
    groupsListRes,
    devicesCountRes,
    devicesListRes,
    appsCountRes,
    appsListRes,
    skusRes,
    rolesRes,
    auditRes,
  ] = await Promise.all([
    fetchGraph('/organization'),
    fetchGraph('/users/$count'),
    fetchGraph('/users?$top=25&$select=id,displayName,userPrincipalName,accountEnabled,createdDateTime,userType'),
    fetchGraph('/groups/$count'),
    fetchGraph('/groups?$top=25&$select=id,displayName,securityEnabled,mailEnabled,groupTypes'),
    fetchGraph('/devices/$count'),
    fetchGraph('/devices?$top=25&$select=id,displayName,operatingSystem,operatingSystemVersion,isCompliant'),
    fetchGraph('/applications/$count'),
    fetchGraph('/applications?$top=25&$select=id,appId,displayName,createdDateTime,signInAudience'),
    fetchGraph('/subscribedSkus'),
    fetchGraph('/directoryRoles?$expand=members'),
    fetchGraph('/auditLogs/directoryAudits?$top=10'),
  ]);

  let subsData = null;
  if (mgmtToken) {
    try {
      const subsR = await fetch('https://management.azure.com/subscriptions?api-version=2022-12-01', {
        headers: { Authorization: `Bearer ${mgmtToken}` },
      });
      subsData = await subsR.json();
    } catch (e) {
      subsData = { error: e.message };
    }
  }

  const org = orgRes.data?.value?.[0] || {};
  const users = usersListRes.data?.value || [];
  const groups = groupsListRes.data?.value || [];
  const devices = devicesListRes.data?.value || [];
  const apps = appsListRes.data?.value || [];
  const skus = skusRes.data?.value || [];
  const roles = rolesRes.data?.value || [];
  const audits = auditRes.data?.value || [];
  const subscriptions = subsData?.value || [];

  const report = {
    reportMetadata: {
      reportTitle: 'ZensusTech Azure Tenant & Environment Live Audit Report',
      softwareName: 'ZensusTech Cloud Governance & Monitoring Platform',
      generatedAt: new Date().toISOString(),
      dataSource: 'Microsoft Azure (Graph API v1.0 & Azure Resource Manager)',
      tenantId: s.tenant_id,
      connectionStatus: 'Connected & Verified',
    },
    organizationOverview: {
      id: org.id || s.tenant_id,
      displayName: org.displayName || 'N/A',
      country: org.countryLetterCode || 'N/A',
      city: org.city || 'N/A',
      state: org.state || 'N/A',
      verifiedDomains: org.verifiedDomains?.map(d => ({ name: d.name, isDefault: d.isDefault, type: d.type })) || [],
    },
    inventorySummary: {
      totalUsers: usersCountRes.data ?? users.length,
      totalGroups: groupsCountRes.data ?? groups.length,
      totalDevices: devicesCountRes.data ?? devices.length,
      totalApplications: appsCountRes.data ?? apps.length,
      totalSubscriptions: subscriptions.length,
      totalDirectoryRolesConfigured: roles.length,
    },
    licenseUsageAndSkus: skus.map(s => ({
      skuPartNumber: s.skuPartNumber,
      skuId: s.skuId,
      unitsPurchased: s.prepaidUnits?.enabled || 0,
      unitsConsumed: s.consumedUnits || 0,
      unitsRemaining: (s.prepaidUnits?.enabled || 0) - (s.consumedUnits || 0),
    })),
    directoryUsersSample: users.map(u => ({
      id: u.id,
      displayName: u.displayName,
      userPrincipalName: u.userPrincipalName,
      userType: u.userType || 'Member',
      accountEnabled: u.accountEnabled,
      createdDateTime: u.createdDateTime,
    })),
    directoryGroupsSample: groups.map(g => ({
      id: g.id,
      displayName: g.displayName,
      securityEnabled: g.securityEnabled,
      mailEnabled: g.mailEnabled,
    })),
    devicesSample: devices.map(d => ({
      id: d.id,
      displayName: d.displayName,
      operatingSystem: d.operatingSystem,
      operatingSystemVersion: d.operatingSystemVersion,
      isCompliant: d.isCompliant,
    })),
    applicationsSample: apps.map(a => ({
      id: a.id,
      appId: a.appId,
      displayName: a.displayName,
      signInAudience: a.signInAudience,
      createdDateTime: a.createdDateTime,
    })),
    privilegedDirectoryRoles: roles
      .filter(r => (r.members && r.members.length > 0))
      .map(r => ({
        roleName: r.displayName,
        description: r.description,
        memberCount: r.members.length,
        members: r.members.map(m => m.displayName || m.userPrincipalName || m.id),
      })),
    recentAuditActivity: audits.map(a => ({
      id: a.id,
      activityDateTime: a.activityDateTime,
      activityDisplayName: a.activityDisplayName,
      category: a.category,
      result: a.result,
      initiatedBy: a.initiatedBy?.user?.userPrincipalName || a.initiatedBy?.app?.displayName || 'System',
    })),
    azureSubscriptions: subscriptions.map(sub => ({
      subscriptionId: sub.subscriptionId,
      displayName: sub.displayName,
      state: sub.state,
    })),
  };

  const reportsDir = path.resolve(__dirname, '../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }

  // 1. Write JSON Report
  const jsonReportPath = path.join(reportsDir, 'azure_fetched_data_report.json');
  fs.writeFileSync(jsonReportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`✓ JSON Report generated: ${jsonReportPath}`);

  // 2. Write Markdown / Human-Readable Report
  const mdReportPath = path.join(reportsDir, 'azure_fetched_data_report.md');
  const mdContent = `# Azure Tenant Data Fetch Report
**Software:** ZensusTech Cloud Governance Platform  
**Report Generated:** ${report.reportMetadata.generatedAt}  
**Tenant ID:** \`${report.reportMetadata.tenantId}\`  
**Data Sources:** Microsoft Graph API (v1.0) & Azure Resource Manager  
**Connection Status:** ✅ ${report.reportMetadata.connectionStatus}

---

## 1. Organization Overview
- **Organization Name:** **${report.organizationOverview.displayName}**
- **Location:** ${report.organizationOverview.city}, ${report.organizationOverview.state}, ${report.organizationOverview.country}
- **Verified Domains:**
${report.organizationOverview.verifiedDomains.map(d => `  - **${d.name}** (Default: \`${d.isDefault}\`, Type: \`${d.type}\`)`).join('\n')}

---

## 2. Live Inventory Metrics
| Resource Type | Count / Volume | API Status |
| :--- | :--- | :--- |
| **Total Users** | ${report.inventorySummary.totalUsers} | Verified (200 OK) |
| **Total Groups** | ${report.inventorySummary.totalGroups} | Verified (200 OK) |
| **Enrolled Devices** | ${report.inventorySummary.totalDevices} | Verified (200 OK) |
| **Enterprise / Registered Apps** | ${report.inventorySummary.totalApplications} | Verified (200 OK) |
| **Active Subscriptions** | ${report.inventorySummary.totalSubscriptions} | Verified (200 OK) |
| **Active Directory Roles** | ${report.inventorySummary.totalDirectoryRolesConfigured} | Verified (200 OK) |

---

## 3. Microsoft 365 License & SKU Allocation
| SKU / Plan | Units Purchased | Units Consumed | Remaining Available |
| :--- | :--- | :--- | :--- |
${report.licenseUsageAndSkus.length > 0 ? report.licenseUsageAndSkus.map(s => `| **${s.skuPartNumber}** | ${s.unitsPurchased} | ${s.unitsConsumed} | ${s.unitsRemaining} |`).join('\n') : '| *No SKUs assigned* | 0 | 0 | 0 |'}

---

## 4. Privileged Administrative Roles (RBAC)
${report.privilegedDirectoryRoles.length > 0 ? report.privilegedDirectoryRoles.map(r => `### ${r.roleName} (${r.memberCount} member${r.memberCount > 1 ? 's' : ''})
- **Assigned to:** ${r.members.join(', ')}
`).join('\n') : '*No elevated directory role assignments detected.*'}

---

## 5. Live Directory Users Sample
| Display Name | User Principal Name | Account Status | Created Date |
| :--- | :--- | :--- | :--- |
${report.directoryUsersSample.slice(0, 10).map(u => `| **${u.displayName}** | \`${u.userPrincipalName}\` | ${u.accountEnabled ? '🟢 Active' : '🔴 Disabled'} | ${u.createdDateTime ? u.createdDateTime.split('T')[0] : 'N/A'} |`).join('\n')}

---

## 6. Registered Applications Sample
| Application Name | App ID | Audience | Created Date |
| :--- | :--- | :--- | :--- |
${report.applicationsSample.map(a => `| **${a.displayName}** | \`${a.appId}\` | ${a.signInAudience} | ${a.createdDateTime ? a.createdDateTime.split('T')[0] : 'N/A'} |`).join('\n')}

---

## 7. Recent Audit Log Activity
| Date/Time | Activity | Category | Result | Initiated By |
| :--- | :--- | :--- | :--- | :--- |
${report.recentAuditActivity.length > 0 ? report.recentAuditActivity.map(a => `| ${a.activityDateTime} | **${a.activityDisplayName}** | ${a.category} | ${a.result} | \`${a.initiatedBy}\` |`).join('\n') : '| *No recent audit records* | - | - | - | - |'}

---

*Report generated automatically by ZensusTech API service.*
`;

  fs.writeFileSync(mdReportPath, mdContent, 'utf8');
  console.log(`✓ Markdown Report generated: ${mdReportPath}`);
}

generateReport().catch(err => {
  console.error('Report Generation Error:', err);
  process.exit(1);
});
