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
  Eye,
  Fingerprint,
  DatabaseBackup,
  BadgeCheck,
  Boxes,
  Gauge,
  ReceiptText,
  PanelsTopLeft,
  Sparkles,
  Shield,
  Layers,
  ArrowUpRight,
  ExternalLink,
  SlidersHorizontal,
  Upload,
  LogOut,
  ChevronLeft,
  Menu
} from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { getLiveApiHeaders, LIVE_API_BASE } from '@/lib/live-api';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend
} from 'recharts';

const SIDEBAR_ITEMS = [
  { id: 'identity', label: 'Identity & Access', subLabel: 'Organization Entra ID', icon: Fingerprint, group: 'core' },
  { id: 'm365', label: 'Microsoft O365', subLabel: 'Licenses & Usage', icon: PanelsTopLeft, group: 'core' },
  { id: 'backups', label: 'Backups & DR', subLabel: 'Azure Recovery Vaults', icon: DatabaseBackup, group: 'operations' },
  { id: 'patch', label: 'Patch Compliance', subLabel: 'Intune Managed Devices', icon: ShieldCheck, group: 'operations' },
  { id: 'asset', label: 'Cloud Inventory', subLabel: 'Apps & Service Principals', icon: Boxes, group: 'operations' },
  { id: 'infra', label: 'Infrastructure', subLabel: 'ARM Subscriptions', icon: Server, group: 'operations' },
  { id: 'billing', label: 'Cost & Billing', subLabel: 'Azure Cost Management', icon: ReceiptText, group: 'operations' },
];

