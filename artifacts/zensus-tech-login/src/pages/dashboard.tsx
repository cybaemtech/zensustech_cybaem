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
  Menu,
  Database
} from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { getLiveApiHeaders, ensureLiveApiTokens, LIVE_API_BASE } from '@/lib/live-api';
import { DatabaseSettingsPage } from '@/components/DatabaseSettingsPage';
import { fetchDatabaseStatus } from '@/lib/database-api';
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
import { CustomerCategorySwitcher } from '@/components/CustomerCategorySwitcher';
import { ClientCategoryView } from '@/components/ClientCategoryView';
import {
  getActiveCustomer,
  getActiveCategory,
  type CustomerData,
  type CategoryType
} from '@/lib/customer-store';

const SIDEBAR_ITEMS = [
  { id: 'identity', label: 'Identity & Access', subLabel: 'Organization Entra ID', icon: Fingerprint, group: 'core' },
  { id: 'm365', label: 'Microsoft O365', subLabel: 'Licenses & Usage', icon: PanelsTopLeft, group: 'core' },
  { id: 'database', label: 'Database Connect', subLabel: 'Multi-DB Settings & Migration', icon: Database, group: 'core' },
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
  license: 'Microsoft Entra ID',
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

function formatRegisteredDate(dateStr?: string) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  } catch {
    return dateStr;
  }
}

const DEFAULT_USERS: any[] = [];

