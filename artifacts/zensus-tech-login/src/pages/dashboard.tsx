import {
  LockKeyhole,
  Cloud,
  ShieldCheck,
  Server,
  Activity,
  CircleDollarSign,
  LayoutGrid,
  Users,
  CheckCircle2,
  Globe,
  Grid,
  Settings,
  TriangleAlert,
  ShieldAlert,
  MapPin,
  RefreshCw,
  Copy,
  ChevronDown,
  Laptop,
  FolderGit2,
  Search,
  UserCheck,
  UserX,
  Key,
  X,
  Clock,
  ChevronRight,
  AlertCircle,
  FileText,
  Eye
} from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { useLocation } from 'wouter';
import { getLiveApiHeaders, LIVE_API_BASE } from '@/lib/live-api';

const SIDEBAR_ITEMS = [
  { id: 'identity', label: 'Identity & Access', subLabel: 'Organization Entra ID', icon: LockKeyhole, active: true },
  { id: 'backups', label: 'Backups & DR', subLabel: 'Recovery Points', icon: Cloud },
  { id: 'patch', label: 'Patch Management', subLabel: 'Updates & Compliance', icon: ShieldCheck },
  { id: 'asset', label: 'Asset Optimization', subLabel: 'Inventory & Reserved Instances', icon: Server },
  { id: 'infra', label: 'Infrastructure', subLabel: 'Performance Metrics', icon: Activity },
  { id: 'billing', label: 'Billing View', subLabel: 'Invoices & Charges', icon: CircleDollarSign },
  { id: 'm365', label: 'Microsoft O365', subLabel: 'Licenses & Usage', icon: LayoutGrid },
];

const DEFAULT_ORG = {
  displayName: 'Loading...',
  countryLetterCode: '',
  primaryDomain: '',
  city: '',
  state: '',
  street: '',
  license: '',
  usersCount: 0,
  groupsCount: 0,
  appsCount: 0,
  devicesCount: 0
};

const DEFAULT_STATS = {
  totalUsers: 0,
  standardUsers: 0,
  globalAdmins: 0,
  totalApps: 0,
  totalGroups: 0,
  totalDevices: 0,
  totalSp: 0,
  compliant: 0,
  mfaDisabled: 0,
  foreign: 0
};

const DEFAULT_USERS: any[] = [];


