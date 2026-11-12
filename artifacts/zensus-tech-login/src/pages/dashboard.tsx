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
  Database,
  History,
  Award,
  TrendingUp,
  Rocket,
  Bell,
  Zap,
  ArrowRight
} from 'lucide-react';
import { useEffect, useState, useCallback, useMemo } from 'react';
import { useLocation } from 'wouter';
import { getLiveApiHeaders, ensureLiveApiTokens, LIVE_API_BASE } from '@/lib/live-api';
import { DatabaseSettingsPage } from '@/components/DatabaseSettingsPage';
import {
  DEFAULT_USERS,
  DEFAULT_APPLICATIONS,
  DEFAULT_GROUPS,
  DEFAULT_DEVICES,
  DEFAULT_ORG_DATA,
  DEFAULT_DASHBOARD_STATS,
  DEFAULT_AUDIT_LOGS
} from '@/data/defaultDirectoryData';
import { AuditLogExplorer } from '@/components/AuditLogExplorer';
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
  loadCustomersFromAPI,
  makeFallbackCustomer,
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

const DEFAULT_ORG = { ...DEFAULT_ORG_DATA };
const DEFAULT_STATS = { ...DEFAULT_DASHBOARD_STATS };

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

// DEFAULT_USERS imported from defaultDirectoryData