export default function Dashboard() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const isAuth = sessionStorage.getItem('is_authenticated') === 'true' &&
      Boolean(sessionStorage.getItem('graph_token') || sessionStorage.getItem('mgmt_token'));
    if (!isAuth) {
      setLocation('/');
    }
  }, [setLocation]);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(getActiveCustomer);
  const [currentCategory, setCurrentCategory] = useState<CategoryType>(getActiveCategory);
  const tenantId = currentCustomer?.tenantId || sessionStorage.getItem('azure_tenant_id') || '';
  const clientId = currentCustomer?.clientId || sessionStorage.getItem('azure_client_id') || '';

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
    const active = getActiveCustomer();
    return {
      ...DEFAULT_ORG,
      displayName: active?.name || '',
      primaryDomain: active?.domainId || ''
    };
  });

  const [stats, setStats] = useState({ ...DEFAULT_STATS });
  const [usersList, setUsersList] = useState<any[]>(DEFAULT_USERS);
  const [licensesData, setLicensesData] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>(() => {
    try {
      const cached = sessionStorage.getItem('azure_applications');
      if (cached) return JSON.parse(cached);
    } catch {}
    return [];
  });
  const [appSearch, setAppSearch] = useState('');
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  // Drilldown Popup Modal State
  type DrilldownType = 'all-users' | 'standard-users' | 'global-admins' | 'mfa-disabled' | 'mfa-compliant' | 'apps' | 'groups' | 'devices' | 'cloud-resources';
  const [drilldownModal, setDrilldownModal] = useState<{
    isOpen: boolean;
    type: DrilldownType;
    activeTab?: 'apps' | 'groups' | 'devices';
  }>({
    isOpen: false,
    type: 'all-users',
    activeTab: 'apps',
  });
  const [modalSearch, setModalSearch] = useState('');
  const [copiedModalId, setCopiedModalId] = useState<string | null>(null);

  const [groupsList, setGroupsList] = useState<any[]>(() => {
    try {
      const c = sessionStorage.getItem('azure_groups');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });

  const [devicesList, setDevicesList] = useState<any[]>(() => {
    try {
      const c = sessionStorage.getItem('azure_devices');
      return c ? JSON.parse(c) : [];
    } catch { return []; }
  });

  const openDrilldownModal = (type: DrilldownType) => {
    setModalSearch('');
    setDrilldownModal({
      isOpen: true,
      type,
      activeTab: type === 'groups' ? 'groups' : type === 'devices' ? 'devices' : 'apps',
    });
  };

  const closeDrilldownModal = () => {
    setDrilldownModal(prev => ({ ...prev, isOpen: false }));
    setModalSearch('');
  };
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
  const [showDatabaseModal, setShowDatabaseModal] = useState(false);
  const [isDbConnected, setIsDbConnected] = useState(false);

  useEffect(() => {
    fetchDatabaseStatus().then(res => {
      setIsDbConnected(Boolean(res.connected));
    }).catch(() => {});
  }, []);

  // Feed & Forensic Explorer state
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [selectedFeedItem, setSelectedFeedItem] = useState<any | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [investigationFilter, setInvestigationFilter] = useState<'All'|'Auth'|'User'|'Application'|'Role'>('All');
  const [investigationTime, setInvestigationTime] = useState<'24H'|'7D'|'30D'>('24H');
  const [showUsersTable, setShowUsersTable] = useState(false);

  const filteredApps = useMemo(() => {
    if (!appSearch.trim()) return applications;
    const q = appSearch.toLowerCase();
    return applications.filter(
      (a: any) =>
        (a.displayName || '').toLowerCase().includes(q) ||
        (a.appId || '').toLowerCase().includes(q) ||
        (a.signInAudience || '').toLowerCase().includes(q)
    );
  }, [applications, appSearch]);

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
      await ensureLiveApiTokens();
      const headers = getLiveApiHeaders();
      const [usersRes, appsRes, orgRes, securityRes, licenseRes, groupsRes, devicesRes] = await Promise.allSettled([
        fetch(`${LIVE_API_BASE}/tenant/users`, { headers }),
        fetch(`${LIVE_API_BASE}/tenant/applications`, { headers }),
        fetch(`${LIVE_API_BASE}/tenant/organization`, { headers }),
        fetch(`${LIVE_API_BASE}/microsoft0365/secure/score`, { headers }),
        fetch(`${LIVE_API_BASE}/microsoft0365/license_and_usage_details`, { headers }),
        fetch(`${LIVE_API_BASE}/tenant/groups`, { headers }),
        fetch(`${LIVE_API_BASE}/tenant/devices`, { headers }),
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
          if (Array.isArray(appJson?.applications) && appJson.applications.length > 0) {
            setApplications(appJson.applications);
            try { sessionStorage.setItem('azure_applications', JSON.stringify(appJson.applications)); } catch {}
          }
        } catch {}
      }

      // 4b. Process Groups
      if (groupsRes?.status === 'fulfilled') {
        try {
          const gJson = await groupsRes.value.json();
          if (Array.isArray(gJson?.groups) && gJson.groups.length > 0) {
            setGroupsList(gJson.groups);
            setStats(prev => ({ ...prev, totalGroups: gJson.groups.length }));
            setOrg(prev => ({ ...prev, groupsCount: gJson.groups.length }));
            try { sessionStorage.setItem('azure_groups', JSON.stringify(gJson.groups)); } catch {}
          }
        } catch {}
      }

      // 4c. Process Devices
      if (devicesRes?.status === 'fulfilled') {
        try {
          const dJson = await devicesRes.value.json();
          if (Array.isArray(dJson?.devices) && dJson.devices.length > 0) {
            setDevicesList(dJson.devices);
            setStats(prev => ({ ...prev, totalDevices: dJson.devices.length }));
            setOrg(prev => ({ ...prev, devicesCount: dJson.devices.length }));
            try { sessionStorage.setItem('azure_devices', JSON.stringify(dJson.devices)); } catch {}
          }
        } catch {}
      }

      // 5. Process Tenant Users
      if (usersRes.status === 'fulfilled') {
        try {
          const usersJson = await usersRes.value.json();
          const liveUsers = (usersRes.value.ok && Array.isArray(usersJson?.users)) ? usersJson.users : [];
          setIsLiveGraph(Boolean(usersJson?.liveData || usersJson?.source === 'graph'));
          setDataSource(usersJson?.source || 'none');
          setLastFetchedAt(usersJson?.fetchedAt || usersJson?.cachedAt || new Date().toISOString());
          setGraphError(usersJson?.error || null);

          const normalizedUsers = liveUsers.map((user: any) => ({
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
        } catch (e: any) {
          setIsLiveGraph(false);
          setUsersList([]);
          setGraphError(e.message);
        }
      } else {
        setIsLiveGraph(false);
        setUsersList([]);
      }
    } catch (e: any) {
      setIsLiveGraph(false);
      setUsersList([]);
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
      await ensureLiveApiTokens();
      const headers = getLiveApiHeaders();
      const top = investigationTime === '30D' ? 50 : investigationTime === '7D' ? 30 : 20;
      const res = await fetch(`${LIVE_API_BASE}/tenant/audit-logs?top=${top}`, {
        headers,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.message || err.detail || `Audit service returned HTTP ${res.status}`);
      }
      const data = await res.json();
      const logs = Array.isArray(data.logs) ? data.logs : (Array.isArray(data.value) ? data.value : []);
      setFeedItems(logs);
    } catch (e: any) {
      console.warn('Audit feed fetch failed:', e);
      setFeedError(e.message || 'Failed to fetch audit feed.');
      setFeedItems([]);
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
  }, [currentCustomer?.id, fetchStats, fetchAuditFeed]);

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

  const isMatchingFilter = useCallback((item: any, filter: string) => {
    if (!filter || filter === 'All') return true;
    const cat = (item.category || '').toLowerCase();
    const name = (item.activityDisplayName || '').toLowerCase();
    if (filter === 'Auth') return cat.includes('auth') || name.includes('sign') || name.includes('passkey') || cat.includes('security') || cat.includes('user');
    if (filter === 'User') return cat.includes('user');
    if (filter === 'Application') return cat.includes('application') || cat.includes('app');
    if (filter === 'Role') return cat.includes('role') || cat.includes('policy') || cat.includes('group');
    return true;
  }, []);

  const getActorLabel = (item: any) => {
    if (typeof item.initiatedBy === 'string' && item.initiatedBy) return item.initiatedBy;
    if (item.initiatedBy?.user?.displayName) return item.initiatedBy.user.displayName;
    if (item.initiatedBy?.user?.userPrincipalName) return item.initiatedBy.user.userPrincipalName;
    if (item.initiatedBy?.app?.displayName) return item.initiatedBy.app.displayName;
    if (item.initiatedBy?.app?.servicePrincipalName) return item.initiatedBy.app.servicePrincipalName;
    return 'System';
  };

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


            {/* Refresh Button */}
            <button
              onClick={fetchStats}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50 shadow-xs"
            >
              <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
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

            {/* TAB: DATABASE SETTINGS & MIGRATION FULL PAGE VIEW */}
            {activeTab === 'database' && (
              <DatabaseSettingsPage onStatusChange={(connected) => setIsDbConnected(connected)} />
            )}

            {/* Organization Info Banner Card */}
            {activeTab !== 'database' && (
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
                </div>
              </div>
            </div>
            )}

            {/* TAB 1: IDENTITY & ACCESS (Primary View) */}
            {activeTab === 'identity' && (
              <>
                {/* Primary Metric KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                  {/* KPI 1: Total Users */}
                  <div
                    onClick={() => openDrilldownModal('all-users')}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-sky-300 hover:shadow-md transition-all cursor-pointer"
                    title="Click to view all 14 users in popup"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
                      <div className="h-9 w-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <Users className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3 group-hover:text-sky-600 transition-colors">
                      {totalUsersCount}
                    </div>
                    <div className="flex flex-wrap gap-2 text-[0.7rem] font-semibold">
                      <span
                        onClick={(e) => { e.stopPropagation(); openDrilldownModal('standard-users'); }}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                        title="Click to view 10 Standard Users"
                      >
                        {standardUsersCount} Standard
                      </span>
                      <span
                        onClick={(e) => { e.stopPropagation(); openDrilldownModal('global-admins'); }}
                        className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-2 py-0.5 rounded-md border border-purple-200 transition-colors cursor-pointer"
                        title="Click to view 4 Global Admins"
                      >
                        {globalAdminCount} Global Admins
                      </span>
                    </div>
                  </div>

                  {/* KPI 2: High Risk Accounts (MFA Disabled) */}
                  <div
                    onClick={() => openDrilldownModal('mfa-disabled')}
                    className="bg-gradient-to-b from-rose-50/50 to-white rounded-2xl p-5 border border-rose-200/90 shadow-[0_4px_16px_-4px_rgba(244,63,94,0.12)] relative overflow-hidden group hover:border-rose-400 hover:shadow-md transition-all cursor-pointer"
                    title="Click to view 2 High Risk (MFA Disabled) accounts"
                  >
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
                      <span className="text-3xl font-black text-rose-600 tracking-tight leading-none group-hover:text-rose-700 transition-colors">
                        {mfaDisabledCount}
                      </span>
                      <span className="text-xs font-bold text-rose-800">MFA Disabled</span>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-[0.7rem] text-rose-700 font-medium">{highRiskCount} accounts at risk</span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); openDrilldownModal('mfa-disabled'); }}
                        className="text-[0.7rem] font-bold text-rose-700 bg-rose-100 hover:bg-rose-200 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        title="Review 2 accounts missing MFA"
                      >
                        Review <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {/* KPI 3: Compliant Accounts */}
                  <div
                    onClick={() => openDrilldownModal('mfa-compliant')}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-emerald-300 hover:shadow-md transition-all cursor-pointer"
                    title="Click to view 12 Compliant (MFA Protected) users"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Compliant Users</span>
                      <div className="h-9 w-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-emerald-600 tracking-tight leading-none mb-3 group-hover:text-emerald-700 transition-colors">
                      {mfaEnabledCount}
                    </div>
                    <div className="flex items-center gap-1.5 text-[0.7rem] font-semibold text-emerald-700">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{mfaCoveragePercent}% MFA Protection Rate</span>
                    </div>
                  </div>

                  {/* KPI 4: Connected Assets */}
                  <div
                    onClick={() => openDrilldownModal('cloud-resources')}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-blue-300 hover:shadow-md transition-all cursor-pointer"
                    title="Click to view all Cloud Resources in popup"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cloud Resources</span>
                      <div className="h-9 w-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <Boxes className="h-4.5 w-4.5" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3 group-hover:text-blue-600 transition-colors">
                      {(stats.totalApps || org.appsCount) + (stats.totalDevices || org.devicesCount)}
                    </div>
                    <div className="flex items-center flex-nowrap gap-1 text-[0.67rem] font-semibold text-slate-600 whitespace-nowrap overflow-hidden">
                      <span
                        onClick={(e) => { e.stopPropagation(); openDrilldownModal('apps'); }}
                        className="hover:bg-blue-50 hover:text-blue-700 px-1 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                        title="Click to view 5 Registered Apps"
                      >
                        {stats.totalApps || org.appsCount} Apps
                      </span>
                      <span className="text-slate-300 shrink-0">·</span>
                      <span
                        onClick={(e) => { e.stopPropagation(); openDrilldownModal('groups'); }}
                        className="hover:bg-blue-50 hover:text-blue-700 px-1 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                        title="Click to view 9 Directory Groups"
                      >
                        {stats.totalGroups || org.groupsCount} Groups
                      </span>
                      <span className="text-slate-300 shrink-0">·</span>
                      <span
                        onClick={(e) => { e.stopPropagation(); openDrilldownModal('devices'); }}
                        className="hover:bg-blue-50 hover:text-blue-700 px-1 py-0.5 rounded transition-colors cursor-pointer shrink-0"
                        title="Click to view 6 Managed Devices"
                      >
                        {stats.totalDevices || org.devicesCount} Devices
                      </span>
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

                {/* Application Inventory */}
                <div className="bg-white rounded-2xl border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] overflow-hidden">
                  <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-2">
                      <LayoutGrid className="h-4 w-4 text-sky-500" />
                      <h3 className="font-bold text-slate-800 text-sm">Application Inventory</h3>
                      <span className="text-[0.68rem] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {applications.length} Registered Apps
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search apps..."
                          value={appSearch}
                          onChange={(e) => setAppSearch(e.target.value)}
                          className="pl-8 pr-3 py-1 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-sky-400 w-44 text-slate-700 placeholder-slate-400"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-600">
                      <thead className="bg-slate-50/75 border-b border-slate-100 text-[0.72rem] uppercase font-bold text-slate-400 tracking-wider">
                        <tr>
                          <th className="py-3 px-6">Application Name</th>
                          <th className="py-3 px-6">App ID (Client ID)</th>
                          <th className="py-3 px-6">Audience / Type</th>
                          <th className="py-3 px-6">Registered</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredApps.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="py-8 text-center text-slate-400">
                              {appSearch ? 'No applications match your search' : 'No registered applications found'}
                            </td>
                          </tr>
                        ) : (
                          filteredApps.map((app: any) => (
                            <tr key={app.id || app.appId} className="hover:bg-slate-50/60 transition-colors">
                              <td className="py-3.5 px-6 font-semibold text-slate-800">
                                {app.displayName || 'Unnamed Application'}
                              </td>
                              <td className="py-3.5 px-6 font-mono text-[0.75rem] text-slate-600">
                                <span
                                  onClick={() => {
                                    if (app.appId) {
                                      navigator.clipboard.writeText(app.appId);
                                      setCopiedAppId(app.appId);
                                      setTimeout(() => setCopiedAppId(null), 2000);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200/70 border border-slate-200/60 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                                  title="Click to copy App ID"
                                >
                                  <span>{app.appId}</span>
                                  {copiedAppId === app.appId ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-slate-400" />
                                  )}
                                </span>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className="bg-sky-50 text-sky-600 border border-sky-200/60 px-2.5 py-1 rounded-full text-[0.72rem] font-medium inline-block">
                                  {app.signInAudience || 'AzureADandPersonalMicrosoftAccount'}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-slate-500 text-[0.75rem]">
                                <div className="flex items-center gap-1.5" title={app.createdDateTime ? new Date(app.createdDateTime).toLocaleString() : ''}>
                                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                                  <span>{formatRegisteredDate(app.createdDateTime)}</span>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
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
                          <p className="text-xl font-bold text-blue-700">{feedItems.filter(f => isMatchingFilter(f, investigationFilter)).length}</p>
                          <p className="text-[0.65rem] font-semibold text-blue-500 mt-0.5">Matching Events</p>
                        </div>
                        <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
                          <p className="text-xl font-bold text-rose-700">{feedItems.filter(f => f.result === 'failure').length}</p>
                          <p className="text-[0.65rem] font-semibold text-rose-500 mt-0.5">Failures</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                          <p className="text-xl font-bold text-emerald-700">{feedItems.filter(f => f.result !== 'failure').length}</p>
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
                      {feedLoading && feedItems.length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <span className="h-5 w-5 border-2 border-slate-200 border-t-sky-500 rounded-full animate-spin inline-block mb-2" />
                          <p className="text-xs font-semibold">Loading audit activities...</p>
                        </div>
                      ) : feedItems.filter(item => isMatchingFilter(item, investigationFilter)).length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Clock className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-700">No events found for "{investigationFilter}"</p>
                          <p className="text-[0.7rem] text-slate-400 mt-1">Switch to "All" or select another category</p>
                        </div>
                      ) : (
                        feedItems
                          .filter(item => isMatchingFilter(item, investigationFilter))
                          .map((item, idx) => {
                            const actor = getActorLabel(item);
                            const isFailure = item.result === 'failure';
                            const dateObj = item.activityDateTime ? new Date(item.activityDateTime) : null;
                            const timeStr = dateObj && !isNaN(dateObj.getTime())
                              ? `${dateObj.toLocaleDateString([], { month: 'short', day: 'numeric' })}, ${dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                              : 'Recent';
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
                                <span className="shrink-0 text-[0.65rem] text-slate-400 mt-1 whitespace-nowrap">
                                  {timeStr}
                                </span>
                              </button>
                            );
                          })
                      )}
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
              <div className="space-y-6">
                <ClientCategoryView
                  customer={currentCustomer}
                  category="azure"
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />

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
              <div className="space-y-6">
                <ClientCategoryView
                  customer={currentCustomer}
                  category="office365"
                  onNavigateToTab={(tab) => setActiveTab(tab)}
                />

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
                {feedItems.length === 0 ? (
                  <div className="p-12 text-center text-slate-400">
                    <Clock className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-semibold text-slate-700">No audit events recorded</p>
                    <p className="text-xs text-slate-400 mt-1">Audit events from Microsoft Entra ID will appear here.</p>
                  </div>
                ) : (
                  feedItems.map((item, idx) => {
                    const actor = getActorLabel(item);
                    const dateObj = item.activityDateTime ? new Date(item.activityDateTime) : null;
                    const timeStr = dateObj && !isNaN(dateObj.getTime()) ? dateObj.toLocaleString() : 'Recent';
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
                        <span className="text-[0.7rem] text-slate-400 whitespace-nowrap">{timeStr}</span>
                      </button>
                    );
                  })
                )}
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



{/* ────────────────── DRILLDOWN DETAIL POPUP MODAL ────────────────── */}
      {drilldownModal.isOpen && (() => {
        const q = modalSearch.toLowerCase().trim();
        const type = drilldownModal.type;

        // Compute items and metadata
        let title = '';
        let subtitle = '';
        let count = 0;
        let Icon = Users;
        let iconBg = 'bg-sky-50 text-sky-600';
        let category: 'users' | 'apps' | 'groups' | 'devices' | 'cloud-resources' = 'users';
        let rawItems: any[] = [];

        if (type === 'all-users') {
          title = 'Total Users';
          count = usersList.length;
          subtitle = 'All 14 synchronized directory accounts from Microsoft Entra ID';
          Icon = Users;
          iconBg = 'bg-sky-50 text-sky-600';
          category = 'users';
          rawItems = usersList;
        } else if (type === 'standard-users') {
          title = 'Standard Users';
          const filtered = usersList.filter((u: any) =>
            !(u.role || '').toLowerCase().includes('administrator') &&
            !(u.roles || []).some((r: string) => r.toLowerCase().includes('administrator'))
          );
          count = filtered.length;
          subtitle = 'Directory members without administrative directory roles';
          Icon = Users;
          iconBg = 'bg-slate-100 text-slate-700';
          category = 'users';
          rawItems = filtered;
        } else if (type === 'global-admins') {
          title = 'Global Administrators';
          const filtered = usersList.filter((u: any) =>
            (u.role || '').toLowerCase().includes('global administrator') ||
            (u.roles || []).some((r: string) => r.toLowerCase().includes('global administrator'))
          );
          count = filtered.length;
          subtitle = 'Privileged accounts holding full tenant Global Administrator rights';
          Icon = Key;
          iconBg = 'bg-purple-50 text-purple-700 border border-purple-200';
          category = 'users';
          rawItems = filtered;
        } else if (type === 'mfa-disabled') {
          title = 'High Risk Accounts — MFA Disabled';
          const filtered = usersList.filter((u: any) => u.mfa === 'Disabled' || u.mfaEnabled === false);
          count = filtered.length;
          subtitle = 'Unprotected accounts vulnerable to credential spray without MFA enforcement';
          Icon = ShieldAlert;
          iconBg = 'bg-rose-50 text-rose-600 border border-rose-200';
          category = 'users';
          rawItems = filtered;
        } else if (type === 'mfa-compliant') {
          title = 'Compliant Users — MFA Protected';
          const filtered = usersList.filter((u: any) => u.mfa === 'Enabled' || u.mfaEnabled === true);
          count = filtered.length;
          subtitle = 'Active accounts with verified Multi-Factor Authentication enforcement';
          Icon = CheckCircle2;
          iconBg = 'bg-emerald-50 text-emerald-600 border border-emerald-200';
          category = 'users';
          rawItems = filtered;
        } else if (type === 'apps') {
          title = 'Registered Applications';
          count = applications.length;
          subtitle = 'Applications registered and authorized in Microsoft Entra ID';
          Icon = LayoutGrid;
          iconBg = 'bg-blue-50 text-blue-600';
          category = 'apps';
          rawItems = applications;
        } else if (type === 'groups') {
          title = 'Directory Groups';
          count = groupsList.length;
          subtitle = 'Microsoft 365 and Security groups synchronized from Entra ID';
          Icon = FolderGit2;
          iconBg = 'bg-indigo-50 text-indigo-600';
          category = 'groups';
          rawItems = groupsList;
        } else if (type === 'devices') {
          title = 'Managed Devices';
          count = devicesList.length;
          subtitle = 'Endpoints and devices registered with Microsoft Entra ID';
          Icon = Laptop;
          iconBg = 'bg-cyan-50 text-cyan-600';
          category = 'devices';
          rawItems = devicesList;
        } else if (type === 'cloud-resources') {
          title = 'Cloud Resources Overview';
          count = (stats.totalApps || org.appsCount) + (stats.totalDevices || org.devicesCount);
          subtitle = `${applications.length} Registered Apps · ${groupsList.length} Directory Groups · ${devicesList.length} Managed Devices`;
          Icon = Boxes;
          iconBg = 'bg-blue-50 text-blue-600';
          category = 'cloud-resources';
          const currentSubTab = drilldownModal.activeTab || 'apps';
          rawItems = currentSubTab === 'groups' ? groupsList : currentSubTab === 'devices' ? devicesList : applications;
        }

        // Apply modal search filter
        const displayedItems = rawItems.filter((item: any) => {
          if (!q) return true;
          if (category === 'users') {
            return (item.displayName || '').toLowerCase().includes(q) ||
              (item.userPrincipalName || '').toLowerCase().includes(q) ||
              (item.role || '').toLowerCase().includes(q);
          }
          if (category === 'apps' || (category === 'cloud-resources' && drilldownModal.activeTab === 'apps')) {
            return (item.displayName || '').toLowerCase().includes(q) ||
              (item.appId || '').toLowerCase().includes(q) ||
              (item.signInAudience || '').toLowerCase().includes(q);
          }
          if (category === 'groups' || (category === 'cloud-resources' && drilldownModal.activeTab === 'groups')) {
            return (item.displayName || '').toLowerCase().includes(q) ||
              (item.description || '').toLowerCase().includes(q) ||
              (item.id || '').toLowerCase().includes(q);
          }
          if (category === 'devices' || (category === 'cloud-resources' && drilldownModal.activeTab === 'devices')) {
            return (item.displayName || '').toLowerCase().includes(q) ||
              (item.operatingSystem || '').toLowerCase().includes(q) ||
              (item.id || '').toLowerCase().includes(q);
          }
          return true;
        });

        return (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150"
            onClick={closeDrilldownModal}
          >
            <div
              className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-4xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-4.5 border-b border-slate-100 flex items-center justify-between gap-4 bg-slate-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold text-slate-800 text-base leading-snug">{title}</h3>
                      <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200/80 px-2.5 py-0.5 rounded-full shadow-2xs">
                        {count} {category === 'apps' ? 'Apps' : category === 'groups' ? 'Groups' : category === 'devices' ? 'Devices' : 'Users'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Filter records..."
                      value={modalSearch}
                      onChange={(e) => setModalSearch(e.target.value)}
                      className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:border-sky-400 w-36 sm:w-52 text-slate-700 placeholder-slate-400 bg-white"
                      autoFocus
                    />
                  </div>
                  <button
                    onClick={closeDrilldownModal}
                    className="h-8 w-8 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
                    title="Close (Esc)"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Sub-tabs for Cloud Resources */}
              {category === 'cloud-resources' && (
                <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2 text-xs font-semibold">
                  <button
                    onClick={() => { setModalSearch(''); setDrilldownModal(prev => ({ ...prev, activeTab: 'apps' })); }}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      drilldownModal.activeTab === 'apps' || !drilldownModal.activeTab ? 'bg-sky-500 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Applications ({applications.length})
                  </button>
                  <button
                    onClick={() => { setModalSearch(''); setDrilldownModal(prev => ({ ...prev, activeTab: 'groups' })); }}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      drilldownModal.activeTab === 'groups' ? 'bg-sky-500 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Directory Groups ({groupsList.length})
                  </button>
                  <button
                    onClick={() => { setModalSearch(''); setDrilldownModal(prev => ({ ...prev, activeTab: 'devices' })); }}
                    className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                      drilldownModal.activeTab === 'devices' ? 'bg-sky-500 text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Managed Devices ({devicesList.length})
                  </button>
                </div>
              )}

              {/* Modal Table Content */}
              <div className="overflow-y-auto flex-1 p-0">
                {/* 1. USERS TABLE */}
                {(category === 'users') && (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/90 border-b border-slate-100 text-[0.72rem] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                      <tr>
                        <th className="py-3 px-6">User / Name</th>
                        <th className="py-3 px-6">User Principal Name (Email)</th>
                        <th className="py-3 px-6">Role</th>
                        <th className="py-3 px-6">MFA Status</th>
                        <th className="py-3 px-6">Created / Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {displayedItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            {modalSearch ? 'No users match your filter' : 'No users found'}
                          </td>
                        </tr>
                      ) : (
                        displayedItems.map((u: any) => {
                          const isMfaDisabled = u.mfa === 'Disabled' || u.mfaEnabled === false;
                          const isGlobalAdmin = (u.role || '').toLowerCase().includes('global administrator') ||
                            (u.roles || []).some((r: string) => r.toLowerCase().includes('global administrator'));
                          return (
                            <tr key={u.id || u.userPrincipalName} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-6 font-semibold text-slate-800">
                                <div className="flex items-center gap-2.5">
                                  <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold ${
                                    isGlobalAdmin ? 'bg-purple-100 text-purple-700' : isMfaDisabled ? 'bg-rose-100 text-rose-700' : 'bg-sky-100 text-sky-700'
                                  }`}>
                                    {(u.displayName || u.user || 'U').charAt(0).toUpperCase()}
                                  </div>
                                  <span>{u.displayName || u.user || 'Unknown'}</span>
                                </div>
                              </td>
                              <td className="py-3.5 px-6 font-mono text-[0.75rem] text-slate-600">
                                <span
                                  onClick={() => {
                                    if (u.userPrincipalName) {
                                      navigator.clipboard.writeText(u.userPrincipalName);
                                      setCopiedModalId(u.userPrincipalName);
                                      setTimeout(() => setCopiedModalId(null), 2000);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                  title="Click to copy UPN"
                                >
                                  <span>{u.userPrincipalName || '—'}</span>
                                  {copiedModalId === u.userPrincipalName ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-slate-400" />
                                  )}
                                </span>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[0.72rem] font-semibold border ${
                                  isGlobalAdmin
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-slate-100 text-slate-700 border-slate-200'
                                }`}>
                                  {u.role || u.roles?.[0] || 'Standard Member'}
                                </span>
                              </td>
                              <td className="py-3.5 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[0.72rem] font-bold border ${
                                  isMfaDisabled
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                }`}>
                                  {isMfaDisabled ? 'Disabled (At Risk)' : 'Enabled (Protected)'}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-slate-500 text-[0.75rem]">
                                {u.createdDateTime ? formatRegisteredDate(u.createdDateTime) : u.lastLogin || 'Recent'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {/* 2. APPS TABLE */}
                {(category === 'apps' || (category === 'cloud-resources' && drilldownModal.activeTab === 'apps')) && (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/90 border-b border-slate-100 text-[0.72rem] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                      <tr>
                        <th className="py-3 px-6">Application Name</th>
                        <th className="py-3 px-6">App ID (Client ID)</th>
                        <th className="py-3 px-6">Audience / Type</th>
                        <th className="py-3 px-6">Registered</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {displayedItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400">
                            {modalSearch ? 'No applications match your filter' : 'No applications found'}
                          </td>
                        </tr>
                      ) : (
                        displayedItems.map((app: any) => (
                          <tr key={app.id || app.appId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-6 font-semibold text-slate-800">
                              <div className="flex items-center gap-2">
                                <Cloud className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                                <span>{app.displayName || 'Unnamed Application'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-6 font-mono text-[0.75rem] text-slate-600">
                              <span
                                onClick={() => {
                                  if (app.appId) {
                                    navigator.clipboard.writeText(app.appId);
                                    setCopiedModalId(app.appId);
                                    setTimeout(() => setCopiedModalId(null), 2000);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 px-2.5 py-1 rounded-md cursor-pointer transition-colors"
                                title="Click to copy App ID"
                              >
                                <span>{app.appId}</span>
                                {copiedModalId === app.appId ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3 text-slate-400" />
                                )}
                              </span>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className="bg-sky-50 text-sky-600 border border-sky-200/60 px-2.5 py-1 rounded-full text-[0.72rem] font-medium inline-block">
                                {app.signInAudience || 'AzureADandPersonalMicrosoftAccount'}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 text-slate-500 text-[0.75rem]">
                              <div className="flex items-center gap-1.5">
                                <Clock className="h-3.5 w-3.5 text-slate-400" />
                                <span>{formatRegisteredDate(app.createdDateTime)}</span>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}

                {/* 3. GROUPS TABLE */}
                {(category === 'groups' || (category === 'cloud-resources' && drilldownModal.activeTab === 'groups')) && (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/90 border-b border-slate-100 text-[0.72rem] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                      <tr>
                        <th className="py-3 px-6">Group Name</th>
                        <th className="py-3 px-6">Type</th>
                        <th className="py-3 px-6">Group Object ID</th>
                        <th className="py-3 px-6">Created Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {displayedItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400">
                            {modalSearch ? 'No groups match your filter' : 'No groups found'}
                          </td>
                        </tr>
                      ) : (
                        displayedItems.map((grp: any) => {
                          const isUnified = (grp.groupTypes || []).includes('Unified');
                          return (
                            <tr key={grp.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="py-3.5 px-6 font-semibold text-slate-800">
                                <div className="flex items-center gap-2">
                                  <FolderGit2 className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                                  <span>{grp.displayName}</span>
                                </div>
                                {grp.description && (
                                  <p className="text-[0.68rem] text-slate-400 font-normal truncate mt-0.5 max-w-sm">{grp.description}</p>
                                )}
                              </td>
                              <td className="py-3.5 px-6">
                                <span className={`px-2.5 py-1 rounded-full text-[0.72rem] font-medium border ${
                                  isUnified
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}>
                                  {isUnified ? 'Microsoft 365' : 'Security Group'}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 font-mono text-[0.75rem] text-slate-600">
                                <span
                                  onClick={() => {
                                    if (grp.id) {
                                      navigator.clipboard.writeText(grp.id);
                                      setCopiedModalId(grp.id);
                                      setTimeout(() => setCopiedModalId(null), 2000);
                                    }
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                  title="Click to copy Group ID"
                                >
                                  <span>{grp.id}</span>
                                  {copiedModalId === grp.id ? (
                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                  ) : (
                                    <Copy className="h-3 w-3 text-slate-400" />
                                  )}
                                </span>
                              </td>
                              <td className="py-3.5 px-6 text-slate-500 text-[0.75rem]">
                                {formatRegisteredDate(grp.createdDateTime)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                )}

                {/* 4. DEVICES TABLE */}
                {(category === 'devices' || (category === 'cloud-resources' && drilldownModal.activeTab === 'devices')) && (
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50/90 border-b border-slate-100 text-[0.72rem] uppercase font-bold text-slate-400 tracking-wider sticky top-0 z-10 backdrop-blur-xs">
                      <tr>
                        <th className="py-3 px-6">Device Name</th>
                        <th className="py-3 px-6">Operating System</th>
                        <th className="py-3 px-6">Compliance</th>
                        <th className="py-3 px-6">Device ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {displayedItems.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="py-12 text-center text-slate-400">
                            {modalSearch ? 'No devices match your filter' : 'No devices found'}
                          </td>
                        </tr>
                      ) : (
                        displayedItems.map((dev: any) => (
                          <tr key={dev.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-6 font-semibold text-slate-800">
                              <div className="flex items-center gap-2">
                                <Laptop className="h-3.5 w-3.5 text-cyan-500 shrink-0" />
                                <span>{dev.displayName || 'Unknown Device'}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[0.72rem] font-medium border border-slate-200/60">
                                {dev.operatingSystem || 'Unknown'} {dev.operatingSystemVersion ? `(${dev.operatingSystemVersion})` : ''}
                              </span>
                            </td>
                            <td className="py-3.5 px-6">
                              <span className={`px-2.5 py-1 rounded-full text-[0.72rem] font-medium border ${
                                dev.isCompliant === true
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {dev.isCompliant === true ? 'Compliant' : 'Not Evaluated'}
                              </span>
                            </td>
                            <td className="py-3.5 px-6 font-mono text-[0.75rem] text-slate-600">
                              <span
                                onClick={() => {
                                  if (dev.id) {
                                    navigator.clipboard.writeText(dev.id);
                                    setCopiedModalId(dev.id);
                                    setTimeout(() => setCopiedModalId(null), 2000);
                                  }
                                }}
                                className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-200/60 px-2 py-0.5 rounded cursor-pointer transition-colors"
                                title="Click to copy Device ID"
                              >
                                <span>{dev.id}</span>
                                {copiedModalId === dev.id ? (
                                  <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                ) : (
                                  <Copy className="h-3 w-3 text-slate-400" />
                                )}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between text-xs text-slate-500">
                <span>Showing <strong>{displayedItems.length}</strong> of <strong>{count}</strong> {title.toLowerCase()}</span>
                <button
                  onClick={closeDrilldownModal}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