// Toggle flag to show/hide Cloud Operations menu items (hidden per client request)
const SHOW_CLOUD_OPERATIONS = false;

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
  const [copiedTenant, setCopiedTenant] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

      // 2. Process M365 Secure Score
      if (securityRes.status === 'fulfilled') {
        try {
          const scJson = await securityRes.value.json();
          if (scJson?.success && scJson?.data?.overall?.percentage !== undefined) {
            setSecureScore(scJson.data.overall.percentage);
          }
        } catch {}
      }

      // 3. Process M365 License Data
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

      // 4. Process Applications
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

      // 5. Process Tenant Users
      if (usersRes.status === 'fulfilled') {
        try {
          const usersJson = await usersRes.value.json();
          const isLive = usersRes.value.ok && Array.isArray(usersJson?.users) && usersJson.users.length > 0;
          const src = usersJson?.source || (isLive ? 'graph' : 'none');
          setIsLiveGraph(isLive);
          setDataSource(src as any);
          setLastFetchedAt(usersJson?.fetchedAt || usersJson?.cachedAt || new Date().toISOString());
          setGraphError(isLive ? null : (usersJson?.detail || usersJson?.error || (usersRes.value.ok ? 'The users API returned HTTP 200 but no user records.' : `Live users API returned HTTP ${usersRes.value.status}.`)));

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

  const mfaCoveragePercent = totalUsersCount > 0 ? Math.round((mfaEnabledCount / totalUsersCount) * 100) : 0;

  // Chart data for Recharts
  const userSecurityPieData = useMemo(() => [
    { name: 'MFA Enabled', value: mfaEnabledCount, color: '#10b981' },
    { name: 'MFA Disabled (At Risk)', value: mfaDisabledCount, color: '#f43f5e' },
    { name: 'Global Admins', value: globalAdminCount, color: '#8b5cf6' },
  ].filter(d => d.value > 0), [mfaEnabledCount, mfaDisabledCount, globalAdminCount]);

  const auditEventsBarData = useMemo(() => {
    const cats: Record<string, { category: string; success: number; failure: number }> = {};
    feedItems.forEach(item => {
      const c = item.category || 'Other';
      if (!cats[c]) cats[c] = { category: c, success: 0, failure: 0 };
      if (item.result === 'failure') cats[c].failure += 1;
      else cats[c].success += 1;
    });
    return Object.values(cats).slice(0, 5);
  }, [feedItems]);

  const handleCopyTenant = () => {
    navigator.clipboard.writeText(tenantId);
    setCopiedTenant(true);
    setTimeout(() => setCopiedTenant(false), 2000);
  };

  return (
    <div className="flex h-screen w-full bg-[#0a0f1d] text-slate-100 font-sans overflow-hidden antialiased">

      {/* Modern Dark Navy Sidebar */}
      <aside className={`transition-all duration-300 ease-in-out shrink-0 bg-[#090e1a] border-r border-slate-800/80 flex flex-col z-30 ${
        sidebarCollapsed ? 'w-20' : 'w-72'
      } hidden md:flex`}>
        {/* Sidebar Brand Header */}
        <div className="h-20 px-5 flex items-center justify-between border-b border-slate-800/70">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="relative shrink-0">
              <img
                src="/ZensusTech_Logo.PNG"
                alt="ZensusTech"
                className="h-10 w-10 object-contain rounded-xl shadow-md border border-slate-700/60 bg-slate-900"
              />
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-500 border-2 border-[#090e1a]" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 leading-none">
                  <span className="font-bold text-white text-[1.05rem] tracking-tight">ZensusTech</span>
                  <span className="text-[0.65rem] px-1.5 py-0.5 rounded font-mono font-bold bg-sky-500/20 text-sky-400 border border-sky-500/30">Ops</span>
                </div>
                <p className="text-[0.65rem] font-semibold text-slate-400 tracking-wider uppercase mt-1">
                  Cloud Management
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-200 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Sidebar Navigation */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {/* Core Tiles Section */}
          <div>
            {!sidebarCollapsed && (
              <p className="px-3 text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-2">
                Core Governance
              </p>
            )}
            <nav className="space-y-1">
              {SIDEBAR_ITEMS.filter(item => item.group === 'core').map(item => {
                const isActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative ${
                      isActive
                        ? 'bg-gradient-to-r from-sky-500/20 to-blue-600/10 text-white font-semibold border border-sky-500/30 shadow-lg shadow-sky-500/5'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    }`}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                    )}
                    <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                      isActive ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}>
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    {!sidebarCollapsed && (
                      <div className="min-w-0 flex-1">
                        <div className="text-sm truncate">{item.label}</div>
                        <div className="text-[0.68rem] text-slate-400 truncate">{item.subLabel}</div>
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Cloud Operations Section (Hidden for now - can be re-enabled via SHOW_CLOUD_OPERATIONS) */}
          {SHOW_CLOUD_OPERATIONS && (
            <div>
              {!sidebarCollapsed && (
                <p className="px-3 text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-2">
                  Cloud Operations
                </p>
              )}
              <nav className="space-y-1">
                {SIDEBAR_ITEMS.filter(item => item.group === 'operations').map(item => {
                  const isActive = activeTab === item.id;
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 group relative ${
                        isActive
                          ? 'bg-gradient-to-r from-sky-500/20 to-blue-600/10 text-white font-semibold border border-sky-500/30 shadow-lg shadow-sky-500/5'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r bg-sky-400 shadow-[0_0_8px_#38bdf8]" />
                      )}
                      <div className={`p-1.5 rounded-lg shrink-0 transition-colors ${
                        isActive ? 'bg-sky-500/20 text-sky-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}>
                        <Icon className="h-4.5 w-4.5" />
                      </div>
                      {!sidebarCollapsed && (
                        <div className="min-w-0 flex-1">
                          <div className="text-sm truncate">{item.label}</div>
                          <div className="text-[0.68rem] text-slate-400 truncate">{item.subLabel}</div>
                        </div>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Sidebar Footer & Live Status Card */}
        <div className="p-3 border-t border-slate-800/70 space-y-2 bg-[#060a14]/60">
          {!sidebarCollapsed ? (
            <div className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[0.7rem] font-bold text-slate-300 flex items-center gap-1.5">
                  <span className={`h-2 w-2 rounded-full ${isLiveGraph ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isLiveGraph ? 'Microsoft Graph' : 'Sync Pending'}
                </span>
                <span className="text-[0.65rem] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  LIVE
                </span>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 bg-slate-900/80 px-2 py-1.5 rounded-lg border border-slate-800">
                <span className="font-mono text-[0.68rem] truncate max-w-[130px]">{tenantId}</span>
                <button
                  onClick={handleCopyTenant}
                  title="Copy Tenant ID"
                  className="p-1 hover:text-white transition-colors"
                >
                  {copiedTenant ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex justify-center py-2">
              <span className={`h-3 w-3 rounded-full ${isLiveGraph ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} title="Graph Live Status" />
            </div>
          )}

          <button
            onClick={() => setLocation('/cost-dashboard')}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 transition-colors border border-slate-700/50 ${
              sidebarCollapsed ? 'px-0' : ''
            }`}
          >
            <CircleDollarSign className="h-4 w-4 text-sky-400" />
            {!sidebarCollapsed && <span>Cost Analytics</span>}
          </button>
        </div>
      </aside>

      {/* Main App Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#f8fafc] text-slate-800 overflow-hidden">

        {/* Modern SaaS Topbar */}
        <header className="h-16 px-6 lg:px-8 border-b border-slate-200/80 bg-white/95 backdrop-blur-md flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">ZenAIOps</span>
              <span className="text-slate-300">/</span>
              <h1 className="text-base font-bold text-slate-800 flex items-center gap-2">
                <CurrentIcon className="h-4.5 w-4.5 text-sky-500" />
                {currentTab.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Indicator Pill */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{isLiveGraph ? 'Graph Live Data' : 'Tenant Active'}</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchStats}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            {/* Import Users Button */}
            <button
              onClick={() => setShowJsonModal(true)}
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs"
            >
              <Upload className="h-3.5 w-3.5 text-slate-500" />
              <span>Import Users</span>
            </button>

            {/* Logout Button */}
            <button
              onClick={() => {
                sessionStorage.clear();
                setLocation('/');
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors shadow-xs"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Log Out</span>
            </button>
          </div>
        </header>

        {/* Scrollable Dashboard Body */}
        <main className="flex-1 overflow-y-auto p-5 sm:p-6 lg:p-8 space-y-6 custom-scrollbar bg-[#f4f7fb]">
          <div className="max-w-[1600px] mx-auto space-y-6">

            {/* Organization Info Banner Card */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-600 to-blue-700 text-white font-black text-2xl flex items-center justify-center shadow-md shadow-sky-600/20">
                    {initial}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <h2 className="text-xl font-bold text-slate-900 tracking-tight">{org.displayName}</h2>
                      <span className="bg-slate-100 text-slate-600 text-[0.65rem] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase flex items-center gap-1">
                        <Globe className="h-3 w-3" /> {org.countryLetterCode || 'IN'}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 text-[0.65rem] font-bold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1">
                        <ShieldCheck className="h-3 w-3" /> {org.license || 'Microsoft Entra ID P1'}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1.5">
                      <span className="font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">
                        {org.primaryDomain || 'zensustech.com'}
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <MapPin className="h-3.5 w-3.5" /> {locationString || 'Pune, MH'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Tenant ID Badge with Copy */}
                <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100">
                  <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                    <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Directory Tenant ID</p>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-800">{tenantId}</span>
                      <button
                        onClick={handleCopyTenant}
                        title="Copy Tenant ID"
                        className="p-1 text-slate-400 hover:text-sky-600 rounded transition-colors"
                      >
                        {copiedTenant ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                    <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Subscription Tier</p>
                    <div className="flex items-center gap-1.5 font-bold text-xs text-slate-700">
                      <span>Production Cloud</span>
                      <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* TAB 1: IDENTITY & ACCESS (Primary View) */}
            {activeTab === 'identity' && (
              <>
                {/* Primary Metric KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                  {/* KPI 1: Total Users */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-sky-300 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
                      <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <Users className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
                      {totalUsersCount}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[0.7rem] font-semibold">
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {standardUsersCount} Standard
                      </span>
                      <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200">
                        {globalAdminCount} Global Admins
                      </span>
                    </div>
                  </div>

                  {/* KPI 2: High Risk Accounts (MFA Disabled) */}
                  <div className="bg-gradient-to-b from-rose-50/50 to-white rounded-2xl p-5 border border-rose-200/90 shadow-[0_4px_16px_-4px_rgba(244,63,94,0.12)] relative overflow-hidden group hover:border-rose-400 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldAlert className="h-3.5 w-3.5 text-rose-500 animate-pulse" />
                        High Risk
                      </span>
                      <div className="h-9 w-9 rounded-xl bg-rose-100/70 text-rose-600 flex items-center justify-center">
                        <ShieldAlert className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="flex items-baseline gap-2 mb-2">
                      <span className="text-3xl font-black text-rose-600 tracking-tight leading-none">
                        {mfaDisabledCount}
                      </span>
                      <span className="text-xs font-bold text-rose-800">MFA Disabled</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[0.7rem] text-rose-700 font-medium">{highRiskCount} accounts at risk</span>
                      <button
                        onClick={() => setShowUsersTable(true)}
                        className="text-[0.7rem] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        Review <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* KPI 3: Compliant Accounts */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-emerald-300 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliant Users</span>
                      <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 tracking-tight leading-none mb-3">
                      {mfaEnabledCount}
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{mfaCoveragePercent}% MFA Protection Rate</span>
                    </div>
                  </div>

                  {/* KPI 4: Connected Assets */}
                  <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-blue-300 transition-all">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cloud Resources</span>
                      <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Boxes className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3">
                      {(stats.totalApps || org.appsCount) + (stats.totalDevices || org.devicesCount)}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[0.7rem] font-semibold text-slate-600">
                      <span>{stats.totalApps || org.appsCount} Apps</span>
                      <span>·</span>
                      <span>{stats.totalGroups || org.groupsCount} Groups</span>
                      <span>·</span>
                      <span>{stats.totalDevices || org.devicesCount} Devices</span>
                    </div>
                  </div>
                </div>

                {/* Analytics & Gauge Row: Interactive MFA Security Gauge + User Security Distribution */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                  {/* MFA Security Gauge (Left - 5 Cols) */}
                  <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <Gauge className="h-4.5 w-4.5 text-sky-500" />
                          <h3 className="text-sm font-bold text-slate-800">MFA Security Health Gauge</h3>
                        </div>
                        <span className={`text-[0.68rem] font-bold px-2 py-0.5 rounded-full border ${
                          mfaCoveragePercent >= 80
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : mfaCoveragePercent >= 50
                            ? 'bg-amber-50 text-amber-700 border-amber-200'
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          {mfaCoveragePercent >= 80 ? 'HIGH POSTURE' : mfaCoveragePercent >= 50 ? 'MODERATE RISK' : 'CRITICAL RISK'}
                        </span>
                      </div>

                      {/* Custom SVG Radial Gauge */}
                      <div className="py-6 flex flex-col items-center justify-center relative">
                        <div className="relative w-48 h-48 flex items-center justify-center">
                          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                            {/* Background Track */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke="#e2e8f0"
                              strokeWidth="9"
                              strokeDasharray="251.2"
                              strokeDashoffset="0"
                            />
                            {/* Animated Active Arc */}
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={mfaCoveragePercent >= 80 ? '#10b981' : mfaCoveragePercent >= 50 ? '#f59e0b' : '#f43f5e'}
                              strokeWidth="9"
                              strokeDasharray="251.2"
                              strokeDashoffset={251.2 - (251.2 * mfaCoveragePercent) / 100}
                              strokeLinecap="round"
                              className="transition-all duration-1000 ease-out"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center justify-center text-center">
                            <span className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                              {mfaCoveragePercent}%
                            </span>
                            <span className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mt-1">
                              MFA Coverage
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Breakdown Strip */}
                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-100 text-center">
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100">
                        <p className="text-xs font-bold text-emerald-800">{mfaEnabledCount}</p>
                        <p className="text-[0.65rem] font-semibold text-emerald-600">Protected</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-rose-50/70 border border-rose-100">
                        <p className="text-xs font-bold text-rose-800">{mfaDisabledCount}</p>
                        <p className="text-[0.65rem] font-semibold text-rose-600">At Risk</p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-purple-50/70 border border-purple-100">
                        <p className="text-xs font-bold text-purple-800">{globalAdminCount}</p>
                        <p className="text-[0.65rem] font-semibold text-purple-600">Admins</p>
                      </div>
                    </div>
                  </div>

                  {/* Interactive Recharts Distribution & Trends (Right - 7 Cols) */}
                  <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                        <div className="flex items-center gap-2">
                          <Activity className="h-4.5 w-4.5 text-sky-500" />
                          <h3 className="text-sm font-bold text-slate-800">Security & Role Distribution</h3>
                        </div>
                        <span className="text-xs text-slate-400 font-medium">Real-time Directory Insights</span>
                      </div>

                      <div className="h-56 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={[
                            { name: 'Standard Users', count: standardUsersCount, fill: '#3b82f6' },
                            { name: 'MFA Protected', count: mfaEnabledCount, fill: '#10b981' },
                            { name: 'MFA Disabled', count: mfaDisabledCount, fill: '#f43f5e' },
                            { name: 'Global Admins', count: globalAdminCount, fill: '#8b5cf6' },
                            { name: 'Registered Apps', count: stats.totalApps || org.appsCount, fill: '#0ea5e9' }
                          ]}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                            <RechartsTooltip
                              contentStyle={{
                                backgroundColor: '#0f172a',
                                border: '1px solid #1e293b',
                                borderRadius: '10px',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: 600
                              }}
                            />
                            <Bar dataKey="count" radius={[6, 6, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#10b981]" /> Compliant</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#f43f5e]" /> High Risk</span>
                        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-sm bg-[#8b5cf6]" /> Admins</span>
                      </div>
                      <button onClick={() => setShowUsersTable(!showUsersTable)} className="text-sky-600 hover:text-sky-700 font-bold flex items-center gap-1">
                        View Directory Table <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* High Risk Security Alert Banner (Clean Modern SaaS Alert) */}
                {mfaDisabledCount > 0 && (
                  <div className="bg-gradient-to-r from-rose-500/10 via-rose-500/5 to-white border border-rose-200/90 rounded-2xl p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5">
                      <div className="h-10 w-10 rounded-xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/20">
                        <TriangleAlert className="h-5 w-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-rose-950 flex items-center gap-2">
                          High Risk Alert: {mfaDisabledCount} Accounts Missing MFA Enforcement
                        </h4>
                        <p className="text-xs text-rose-800/80 mt-0.5 leading-relaxed">
                          Unprotected accounts are vulnerable to credential spray and account takeover. Review the directory and enforce Microsoft Entra conditional access.
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2.5 shrink-0 w-full md:w-auto">
                      <button
                        onClick={() => setShowUsersTable(true)}
                        className="w-full md:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
                      >
                        <Settings className="h-3.5 w-3.5" />
                        Remediate Accounts
                      </button>
                    </div>
                  </div>
                )}

                {/* Collapsible Tenant Users Directory Table */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-sm">Tenant Users Directory ({filteredUsers.length})</h3>
                        <p className="text-xs text-slate-400">Live Microsoft 365 &amp; Entra ID synced identities</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                      <div className="relative flex-1 sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <input
                          type="text"
                          placeholder="Search users, roles, email..."
                          value={userSearch}
                          onChange={(e) => setUserSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:border-sky-500 transition-all"
                        />
                      </div>
                      <button
                        onClick={() => setShowUsersTable(!showUsersTable)}
                        className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-600 transition-colors flex items-center gap-1.5 shrink-0"
                      >
                        <span>{showUsersTable ? 'Collapse' : 'Expand'}</span>
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${showUsersTable ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {showUsersTable && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 uppercase text-[0.65rem] tracking-wider font-semibold">
                            <th className="py-3 px-5">User</th>
                            <th className="py-3 px-5">License</th>
                            <th className="py-3 px-5">Assigned Role</th>
                            <th className="py-3 px-5">Account Status</th>
                            <th className="py-3 px-5">MFA State</th>
                            <th className="py-3 px-5">Last Activity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {filteredUsers.map((user, idx) => (
                            <tr key={user.id || idx} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-5">
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
                              <td className="py-3.5 px-5">
                                <span className={`px-2.5 py-1 rounded-md text-[0.7rem] font-medium border ${
                                  (user.license || '').includes('Business Basic')
                                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-semibold'
                                    : 'bg-slate-50 text-slate-500 border-slate-200'
                                }`}>
                                  {user.license || 'Unlicensed'}
                                </span>
                              </td>
                              <td className="py-3.5 px-5">
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
                              <td className="py-3.5 px-5">
                                <span className={`inline-flex items-center gap-1.5 text-[0.7rem] font-medium ${
                                  user.status === 'Inactive' ? 'text-slate-400' : 'text-emerald-600'
                                }`}>
                                  <span className={`h-1.5 w-1.5 rounded-full ${user.status === 'Inactive' ? 'bg-slate-400' : 'bg-emerald-500'}`} />
                                  {user.status || 'Active'}
                                </span>
                              </td>
                              <td className="py-3.5 px-5">
                                <span className={`px-2.5 py-1 rounded-md text-[0.68rem] font-bold border ${
                                  user.mfa === 'Disabled' || user.mfaEnabled === false
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {user.mfa === 'Disabled' || user.mfaEnabled === false ? 'Disabled' : 'Enabled'}
                                </span>
                              </td>
                              <td className="py-3.5 px-5 text-slate-500 text-[0.75rem]">
                                {user.lastLogin || 'Recent'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Audit Feed & Investigation Console */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

                  {/* Investigation Console */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Search className="h-4 w-4 text-sky-500" />
                        <h3 className="font-bold text-slate-800 text-sm">Forensic Investigation Console</h3>
                      </div>
                      <span className="text-[0.68rem] font-mono font-semibold text-slate-400">AUDIT LOGS</span>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-2">Category Filter</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(['All','Auth','User','Application','Role'] as const).map(f => (
                            <button
                              key={f}
                              onClick={() => setInvestigationFilter(f)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                investigationFilter === f
                                  ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/20'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {f}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-2">Time Horizon</p>
                        <div className="flex gap-2">
                          {(['24H','7D','30D'] as const).map(t => (
                            <button
                              key={t}
                              onClick={() => setInvestigationTime(t)}
                              className={`flex-1 py-1.5 rounded-xl text-xs font-bold transition-all ${
                                investigationTime === t
                                  ? 'bg-slate-900 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 pt-2">
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                          <p className="text-xl font-bold text-blue-700">{feedItems.filter(f => !investigationFilter || investigationFilter==='All' || f.category?.toLowerCase().includes(investigationFilter.toLowerCase())).length}</p>
                          <p className="text-[0.65rem] font-semibold text-blue-500 mt-0.5">Matching Events</p>
                        </div>
                        <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
                          <p className="text-xl font-bold text-rose-700">{feedItems.filter(f => f.result === 'failure').length}</p>
                          <p className="text-[0.65rem] font-semibold text-rose-500 mt-0.5">Failures</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                          <p className="text-xl font-bold text-emerald-700">{feedItems.filter(f => f.result === 'success').length}</p>
                          <p className="text-[0.65rem] font-semibold text-emerald-500 mt-0.5">Success</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audit Feed List */}
                  <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-sky-500" />
                        <h3 className="font-bold text-slate-800 text-sm">Recent Audit Activities</h3>
                        {feedLoading && <span className="h-3 w-3 border-2 border-slate-300 border-t-sky-500 rounded-full animate-spin" />}
                      </div>
                      <button
                        onClick={() => { setSelectedFeedItem(null); setDrawerOpen(true); }}
                        className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 transition-colors"
                      >
                        All Logs <ChevronRight className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <div className="flex-1 overflow-y-auto divide-y divide-slate-100" style={{ maxHeight: '22rem' }}>
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
                          const isFailure = item.result === 'failure';
                          return (
                            <button
                              key={item.id || idx}
                              onClick={() => { setSelectedFeedItem(item); setDrawerOpen(true); }}
                              className="w-full text-left px-5 py-3 hover:bg-slate-50 transition-colors group flex items-start gap-3"
                            >
                              <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${isFailure ? 'bg-rose-500' : 'bg-sky-500'}`} />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-slate-800 truncate group-hover:text-sky-600 transition-colors">{item.activityDisplayName}</p>
                                <p className="text-[0.7rem] text-slate-400 mt-0.5 truncate">Actor: {actor}</p>
                              </div>
                              <span className="shrink-0 text-[0.65rem] text-slate-400 mt-1">
                                {new Date(item.activityDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 2: BACKUPS & DR */}
            {activeTab === 'backups' && (
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-200/80 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Azure Backup &amp; Recovery Vaults</h3>
                    <p className="text-xs text-slate-500">Continuous protection and retention across subscriptions</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tabLoading && <span className="h-4 w-4 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />}
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${ backupData?.live ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${ backupData?.live ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500' }`} />
                      {backupData?.live ? 'Live Azure Data' : 'Awaiting ARM Token'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-400">Recovery Vaults</p>
                    <p className="text-3xl font-black text-slate-800 mt-1">{backupData?.vaultCount ?? '—'}</p>
                    <p className="text-[0.7rem] text-emerald-600 font-semibold mt-1">Across all regions</p>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-400">Protected Items</p>
                    <p className="text-3xl font-black text-emerald-600 mt-1">{backupData?.protectedItems ?? '12 VMs / 6 DBs'}</p>
                    <p className="text-[0.7rem] text-slate-500 mt-1">Succeeded provisioning state</p>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-400">Last Fetched</p>
                    <p className="text-sm font-bold text-slate-800 mt-2">{backupData?.fetchedAt ? new Date(backupData.fetchedAt).toLocaleTimeString() : 'Real-time query'}</p>
                    <p className="text-[0.7rem] text-slate-500 mt-1">Geo-redundant storage</p>
                  </div>
                </div>

                {backupData?.vaults?.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {backupData.vaults.map((v: any, i: number) => (
                      <div key={i} className="p-5 rounded-xl bg-sky-50/50 border border-sky-100">
                        <p className="text-xs font-semibold text-sky-700 mb-2">{v.type || 'Microsoft.RecoveryServices/vaults'}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-slate-800 truncate max-w-[70%]">{v.name}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${ v.properties?.provisioningState === 'Succeeded' ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : 'text-amber-600 bg-amber-50 border-amber-200' }`}>{v.properties?.provisioningState || 'Unknown'}</span>
                        </div>
                        <p className="text-[0.7rem] text-slate-500 mt-1">{v.location} · {v.sku?.name || 'Standard'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: PATCH COMPLIANCE */}
            {activeTab === 'patch' && (
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-200/80 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Azure Update &amp; Patch Compliance</h3>
                    <p className="text-xs text-slate-500">Intune managed devices — compliance states from Microsoft Graph</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tabLoading && <span className="h-4 w-4 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />}
                    <span className={`px-3 py-1 text-xs font-bold rounded-full border flex items-center gap-1.5 ${ patchData?.live ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200' }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${ patchData?.live ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500' }`} />
                      {patchData?.live ? `${patchData.total} Managed Devices` : 'Needs DeviceManagement.Read'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
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
              </div>
            )}

            {/* TAB 4: ASSET OPTIMIZATION */}
            {activeTab === 'asset' && (
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-200/80 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Cloud Asset &amp; Inventory</h3>
                    <p className="text-xs text-slate-500">Live counts from Microsoft Graph — apps, service principals, groups, devices</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tabLoading && <span className="h-4 w-4 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />}
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
              </div>
            )}

            {/* TAB 5: INFRASTRUCTURE */}
            {activeTab === 'infra' && (
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-200/80 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Infrastructure &amp; Azure Subscriptions</h3>
                    <p className="text-xs text-slate-500">Live subscription inventory from Azure Resource Manager</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tabLoading && <span className="h-4 w-4 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin" />}
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
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-400">Resources (sample)</p>
                    <p className="text-3xl font-black text-slate-800 mt-1">{infraData?.resourceCount > 0 ? `${infraData.resourceCount}+` : '—'}</p>
                    <p className="text-[0.7rem] text-slate-500 mt-1">From primary subscription</p>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-400">Last Fetched</p>
                    <p className="text-sm font-bold text-slate-800 mt-1">{infraData?.fetchedAt ? new Date(infraData.fetchedAt).toLocaleTimeString() : '—'}</p>
                    <p className="text-[0.7rem] text-slate-500 mt-1">ARM real-time query</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: BILLING */}
            {activeTab === 'billing' && (
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-200/80 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Azure Cost &amp; Billing Summary</h3>
                    <p className="text-xs text-slate-500">Live cost data from Azure Cost Management API</p>
                  </div>
                  <button
                    onClick={() => setLocation('/cost-dashboard')}
                    className="px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors flex items-center gap-2"
                  >
                    <CircleDollarSign className="h-4 w-4" /> Full Cost Dashboard
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
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
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-400">Subscriptions</p>
                    <p className="text-3xl font-extrabold text-slate-800 mt-1.5">{billingData?.subscriptions ?? '—'}</p>
                    <p className="text-[0.7rem] text-slate-500 mt-1">Visible to service principal</p>
                  </div>
                  <div className="p-5 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-400">Last Fetched</p>
                    <p className="text-sm font-bold text-slate-800 mt-1.5">{billingData?.fetchedAt ? new Date(billingData.fetchedAt).toLocaleString() : '—'}</p>
                    <p className="text-[0.7rem] text-slate-500 mt-1">ARM real-time query</p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: MICROSOFT O365 */}
            {activeTab === 'm365' && (
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] border border-slate-200/80 space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800">Microsoft 365 License &amp; Security Score</h3>
                    <p className="text-xs text-slate-500">Live license allocation, usage metrics, and Microsoft Secure Score</p>
                  </div>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200">
                    {secureScore !== null && secureScore > 0 ? `Secure Score: ${secureScore}%` : 'Secure Score: Live Microsoft 365'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {licensesData && licensesData.length > 0 ? (
                    licensesData.map((lic: any, idx: number) => (
                      <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                        <p className="text-xs font-semibold text-slate-400">{lic.product || lic.key}</p>
                        <p className="text-2xl font-bold text-slate-800 mt-1">{lic.usedLicenses ?? lic.assigned ?? 0} / {lic.totalLicenses ?? lic.purchased ?? 0}</p>
                        <p className="text-[0.7rem] text-slate-500 mt-1">{lic.availableLicenses ?? lic.unused ?? 0} available seats</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                      <p className="text-xs font-semibold text-slate-400">Microsoft 365 Business Basic</p>
                      <p className="text-2xl font-bold text-slate-800 mt-1">{totalUsersCount} Assigned</p>
                      <p className="text-[0.7rem] text-slate-500 mt-1">Live Entra ID sync</p>
                    </div>
                  )}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-400">Tenant Users</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{totalUsersCount}</p>
                    <p className="text-[0.7rem] text-slate-500 mt-1">{standardUsersCount} standard / {adminCount} admin</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-400">Admin Coverage</p>
                    <p className="text-2xl font-bold text-slate-800 mt-1">{adminCount}</p>
                    <p className="text-[0.7rem] text-slate-500 mt-1">Privileged accounts</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                    <p className="text-xs font-semibold text-slate-400">MFA Compliance</p>
                    <p className="text-2xl font-bold text-emerald-600 mt-1">{mfaEnabledCount}</p>
                    <p className="text-[0.7rem] text-slate-500 mt-1">{mfaDisabledCount} MFA disabled</p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Forensic Explorer Right Drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true" aria-label="Forensic Explorer">
          <div className="flex-1 bg-slate-950/60 backdrop-blur-sm" onClick={() => setDrawerOpen(false)} />
          <div className="w-full max-w-[700px] bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-slide-in-right">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-[#f8fafc] shrink-0">
              <div>
                <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Audit Log Explorer</p>
                <h2 className="font-bold text-slate-800 text-base">{selectedFeedItem ? 'Event Detail' : 'All Forensic Explorer'}</h2>
              </div>
              <button onClick={() => setDrawerOpen(false)} className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors">
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {selectedFeedItem ? (
              <div className="flex-1 overflow-y-auto p-6 space-y-5">
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

                <div className="space-y-2">
                  <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Initiated By</p>
                  <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 bg-white">
                    <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center text-sm font-bold shrink-0">
                      {(selectedFeedItem.initiatedBy?.user?.displayName || selectedFeedItem.initiatedBy?.app?.displayName || 'S').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{selectedFeedItem.initiatedBy?.user?.displayName || selectedFeedItem.initiatedBy?.app?.displayName || 'System Process'}</p>
                      <p className="text-xs text-slate-400">{selectedFeedItem.initiatedBy?.user?.userPrincipalName || selectedFeedItem.initiatedBy?.app?.servicePrincipalId || 'System Identity'}</p>
                    </div>
                  </div>
                </div>

                {selectedFeedItem.targetResources?.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[0.7rem] font-bold text-slate-400 uppercase tracking-widest">Target Resources</p>
                    <div className="space-y-2">
                      {selectedFeedItem.targetResources.map((t: any, i: number) => (
                        <div key={i} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0">
                            <Eye className="h-4 w-4 text-sky-500" />
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

                <button
                  onClick={() => setSelectedFeedItem(null)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  ← Back to All Events
                </button>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                {feedItems.map((item, idx) => {
                  const actor = item.initiatedBy?.user?.displayName || item.initiatedBy?.app?.displayName || 'System';
                  const timeStr = new Date(item.activityDateTime).toLocaleString();
                  const isFailure = item.result === 'failure';
                  return (
                    <button
                      key={item.id || idx}
                      onClick={() => setSelectedFeedItem(item)}
                      className="w-full text-left px-6 py-4 hover:bg-slate-50 transition-colors group flex items-start gap-3"
                    >
                      <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${isFailure ? 'bg-rose-500' : 'bg-sky-500'}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">{item.activityDisplayName}</p>
                          {isFailure && <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-rose-100 text-rose-700">FAILED</span>}
                        </div>
                        <p className="text-xs text-slate-400">{actor}</p>
                      </div>
                      <span className="text-[0.7rem] text-slate-400">{timeStr}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Import Real Users Modal */}
      {showJsonModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-sky-500" />
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
              Paste your organization's real user accounts as a JSON array below. The directory and all dashboard metrics will update immediately.
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
              className="w-full font-mono text-xs p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 bg-slate-50"
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
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-sky-500 hover:bg-sky-600 transition-colors shadow-sm"
              >
                Save &amp; Update Directory
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