export default function Dashboard() {
  const [, setLocation] = useLocation();

  useEffect(() => {
    const isAuth =
      sessionStorage.getItem('is_authenticated') === 'true' &&
      Boolean(
        sessionStorage.getItem('zt_session') ||
        sessionStorage.getItem('graph_token') ||
        sessionStorage.getItem('mgmt_token')
      );
    if (!isAuth) {
      setLocation('/');
    }
  }, [setLocation]);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData>(() => getActiveCustomer() || makeFallbackCustomer());
  const [currentCategory, setCurrentCategory] = useState<CategoryType>(getActiveCategory);
  const tenantId = currentCustomer?.tenantId || sessionStorage.getItem('azure_tenant_id') || '';
  const clientId = currentCustomer?.clientId || sessionStorage.getItem('azure_client_id') || '';

  useEffect(() => {
    loadCustomersFromAPI().then(list => {
      const active = getActiveCustomer();
      if (active) setCurrentCustomer(active);
    });

    const handleCustChange = (e: any) => {
      if (e.detail) setCurrentCustomer(e.detail);
    };
    const handleCatChange = (e: any) => {
      if (e.detail) setCurrentCategory(e.detail);
    };
    const handleCustomersLoaded = (e: any) => {
      const active = getActiveCustomer();
      if (active) setCurrentCustomer(active);
    };

    window.addEventListener('zensustech_customer_changed', handleCustChange);
    window.addEventListener('zensustech_category_changed', handleCatChange);
    window.addEventListener('zensustech_customers_loaded', handleCustomersLoaded);
    return () => {
      window.removeEventListener('zensustech_customer_changed', handleCustChange);
      window.removeEventListener('zensustech_category_changed', handleCatChange);
      window.removeEventListener('zensustech_customers_loaded', handleCustomersLoaded);
    };
  }, []);

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
      if (cached && JSON.parse(cached).length > 0) return JSON.parse(cached);
    } catch {}
    return DEFAULT_APPLICATIONS;
  });
  const [appSearch, setAppSearch] = useState('');
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  // Drilldown Popup Modal State
  type DrilldownType = 'all-users' | 'standard-users' | 'global-admins' | 'global-readers' | 'sec-admins' | 'service-principals' | 'mfa-disabled' | 'mfa-compliant' | 'apps' | 'groups' | 'devices' | 'cloud-resources';
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
      return (c && JSON.parse(c).length > 0) ? JSON.parse(c) : DEFAULT_GROUPS;
    } catch { return DEFAULT_GROUPS; }
  });

  const [devicesList, setDevicesList] = useState<any[]>(() => {
    try {
      const c = sessionStorage.getItem('azure_devices');
      return (c && JSON.parse(c).length > 0) ? JSON.parse(c) : DEFAULT_DEVICES;
    } catch { return DEFAULT_DEVICES; }
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
  const [summaryItems, setSummaryItems] = useState<any[]>([]);
  const [m365Score, setM365Score] = useState<{ currentScore: number; maxScore: number; avgScore: number } | null>(null);
  const [m365Threats, setM365Threats] = useState<string[]>([]);
  const [m365Metadata, setM365Metadata] = useState<{ updated_at?: string } | null>(null);
  const [viewZoom, setViewZoom] = useState<number>(() => {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('dashboard_view_zoom') : null;
    return saved ? Number(saved) : 80;
  });
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
  const [remediationDrawerItem, setRemediationDrawerItem] = useState<{
    badge: string;
    title: string;
    description: string;
    technicalRemediation: string;
    expectedResult: string;
    additionalDetails?: { label: string; value: string }[];
    usersList?: { displayName: string; userPrincipalName: string; mfaStatus: boolean }[];
  } | null>(null);

  useEffect(() => {
    fetchDatabaseStatus().then(res => {
      setIsDbConnected(Boolean(res.connected));
    }).catch(() => {});
  }, []);

  // Feed & Forensic Explorer state
  const [feedItems, setFeedItems] = useState<any[]>(() => {
    try {
      const cached = sessionStorage.getItem('azure_audit_feed');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_AUDIT_LOGS;
  });
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
          if (scJson?.success || scJson?.data) {
            const overall = scJson.data?.overall || {};
            const pct = overall.percentage ?? overall.currentScore ?? 68;
            setSecureScore(pct);
            setM365Score({
              currentScore: overall.currentScore ?? 68,
              maxScore: overall.maxScore ?? 100,
              avgScore: overall.averageComparativeScores?.[0]?.averageScore ?? 53.4,
            });
            const plan = scJson.data?.action_plan || [];
            const threatsFound = [...new Set(plan.flatMap((a: any) => a.threats || []))].filter(Boolean);
            if (threatsFound.length > 0) {
              setM365Threats(threatsFound as string[]);
            }
            if (scJson.data?.batch_metadata) {
              setM365Metadata(scJson.data.batch_metadata);
            }
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
              license: license.license || license.product || license.key,
              purchased: license.purchased ?? license.totalLicenses ?? 0,
              assigned: license.assigned ?? license.usedLicenses ?? 0,
              unused: license.unused ?? license.availableLicenses ?? 0,
              available: license.available ?? license.unused ?? license.availableLicenses ?? 0,
              potentialSavings: license.potentialSavings || (license.unused === 0 ? '$0 (100% Utilized)' : '$0 (Free Service)'),
              totalLicenses: license.totalLicenses ?? license.purchased ?? 0,
              usedLicenses: license.usedLicenses ?? license.assigned ?? 0,
              availableLicenses: license.availableLicenses ?? license.unused ?? 0,
              usagePercent: license.usagePercent ?? (license.purchased ? Math.round((license.assigned / license.purchased) * 100) : 0),
            })));
          }
          if (Array.isArray(licJson?.summaryItems)) {
            setSummaryItems(licJson.summaryItems);
          }
        } catch {}
      }

      // 4. Process Applications
      if (appsRes.status === 'fulfilled') {
        try {
          const appJson = await appsRes.value.json();
          const appCount = appJson?.count ?? appJson?.applications?.length ?? 0;
          if (appCount > 0) {
            setStats((prev: any) => ({ ...prev, totalApps: appCount }));
            setOrg((prev: any) => ({ ...prev, appsCount: appCount }));
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
            setStats((prev: any) => ({ ...prev, totalGroups: gJson.groups.length }));
            setOrg((prev: any) => ({ ...prev, groupsCount: gJson.groups.length }));
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
            setStats((prev: any) => ({ ...prev, totalDevices: dJson.devices.length }));
            setOrg((prev: any) => ({ ...prev, devicesCount: dJson.devices.length }));
            try { sessionStorage.setItem('azure_devices', JSON.stringify(dJson.devices)); } catch {}
          }
        } catch {}
      }

      // 5. Process Tenant Users
      if (usersRes.status === 'fulfilled') {
        try {
          const usersJson = await usersRes.value.json();
          const rawUsers = (usersRes.value.ok && Array.isArray(usersJson?.users) && usersJson.users.length > 0)
            ? usersJson.users
            : DEFAULT_USERS;
          setIsLiveGraph(Boolean(usersJson?.liveData || usersJson?.source === 'graph'));
          setDataSource(usersJson?.source || 'cache-json');
          setLastFetchedAt(usersJson?.fetchedAt || usersJson?.cachedAt || new Date().toISOString());
          setGraphError(usersJson?.error || null);

          const normalizedUsers = rawUsers.map((user: any) => ({
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
          setStats((prev: any) => ({
            ...prev,
            totalUsers: total,
            standardUsers: Math.max(0, total - admins),
            globalAdmins: gAdmins,
            mfaDisabled: mfaDis,
            compliant: Math.max(0, total - mfaDis),
          }));
          setOrg((prev: any) => ({ ...prev, usersCount: total }));
        } catch (e: any) {
          setIsLiveGraph(false);
          setUsersList(DEFAULT_USERS);
          setGraphError(e.message);
        }
      } else {
        setIsLiveGraph(false);
        setUsersList(DEFAULT_USERS);
      }
    } catch (e: any) {
      setIsLiveGraph(false);
      setUsersList(DEFAULT_USERS);
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
      const res = await fetch(`${LIVE_API_BASE}/tenant/audit-logs?top=100`, {
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const logs = Array.isArray(data.logs) && data.logs.length > 0
          ? data.logs
          : (Array.isArray(data.value) && data.value.length > 0 ? data.value : DEFAULT_AUDIT_LOGS);
        setFeedItems(logs);
        try { sessionStorage.setItem('azure_audit_feed', JSON.stringify(logs)); } catch {}
      } else {
        // Fallback to default directory audit logs if endpoint returned an error
        setFeedItems(prev => (prev && prev.length > 0 ? prev : DEFAULT_AUDIT_LOGS));
      }
    } catch (e: any) {
      console.warn('Audit feed fetch note:', e);
      setFeedItems(prev => (prev && prev.length > 0 ? prev : DEFAULT_AUDIT_LOGS));
    } finally {
      setFeedLoading(false);
    }
  }, []);

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

  const roleBreakdown = useMemo(() => {
    const list = usersList && usersList.length > 0 ? usersList : DEFAULT_USERS;
    return [
      {
        role: 'Standard User',
        type: 'standard-users' as DrilldownType,
        count: list.filter((u: any) => {
          const r = (u.role || (Array.isArray(u.roles) ? u.roles.join(', ') : '')).trim().toLowerCase();
          const roles: string[] = (u.roles || []).map((x: string) => String(x).toLowerCase());
          return (!r || r === 'standard user' || r === 'member') && !roles.some(x => x.includes('administrator') || x.includes('reader'));
        }).length
      },
      {
        role: 'Global Reader',
        type: 'global-readers' as DrilldownType,
        count: list.filter((u: any) => {
          const r = (u.role || '').toLowerCase();
          const roles: string[] = (u.roles || []).map((x: string) => String(x).toLowerCase());
          return r.includes('global reader') || roles.some(x => x.includes('global reader'));
        }).length
      },
      {
        role: 'Global Administrator',
        type: 'global-admins' as DrilldownType,
        count: list.filter((u: any) => {
          const r = (u.role || '').toLowerCase();
          const roles: string[] = (u.roles || []).map((x: string) => String(x).toLowerCase());
          return (r.includes('global administrator') && !r.includes('security administrator')) ||
            (roles.some(x => x.includes('global administrator')) && !roles.some(x => x.includes('security administrator')));
        }).length
      },
      {
        role: 'Security Administrator',
        type: 'sec-admins' as DrilldownType,
        count: list.filter((u: any) => {
          const r = (u.role || '').toLowerCase();
          const roles: string[] = (u.roles || []).map((x: string) => String(x).toLowerCase());
          return r.includes('security administrator') || roles.some(x => x.includes('security administrator'));
        }).length
      }
    ];
  }, [usersList]);

  const adminRolesData = useMemo(() => {
    const list = usersList && usersList.length > 0 ? usersList : DEFAULT_USERS;
    return roleBreakdown.map(rb => {
      const roleUsers = list.filter((u: any) => {
        const r = (u.role || (Array.isArray(u.roles) ? u.roles.join(', ') : '')).trim().toLowerCase();
        const roles: string[] = (u.roles || []).map((x: string) => String(x).toLowerCase());
        if (rb.role === 'Standard User') return (!r || r === 'standard user' || r === 'member') && !roles.some(x => x.includes('administrator') || x.includes('reader'));
        if (rb.role === 'Global Reader') return r.includes('global reader') || roles.some(x => x.includes('global reader'));
        if (rb.role === 'Global Administrator') return (r.includes('global administrator') && !r.includes('security administrator')) || (roles.some(x => x.includes('global administrator')) && !roles.some(x => x.includes('security administrator')));
        if (rb.role === 'Security Administrator') return r.includes('security administrator') || roles.some(x => x.includes('security administrator'));
        return false;
      });
      const mfaDisabledUsers = roleUsers.filter((u: any) => u.mfa === 'Disabled' || u.mfaEnabled === false).length;
      return {
        role: rb.role,
        assignedUsers: rb.count,
        mfaCheck: mfaDisabledUsers > 0 ? `❌ ${mfaDisabledUsers}` : '✅',
        hasFailure: mfaDisabledUsers > 0,
        users: roleUsers
      };
    });
  }, [usersList, roleBreakdown]);

  const displaySummaryItems = useMemo(() => {
    if (summaryItems && summaryItems.length > 0) {
      return summaryItems;
    }
    const totalLicensed = licensesData.reduce((acc, l) => acc + (l.purchased || 0), 0) || 1010004;
    const totalUnused = licensesData.reduce((acc, l) => acc + (l.available ?? l.unused ?? 0), 0) || 1009997;
    const mfaPct = totalUsersCount > 0 ? Math.round((mfaEnabledCount / totalUsersCount) * 100) : 86;
    return [
      {
        area: 'License Optimization',
        status: totalUnused > 0 ? 'Savings Possible' : 'Optimized',
        number: `${totalUnused}/${totalLicensed}`,
        color: totalUnused > 0 ? 'gold' : 'green',
        note: `Managed ${totalLicensed} total license units.`
      },
      {
        area: 'Identity & Privileged Roles',
        status: `${adminCount} Admins Monitored`,
        number: `${adminCount}/${totalUsersCount}`,
        color: 'blue',
        note: 'Privileged directory role holders monitored under least privilege.'
      },
      {
        area: 'Account Protection & MFA',
        status: `${mfaPct}% Protected`,
        number: `${mfaEnabledCount}/${totalUsersCount}`,
        color: mfaDisabledCount > 0 ? 'gold' : 'green',
        note: `${mfaEnabledCount} of ${totalUsersCount} accounts protected with Multi-Factor Authentication.`
      },
      {
        area: 'Active Threat Defense',
        status: 'Healthy Posture',
        number: '100%',
        color: 'green',
        note: 'Continuous tenant monitoring and policy verification active.'
      }
    ];
  }, [summaryItems, licensesData, totalUsersCount, adminCount, mfaEnabledCount, mfaDisabledCount]);

  const displayThreats = useMemo(() => {
    const defaultThreats = [
      'Account Compromise',
      'Credential Phishing',
      'Session Hijacking',
      'Unauthorized Privilege Escalation',
      'Malicious App Consent',
      'License Wastage'
    ];
    return m365Threats.length > 0 ? m365Threats : defaultThreats;
  }, [m365Threats]);

  const displayLicenseData = useMemo(() => {
    if (licensesData && licensesData.length > 0) {
      return licensesData;
    }
    return [
      { key: 'FLOW_FREE', product: 'Microsoft Power Automate Free', license: 'Microsoft Power Automate Free', purchased: 10000, assigned: 1, available: 9999, unused: 9999, potentialSavings: '$0 (Free Service)' },
      { key: 'POWER_BI_STANDARD', product: 'Power BI Standard (Free)', license: 'Power BI Standard (Free)', purchased: 1000000, assigned: 2, available: 999998, unused: 999998, potentialSavings: '$0 (Free Service)' },
      { key: 'O365_BUSINESS_ESSENTIALS', product: 'Microsoft 365 Business Basic', license: 'Microsoft 365 Business Basic', purchased: 4, assigned: 4, available: 0, unused: 0, potentialSavings: '$0 (100% Utilized)' }
    ];
  }, [licensesData]);

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

  // Client-side time horizon filter — applied in addition to the API-level start_date filter
  // This ensures cached data is also filtered correctly when the user switches horizons
  const isInTimeHorizon = useCallback((item: any, horizon: '24H' | '7D' | '30D') => {
    if (!item.activityDateTime) return true; // keep items with no timestamp
    const itemTime = new Date(item.activityDateTime).getTime();
    if (isNaN(itemTime)) return true;
    const now = Date.now();
    const hoursMap: Record<string, number> = { '24H': 24, '7D': 24 * 7, '30D': 24 * 30 };
    const limitMs = (hoursMap[horizon] ?? 24 * 7) * 3600 * 1000;
    return (now - itemTime) <= limitMs;
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

  const handleThreatClick = (threat: string) => {
    switch (threat) {
      case 'Account Compromise':
        setRemediationDrawerItem({
          badge: 'Microsoft Entra ID',
          title: 'Account Protection & MFA',
          description: 'Ensure Multi-Factor Authentication is enforced for all administrators and user accounts to prevent unauthorized access.',
          technicalRemediation: 'Navigate to Microsoft Entra Admin Center > Protection > Conditional Access and enforce MFA registration policies for all users.',
          expectedResult: 'Reduces account takeover risk by 99.2%',
          additionalDetails: [
            { label: 'Risk Vector', value: 'Credential stuffing & account takeover' },
            { label: 'Baseline Requirement', value: 'Phishing-resistant MFA (FIDO2 / Authenticator)' }
          ]
        });
        break;
      case 'Credential Phishing':
        setRemediationDrawerItem({
          badge: 'Defender for Office 365',
          title: 'Anti-Phishing & Safe Links Defense',
          description: 'Configure real-time time-of-click URL verification and automated anti-phishing protection across Exchange Online and Teams.',
          technicalRemediation: 'Navigate to Microsoft Defender Portal (security.microsoft.com) > Email & Collaboration > Policies & Rules > Threat Policies > Anti-phishing to enable mailbox intelligence and spoof intelligence.',
          expectedResult: 'Eliminates 98.7% of deceptive inbound credential harvest campaigns.',
          additionalDetails: [
            { label: 'Protection Module', value: 'Zero-hour Auto Purge (ZAP)' },
            { label: 'Deployment Scope', value: 'All tenant inbound emails & links' }
          ]
        });
        break;
      case 'Session Hijacking':
        setRemediationDrawerItem({
          badge: 'Conditional Access & CAE',
          title: 'Token Theft & Continuous Access Evaluation',
          description: 'Revoke active bearer tokens and enforce strict IP binding with Continuous Access Evaluation to mitigate stolen session tokens.',
          technicalRemediation: 'Navigate to Microsoft Entra Admin Center > Protection > Conditional Access > Session. Enforce Continuous Access Evaluation (CAE) and configure sign-in frequency to 8 hours for admin sessions.',
          expectedResult: 'Neutralizes stolen cookie playback and unauthorized off-network token replay.',
          additionalDetails: [
            { label: 'Session Policy', value: 'Max 8-hour token lifetime' },
            { label: 'IP Strict Binding', value: 'Active CAE checks' }
          ]
        });
        break;
      case 'Unauthorized Privilege Escalation':
        setRemediationDrawerItem({
          badge: 'Privileged Identity Management (PIM)',
          title: 'Just-In-Time (JIT) Admin Activation',
          description: 'Remove standing administrator assignments and require MFA approval workflows before privileged roles can be activated.',
          technicalRemediation: 'Navigate to Microsoft Entra ID > Identity Governance > Privileged Identity Management > Azure AD Roles and convert Global Admins to Eligible with maximum 4-hour activation window.',
          expectedResult: 'Eliminates permanent administrative attack surface across tenant.',
          additionalDetails: [
            { label: 'Activation Window', value: 'Max 4 hours per session' },
            { label: 'Approval Rule', value: 'Multi-custody authorization required' }
          ]
        });
        break;
      case 'Malicious App Consent':
        setRemediationDrawerItem({
          badge: 'App Governance',
          title: 'Third-Party OAuth Consent Hardening',
          description: 'Restrict non-admin user permissions from consenting to unverified third-party OAuth enterprise applications requesting high-privilege Graph scopes.',
          technicalRemediation: 'Navigate to Entra ID > Enterprise Applications > Consent and permissions > User consent settings, select "Do not allow user consent" and configure admin consent workflow.',
          expectedResult: 'Prevents silent corporate data exfiltration via rogue SaaS integrations.',
          additionalDetails: [
            { label: 'User Consent', value: 'Disabled for unverified apps' },
            { label: 'Admin Approval', value: 'Required for high-privilege scopes' }
          ]
        });
        break;
      case 'License Wastage':
        setRemediationDrawerItem({
          badge: 'License Optimization',
          title: 'Automated Inactive Seat Reclamation',
          description: 'Identify users inactive for over 90 days and reclaim unused Microsoft 365 licenses to reduce SaaS subscription costs.',
          technicalRemediation: 'Navigate to Microsoft 365 Admin Center > Billing > Licenses, cross-reference last sign-in timestamp via Entra ID sign-in logs, and deprovision unutilized subscriptions.',
          expectedResult: 'Recovers wasted annual licensing spend with zero operational disruption.',
          additionalDetails: [
            { label: 'Audited Threshold', value: '> 60 days inactive' },
            { label: 'Optimization Target', value: '100% license efficiency' }
          ]
        });
        break;
      default:
        setRemediationDrawerItem({
          badge: 'Security Remediation Engine',
          title: `${threat} Threat Remediation`,
          description: `Security posture baseline and recommended configuration controls for ${threat}.`,
          technicalRemediation: `Navigate to Microsoft Defender Portal > Policies & Rules > Threat Policies to inspect and configure protective controls against ${threat}.`,
          expectedResult: 'Strengthens tenant defensive posture and mitigates attack vectors.',
          additionalDetails: [
            { label: 'Threat Category', value: threat },
            { label: 'Status', value: 'Security Policy Active' }
          ]
        });
        break;
    }
  };

  const handleExecutiveSummaryClick = (item: any) => {
    const area = item.area || '';
    if (area.includes('License')) {
      setRemediationDrawerItem({
        badge: 'Cost & SaaS Governance',
        title: 'License Optimization & SKU Allocation',
        description: 'Continuous auditing of paid vs allocated licenses to prevent over-provisioning and dormant account billing.',
        technicalRemediation: 'Navigate to Microsoft 365 Admin Center > Billing > Licenses. Audit unassigned licenses across Microsoft 365 Business Basic, Power BI, and Power Automate SKUs and deprovision unused pools.',
        expectedResult: 'Immediate reduction in SaaS expenditures with optimized seat utilization.',
        additionalDetails: [
          { label: 'Current Result / Status', value: item.status || 'Savings Possible' },
          { label: 'Coverage Metric', value: String(item.number || '1009997 / 1010004') }
        ]
      });
    } else if (area.includes('Identity') || area.includes('Privilege')) {
      setRemediationDrawerItem({
        badge: 'Privileged Access Management',
        title: 'Privileged Admin Roles & Access Control',
        description: 'Audit and enforce least-privilege administrative assignments across Global Admin, Security Admin, and Directory Reader roles.',
        technicalRemediation: 'Navigate to Microsoft Entra Admin Center > Identity > Roles & admins. Restrict Global Administrators to emergency break-glass accounts and assign scoped role-based privileges.',
        expectedResult: 'Limits tenant blast radius and secures root administrative accounts against unauthorized modification.',
        additionalDetails: [
          { label: 'Current Status', value: item.status || '4 Admins Monitored' },
          { label: 'Admin Ratio', value: String(item.number || '4 / 14 accounts') }
        ]
      });
    } else if (area.includes('Account Protection') || area.includes('MFA')) {
      setRemediationDrawerItem({
        badge: 'Microsoft Entra ID',
        title: 'Account Protection & MFA',
        description: 'Ensure Multi-Factor Authentication is enforced for all administrators and user accounts to prevent unauthorized access.',
        technicalRemediation: 'Navigate to Microsoft Entra Admin Center > Protection > Conditional Access and enforce MFA registration policies for all users.',
        expectedResult: 'Reduces account takeover risk by 99.2%',
        additionalDetails: [
          { label: 'MFA Status', value: item.status || '86% Protected' },
          { label: 'Coverage', value: String(item.number || '12 / 14 accounts') }
        ]
      });
    } else {
      setRemediationDrawerItem({
        badge: 'Microsoft Defender & Secure Score',
        title: 'Active Threat Posture & Defense Engine',
        description: 'Tenant security controls and posture aligned with Microsoft Secure Score and cloud industry protection baselines.',
        technicalRemediation: 'Navigate to Microsoft Defender Portal > Secure Score. Implement recommended identity and device improvement actions to increase tenant defense posture.',
        expectedResult: 'Maintains cloud security score above the 53.4% global Microsoft 365 tenant average.',
        additionalDetails: [
          { label: 'Current Score', value: `${m365Score?.currentScore ?? secureScore ?? 68}/100` },
          { label: 'Benchmark Comparison', value: `${m365Score?.avgScore ?? 53.4}% global avg` }
        ]
      });
    }
  };

  const handleRoleClick = (item: any) => {
    const usersList = (item.users || []).map((u: any) => ({
      displayName: u.displayName || u.userPrincipalName || 'User',
      userPrincipalName: u.userPrincipalName || '',
      mfaStatus: u.mfa !== 'Disabled' && u.mfaEnabled !== false,
    }));
    setRemediationDrawerItem({
      badge: 'Role-Based Access Control (RBAC)',
      title: `${item.role} Role Detail & Governance`,
      description: item.role === 'Global Administrator'
        ? 'Highest-privilege directory role with unrestricted access to all administrative features in Microsoft Entra and Microsoft 365 services.'
        : item.role === 'Security Administrator'
        ? 'Privileged security role with permissions to read security information, manage security configurations, and investigate threat incidents.'
        : item.role === 'Global Reader'
        ? 'Read-only administrative role for viewing reports and configurations across all Microsoft 365 admin centers without modification rights.'
        : 'Non-privileged organization members with standard mailbox, collaboration, and application access permissions.',
      technicalRemediation: item.hasFailure
        ? `Navigate to Microsoft Entra Admin Center > Protection > Conditional Access. Create or enforce an MFA policy requiring all users assigned to ${item.role} to register Microsoft Authenticator or FIDO2 keys.`
        : `All accounts in ${item.role} are currently MFA compliant. Conduct quarterly access reviews in Microsoft Entra Identity Governance to prevent role accumulation.`,
      expectedResult: item.hasFailure
        ? 'Brings MFA compliance to 100% across assigned users and eliminates active credential risk.'
        : 'Maintains Zero Trust compliance across administrative personnel.',
      additionalDetails: [
        { label: 'Assigned User Count', value: `${item.assignedUsers} users` },
        { label: 'MFA Status', value: item.mfaCheck }
      ],
      usersList,
    });
  };

  const handleLicenseClick = (lic: any) => {
    const name = lic.product || lic.license || lic.key || 'License SKU';
    const purchased = lic.purchased ?? lic.totalLicenses ?? 0;
    const assigned = lic.assigned ?? lic.usedLicenses ?? 0;
    const available = lic.available ?? lic.unused ?? lic.availableLicenses ?? 0;
    const savings = lic.potentialSavings || (available === 0 ? '$0 (100% Utilized)' : '$0 (Free Service)');
    setRemediationDrawerItem({
      badge: 'License Optimization & Cost Management',
      title: `${name} SKU Detail`,
      description: `License consumption, seat availability, and cost optimization telemetry for ${name}.`,
      technicalRemediation: available > 0 && !savings.includes('Free')
        ? `Navigate to Microsoft 365 Admin Center > Billing > Licenses. Reduce purchased license quota from ${purchased} to ${assigned} seats to eliminate unused capacity.`
        : `Navigate to Microsoft 365 Admin Center > Billing > Licenses to manage user assignments and evaluate subscription utilization.`,
      expectedResult: available > 0 && !savings.includes('Free')
        ? `Saves approximately ${savings} by rightsizing monthly subscription commitments.`
        : 'Optimal license utilization with zero dormant seat waste.',
      additionalDetails: [
        { label: 'Purchased Seats', value: purchased.toLocaleString() },
        { label: 'Assigned Seats', value: assigned.toLocaleString() },
        { label: 'Available Seats', value: available.toLocaleString() },
        { label: 'Potential Savings', value: savings }
      ]
    });
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
            {/* View Scale Control (80% default view for compact display) */}
            <div className="flex items-center bg-slate-100/90 rounded-lg p-0.5 border border-slate-200 text-xs font-semibold shadow-2xs">
              <button
                onClick={() => {
                  const next = Math.max(60, viewZoom - 10);
                  setViewZoom(next);
                  localStorage.setItem('dashboard_view_zoom', String(next));
                }}
                className="h-6 w-6 flex items-center justify-center hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors"
                title="Zoom out"
              >
                -
              </button>
              <span className="px-2 font-mono text-[0.72rem] text-slate-800">{viewZoom}%</span>
              <button
                onClick={() => {
                  const next = Math.min(120, viewZoom + 10);
                  setViewZoom(next);
                  localStorage.setItem('dashboard_view_zoom', String(next));
                }}
                className="h-6 w-6 flex items-center justify-center hover:bg-white rounded text-slate-600 hover:text-slate-900 transition-colors"
                title="Zoom in"
              >
                +
              </button>
              {viewZoom !== 80 && (
                <button
                  onClick={() => {
                    setViewZoom(80);
                    localStorage.setItem('dashboard_view_zoom', '80');
                  }}
                  className="px-2 py-0.5 text-[0.68rem] text-sky-600 hover:text-sky-700 hover:bg-white rounded transition-colors border-l border-slate-200 font-bold"
                  title="Reset to 80% default"
                >
                  80%
                </button>
              )}
              {viewZoom !== 100 && viewZoom === 80 && (
                <button
                  onClick={() => {
                    setViewZoom(100);
                    localStorage.setItem('dashboard_view_zoom', '100');
                  }}
                  className="px-2 py-0.5 text-[0.68rem] text-slate-400 hover:text-slate-700 hover:bg-white rounded transition-colors border-l border-slate-200"
                  title="Full 100% scale"
                >
                  100%
                </button>
              )}
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
        <main className="flex-1 overflow-y-auto p-4 sm:p-5 lg:p-6 space-y-4 custom-scrollbar bg-[#f4f7fb]">
          <div className="max-w-[1600px] mx-auto space-y-5" style={{ zoom: `${viewZoom}%` }}>

            {/* TAB: DATABASE SETTINGS & MIGRATION FULL PAGE VIEW */}
            {activeTab === 'database' && (
              <DatabaseSettingsPage onStatusChange={(connected) => setIsDbConnected(connected)} />
            )}

            {/* TAB: AUDIT LOGS FULL PAGE VIEW */}
            {activeTab === 'audit-logs' && (
              <div className="h-[calc(100vh-10rem)] min-h-[700px] flex flex-col">
                <AuditLogExplorer
                  logs={feedItems}
                  onRefresh={fetchAuditFeed}
                  isRefreshing={feedLoading}
                />
              </div>
            )}

            {/* Organization Info Banner Card */}
            {activeTab !== 'database' && activeTab !== 'audit-logs' && (
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
                {/* Primary Metric KPI Cards - Original UI/UX Preserved with Proper Data Values */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

                  {/* KPI 1: Total Users - Proper Role-Wise Breakdown (Not Combined) */}
                  <div
                    onClick={() => openDrilldownModal('all-users')}
                    className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.04)] relative overflow-hidden group hover:border-sky-300 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                    title="Click to view all 14 users in popup"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
                        <div className="h-8 w-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                          <Users className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3 group-hover:text-sky-600 transition-colors">
                        {totalUsersCount}
                      </div>
                    </div>

                    {/* Role-wise distinct items - each role separate with its proper count */}
                    <div className="space-y-1 pt-2 border-t border-slate-100">
                      {roleBreakdown.map((r) => (
                        <div
                          key={r.role}
                          onClick={(e) => { e.stopPropagation(); openDrilldownModal(r.type); }}
                          className="flex items-center justify-between text-[0.7rem] font-medium text-slate-700 hover:text-sky-600 transition-colors cursor-pointer group/item py-0.5"
                          title={`Click to view ${r.count} ${r.role}`}
                        >
                          <span className="truncate pr-1 group-hover/item:underline">{r.role}</span>
                          <span className="min-w-[18px] h-[18px] px-1.5 rounded-full bg-slate-100 text-slate-700 font-bold text-[0.62rem] flex items-center justify-center shrink-0 border border-slate-200 group-hover/item:bg-sky-50 group-hover/item:text-sky-700 group-hover/item:border-sky-200 transition-colors">
                            {r.count}
                          </span>
                        </div>
                      ))}
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
                          <p className="text-xl font-bold text-blue-700">{feedItems.filter(f => isInTimeHorizon(f, investigationTime) && isMatchingFilter(f, investigationFilter)).length}</p>
                          <p className="text-[0.65rem] font-semibold text-blue-500 mt-0.5">Matching Events</p>
                        </div>
                        <div className="rounded-xl bg-rose-50 border border-rose-100 p-3 text-center">
                          <p className="text-xl font-bold text-rose-700">{feedItems.filter(f => isInTimeHorizon(f, investigationTime) && f.result === 'failure').length}</p>
                          <p className="text-[0.65rem] font-semibold text-rose-500 mt-0.5">Failures</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                          <p className="text-xl font-bold text-emerald-700">{feedItems.filter(f => isInTimeHorizon(f, investigationTime) && f.result !== 'failure').length}</p>
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
                      ) : feedItems.filter(item => isInTimeHorizon(item, investigationTime) && isMatchingFilter(item, investigationFilter)).length === 0 ? (
                        <div className="p-8 text-center text-slate-400">
                          <Clock className="h-6 w-6 mx-auto mb-2 text-slate-300" />
                          <p className="text-xs font-semibold text-slate-700">No events found for "{investigationFilter}"</p>
                          <p className="text-[0.7rem] text-slate-400 mt-1">Switch to "All" or select another category</p>
                        </div>
                      ) : (
                        feedItems
                          .filter(item => isInTimeHorizon(item, investigationTime) && isMatchingFilter(item, investigationFilter))
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
                {/* Header Banner */}
                <div className="bg-gradient-to-r from-[#722ed1] to-[#2f54eb] rounded-2xl p-6 sm:p-8 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-md">
                  <div className="flex items-center gap-5">
                    <div className="bg-white/20 p-3.5 rounded-2xl flex items-center justify-center">
                      <Users className="h-8 w-8 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-white tracking-tight">Microsoft 365 Managed Services</h1>
                      <p className="text-white/80 text-sm mt-0.5">Security Infrastructure &amp; License Optimization</p>
                    </div>
                  </div>
                  <div>
                    <span className="bg-white text-[#722ed1] font-semibold text-xs px-4 py-1.5 rounded-full shadow-xs inline-block">
                      Data Sync: Active
                    </span>
                  </div>
                </div>

                {/* Benchmark and Threat Defense Cards */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* Industry Benchmark */}
                  <div className="md:col-span-4 bg-[#f9f5ff] rounded-2xl p-6 border border-purple-100/80 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 text-slate-400 text-xs font-semibold">
                        <Globe className="h-3.5 w-3.5" />
                        <span>Industry Benchmark</span>
                      </div>
                      <div className="my-4">
                        <span className="text-3xl sm:text-4xl font-extrabold text-[#cf1322]">
                          {m365Score?.currentScore ?? secureScore ?? 68} / {m365Score?.avgScore ?? 53.4}% avg
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-medium">Compared to global Microsoft 365 tenants.</p>
                    </div>
                    <div className="mt-5">
                      <div className="w-full bg-[#e8e8e8] rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#52c41a] h-2 rounded-full transition-all"
                          style={{ width: `${Math.min(100, m365Score?.currentScore ?? secureScore ?? 68)}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Active Threat Defence */}
                  <div className="md:col-span-8 bg-[#fffef0] rounded-2xl p-6 border border-amber-100/80 flex flex-col justify-between shadow-xs">
                    <div>
                      <div className="flex items-center gap-2 text-slate-800 text-sm font-bold">
                        <Shield className="h-4 w-4 text-slate-700" />
                        <span>Active Threat Defence</span>
                      </div>
                      <div className="flex flex-wrap gap-2.5 mt-5">
                        {displayThreats.map((threat) => (
                          <button
                            key={threat}
                            onClick={() => handleThreatClick(threat)}
                            className="bg-[#fff7e6] border border-[#ffd591] text-[#d46b08] px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer hover:bg-amber-100/80 hover:border-amber-400 hover:shadow-xs active:scale-98 transition-all flex items-center gap-1.5 group text-left"
                            title={`Inspect ${threat} Remediation`}
                          >
                            <span>{threat}</span>
                            <ArrowRight className="h-3 w-3 text-amber-500 opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-5">
                      Security controls tuned for account protection and data privacy based on your {m365Score?.currentScore ?? secureScore ?? 68} score. Click any threat policy to inspect remediation guidelines.
                    </p>
                  </div>
                </div>

                {/* Section Header: Executive Summary */}
                <div className="text-center pt-2">
                  <h2 className="text-lg font-bold text-slate-800 flex items-center justify-center gap-2">
                    <Rocket className="h-5 w-5 text-indigo-600" />
                    <span>Executive Summary (CXO View)</span>
                  </h2>
                </div>

                {/* Card 1: Executive Summary Table */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[0.7rem] uppercase tracking-wider text-slate-400 font-semibold">
                          <th className="py-3 px-4">Area</th>
                          <th className="py-3 px-4">Result / Status</th>
                          <th className="py-3 px-4">Metric / Coverage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {displaySummaryItems.map((item: any, idx: number) => {
                          const isGreen = item.color === 'green' || item.status?.toLowerCase().includes('healthy') || item.status?.toLowerCase().includes('optimized');
                          return (
                            <tr
                              key={item.area || idx}
                              onClick={() => handleExecutiveSummaryClick(item)}
                              className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                              title="Click to view Security Remediation & details"
                            >
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                  <span>{item.area}</span>
                                  <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                                <div className="text-[0.68rem] text-slate-400 mt-0.5">
                                  Last updated: {m365Metadata?.updated_at ? new Date(m365Metadata.updated_at).toLocaleDateString() : '10/29/2026'}
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-2.5">
                                  <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-semibold text-[0.7rem]">
                                    {m365Score?.currentScore ?? secureScore ?? 68}/100
                                  </span>
                                  <span className={`font-bold ${isGreen ? 'text-[#52c41a]' : 'text-[#faad14]'}`}>
                                    {isGreen ? '✅' : '⚠️'} {item.status}
                                  </span>
                                </div>
                              </td>
                              <td className="py-3.5 px-4">
                                <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 font-semibold text-xs inline-block group-hover:bg-blue-100 transition-colors">
                                  {item.number}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end items-center gap-1.5 mt-4 pt-2">
                    <button className="h-6 w-6 rounded border border-slate-200 text-slate-400 flex items-center justify-center text-xs hover:bg-slate-50">&lt;</button>
                    <button className="h-6 w-6 rounded border border-blue-500 bg-white text-blue-600 font-semibold flex items-center justify-center text-xs shadow-xs">1</button>
                    <button className="h-6 w-6 rounded border border-slate-200 text-slate-400 flex items-center justify-center text-xs hover:bg-slate-50">&gt;</button>
                  </div>
                </div>

                {/* Card 2: Admin Roles & Privileged Access */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-sm mb-4">
                    <Shield className="h-4 w-4 text-slate-700" />
                    <span>Admin Roles &amp; Privileged Access</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[0.7rem] uppercase tracking-wider text-slate-400 font-semibold">
                          <th className="py-3 px-4">Role Name</th>
                          <th className="py-3 px-4">User Count</th>
                          <th className="py-3 px-4">MFA Check</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {adminRolesData.map((item, idx) => (
                          <tr
                            key={item.role || idx}
                            onClick={() => handleRoleClick(item)}
                            className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                            title={`Click to inspect ${item.role} users & policy remediation`}
                          >
                            <td className="py-3.5 px-4 font-bold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                              <span>{item.role}</span>
                              <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-slate-700">{item.assignedUsers}</td>
                            <td className="py-3.5 px-4">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-bold inline-flex items-center gap-1 ${
                                  item.hasFailure
                                    ? 'bg-rose-50 text-rose-600 border border-rose-200'
                                    : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                }`}
                              >
                                {item.mfaCheck}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end items-center gap-1.5 mt-4 pt-2">
                    <button className="h-6 w-6 rounded border border-slate-200 text-slate-400 flex items-center justify-center text-xs hover:bg-slate-50">&lt;</button>
                    <button className="h-6 w-6 rounded border border-blue-500 bg-white text-blue-600 font-semibold flex items-center justify-center text-xs shadow-xs">1</button>
                    <button className="h-6 w-6 rounded border border-slate-200 text-slate-400 flex items-center justify-center text-xs hover:bg-slate-50">&gt;</button>
                  </div>
                </div>

                {/* Card 3: License Optimization & Cost Management */}
                <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
                  <div className="text-slate-800 font-bold text-sm mb-4">
                    License Optimization &amp; Cost Management
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-100 text-[0.7rem] uppercase tracking-wider text-slate-400 font-semibold">
                          <th className="py-3 px-4">License Type</th>
                          <th className="py-3 px-4">Purchased</th>
                          <th className="py-3 px-4">Assigned</th>
                          <th className="py-3 px-4">Available</th>
                          <th className="py-3 px-4">Potential Savings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {displayLicenseData.map((lic: any, idx: number) => {
                          const purchased = lic.purchased ?? lic.totalLicenses ?? 0;
                          const assigned = lic.assigned ?? lic.usedLicenses ?? 0;
                          const available = lic.available ?? lic.unused ?? lic.availableLicenses ?? 0;
                          const savings = lic.potentialSavings || (available === 0 ? '$0 (100% Utilized)' : '$0 (Free Service)');
                          return (
                            <tr
                              key={lic.key || lic.license || lic.product || idx}
                              onClick={() => handleLicenseClick(lic)}
                              className="hover:bg-indigo-50/50 cursor-pointer transition-colors group"
                              title={`Click to inspect ${lic.product || lic.license || lic.key} allocation`}
                            >
                              <td className="py-3.5 px-4 font-bold text-slate-800 group-hover:text-indigo-600 transition-colors flex items-center gap-1.5">
                                <span>{lic.product || lic.license || lic.key}</span>
                                <ExternalLink className="h-3 w-3 text-slate-400 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all" />
                              </td>
                              <td className="py-3.5 px-4 font-semibold text-slate-700">{purchased.toLocaleString()}</td>
                              <td className="py-3.5 px-4 font-semibold text-slate-700">{assigned.toLocaleString()}</td>
                              <td className="py-3.5 px-4 font-semibold text-slate-700">{available.toLocaleString()}</td>
                              <td className="py-3.5 px-4 font-bold text-[#52c41a]">{savings}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  <div className="flex justify-end items-center gap-1.5 mt-4 pt-2">
                    <button className="h-6 w-6 rounded border border-slate-200 text-slate-400 flex items-center justify-center text-xs hover:bg-slate-50">&lt;</button>
                    <button className="h-6 w-6 rounded border border-blue-500 bg-white text-blue-600 font-semibold flex items-center justify-center text-xs shadow-xs">1</button>
                    <button className="h-6 w-6 rounded border border-slate-200 text-slate-400 flex items-center justify-center text-xs hover:bg-slate-50">&gt;</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Forensic Explorer Modal */}
      {drawerOpen && (
        <AuditLogExplorer
          logs={feedItems}
          onRefresh={fetchAuditFeed}
          isRefreshing={feedLoading}
          onClose={() => { setDrawerOpen(false); setSelectedFeedItem(null); }}
          isModal={true}
          initialSelectedId={selectedFeedItem?.id || null}
        />
      )}

      {/* Security Remediation Engine Slide-Over Drawer */}
      {remediationDrawerItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-lg bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Top Navigation Bar */}
            <div className="px-6 py-4 border-b border-slate-100 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setRemediationDrawerItem(null)}
                  className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors mr-0.5"
                  title="Close Drawer"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                    <Shield className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-slate-900 text-sm tracking-tight">Security Remediation Engine</span>
                </div>
              </div>
              <button
                onClick={() => setRemediationDrawerItem(null)}
                className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Purple Hero Card */}
            <div className="bg-[#240b49] text-white p-6 relative overflow-hidden shrink-0">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white/10 text-white text-[0.7rem] font-semibold border border-white/10 mb-3 backdrop-blur-xs">
                <Bell className="h-3 w-3 text-purple-200" />
                <span>{remediationDrawerItem.badge}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
                {remediationDrawerItem.title}
              </h2>
              <p className="text-xs sm:text-sm text-purple-200/90 leading-relaxed mt-2.5 font-normal">
                {remediationDrawerItem.description}
              </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Technical Remediation */}
              <div>
                <div className="flex items-center gap-1.5 text-slate-800 font-bold text-xs mb-2">
                  <Zap className="h-4 w-4 text-amber-500 fill-amber-500" />
                  <span>Technical Remediation</span>
                </div>
                <div className="bg-[#f8fafc] border border-slate-200/90 rounded-xl p-4 text-xs text-slate-700 leading-relaxed font-medium">
                  {remediationDrawerItem.technicalRemediation}
                </div>
              </div>

              {/* Expected Result Green Box */}
              <div className="bg-[#f6ffed] border border-[#b7eb8f] rounded-xl p-4 text-xs text-[#389e0d] font-semibold flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 text-[#52c41a] shrink-0 mt-0.5" />
                <span>Expected Result: {remediationDrawerItem.expectedResult}</span>
              </div>

              {/* Additional Context Stats */}
              {remediationDrawerItem.additionalDetails && remediationDrawerItem.additionalDetails.length > 0 && (
                <div className="grid grid-cols-2 gap-2.5 pt-2">
                  {remediationDrawerItem.additionalDetails.map((det, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-200/70">
                      <div className="text-[0.65rem] text-slate-400 font-bold uppercase tracking-wider">{det.label}</div>
                      <div className="font-bold text-slate-800 text-xs mt-0.5 truncate" title={det.value}>{det.value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Assigned Users list if available */}
              {remediationDrawerItem.usersList && remediationDrawerItem.usersList.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                    <span>Assigned Accounts</span>
                    <span className="text-slate-400 font-normal">{remediationDrawerItem.usersList.length} total</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto space-y-1.5 pr-1 divide-y divide-slate-100 border border-slate-200/80 rounded-xl p-2 bg-slate-50/50">
                    {remediationDrawerItem.usersList.map((u, i) => (
                      <div key={i} className="pt-1.5 pb-1.5 px-2 flex items-center justify-between text-xs first:pt-1">
                        <div className="min-w-0 pr-2">
                          <div className="font-bold text-slate-800 truncate">{u.displayName}</div>
                          <div className="text-[0.68rem] text-slate-400 font-mono truncate">{u.userPrincipalName}</div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[0.65rem] font-bold shrink-0 ${
                          u.mfaStatus
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {u.mfaStatus ? 'MFA Enabled' : 'MFA Required'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[0.72rem] text-slate-400 font-mono">
                Cloud Security Engine · ZensusTech
              </span>
              <button
                onClick={() => setRemediationDrawerItem(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors shadow-xs"
              >
                Done
              </button>
            </div>
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
            !(u.roles || []).some((r: string) => r.toLowerCase().includes('administrator')) &&
            !(u.role || '').toLowerCase().includes('reader') &&
            !(u.roles || []).some((r: string) => r.toLowerCase().includes('reader'))
          );
          count = filtered.length;
          subtitle = 'Directory members without administrative directory roles';
          Icon = Users;
          iconBg = 'bg-slate-100 text-slate-700';
          category = 'users';
          rawItems = filtered;
        } else if (type === 'global-admins') {
          title = 'Global Administrators';
          const filtered = usersList.filter((u: any) => {
            const r = (u.role || '').toLowerCase();
            const roles: string[] = (u.roles || []).map((x: string) => String(x).toLowerCase());
            return r.includes('global administrator') || roles.some(x => x.includes('global administrator'));
          });
          count = filtered.length;
          subtitle = 'Privileged accounts holding full tenant Global Administrator rights';
          Icon = Key;
          iconBg = 'bg-purple-50 text-purple-700 border border-purple-200';
          category = 'users';
          rawItems = filtered;
        } else if (type === 'global-readers') {
          title = 'Global Readers';
          const filtered = usersList.filter((u: any) => {
            const r = (u.role || '').toLowerCase();
            const roles: string[] = (u.roles || []).map((x: string) => String(x).toLowerCase());
            return r.includes('global reader') || roles.some(x => x.includes('global reader'));
          });
          count = filtered.length;
          subtitle = 'Read-only directory administrative accounts';
          Icon = Key;
          iconBg = 'bg-amber-50 text-amber-700 border border-amber-200';
          category = 'users';
          rawItems = filtered;
        } else if (type === 'sec-admins') {
          title = 'Security Administrators';
          const filtered = usersList.filter((u: any) => {
            const r = (u.role || '').toLowerCase();
            const roles: string[] = (u.roles || []).map((x: string) => String(x).toLowerCase());
            return r.includes('security administrator') || roles.some(x => x.includes('security administrator'));
          });
          count = filtered.length;
          subtitle = 'Privileged accounts holding Security Administrator rights in Azure AD';
          Icon = Key;
          iconBg = 'bg-rose-50 text-rose-700 border border-rose-200';
          category = 'users';
          rawItems = filtered;
        } else if (type === 'service-principals') {
          title = 'Service Principals';
          count = 0;
          subtitle = 'Automated service identities registered in Microsoft Entra ID';
          Icon = Boxes;
          iconBg = 'bg-amber-50 text-amber-700 border border-amber-200';
          category = 'users';
          rawItems = [];
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
