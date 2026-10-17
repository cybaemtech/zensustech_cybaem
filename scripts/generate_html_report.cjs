const fs = require('fs');
const path = require('path');

const reportsDir = path.resolve(__dirname, '../reports');
const jsonPath = path.join(reportsDir, 'azure_fetched_data_report.json');

if (!fs.existsSync(jsonPath)) {
  console.error('Report JSON not found. Run generate_azure_report.cjs first.');
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));

const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Azure Tenant Live Data Audit Report - ZensusTech</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Inter', system-ui, -apple-system, sans-serif;
      background: #f1f5f9;
      color: #0f172a;
      line-height: 1.5;
      padding: 32px 16px;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
      background: #ffffff;
      border-radius: 14px;
      box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08);
      overflow: hidden;
      border: 1px solid #e2e8f0;
    }
    .header {
      background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
      color: #ffffff;
      padding: 36px 40px;
      position: relative;
    }
    .badge-status {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 600;
      background: #10b981;
      color: #ffffff;
      margin-bottom: 12px;
    }
    .header h1 {
      font-size: 26px;
      font-weight: 800;
      letter-spacing: -0.02em;
      margin-bottom: 8px;
    }
    .header p {
      color: #94a3b8;
      font-size: 14px;
    }
    .meta-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      padding: 16px 40px;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 13px;
      color: #64748b;
    }
    .meta-bar strong { color: #1e293b; }
    .content { padding: 36px 40px; }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #1e293b;
      margin: 32px 0 16px 0;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .section-title:first-of-type { margin-top: 0; }
    .grid-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 14px;
      margin-bottom: 24px;
    }
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px;
      text-align: center;
    }
    .card-val {
      font-size: 26px;
      font-weight: 800;
      color: #2563eb;
    }
    .card-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
      font-size: 13px;
    }
    th {
      background: #f1f5f9;
      color: #475569;
      font-weight: 600;
      text-align: left;
      padding: 10px 14px;
      border-top: 1px solid #e2e8f0;
      border-bottom: 1px solid #cbd5e1;
    }
    td {
      padding: 10px 14px;
      border-bottom: 1px solid #e2e8f0;
      color: #334155;
    }
    tr:hover td { background: #f8fafc; }
    .tag {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 600;
    }
    .tag-green { background: #dcfce7; color: #15803d; }
    .tag-red { background: #fee2e2; color: #b91c1c; }
    .tag-blue { background: #dbeafe; color: #1d4ed8; }
    .footer {
      padding: 20px 40px;
      background: #f8fafc;
      border-top: 1px solid #e2e8f0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      color: #94a3b8;
    }
    .btn-print {
      background: #2563eb;
      color: #ffffff;
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    @media print {
      body { padding: 0; background: #fff; }
      .container { border: none; box-shadow: none; }
      .btn-print { display: none; }
    }
  </style>
</head>
<body>

<div class="container">
  <div class="header">
    <div class="badge-status">● Live Connected & Verified</div>
    <h1>Azure Tenant Data Fetch Audit Report</h1>
    <p>Live snapshot retrieved via Microsoft Graph API v1.0 & Azure Resource Manager by ZensusTech Platform</p>
  </div>

  <div class="meta-bar">
    <div><strong>Tenant:</strong> ${report.organizationOverview.displayName} (${report.organizationOverview.city}, ${report.organizationOverview.country})</div>
    <div><strong>Tenant ID:</strong> <code>${report.reportMetadata.tenantId}</code></div>
    <div><strong>Generated:</strong> ${new Date(report.reportMetadata.generatedAt).toLocaleString()}</div>
  </div>

  <div class="content">
    <div class="section-title">📊 1. Live Tenant Inventory Volume</div>
    <div class="grid-cards">
      <div class="card">
        <div class="card-val">${report.inventorySummary.totalUsers}</div>
        <div class="card-label">Active Users</div>
      </div>
      <div class="card">
        <div class="card-val">${report.inventorySummary.totalGroups}</div>
        <div class="card-label">Directory Groups</div>
      </div>
      <div class="card">
        <div class="card-val">${report.inventorySummary.totalDevices}</div>
        <div class="card-label">Enrolled Devices</div>
      </div>
      <div class="card">
        <div class="card-val">${report.inventorySummary.totalApplications}</div>
        <div class="card-label">Registered Apps</div>
      </div>
      <div class="card">
        <div class="card-val">${report.inventorySummary.totalDirectoryRolesConfigured}</div>
        <div class="card-label">Security Roles</div>
      </div>
    </div>

    <div class="section-title">🌐 2. Verified Domains & Tenant Details</div>
    <table>
      <thead>
        <tr>
          <th>Domain Name</th>
          <th>Type</th>
          <th>Is Default</th>
        </tr>
      </thead>
      <tbody>
        ${report.organizationOverview.verifiedDomains.map(d => `
        <tr>
          <td><strong>${d.name}</strong></td>
          <td><span class="tag tag-blue">${d.type}</span></td>
          <td>${d.isDefault ? '<span class="tag tag-green">Default Domain</span>' : '<span class="tag">Secondary</span>'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="section-title">💳 3. Microsoft 365 License Allocation & SKU Consumption</div>
    <table>
      <thead>
        <tr>
          <th>Product / SKU Name</th>
          <th>Units Purchased</th>
          <th>Consumed Units</th>
          <th>Remaining Units</th>
        </tr>
      </thead>
      <tbody>
        ${report.licenseUsageAndSkus.map(s => `
        <tr>
          <td><strong>${s.skuPartNumber}</strong></td>
          <td>${s.unitsPurchased.toLocaleString()}</td>
          <td><span class="tag tag-blue">${s.unitsConsumed}</span></td>
          <td>${s.unitsRemaining.toLocaleString()}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="section-title">🛡️ 4. Privileged Administrative Roles (RBAC)</div>
    <table>
      <thead>
        <tr>
          <th>Role Name</th>
          <th>Assigned Members Count</th>
          <th>Assigned Users / Identities</th>
        </tr>
      </thead>
      <tbody>
        ${report.privilegedDirectoryRoles.map(r => `
        <tr>
          <td><strong>${r.roleName}</strong></td>
          <td><span class="tag tag-red">${r.memberCount} admin(s)</span></td>
          <td>${r.members.join(', ')}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="section-title">👥 5. Live Directory Users Sample (Azure AD / Entra ID)</div>
    <table>
      <thead>
        <tr>
          <th>Display Name</th>
          <th>User Principal Name (Email)</th>
          <th>Status</th>
          <th>User Type</th>
        </tr>
      </thead>
      <tbody>
        ${report.directoryUsersSample.slice(0, 10).map(u => `
        <tr>
          <td><strong>${u.displayName}</strong></td>
          <td><code>${u.userPrincipalName}</code></td>
          <td>${u.accountEnabled ? '<span class="tag tag-green">Active</span>' : '<span class="tag tag-red">Disabled</span>'}</td>
          <td>${u.userType}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="section-title">📱 6. Registered Applications & Integrations</div>
    <table>
      <thead>
        <tr>
          <th>Application Name</th>
          <th>Application (Client) ID</th>
          <th>Sign-in Audience</th>
        </tr>
      </thead>
      <tbody>
        ${report.applicationsSample.map(a => `
        <tr>
          <td><strong>${a.displayName}</strong></td>
          <td><code>${a.appId}</code></td>
          <td>${a.signInAudience}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>

    <div class="section-title">📝 7. Recent Azure Directory Audit Log</div>
    <table>
      <thead>
        <tr>
          <th>Timestamp</th>
          <th>Action</th>
          <th>Category</th>
          <th>Result</th>
          <th>Initiated By</th>
        </tr>
      </thead>
      <tbody>
        ${report.recentAuditActivity.map(a => `
        <tr>
          <td>${a.activityDateTime}</td>
          <td><strong>${a.activityDisplayName}</strong></td>
          <td>${a.category}</td>
          <td><span class="tag tag-green">${a.result}</span></td>
          <td><code>${a.initiatedBy}</code></td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="footer">
    <div>Generated by ZensusTech Cloud Governance Platform</div>
    <button class="btn-print" onclick="window.print()">Print / Save as PDF</button>
  </div>
</div>

</body>
</html>
`;

const htmlReportPath = path.join(reportsDir, 'azure_fetched_data_report.html');
fs.writeFileSync(htmlReportPath, htmlContent, 'utf8');
console.log(`✓ Printable HTML Report generated: ${htmlReportPath}`);