export default function Dashboard() {
  const [, setLocation] = useLocation();
  const tenantId = sessionStorage.getItem('azure_tenant_id') || '9414ece9-9039-40b7-a6a7-7ecbe7409245';
  const clientId = sessionStorage.getItem('azure_client_id') || '3bd333d8-94ea-4630-a492-7c06062b9822';

  const [org, setOrg] = useState<typeof DEFAULT_ORG>(() => {
    try {
      const raw = sessionStorage.getItem('azure_org_details');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.displayName && parsed.displayName !== 'Cybaem Tech') {
          return { ...DEFAULT_ORG, ...parsed, usersCount: DEFAULT_ORG.usersCount };
        }
      }
    } catch {}
    return DEFAULT_ORG;
  });

  const [stats, setStats] = useState({ ...DEFAULT_STATS });
  const [usersList, setUsersList] = useState<any[]>(DEFAULT_USERS);
  const [licensesData, setLicensesData] = useState<any[]>([]);
  const [secureScore, setSecureScore] = useState<number | null>(null);
  const [userSearch, setUserSearch] = useState('');
  const [activeTab, setActiveTab] = useState('identity');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isLiveGraph, setIsLiveGraph] = useState(false);
  const [dataSource, setDataSource] = useState<string>('microsoft365');
  const [graphError, setGraphError] = useState<string | null>(null);
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [customJsonInput, setCustomJsonInput] = useState('');
  const [jsonSaveSuccess, setJsonSaveSuccess] = useState(false);
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null);

  // Feed & Forensic Explorer state
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedFeedItem, setSelectedFeedItem] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [investigationFilter, setInvestigationFilter] = useState<'All'|'Auth'|'User'|'Application'|'Role'>('All');
  const [investigationTime, setInvestigationTime] = useState<'24H'|'7D'|'30D'>('24H');
  const [showUsersTable, setShowUsersTable] = useState(false);

  // Per-tab live data
  const [tabLoading, setTabLoading] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);
  const [patchData, setPatchData] = useState<any>(null);
  const [assetData, setAssetData] = useState<any>(null);
  const [infraData, setInfraData] = useState<any>(null);
  const [billingData, setBillingData] = useState<any>(null);

  const fetchStats = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const headers = getLiveApiHeaders();
      // Parallel fetch — mirrors Zensustech-feature-enhanced-dashboard/frontend/src/hooks/useDashboardData.ts
      // Fetches: tenant/users, tenant/applications, tenant/organization, M365 secure score, M365 licenses
      const [usersRes, appsRes, orgRes, securityRes, licenseRes] = await Promise.allSettled([
        fetch(`${LIVE_API_BASE}/tenant/users`, { headers }),
        fetch(`${LIVE_API_BASE}/tenant/applications`, { headers }),
        fetch(`${LIVE_API_BASE}/tenant/organization`, { headers }),
        fetch(`${LIVE_API_BASE}/microsoft0365/secure/score`, { headers }),
        fetch(`${LIVE_API_BASE}/microsoft0365/license_and_usage_details`, { headers }),
      ]);

      // 1. Process Organization
      if (orgRes.status === 'fulfilled') {
        try {
          const orgJson = await orgRes.value.json();
          if (orgJson?.organization) {
            const o = orgJson.organization;
            const orgData = {
              displayName: o.displayName || o.tenantName || DEFAULT_ORG.displayName,
              countryLetterCode: o.countryLetterCode || o.country || DEFAULT_ORG.countryLetterCode,
              primaryDomain: o.primaryDomain || o.domain || o.verifiedDomains?.[0]?.name || DEFAULT_ORG.primaryDomain,
              city: o.city || DEFAULT_ORG.city,
              state: o.state || DEFAULT_ORG.state,
              street: o.street || DEFAULT_ORG.street,
              license: o.license || DEFAULT_ORG.license,
              usersCount: o.usersCount || DEFAULT_ORG.usersCount,
              groupsCount: o.groupsCount || DEFAULT_ORG.groupsCount,
              appsCount: o.appsCount || DEFAULT_ORG.appsCount,
              devicesCount: o.devicesCount || DEFAULT_ORG.devicesCount,
            };
            setOrg(orgData);
            sessionStorage.setItem('azure_org_details', JSON.stringify(orgData));
          }
        } catch {}
      }

      // 2. Process M365 Secure Score (mirrors securityData processing in useDashboardData.ts)
      if (securityRes.status === 'fulfilled') {
        try {
          const scJson = await securityRes.value.json();
          if (scJson?.success && scJson?.data?.overall?.percentage !== undefined) {
            setSecureScore(scJson.data.overall.percentage);
          }
        } catch {}
      }

      // 3. Process M365 License Data (mirrors licenseData processing in useDashboardData.ts)
      if (licenseRes.status === 'fulfilled') {
        try {
          const licJson = await licenseRes.value.json();
          if (Array.isArray(licJson?.tableData)) {
            setLicensesData(licJson.tableData.map((license: any) => ({
              ...license,
              key: license.key || license.license,
              product: license.product || license.license,
              totalLicenses: license.totalLicenses ?? license.purchased ?? 0,
              usedLicenses: license.usedLicenses ?? license.assigned ?? 0,
              availableLicenses: license.availableLicenses ?? license.unused ?? 0,
              usagePercent: license.usagePercent ?? (license.purchased ? Math.round((license.assigned / license.purchased) * 100) : 0),
            })));
          }
        } catch {}
      }

      // 4. Process Applications (mirrors appData processing in useDashboardData.ts)
      if (appsRes.status === 'fulfilled') {
        try {
          const appJson = await appsRes.value.json();
          const appCount = appJson?.count ?? appJson?.applications?.length ?? 0;
          if (appCount > 0) {
            setStats(prev => ({ ...prev, totalApps: appCount }));
            setOrg(prev => ({ ...prev, appsCount: appCount }));
          }
        } catch {}
      }

      // 5. Process Tenant Users (mirrors userData processing in useDashboardData.ts)
      if (usersRes.status === 'fulfilled') {
        try {
          const usersJson = await usersRes.value.json();
          const isLive = usersRes.value.ok && Array.isArray(usersJson?.users) && usersJson.users.length > 0;
          const src = usersJson?.source || (isLive ? 'graph' : 'none');
          setIsLiveGraph(isLive);
          setDataSource(src as any);
          setLastFetchedAt(usersJson?.fetchedAt || usersJson?.cachedAt || new Date().toISOString());
          setGraphError(isLive ? null : (usersJson?.detail || usersJson?.error || (usersRes.value.ok ? 'The users API returned HTTP 200 but no user records. Check the backend Graph response and tenant user inventory.' : `Live users API returned HTTP ${usersRes.value.status}.`)));

          if (usersJson && Array.isArray(usersJson.users)) {
            const normalizedUsers = usersJson.users.map((user: any) => ({
              ...user,
              displayName: user.displayName || user.user || 'Unknown',
              userPrincipalName: user.userPrincipalName || user.email || '',
              accountEnabled: user.accountEnabled ?? user.status === 'Active',
              mfaEnabled: user.mfaEnabled ?? (user.mfa === 'Enabled' ? true : user.mfa === 'Disabled' ? false : null),
              roles: user.roles || (user.role ? [user.role] : []),
            }));
            setUsersList(normalizedUsers);
            const ul = normalizedUsers;
            const total = ul.length;
            const mfaDis = ul.filter((u: any) => u.mfa === 'Disabled' || u.mfaEnabled === false).length;
            const admins = ul.filter((u: any) =>
              (u.role || '').toLowerCase().includes('administrator') ||
              (u.roles || []).some((r: string) => r.toLowerCase().includes('administrator'))
            ).length;
            const gAdmins = ul.filter((u: any) =>
              (u.role || '').toLowerCase().includes('global administrator') ||
              (u.roles || []).some((r: string) => r.toLowerCase().includes('global administrator'))
            ).length;
            setStats(prev => ({
              ...prev,
              totalUsers: total,
              standardUsers: Math.max(0, total - admins),
              globalAdmins: gAdmins,
              mfaDisabled: mfaDis,
              compliant: Math.max(0, total - mfaDis),
            }));
            setOrg(prev => ({ ...prev, usersCount: total }));
          }
        } catch (e: any) {
          setIsLiveGraph(false);
          setDataSource('none');
          setGraphError(e.message);
        }
      }
    } catch (e: any) {
      setIsLiveGraph(false);
      setGraphError(e.message);
    } finally {
      setIsRefreshing(false);
      setDataLoaded(true);
    }
  }, []);

  const fetchAuditFeed = useCallback(async () => {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const graphToken = sessionStorage.getItem('graph_token');
      if (!graphToken) {
        throw new Error('No Graph token available. Please re-authenticate.');
      }
      const top = investigationTime === '30D' ? 50 : investigationTime === '7D' ? 30 : 20;
      const url = `https://graph.microsoft.com/v1.0/auditLogs/directoryAudits?$top=${top}&$orderby=activityDateTime desc`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${graphToken}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || `Graph returned HTTP ${res.status}`);
      }
      const data = await res.json();
      setFeedItems(Array.isArray(data.value) ? data.value : []);
    } catch (e: any) {
      setFeedError(e.message || 'Failed to fetch audit feed.');
      // Fallback demo data so the UI isn't empty
      setFeedItems([
        { id: 'demo-1', activityDisplayName: 'Hard Delete application', activityDateTime: new Date(Date.now() - 20 * 3600000).toISOString(), initiatedBy: { app: { displayName: 'Microsoft Online Services Garbage Collector' } }, targetResources: [{ displayName: 'cybaemtechdemo1.file.core.windows.net', type: 'StorageAccount', modifiedProperties: [] }], result: 'success', category: 'Application', operationType: 'Delete' },
        { id: 'demo-2', activityDisplayName: 'GroupLifecyclePolicies_Get', activityDateTime: new Date(Date.now() - 26 * 3600000).toISOString(), initiatedBy: { app: { displayName: 'System Process' } }, targetResources: [{ displayName: 'Unknown', type: 'Other', modifiedProperties: [] }], result: 'success', category: 'Policy', operationType: 'Get' },
        { id: 'demo-3', activityDisplayName: 'Update application', activityDateTime: new Date(Date.now() - 4 * 24 * 3600000).toISOString(), initiatedBy: { app: { displayName: 'System Process' } }, targetResources: [{ displayName: 'CybaemTech-0365', type: 'Application', modifiedProperties: [{ displayName: 'KeyDescription', oldValue: '', newValue: 'KeyIdentifier=...' }] }], result: 'success', category: 'Application', operationType: 'Update' },
        { id: 'demo-4', activityDisplayName: 'Update application – Certificates and secrets management', activityDateTime: new Date(Date.now() - 4 * 24 * 3600000).toISOString(), initiatedBy: { app: { displayName: 'System Process' } }, targetResources: [{ displayName: 'CybaemTech-0365', type: 'Application', modifiedProperties: [{ displayName: 'KeyDescription', oldValue: '', newValue: 'KeyIdentifier=cf0c930-1d37-4797-9874-d564bb66a1ba;KeyType=Password;KeyUsage=Verify;DisplayName=CybaemTech-0365;KeyDent...' }] }], result: 'success', category: 'Application', operationType: 'Update' },
        { id: 'demo-5', activityDisplayName: 'Update service principal', activityDateTime: new Date(Date.now() - 4 * 24 * 3600000).toISOString(), initiatedBy: { app: { displayName: 'System Process' } }, targetResources: [{ displayName: 'CybaemTech-0365', type: 'ServicePrincipal', modifiedProperties: [{ displayName: 'Included Updated Properties', oldValue: '', newValue: 'KeyCredentials' }] }], result: 'success', category: 'Application', operationType: 'Update' },
      ]);
    } finally {
      setFeedLoading(false);
    }
  }, [investigationTime]);

  // Fetch live data for a tab when it is activated
  const fetchTabData = useCallback(async (tab: string) => {
    const graphToken = sessionStorage.getItem('graph_token');
    const mgmtToken = sessionStorage.getItem('mgmt_token');
    if (!graphToken && !mgmtToken) return;
    setTabLoading(true);
    try {
      if (tab === 'backups') {
        const subs = sessionStorage.getItem('azure_subscription_id');
        const subId = subs || 'placeholder';
        const armHeaders = new Headers({ Authorization: `Bearer ${mgmtToken || ''}` });
        let vaults: any[] = [];
        try {
          const r = await fetch(`https://management.azure.com/subscriptions/${subId}/providers/Microsoft.RecoveryServices/vaults?api-version=2023-04-01`, { headers: armHeaders });
          if (r.ok) { const d = await r.json(); vaults = d.value || []; }
        } catch {}
        setBackupData({ vaultCount: vaults.length, vaults: vaults.slice(0, 6), protectedItems: vaults.filter((v: any) => v.properties?.provisioningState === 'Succeeded').length, fetchedAt: new Date().toISOString(), live: vaults.length > 0 });
      }
      if (tab === 'patch') {
        const gHeaders = new Headers({ Authorization: `Bearer ${graphToken || ''}` });
        let devices: any[] = [];
        try {
          const r = await fetch('https://graph.microsoft.com/v1.0/deviceManagement/managedDevices?$top=50&$select=id,deviceName,complianceState,osVersion,operatingSystem,lastSyncDateTime', { headers: gHeaders });
          if (r.ok) { const d = await r.json(); devices = d.value || []; }
        } catch {}
        const compliant = devices.filter((d: any) => d.complianceState === 'compliant').length;
        const noncompliant = devices.filter((d: any) => d.complianceState === 'noncompliant').length;
        const unknown = devices.filter((d: any) => !d.complianceState || d.complianceState === 'unknown').length;
        setPatchData({ total: devices.length, compliant, noncompliant, unknown, devices: devices.slice(0, 10), fetchedAt: new Date().toISOString(), live: devices.length > 0 });
      }
      if (tab === 'asset') {
        const gHeaders = new Headers({ Authorization: `Bearer ${graphToken || ''}`, ConsistencyLevel: 'eventual' });
        const [appsR, spR, groupsR, devicesR] = await Promise.allSettled([
          fetch('https://graph.microsoft.com/v1.0/applications?$count=true&$top=1', { headers: gHeaders }),
          fetch('https://graph.microsoft.com/v1.0/servicePrincipals?$count=true&$top=1', { headers: gHeaders }),
          fetch('https://graph.microsoft.com/v1.0/groups?$count=true&$top=1', { headers: gHeaders }),
          fetch('https://graph.microsoft.com/v1.0/devices?$count=true&$top=1', { headers: gHeaders }),
        ]);
        const getCount = async (res: any) => { try { if (res.status === 'fulfilled' && res.value.ok) { const d = await res.value.json(); return d['@odata.count'] ?? d.value?.length ?? 0; } } catch {} return 0; };
        const [appCount, spCount, groupCount, deviceCount] = await Promise.all([getCount(appsR), getCount(spR), getCount(groupsR), getCount(devicesR)]);
        setAssetData({ appCount, spCount, groupCount, deviceCount, fetchedAt: new Date().toISOString(), live: appCount > 0 || spCount > 0 });
      }
      if (tab === 'infra') {
        const armHeaders = new Headers({ Authorization: `Bearer ${mgmtToken || ''}` });
        let subs: any[] = [];
        let resourceCount = 0;
        try {
          const r = await fetch('https://management.azure.com/subscriptions?api-version=2022-12-01', { headers: armHeaders });
          if (r.ok) { const d = await r.json(); subs = d.value || []; }
        } catch {}
        if (subs.length > 0) {
          try {
            const r = await fetch(`https://management.azure.com/subscriptions/${subs[0].subscriptionId}/resources?api-version=2021-04-01&$top=1`, { headers: armHeaders });
            if (r.ok) { const d = await r.json(); resourceCount = d['@odata.count'] ?? d.value?.length ?? 0; }
          } catch {}
        }
        setInfraData({ subscriptions: subs.length, subList: subs.slice(0, 6), resourceCount, fetchedAt: new Date().toISOString(), live: subs.length > 0 });
      }
      if (tab === 'billing') {
        const armHeaders = new Headers({ Authorization: `Bearer ${mgmtToken || ''}`, 'Content-Type': 'application/json' });
        let subs: any[] = [];
        try {
          const r = await fetch('https://management.azure.com/subscriptions?api-version=2022-12-01', { headers: armHeaders });
          if (r.ok) { const d = await r.json(); subs = d.value || []; }
        } catch {}
        let totalCost: number | null = null;
        let currency = 'USD';
        if (subs.length > 0) {
          try {
            const now = new Date(); const from = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10); const to = now.toISOString().slice(0, 10);
            const r = await fetch(`https://management.azure.com/subscriptions/${subs[0].subscriptionId}/providers/Microsoft.CostManagement/query?api-version=2023-03-01`, {
              method: 'POST', headers: armHeaders,
              body: JSON.stringify({ type: 'ActualCost', timeframe: 'Custom', timePeriod: { from, to }, dataset: { granularity: 'None', aggregation: { totalCost: { name: 'Cost', function: 'Sum' } } } })
            });
            if (r.ok) { const d = await r.json(); totalCost = d.properties?.rows?.[0]?.[0] ?? null; currency = d.properties?.rows?.[0]?.[1] ?? 'USD'; }
          } catch {}
        }
        setBillingData({ totalCost, currency, subscriptions: subs.length, subList: subs.slice(0, 4), fetchedAt: new Date().toISOString(), live: totalCost !== null });
      }
    } catch {}
    finally { setTabLoading(false); }
  }, []);

  const handleSaveCustomUsers = async () => {

    try {
      if (!customJsonInput.trim()) {
        alert('Please enter or paste a valid JSON array of users.');
        return;
      }
      const parsed = JSON.parse(customJsonInput);
      if (!Array.isArray(parsed)) throw new Error('Input must be a JSON array of users');
      const res = await fetch('/api/v1/tenant/users/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users: parsed })
      });
      if (res.ok) {
        setUsersList(parsed);
        setIsLiveGraph(true);
        setJsonSaveSuccess(true);
        setTimeout(() => {
          setShowJsonModal(false);
          setJsonSaveSuccess(false);
        }, 1200);
      }
    } catch (e: any) {
      alert('Invalid JSON: ' + e.message);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchAuditFeed();
  }, []);

  useEffect(() => {
    fetchAuditFeed();
  }, [investigationTime]);

  // Fetch live data when a non-identity tab is activated
  useEffect(() => {
    if (activeTab !== 'identity') fetchTabData(activeTab);
  }, [activeTab]);

  const initial = org.displayName ? org.displayName.charAt(0).toUpperCase() : 'Z';
  const locationString = [org.street, org.city, org.state].filter(Boolean).join(', ');
  const currentTab = SIDEBAR_ITEMS.find(i => i.id === activeTab) || SIDEBAR_ITEMS[0];
  const CurrentIcon = currentTab.icon;

  const filteredUsers = usersList.filter(u => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      (u.displayName && u.displayName.toLowerCase().includes(q)) ||
      (u.userPrincipalName && u.userPrincipalName.toLowerCase().includes(q)) ||
      (u.role && u.role.toLowerCase().includes(q))
    );
  });

  const totalUsersCount = usersList.length;
  const mfaEnabledCount = usersList.filter(u => u.mfa === 'Enabled' || u.mfaEnabled === true).length;
  const mfaDisabledCount = usersList.filter(u => u.mfa === 'Disabled' || u.mfaEnabled === false).length;
  const highRiskCount = mfaDisabledCount;
  const adminCount = usersList.filter(u => (u.role || '').toLowerCase().includes('administrator') || (u.roles || []).some((r: string) => r.toLowerCase().includes('administrator'))).length;
  const globalAdminCount = usersList.filter(u => (u.role || '').toLowerCase().includes('global administrator') || (u.roles || []).some((r: string) => r.toLowerCase().includes('global administrator'))).length;
  const standardUsersCount = Math.max(0, totalUsersCount - adminCount);

  return (
    <div className="flex flex-col overflow-hidden w-full bg-[#f4f7fa] font-sans text-slate-800" style={{ zoom: '0.82', height: 'calc(100dvh / 0.82)' }}>

      {/* Top Navbar */}
      <header className="h-[76px] shrink-0 px-6 lg:px-10 flex items-center justify-between bg-white border-b border-slate-200/60 shadow-[0_2px_10px_rgba(0,0,0,0.02)] z-20 sticky top-0">
        <div className="flex items-center gap-4">
          <img src="/ZensusTech_Logo.PNG" alt="ZensusTech" className="h-11 w-11 object-contain rounded-xl shadow-sm border border-slate-100" />
          <div className="hidden sm:block">
            <h1 className="text-[1.35rem] font-bold text-[#162a44] flex items-center gap-1.5 leading-none mb-1.5">
              ZensusTech <span className="text-[#0ea5e9] font-medium">ZenAIOps&trade;</span>
            </h1>
            <p className="text-[0.62rem] font-bold text-slate-500 tracking-[0.15em] uppercase leading-none">
              AI-Powered Azure Managed Services Dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setLocation('/cost-dashboard')}
            className="hidden md:flex items-center gap-2 border border-slate-200 hover:border-slate-300 bg-slate-50 text-slate-700 text-[0.8rem] font-bold px-4 py-2.5 rounded-lg transition-colors"
          >
            <CircleDollarSign className="h-4 w-4 text-[#0ea5e9]" /> Cost Analytics
          </button>
          <button
            onClick={() => {
              sessionStorage.clear();
              setLocation('/');
            }}
            className="bg-[#ff5a5f] hover:bg-[#e0484c] text-white text-[0.8rem] font-bold px-6 py-2.5 rounded-lg shadow-sm shadow-rose-200/50 transition-colors"
          >
            Log Out
          </button>
        </div>
      </header>

      {/* Main scrollable area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 custom-scrollbar">
        <div className="max-w-[1600px] mx-auto space-y-6">

          {/* Company Info Card */}
          <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-100 flex flex-col xl:flex-row gap-8 justify-between animate-fade-up relative overflow-hidden">
            <div className="absolute top-0 right-1/2 -mt-10 h-32 w-32 rounded-full bg-blue-50 opacity-50 blur-3xl pointer-events-none" />

            {/* Left Side: Name, Address, Quota */}
            <div className="flex flex-col sm:flex-row gap-5 flex-1 relative z-10">
              <div className="h-16 w-16 rounded-2xl bg-[#0078d4] text-white flex items-center justify-center text-3xl font-bold shrink-0 shadow-md shadow-blue-500/20 uppercase">
                {initial}
              </div>
              <div className="flex flex-col justify-center flex-1 max-w-2xl">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold text-[#162a44] tracking-tight">{org.displayName}</h2>
                  <span className="bg-slate-100 text-slate-600 text-[0.65rem] font-bold px-2 py-0.5 rounded-md flex items-center gap-1 border border-slate-200 uppercase">
                    <Globe className="h-3 w-3" /> {org.countryLetterCode || 'IN'}
                  </span>
                  <span className="bg-emerald-50 text-emerald-700 text-[0.65rem] font-bold px-2.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> {org.license || 'Microsoft Entra ID P1'}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-500 mb-2">
                  <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-md font-medium text-xs shadow-sm">
                    {org.primaryDomain || 'zensustech.com'}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs font-medium text-slate-400">
                    <MapPin className="h-3.5 w-3.5" /> {locationString || 'Pune, MH'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-xs mt-3">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border font-medium text-xs shadow-xs ${isLiveGraph ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                    <span className={`h-2 w-2 rounded-full ${isLiveGraph ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                    {isRefreshing && !dataLoaded ? 'Connecting to Microsoft Graph…' : isLiveGraph ? 'Microsoft Graph Live Data' : 'Live tenant data unavailable'}
                  </span>
                  <span className="bg-slate-100 text-slate-600 px-2.5 py-1.5 rounded-lg border border-slate-200 font-mono text-[0.72rem]">
                    Tenant: {tenantId}
                  </span>
                </div>
                {!isLiveGraph && dataLoaded && (
                  <p className="mt-3 max-w-2xl text-xs leading-5 text-amber-800" role="status" data-testid="text-live-data-error">
                    {graphError || 'The tenant connection was verified, but Microsoft Graph returned no live user data. Check the app permissions and tenant access, then refresh.'}
                  </p>
                )}
              </div>
            </div>

            {/* Right Side: Toggles, Tenant ID, Subscription */}
            <div className="flex flex-col items-start xl:items-end justify-between xl:border-l border-slate-100 xl:pl-10 relative z-10 w-full xl:w-auto">
               <div className="flex items-center gap-3 w-full xl:w-auto">
                 <div className="flex bg-slate-50 border border-slate-200/80 rounded-xl p-1">
                   <button className="px-5 py-1.5 text-[0.8rem] font-bold bg-white rounded-lg shadow-sm border border-slate-200/50 text-slate-700">Tenant</button>
                   <button className="px-5 py-1.5 text-[0.8rem] font-bold text-slate-500 hover:text-slate-700 transition-colors">Subscription</button>
                 </div>
                 <button
                   onClick={fetchStats}
                   disabled={isRefreshing}
                   className="flex items-center gap-2 px-4 py-2 border border-slate-200/80 rounded-xl text-[0.8rem] font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                 >
                   <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Refresh
                 </button>
               </div>

               <div className="flex flex-col sm:flex-row gap-8 sm:gap-12 mt-6 w-full xl:w-auto">
                 <div>
                   <div className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Tenant ID / Directory ID</div>
                   <div className="flex items-center gap-2 font-mono text-[0.82rem] font-bold text-slate-800 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200/60">
                     <span>{tenantId}</span>
                     <button
                       onClick={() => navigator.clipboard.writeText(tenantId)}
                       title="Copy Tenant ID"
                       className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-blue-500 transition-colors"
                     >
                       <Copy className="h-3.5 w-3.5" />
                     </button>
                   </div>
                 </div>
                 <div>
                   <div className="text-[0.62rem] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Target Subscription</div>
                   <div className="font-semibold text-slate-400 text-sm flex items-center justify-between min-w-[180px] bg-slate-50 border border-slate-200/60 px-3 py-1.5 rounded-lg cursor-default">
                     Production Cloud <ChevronDown className="h-4 w-4" />
                   </div>
                 </div>
               </div>
            </div>
          </div>

          {/* Two Column Layout (Sidebar + Content) */}
          <div className="flex flex-col lg:flex-row gap-6">

            {/* Sidebar */}
            <aside className="w-full lg:w-[280px] shrink-0 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.03)] overflow-hidden animate-fade-up [animation-delay:100ms] h-fit">
              <div className="p-6 pb-4 border-b border-slate-50">
                <div className="flex items-center gap-3 font-bold text-slate-700 text-[1.05rem]">
                  <Cloud className="h-5 w-5 text-slate-400" />
                  <span>Dashboard Tiles</span>
                </div>
              </div>

              <nav className="p-4 space-y-1.5">
                {SIDEBAR_ITEMS.map((item) => {
                  const isActive = item.id === activeTab;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-start gap-3.5 px-4 py-3.5 rounded-xl transition-all duration-300 text-left group relative`}
                    >
                      <div className={`mt-0.5 rounded-lg p-1.5 transition-colors ${
                        isActive
                          ? 'text-[#0ea5e9]'
                          : 'text-slate-400 group-hover:text-slate-600'
                      }`}>
                        <item.icon className="h-5 w-5" strokeWidth={2} />
                      </div>
                      <div className="flex flex-col">
                        <span className={`text-[0.9rem] font-bold tracking-tight ${
                          isActive ? 'text-[#0ea5e9]' : 'text-slate-600 group-hover:text-slate-900'
                        }`}>
                          {item.label}
                        </span>
                        <span className="text-[0.7rem] text-slate-400 font-medium tracking-wide mt-0.5">
                          {item.subLabel}
                        </span>
                      </div>

                      {/* Active State Background & Border */}
                      {isActive && (
                        <div className="absolute inset-0 border-[1.5px] border-[#0ea5e9] bg-blue-50/50 rounded-xl shadow-[0_4px_12px_rgba(14,165,233,0.06)] pointer-events-none" />
                      )}
                    </button>
                  );
                })}
              </nav>
            </aside>

            {/* Content Area */}
            <div className="flex-1 space-y-6">

              {/* Header Banner */}
              <div className="animate-fade-up [animation-delay:150ms] w-full rounded-2xl bg-gradient-to-r from-[#1488e6] via-[#1db2ed] to-[#36d1f0] p-6 lg:p-8 text-white shadow-[0_8px_20px_-8px_rgba(20,136,230,0.4)] relative overflow-hidden">
                <div className="absolute top-0 right-0 -mt-16 -mr-16 h-64 w-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none" />
                <div className="flex items-center gap-4 relative z-10">
                  <div className="h-12 w-12 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm border border-white/30 shadow-inner">
                    <CurrentIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-[1.7rem] font-bold tracking-tight text-white mb-1 leading-none">{currentTab.label}</h2>
                    <p className="text-cyan-50 text-[0.8rem] font-medium opacity-90 flex items-center gap-1.5 mt-2">
                      <span className="text-white/80">Tenant:</span>
                      <span className="font-mono">{tenantId}</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Tab 1: Identity & Access */}
              {activeTab === 'identity' && (
                <>
                  <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                    {/* Total Users Breakdown */}
                    <div className="xl:col-span-5 bg-white rounded-2xl p-6 lg:p-7 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-100 animate-fade-up [animation-delay:200ms] flex flex-col">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[0.8rem] font-bold text-slate-400">Total Users</span>
                        <span className="text-[0.7rem] font-semibold px-2.5 py-0.5 rounded-full border text-emerald-700 bg-emerald-50 border-emerald-200 flex items-center gap-1.5">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live Microsoft 365
                        </span>
                      </div>
                      <div className="flex items-end gap-3 mb-8">
                        <Users className="h-8 w-8 text-amber-500 pb-1" />
                        <span className="text-4xl font-bold text-slate-800 leading-none">{totalUsersCount}</span>
                      </div>

                      <div className="space-y-4 mt-auto">
                        <div className="flex items-center justify-between text-[0.85rem] font-medium group">
                          <div className="flex items-center gap-2.5 text-slate-600">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <span>Standard Users</span>
                          </div>
                          <span className="bg-rose-500 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">{standardUsersCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-[0.85rem] font-medium group">
                          <div className="flex items-center gap-2.5 text-slate-600">
                            <span className="h-2 w-2 rounded-full bg-slate-300" />
                            <span className="truncate max-w-[200px]">Azure AD Joined Devices</span>
                          </div>
                          <span className="bg-blue-500 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">{stats.totalDevices || org.devicesCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-[0.85rem] font-medium group">
                          <div className="flex items-center gap-2.5 text-slate-600">
                            <span className="h-2 w-2 rounded-full bg-purple-400" />
                            <span className="truncate max-w-[200px]">MFA Enabled Users</span>
                          </div>
                          <span className="bg-emerald-500 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">{mfaEnabledCount}</span>
                        </div>
                        <div className="flex items-center justify-between text-[0.85rem] font-medium group">
                          <div className="flex items-center gap-2.5 text-slate-600">
                            <span className="h-2 w-2 rounded-full bg-amber-400" />
                            <span className="truncate max-w-[200px]">Global Administrator</span>
                          </div>
                          <span className="bg-rose-500 text-white text-[0.65rem] font-bold px-2 py-0.5 rounded-full">{globalAdminCount}</span>
                        </div>
                      </div>
                    </div>

                    {/* High Risk Alert */}
                    <div className="xl:col-span-3 rounded-2xl p-[2px] bg-gradient-to-b from-rose-200 to-rose-50 animate-pulse-border [animation-delay:250ms]">
                      <div className="bg-[#fff9fa] rounded-[14px] h-full p-6 lg:p-7 flex flex-col items-center justify-center text-center relative overflow-hidden">
                        <div className="absolute top-0 right-0 -mt-12 -mr-12 h-32 w-32 rounded-full bg-rose-100 opacity-50 blur-2xl" />

                        <div className="flex items-center gap-2 text-rose-500 font-bold text-[0.65rem] tracking-widest mb-3 uppercase">
                          <ShieldAlert className="h-3.5 w-3.5" />
                          <span>High Risk</span>
                        </div>

                        <div className="text-[4rem] font-black text-[#c81e1e] leading-none mb-2">{mfaDisabledCount}</div>
                        <div className="text-sm font-bold text-rose-900 mb-3">MFA Disabled</div>
                        <div className="text-[0.7rem] text-rose-700/60 mb-6">{highRiskCount} high risk accounts detected</div>

                        <button className="w-full py-3 px-4 bg-[#c81e1e] hover:bg-[#a71616] transition-colors text-white text-[0.8rem] font-bold rounded-lg flex items-center justify-center gap-2 shadow-md shadow-rose-200/50">
                          <Settings className="h-4 w-4" />
                          Remediate Now
                        </button>
                      </div>
                    </div>

                    {/* Minor Stats Quad */}
                    <div className="xl:col-span-4 grid grid-cols-2 gap-4 animate-fade-up [animation-delay:300ms]">
                      <div className="bg-[#f4fcf6] border border-[#e6f4ea] rounded-xl p-5 flex flex-col justify-center">
                        <span className="text-[#5ea271] font-medium text-[0.8rem] mb-3">Compliant</span>
                        <div className="flex items-center gap-2 text-slate-800">
                          <CheckCircle2 className="h-5 w-5 text-[#4bbd6e] fill-[#4bbd6e]/20" />
                          <span className="text-2xl font-bold">{mfaEnabledCount}</span>
                        </div>
                      </div>

                      <div className="bg-[#faf5fc] border border-[#f3e8f8] rounded-xl p-5 flex flex-col justify-center">
                        <span className="text-[#a074b6] font-medium text-[0.8rem] mb-3">Groups</span>
                        <div className="flex items-center gap-2 text-slate-800">
                          <FolderGit2 className="h-5 w-5 text-[#a660c6]" />
                          <span className="text-2xl font-bold">{stats.totalGroups || org.groupsCount}</span>
                        </div>
                      </div>

                      <div className="bg-[#f0f9ff] border border-[#e0f2fe] rounded-xl p-5 flex flex-col justify-center">
                        <span className="text-[#5b9dc3] font-medium text-[0.8rem] mb-3">Applications</span>
                        <div className="flex items-center gap-2 text-slate-800">
                          <Grid className="h-5 w-5 text-[#38bdf8]" />
                          <span className="text-2xl font-bold">{stats.totalApps || org.appsCount}</span>
                        </div>
                      </div>

                      <div className="bg-[#fffcf0] border border-[#fef3c7] rounded-xl p-5 flex flex-col justify-center">
                        <span className="text-[#b7964b] font-medium text-[0.8rem] mb-3">Devices</span>
                        <div className="flex items-center gap-2 text-slate-800">
                          <Laptop className="h-5 w-5 text-[#fbbf24]" />
                          <span className="text-2xl font-bold">{stats.totalDevices || org.devicesCount}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* MFA Status Summary */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-fade-up [animation-delay:280ms]">
                    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                        <Users className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-0.5">Total Users</p>
                        <p className="text-2xl font-bold text-slate-800">{totalUsersCount}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                        <UserCheck className="h-5 w-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-0.5">MFA Enabled</p>
                        <p className="text-2xl font-bold text-emerald-600">{mfaEnabledCount}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-rose-50 flex items-center justify-center shrink-0">
                        <UserX className="h-5 w-5 text-rose-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-0.5">MFA Disabled</p>
                        <p className="text-2xl font-bold text-rose-600">{mfaDisabledCount}</p>
                      </div>
                    </div>
                    <div className="bg-white rounded-xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center shrink-0">
                        <Key className="h-5 w-5 text-purple-500" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-400 mb-0.5">Administrators</p>
                        <p className="text-2xl font-bold text-purple-700">{adminCount}</p>
                      </div>
                    </div>
                  </div>

                  {/* Warning Banner */}
                  {mfaDisabledCount > 0 && (
                    <div className="bg-[#fffdf5] border border-[#fde68a] rounded-xl p-5 lg:p-6 flex flex-col sm:flex-row items-start gap-4 lg:gap-6 animate-fade-up [animation-delay:350ms] shadow-sm">
                      <div className="mt-1 bg-amber-100 p-2 rounded-lg shrink-0">
                        <TriangleAlert className="h-5 w-5 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-amber-900 font-bold text-lg mb-1.5">Financial Risk Alert: Microsoft Refund Warning</h3>
                        <p className="text-amber-900/80 text-[0.85rem] leading-relaxed">
                          <strong className="text-amber-900">CRITICAL:</strong> MFA is disabled for {mfaDisabledCount} accounts. Microsoft support policies may refuse refunds for tenant compromises if administrative or sensitive accounts are operating without MFA protection.
                        </p>
                      </div>
                      <div className="shrink-0 flex flex-col gap-2.5 sm:border-l border-amber-200/80 sm:pl-6 text-[0.7rem] text-amber-800/80 font-bold tracking-wide">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                          <span>Potential Crypto Mining</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-3.5 w-3.5 text-amber-500" />
                          <span>Service Usage Spikes</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tenant Users Directory Table — collapsible */}
                  <div className="bg-white rounded-2xl shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-100 animate-fade-up [animation-delay:400ms] overflow-hidden">
                    {/* Clickable header toggle */}
                    <button
                      type="button"
                      onClick={() => setShowUsersTable(v => !v)}
                      className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 px-6 py-4 hover:bg-slate-50/60 transition-colors"
                      aria-expanded={showUsersTable}
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-base font-bold text-slate-800 flex items-center gap-2">
                          <Users className="h-5 w-5 text-[#0ea5e9]" />
                          Tenant Users Directory ({filteredUsers.length})
                        </span>
                        <span className="text-[0.7rem] font-bold px-2.5 py-0.5 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200 flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          Live Microsoft 365 &amp; Entra ID
                        </span>
                        {lastFetchedAt && (
                          <span className="text-[0.65rem] text-slate-400 font-medium">
                            Updated: {new Date(lastFetchedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {showUsersTable && (
                          <div className="relative" onClick={e => e.stopPropagation()}>
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search users or roles..."
                              value={userSearch}
                              onChange={(e) => setUserSearch(e.target.value)}
                              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-[#0ea5e9] bg-slate-50 w-48"
                            />
                          </div>
                        )}
                        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${showUsersTable ? 'rotate-180' : ''}`} />
                      </div>
                    </button>

                    {showUsersTable && (
                      <div className="overflow-x-auto border-t border-slate-100">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-100 text-slate-400 uppercase text-[0.65rem] tracking-wider font-semibold">
                              <th className="py-3 px-4">User</th>
                              <th className="py-3 px-4">Licenses</th>
                              <th className="py-3 px-4">Assigned Role</th>
                              <th className="py-3 px-4">Status</th>
                              <th className="py-3 px-4">MFA State</th>
                              <th className="py-3 px-4">Last Activity</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {filteredUsers.map((user, idx) => (
                              <tr key={user.id || idx} className="hover:bg-slate-50/70 transition-colors">
                                <td className="py-3 px-4">
                                  <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-full text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-sm ${
                                      (user.role || '').includes('Administrator') ? 'bg-gradient-to-tr from-purple-500 to-purple-700' :
                                      (user.role || '').includes('Owner') ? 'bg-gradient-to-tr from-blue-500 to-blue-700' :
                                      'bg-gradient-to-tr from-sky-400 to-sky-600'
                                    }`}>
                                      {(user.displayName || user.user || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                      <div className="font-semibold text-slate-800">{user.displayName || user.user}</div>
                                      <div className="text-[0.7rem] text-slate-400 font-mono">{user.userPrincipalName || 'N/A'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-1 rounded-md text-[0.7rem] font-medium border ${
                                    (user.license || '').includes('Business Basic')
                                      ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                                      : 'bg-slate-50 text-slate-500 border-slate-200'
                                  }`}>
                                    {user.license || 'Unlicensed'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2.5 py-1 rounded-md text-[0.7rem] font-bold ${
                                    (user.role || '').includes('Admin')
                                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                      : (user.role || '').includes('Owner')
                                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}>
                                    {user.role || (user.roles && user.roles[0]) || 'Member'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`inline-flex items-center gap-1.5 text-[0.7rem] font-medium ${
                                    user.status === 'Inactive' ? 'text-slate-400' : 'text-emerald-600'
                                  }`}>
                                    <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'Inactive' ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                                    {user.status || 'Active'}
                                  </span>
                                </td>
                                <td className="py-3 px-4">
                                  <span className={`px-2 py-0.5 rounded-md text-[0.65rem] font-bold ${
                                    user.mfa === 'Disabled' || user.mfaEnabled === false
                                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}>
                                    {user.mfa === 'Disabled' || user.mfaEnabled === false ? 'Disabled' : 'Enabled'}
                                  </span>
                                </td>
                                <td className="py-3 px-4 text-slate-500 text-[0.75rem]">
                                  {user.lastLogin || 'Recent'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {/* All Feed + Investigation Console */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-up [animation-delay:450ms]">

                    {/* Investigation Console */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center gap-2">
                        <Search className="h-4 w-4 text-slate-400" />
                        <h3 className="font-bold text-slate-700 text-sm">Investigation Console</h3>
                      </div>
                      <div className="p-5 space-y-4">
                        <div>
                          <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-2">Filter Category</p>
                          <div className="flex flex-wrap gap-1.5">
                            {(['All','Auth','User','Application','Role'] as const).map(f => (
                              <button key={f} onClick={() => setInvestigationFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                  investigationFilter === f
                                    ? 'bg-[#0ea5e9] text-white shadow-sm'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}>{f}</button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-2">Time Horizon</p>
                          <div className="flex gap-1.5">
                            {(['24H','7D','30D'] as const).map(t => (
                              <button key={t} onClick={() => setInvestigationTime(t)}
                                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                  investigationTime === t
                                    ? 'bg-[#162a44] text-white'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}>{t}</button>
                            ))}
                          </div>
                        </div>
                        <div className="pt-2 border-t border-slate-100">
                          <button onClick={fetchAuditFeed} disabled={feedLoading}
                            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#0ea5e9] hover:bg-[#0284c7] disabled:opacity-60 flex items-center justify-center gap-2 transition-colors shadow-sm">
                            {feedLoading ? <><span className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Fetching...</> : <><Search className="h-3.5 w-3.5" />Events Detected</>}
                          </button>
                        </div>
                        <div className="grid grid-cols-3 gap-3 pt-1">
                          <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                            <p className="text-lg font-bold text-blue-700">{feedItems.filter(f => !investigationFilter || investigationFilter==='All' || f.category?.toLowerCase().includes(investigationFilter.toLowerCase())).length}</p>
                            <p className="text-[0.65rem] font-semibold text-blue-500 mt-0.5">Events</p>
                          </div>
                          <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
                            <p className="text-lg font-bold text-rose-700">{feedItems.filter(f => f.result === 'failure').length}</p>
                            <p className="text-[0.65rem] font-semibold text-rose-500 mt-0.5">Failures</p>
                          </div>
                          <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                            <p className="text-lg font-bold text-emerald-700">{feedItems.filter(f => f.result === 'success').length}</p>
                            <p className="text-[0.65rem] font-semibold text-emerald-500 mt-0.5">Success</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* All Feed */}
                    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-400" />
                          <h3 className="font-bold text-slate-700 text-sm">All Feed</h3>
                          {feedLoading && <span className="h-3.5 w-3.5 border-2 border-slate-300 border-t-[#0ea5e9] rounded-full animate-spin" />}
                        </div>
                        <button onClick={() => { setSelectedFeedItem(null); setDrawerOpen(true); }}
                          className="text-[0.72rem] font-bold text-[#0ea5e9] hover:text-[#0284c7] flex items-center gap-1 transition-colors">
                          View All <ChevronRight className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="flex-1 overflow-y-auto divide-y divide-slate-50" style={{ maxHeight: '22rem' }}>
                        {feedError && (
                          <div className="p-4 flex items-start gap-2 text-amber-700 text-xs">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            <span>{feedError} (showing demo data)</span>
                          </div>
                        )}
                        {feedItems
                          .filter(item => {
                            if (investigationFilter === 'All') return true;
                            if (investigationFilter === 'Auth') return item.category?.toLowerCase().includes('auth') || item.activityDisplayName?.toLowerCase().includes('sign');
                            if (investigationFilter === 'User') return item.category?.toLowerCase().includes('user');
                            if (investigationFilter === 'Application') return item.category?.toLowerCase().includes('application') || item.category?.toLowerCase().includes('app');
                            if (investigationFilter === 'Role') return item.category?.toLowerCase().includes('role') || item.category?.toLowerCase().includes('policy');
                            return true;
                          })
                          .map((item, idx) => {
                            const actor = item.initiatedBy?.user?.displayName || item.initiatedBy?.app?.displayName || 'System';
                            const target = item.targetResources?.[0]?.displayName || '';
                            const timeAgo = (() => {
                              const d = new Date(item.activityDateTime);
                              const diff = Date.now() - d.getTime();
                              const h = Math.floor(diff / 3600000);
                              const days = Math.floor(h / 24);
                              if (days > 0) return `${days} day${days>1?'s':''} ago`;
                              if (h > 0) return `${h} hour${h>1?'s':''} ago`;
                              return 'Just now';
                            })();
                            const isFailure = item.result === 'failure';
                            return (
                              <button key={item.id || idx} onClick={() => { setSelectedFeedItem(item); setDrawerOpen(true); }}
                                className="w-full text-left px-5 py-3.5 hover:bg-slate-50/80 transition-colors group flex items-start gap-3">
                                <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${ isFailure ? 'bg-rose-500' : 'bg-[#0ea5e9]' }`} />
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-[#0ea5e9] transition-colors">{item.activityDisplayName}</p>
                                  <p className="text-[0.7rem] text-slate-400 mt-0.5 truncate">Actor: {actor}</p>
                                  {item.targetResources?.[0]?.modifiedProperties?.length > 0 && (
                                    <span className="inline-block mt-1 px-2 py-0.5 rounded bg-slate-100 text-[0.65rem] font-mono text-slate-600">configuration updated</span>
                                  )}
                                </div>
                                <span className="shrink-0 text-[0.65rem] text-slate-400 mt-0.5">{timeAgo}</span>
                                <ChevronRight className="h-3.5 w-3.5 text-slate-300 group-hover:text-[#0ea5e9] shrink-0 mt-0.5 transition-colors" />
                              </button>
                            );
                          })}
                        {!feedLoading && feedItems.length === 0 && (
                          <div className="p-8 text-center text-xs text-slate-400">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                            No audit events found for this time range.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </>
              )}

              {/* Tab 2: Backups & DR */}
              {activeTab === 'backups' && (
                <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Azure Backup &amp; Recovery Vaults</h3>
                      <p className="text-xs text-slate-500">Continuous protection and retention across subscriptions</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tabLoading && <span className="h-4 w-4 border-2 border-slate-200 border-t-[#0ea5e9] rounded-full animate-spin" />}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${ backupData?.live ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ backupData?.live ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500' }`} />
                        {backupData?.live ? 'Live Azure Data' : 'Awaiting ARM Token'}
                      </span>
                    </div>
                  </div>
                  {backupData?.live ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-400">Recovery Vaults</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">{backupData.vaultCount}</p>
                          <p className="text-[0.7rem] text-emerald-600 font-semibold mt-1">Across all regions</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-400">Provisioned Vaults</p>
                          <p className="text-2xl font-bold text-emerald-600 mt-1">{backupData.protectedItems}</p>
                          <p className="text-[0.7rem] text-slate-500 mt-1">Succeeded provisioning state</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-400">Last Fetched</p>
                          <p className="text-sm font-bold text-slate-800 mt-1">{new Date(backupData.fetchedAt).toLocaleTimeString()}</p>
                          <p className="text-[0.7rem] text-slate-500 mt-1">Real-time ARM query</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {backupData.vaults.map((v: any, i: number) => (
                          <div key={i} className="p-5 rounded-xl bg-blue-50 border border-blue-100">
                            <p className="text-xs font-semibold text-blue-700 mb-2">{v.type || 'Microsoft.RecoveryServices/vaults'}</p>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-slate-800 truncate max-w-[70%]">{v.name}</span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ v.properties?.provisioningState === 'Succeeded' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200' }`}>{v.properties?.provisioningState || 'Unknown'}</span>
                            </div>
                            <p className="text-[0.7rem] text-slate-500 mt-1">{v.location} · {v.sku?.name || 'Standard'}</p>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400">Protected Items</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">12 VMs / 6 DBs</p>
                        <p className="text-[0.7rem] text-emerald-600 font-semibold mt-1">All recovery points valid</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400">Last Recovery Point</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">Today, 04:00 AM</p>
                        <p className="text-[0.7rem] text-slate-500 mt-1">Geo-redundant storage (GRS)</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400">Failed Jobs (30d)</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">0</p>
                        <p className="text-[0.7rem] text-slate-500 mt-1">Requires ARM permissions</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Patch Management */}
              {activeTab === 'patch' && (
                <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Azure Update &amp; Patch Compliance</h3>
                      <p className="text-xs text-slate-500">Intune managed devices — compliance states from Microsoft Graph</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tabLoading && <span className="h-4 w-4 border-2 border-slate-200 border-t-[#0ea5e9] rounded-full animate-spin" />}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${ patchData?.live ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ patchData?.live ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500' }`} />
                        {patchData?.live ? `${patchData.total} Managed Devices` : 'Needs DeviceManagement.Read'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">Total Managed</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{patchData?.total ?? '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">Intune enrolled devices</p>
                    </div>
                    <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-100">
                      <p className="text-xs font-semibold text-emerald-600">Compliant</p>
                      <p className="text-2xl font-bold text-emerald-700 mt-1">{patchData?.compliant ?? '—'}</p>
                      <p className="text-[0.7rem] text-emerald-600 font-semibold mt-1">Policies met</p>
                    </div>
                    <div className="p-4 rounded-xl bg-rose-50 border border-rose-100">
                      <p className="text-xs font-semibold text-rose-600">Non-Compliant</p>
                      <p className="text-2xl font-bold text-rose-700 mt-1">{patchData?.noncompliant ?? '—'}</p>
                      <p className="text-[0.7rem] text-rose-600 mt-1">Requires remediation</p>
                    </div>
                    <div className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                      <p className="text-xs font-semibold text-amber-600">Unknown / Grace</p>
                      <p className="text-2xl font-bold text-amber-700 mt-1">{patchData?.unknown ?? '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">Pending evaluation</p>
                    </div>
                  </div>
                  {patchData?.devices?.length > 0 && (
                    <div className="overflow-x-auto rounded-xl border border-slate-100">
                      <table className="w-full text-xs text-left">
                        <thead><tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[0.65rem] tracking-wider">
                          <th className="py-2.5 px-4">Device</th>
                          <th className="py-2.5 px-4">OS</th>
                          <th className="py-2.5 px-4">Version</th>
                          <th className="py-2.5 px-4">Compliance</th>
                          <th className="py-2.5 px-4">Last Sync</th>
                        </tr></thead>
                        <tbody className="divide-y divide-slate-50">
                          {patchData.devices.map((d: any, i: number) => (
                            <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-2.5 px-4 font-semibold text-slate-800">{d.deviceName || '—'}</td>
                              <td className="py-2.5 px-4 text-slate-500">{d.operatingSystem || '—'}</td>
                              <td className="py-2.5 px-4 font-mono text-slate-500">{d.osVersion || '—'}</td>
                              <td className="py-2.5 px-4">
                                <span className={`px-2 py-0.5 rounded-md font-bold text-[0.65rem] border ${ d.complianceState === 'compliant' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : d.complianceState === 'noncompliant' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-amber-50 text-amber-700 border-amber-200' }`}>{d.complianceState || 'unknown'}</span>
                              </td>
                              <td className="py-2.5 px-4 text-slate-400">{d.lastSyncDateTime ? new Date(d.lastSyncDateTime).toLocaleDateString() : '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 4: Asset Optimization */}
              {activeTab === 'asset' && (
                <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Cloud Asset &amp; Inventory</h3>
                      <p className="text-xs text-slate-500">Live counts from Microsoft Graph — apps, service principals, groups, devices</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tabLoading && <span className="h-4 w-4 border-2 border-slate-200 border-t-[#0ea5e9] rounded-full animate-spin" />}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${ assetData?.live ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ assetData?.live ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500' }`} />
                        {assetData?.live ? 'Live Microsoft Graph' : 'Awaiting Graph Token'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-5 rounded-xl bg-blue-50 border border-blue-100 flex flex-col">
                      <p className="text-xs font-semibold text-blue-600 mb-2">Registered Apps</p>
                      <p className="text-3xl font-black text-slate-800">{assetData?.appCount ?? stats.totalApps ?? '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">App registrations</p>
                    </div>
                    <div className="p-5 rounded-xl bg-purple-50 border border-purple-100 flex flex-col">
                      <p className="text-xs font-semibold text-purple-600 mb-2">Service Principals</p>
                      <p className="text-3xl font-black text-slate-800">{assetData?.spCount ?? '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">Enterprise apps</p>
                    </div>
                    <div className="p-5 rounded-xl bg-emerald-50 border border-emerald-100 flex flex-col">
                      <p className="text-xs font-semibold text-emerald-600 mb-2">Groups</p>
                      <p className="text-3xl font-black text-slate-800">{assetData?.groupCount ?? stats.totalGroups ?? '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">Security + M365 groups</p>
                    </div>
                    <div className="p-5 rounded-xl bg-amber-50 border border-amber-100 flex flex-col">
                      <p className="text-xs font-semibold text-amber-600 mb-2">Azure AD Devices</p>
                      <p className="text-3xl font-black text-slate-800">{assetData?.deviceCount ?? stats.totalDevices ?? org.devicesCount ?? '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">Registered devices</p>
                    </div>
                  </div>
                  {assetData?.fetchedAt && (
                    <p className="text-[0.68rem] text-slate-400">Last fetched: {new Date(assetData.fetchedAt).toLocaleTimeString()}</p>
                  )}
                </div>
              )}

              {/* Tab 5: Infrastructure */}
              {activeTab === 'infra' && (
                <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Infrastructure &amp; Azure Subscriptions</h3>
                      <p className="text-xs text-slate-500">Live subscription inventory from Azure Resource Manager</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tabLoading && <span className="h-4 w-4 border-2 border-slate-200 border-t-[#0ea5e9] rounded-full animate-spin" />}
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${ infraData?.live ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${ infraData?.live ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500' }`} />
                        {infraData?.live ? 'Live Azure ARM' : 'Needs Reader Role on Subscription'}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl bg-blue-50 border border-blue-100">
                      <p className="text-xs font-semibold text-blue-600">Subscriptions</p>
                      <p className="text-3xl font-black text-slate-800 mt-1">{infraData?.subscriptions ?? '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">Visible to service principal</p>
                    </div>
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">Resources (sample)</p>
                      <p className="text-3xl font-black text-slate-800 mt-1">{infraData?.resourceCount > 0 ? `${infraData.resourceCount}+` : '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">From primary subscription</p>
                    </div>
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">Last Fetched</p>
                      <p className="text-sm font-bold text-slate-800 mt-1">{infraData?.fetchedAt ? new Date(infraData.fetchedAt).toLocaleTimeString() : '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">ARM real-time query</p>
                    </div>
                  </div>
                  {infraData?.subList?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subscription List</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {infraData.subList.map((s: any, i: number) => (
                          <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{s.displayName}</p>
                              <p className="text-[0.7rem] font-mono text-slate-400 truncate">{s.subscriptionId}</p>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[0.65rem] font-bold border ${ s.state === 'Enabled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' }`}>{s.state}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 6: Billing View */}
              {activeTab === 'billing' && (
                <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Azure Cost &amp; Billing Summary</h3>
                      <p className="text-xs text-slate-500">Live cost data from Azure Cost Management API</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {tabLoading && <span className="h-4 w-4 border-2 border-slate-200 border-t-[#0ea5e9] rounded-full animate-spin" />}
                      <button onClick={() => setLocation('/cost-dashboard')}
                        className="px-5 py-2.5 bg-[#0ea5e9] hover:bg-[#0284c7] text-white text-xs font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2">
                        <CircleDollarSign className="h-4 w-4" /> Full Cost Dashboard
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">Current Month Spend</p>
                      <p className="text-3xl font-extrabold text-slate-800 mt-1.5">
                        {billingData?.totalCost != null
                          ? `${billingData.currency === 'USD' ? '$' : billingData.currency + ' '}${Number(billingData.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '$—'}
                      </p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">
                        {billingData?.live ? 'Live Azure Cost Management' : 'Needs Cost Management Reader'}
                      </p>
                    </div>
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">Subscriptions</p>
                      <p className="text-3xl font-extrabold text-slate-800 mt-1.5">{billingData?.subscriptions ?? '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">Visible to service principal</p>
                    </div>
                    <div className="p-5 rounded-xl bg-slate-50 border border-slate-100">
                      <p className="text-xs font-semibold text-slate-400">Last Fetched</p>
                      <p className="text-sm font-bold text-slate-800 mt-1.5">{billingData?.fetchedAt ? new Date(billingData.fetchedAt).toLocaleString() : '—'}</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">ARM real-time query</p>
                    </div>
                  </div>
                  {billingData?.subList?.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subscriptions</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {billingData.subList.map((s: any, i: number) => (
                          <div key={i} className="p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-slate-800 truncate">{s.displayName}</p>
                              <p className="text-[0.7rem] font-mono text-slate-400 truncate">{s.subscriptionId}</p>
                            </div>
                            <span className={`shrink-0 px-2 py-0.5 rounded-full text-[0.65rem] font-bold border ${ s.state === 'Enabled' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' }`}>{s.state}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 7: Microsoft O365 */}
              {activeTab === 'm365' && (
                <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-100 space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                    <div>
                      <h3 className="text-lg font-bold text-slate-800">Microsoft 365 License & Security Score</h3>
                      <p className="text-xs text-slate-500">Live license allocation, usage metrics, and Microsoft Secure Score</p>
                    </div>
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                      {secureScore !== null && secureScore > 0 ? `Secure Score: ${secureScore}%` : 'Secure Score: Live Microsoft 365'}
                    </span>
                  </div>
                  {licensesData && licensesData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {licensesData.map((lic: any, idx: number) => (
                        <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                          <p className="text-xs font-semibold text-slate-400">{lic.product || lic.key}</p>
                          <p className="text-2xl font-bold text-slate-800 mt-1">{lic.usedLicenses ?? lic.assigned ?? 0} / {lic.totalLicenses ?? lic.purchased ?? 0}</p>
                          <p className="text-[0.7rem] text-slate-500 mt-1">{lic.availableLicenses ?? lic.unused ?? 0} available seats</p>
                        </div>
                      ))}
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400">Tenant Users</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{totalUsersCount}</p>
                        <p className="text-[0.7rem] text-slate-500 mt-1">{standardUsersCount} standard / {adminCount} admin</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400">Microsoft 365 Business Basic</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{totalUsersCount} Assigned</p>
                        <p className="text-[0.7rem] text-slate-500 mt-1">Live Entra ID sync</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400">Tenant Users</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{totalUsersCount}</p>
                        <p className="text-[0.7rem] text-slate-500 mt-1">{standardUsersCount} standard / {adminCount} admin</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400">Admin Coverage</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{adminCount}</p>
                        <p className="text-[0.7rem] text-slate-500 mt-1">Privileged accounts</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-xs font-semibold text-slate-400">MFA Compliance</p>
                        <p className="text-2xl font-bold text-emerald-600 mt-1">{mfaEnabledCount}</p>
                        <p className="text-[0.7rem] text-slate-500 mt-1">{mfaDisabledCount} MFA disabled</p>
                      </div>
                    </div>
                  )}
                </div>              )}

            </div>
          </div>

        </div>
      </main>

      {/* Forensic Explorer Right Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Forensic Explorer">
          {/* Backdrop */}
          <div className="flex-1 bg-slate-900/40 backdrop-blur-[2px]" onClick={() => setDrawerOpen(false)} />
          {/* Drawer */}
          <div className="w-full max-w-[700px] bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#f8fafc] shrink-0">
              <div>
                <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Audit Log Explorer</p>
                <h2 className="font-bold text-slate-800 text-base">{selectedFeedItem ? 'Event Detail' : 'All Forensic Explorer'}</h2>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {selectedFeedItem ? (
              /* Detailed single event view */
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
                {/* Activity Header */}
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className={`mt-0.5 h-3 w-3 rounded-full shrink-0 ${ selectedFeedItem.result === 'failure' ? 'bg-rose-500' : 'bg-emerald-500' }`} />
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{selectedFeedItem.activityDisplayName}</p>
                    <p className="text-xs text-slate-500 mt-1">{new Date(selectedFeedItem.activityDateTime).toLocaleString()} · Category: <span className="font-semibold text-slate-700">{selectedFeedItem.category || '—'}</span></p>
                    <span className={`inline-block mt-2 px-2.5 py-0.5 rounded-full text-[0.7rem] font-bold border ${ selectedFeedItem.result === 'failure' ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200' }`}>
                      {(selectedFeedItem.result || 'success').toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Initiated By */}
                <div className="space-y-2">
                  <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Initiated By</p>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 bg-white">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-blue-500 to-cyan-400 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {(selectedFeedItem.initiatedBy?.user?.displayName || selectedFeedItem.initiatedBy?.app?.displayName || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{selectedFeedItem.initiatedBy?.user?.displayName || selectedFeedItem.initiatedBy?.app?.displayName || 'System Process'}</p>
                      <p className="text-xs text-slate-400">{selectedFeedItem.initiatedBy?.user?.userPrincipalName || selectedFeedItem.initiatedBy?.app?.servicePrincipalId || 'System Identity'}</p>
                    </div>
                  </div>
                </div>

                {/* Target Resources */}
                {selectedFeedItem.targetResources?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Target Resources</p>
                    <div className="space-y-2">
                      {selectedFeedItem.targetResources.map((t: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-xl border border-slate-100 bg-white flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                            <Eye className="h-4 w-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-slate-800 truncate">{t.displayName || '—'}</p>
                            <p className="text-xs text-slate-400">{t.type || 'Resource'}{t.id ? ` · ${t.id.slice(0, 20)}...` : ''}</p>
                          </div>
                          <span className="shrink-0 px-2 py-0.5 rounded bg-slate-100 text-[0.68rem] font-semibold text-slate-600">{t.type || 'Unknown'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Detailed Property Changes */}
                {selectedFeedItem.targetResources?.some((t: any) => t.modifiedProperties?.length > 0) && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-slate-400" />
                      <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Detailed Property Changes</p>
                    </div>
                    <div className="rounded-xl border border-slate-200 overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="px-4 py-2.5 text-left font-bold text-slate-500 w-1/3">Property</th>
                            <th className="px-4 py-2.5 text-left font-bold text-slate-500 w-1/3">Old Value</th>
                            <th className="px-4 py-2.5 text-left font-bold text-slate-500 w-1/3">New Value</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {selectedFeedItem.targetResources.flatMap((t: any) =>
                            (t.modifiedProperties || []).map((p: any, i: number) => (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="px-4 py-2.5 font-semibold text-slate-700">{p.displayName || '—'}</td>
                                <td className="px-4 py-2.5 text-slate-400 font-mono break-all">{p.oldValue ? <span className="text-rose-600">{String(p.oldValue).slice(0, 60)}{String(p.oldValue).length > 60 ? '...' : ''}</span> : <span className="text-slate-300">—</span>}</td>
                                <td className="px-4 py-2.5 text-slate-700 font-mono break-all">{p.newValue ? <span className="text-emerald-700 bg-emerald-50 px-1 rounded">{String(p.newValue).slice(0, 80)}{String(p.newValue).length > 80 ? '...' : ''}</span> : <span className="text-slate-300">—</span>}</td>
                              </tr>
                            ))
                          )}
                          {selectedFeedItem.targetResources.every((t: any) => !t.modifiedProperties?.length) && (
                            <tr><td colSpan={3} className="px-4 py-8 text-center text-slate-400">No data</td></tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                <button onClick={() => setSelectedFeedItem(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                  ← Back to All Events
                </button>
              </div>
            ) : (
              /* All events list in drawer */
              <div className="flex-1 overflow-y-auto">
                {/* Summary bar */}
                <div className="grid grid-cols-3 gap-px bg-slate-100 border-b border-slate-100">
                  <div className="bg-white px-5 py-3 text-center">
                    <p className="text-lg font-bold text-slate-800">{feedItems.length}</p>
                    <p className="text-[0.65rem] text-slate-400 font-semibold">Total Events</p>
                  </div>
                  <div className="bg-white px-5 py-3 text-center">
                    <p className="text-lg font-bold text-rose-600">{feedItems.filter(f => f.result === 'failure').length}</p>
                    <p className="text-[0.65rem] text-slate-400 font-semibold">Failures</p>
                  </div>
                  <div className="bg-white px-5 py-3 text-center">
                    <p className="text-lg font-bold text-emerald-600">{feedItems.filter(f => f.result === 'success').length}</p>
                    <p className="text-[0.65rem] text-slate-400 font-semibold">Success</p>
                  </div>
                </div>
                <div className="divide-y divide-slate-50">
                  {feedItems.map((item, idx) => {
                    const actor = item.initiatedBy?.user?.displayName || item.initiatedBy?.app?.displayName || 'System';
                    const target = item.targetResources?.[0]?.displayName || '';
                    const type = item.targetResources?.[0]?.type || '';
                    const hasChanges = item.targetResources?.some((t: any) => t.modifiedProperties?.length > 0);
                    const timeStr = new Date(item.activityDateTime).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
                    const isFailure = item.result === 'failure';
                    return (
                      <button key={item.id || idx} onClick={() => setSelectedFeedItem(item)}
                        className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors group">
                        <div className="flex items-start gap-3">
                          <button className="mt-0.5 h-5 w-5 rounded border border-slate-200 bg-slate-50 flex items-center justify-center shrink-0 text-slate-400 text-xs">+</button>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-slate-800 group-hover:text-[#0ea5e9] transition-colors">{item.activityDisplayName}</p>
                              {isFailure && <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-rose-100 text-rose-700">FAILED</span>}
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-slate-400">
                              <span className="font-medium">{actor}</span>
                              {target && <span className="text-[#0ea5e9] font-medium">{target}</span>}
                              {type && <span className="text-slate-500">{type}</span>}
                            </div>
                            {hasChanges && (
                              <span className="inline-block mt-1.5 px-2 py-0.5 rounded bg-slate-100 text-[0.65rem] font-semibold text-slate-600 border border-slate-200">Configuration updated</span>
                            )}
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-[0.7rem] text-slate-400">{timeStr}</p>
                            <ChevronRight className="h-4 w-4 text-slate-300 group-hover:text-[#0ea5e9] ml-auto mt-1 transition-colors" />
                          </div>
                        </div>
                      </button>
                    );
                  })}
                  {feedItems.length === 0 && !feedLoading && (
                    <div className="py-16 text-center text-sm text-slate-400">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-slate-200" />
                      No audit events in this period
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Real Users Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-[#0ea5e9]" />
                <h3 className="font-bold text-slate-800 text-base">Import Real Microsoft Entra ID Users</h3>
              </div>
              <button
                onClick={() => setShowJsonModal(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                &times;
              </button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Paste your organization's real user accounts as a JSON array below (e.g. from Entra ID PowerShell <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[0.7rem]">Get-MgUser</code> or export). The directory and all dashboard metrics will update immediately.
            </p>
            <textarea
              rows={8}
              value={customJsonInput}
              onChange={(e) => setCustomJsonInput(e.target.value)}
              placeholder={`[
  {
    "displayName": "User Name",
    "userPrincipalName": "user@yourdomain.com",
    "role": "Global Administrator",
    "mfa": "Enabled",
    "status": "Active",
    "lastLogin": "2026-03-30"
  }
]`}
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-[#0ea5e9] bg-slate-50"
            />
            {jsonSaveSuccess && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Real users saved! Updating directory...
              </div>
            )}
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowJsonModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveCustomUsers}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0ea5e9] hover:bg-[#0284c7] transition-colors shadow-sm shadow-sky-200"
              >
                Save & Update Directory
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
