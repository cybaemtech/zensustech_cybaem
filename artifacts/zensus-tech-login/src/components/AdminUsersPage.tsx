import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  ShieldCheck,
  Building2,
  Mail,
  Phone,
  Calendar,
  CheckCircle2,
  Clock,
  Search,
  RefreshCw,
  Copy,
  Check,
  UserCheck,
  ExternalLink,
  X,
  Key,
  BadgeCheck,
  Shield,
  Layers,
  ArrowUpDown,
  Filter,
  Download,
  FileSpreadsheet,
  Cloud,
  Sparkles
} from 'lucide-react';

interface AdminUser {
  id: number;
  user_id: string;
  full_name: string;
  email: string;
  role: string;
  phone: string;
  organization: string;
  customer?: string | null;
  vendor_code?: string | null;
  email_verified: boolean;
  account_status: string;
  created_at: string;
  updated_at: string;
  verified_at?: string | null;
  verification_attempts?: number;
  tenant_name?: string | null;
  azure_tenant_id?: string | null;
  active_sessions_count?: number;
  emails_sent_count?: number;
  plan?: string;
  tier?: string;
  plan_tier?: string;
  license_exp_date?: string;
  // Org enrichment from organizations table (tenant-linked)
  org_display_name?: string | null;
  org_domain?: string | null;
  org_phone?: string | null;
  org_email?: string | null;
  org_city?: string | null;
  org_state?: string | null;
  org_country?: string | null;
  org_street?: string | null;
  org_license?: string | null;
  org_license_exp_date?: string | null;
  org_users_count?: number | null;
  org_groups_count?: number | null;
  org_apps_count?: number | null;
  org_devices_count?: number | null;
}

interface AdminStats {
  total_users: number;
  end_customers: number;
  vendors: number;
  super_admins: number;
  email_verified: number;
  pending_verification: number;
  active_sessions: number;
}

export const AdminUsersPage: React.FC = () => {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'END_CUSTOMER' | 'VENDOR' | 'VERIFIED' | 'PENDING'>('ALL');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name'>('newest');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/auth/admin/users');
      if (!res.ok) {
        throw new Error(`Failed to load users: HTTP ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setUsers(data.users || []);
        setStats(data.stats || null);
      } else {
        throw new Error(data.error || 'Failed to fetch admin users');
      }
    } catch (err: any) {
      console.error('Error fetching admin users:', err);
      setError(err.message || 'Error connecting to PostgreSQL users table');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCopyEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  const handleExportData = () => {
    const dataToExport = filteredUsers.length > 0 ? filteredUsers : users;
    if (!dataToExport || dataToExport.length === 0) return;

    const headers = [
      'User ID',
      'Full Name',
      'Email',
      'Account Type',
      'Phone',
      'Organization',
      'Email Verification',
      'Plan',
      'Tier',
      'Plan & Tier',
      'License Expiration',
      'Connected Tenant',
      'Azure Tenant ID',
      'Active Sessions',
      'Emails Sent',
      'Registered At'
    ];

    const escapeCSV = (val: any) => {
      if (val === null || val === undefined) return '""';
      const s = String(val).replace(/"/g, '""');
      return `"${s}"`;
    };

    const rows = dataToExport.map((u) => [
      escapeCSV(u.user_id),
      escapeCSV(u.full_name),
      escapeCSV(u.email),
      escapeCSV(u.role),
      escapeCSV(u.phone),
      escapeCSV(u.organization),
      escapeCSV(u.email_verified ? 'VERIFIED' : 'PENDING_OTP'),
      escapeCSV(u.plan || 'Cloud - Azure'),
      escapeCSV(u.tier || 'Gold'),
      escapeCSV(u.plan_tier || `${u.plan || 'Cloud - Azure'} (${u.tier || 'Gold'})`),
      escapeCSV(u.license_exp_date || '2027-11-11'),
      escapeCSV(u.tenant_name || ''),
      escapeCSV(u.azure_tenant_id || ''),
      escapeCSV(u.active_sessions_count || 0),
      escapeCSV(u.emails_sent_count || 0),
      escapeCSV(u.created_at || '')
    ]);

    const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    link.setAttribute('href', url);
    link.setAttribute('download', `zensustech_users_export_${dateStr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setExportNotice(`Exported ${dataToExport.length} user records successfully.`);
    setTimeout(() => setExportNotice(null), 3500);
  };

  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Role filter
        if (roleFilter === 'END_CUSTOMER' && u.role !== 'END_CUSTOMER') return false;
        if (roleFilter === 'VENDOR' && !u.role.includes('VENDOR')) return false;
        if (roleFilter === 'VERIFIED' && !u.email_verified) return false;
        if (roleFilter === 'PENDING' && u.email_verified) return false;

        // Search query
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          u.full_name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.user_id.toLowerCase().includes(q) ||
          (u.phone && u.phone.toLowerCase().includes(q)) ||
          (u.organization && u.organization.toLowerCase().includes(q)) ||
          (u.vendor_code && u.vendor_code.toLowerCase().includes(q)) ||
          (u.plan && u.plan.toLowerCase().includes(q)) ||
          (u.tier && u.tier.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === 'newest') {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        if (sortBy === 'oldest') {
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        }
        return a.full_name.localeCompare(b.full_name);
      });
  }, [users, roleFilter, searchQuery, sortBy]);

  const formatDate = (isoString?: string) => {
    if (!isoString) return '—';
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return (name[0] || 'U').toUpperCase();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-40 -bottom-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Admin User Governance &amp; Directory
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Live PostgreSQL
                </span>
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
              Real-time directory of all registered accounts in database <code className="text-cyan-300 font-mono">zensustech.users</code>. 
              Track user sign-up details, roles, contact numbers, email verification, cloud plans, tiers, and live tenant associations.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Live DB Synced
            </span>
            <button
              onClick={handleExportData}
              disabled={loading || users.length === 0}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white transition flex items-center gap-2 shadow-sm border border-cyan-400/30 active:scale-95 cursor-pointer disabled:opacity-50"
              title="Export all sign-up users to CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Data</span>
            </button>
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600/60 transition flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Export Success Notification Banner */}
      {exportNotice && (
        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between animate-in fade-in duration-200 shadow-xs">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span>{exportNotice}</span>
          </div>
          <button onClick={() => setExportNotice(null)} className="text-emerald-600 hover:text-emerald-900 dark:hover:text-emerald-100 p-0.5 rounded">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 text-xs">
            <Users className="w-4 h-4 text-cyan-500" />
            <span className="font-medium">Total Users</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {stats ? stats.total_users : users.length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Registered in DB</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 text-xs">
            <UserCheck className="w-4 h-4 text-emerald-500" />
            <span className="font-medium">End Customers</span>
          </div>
          <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
            {stats ? stats.end_customers : users.filter((u) => u.role === 'END_CUSTOMER').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Purchasers / Clients</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 text-xs">
            <Building2 className="w-4 h-4 text-indigo-500" />
            <span className="font-medium">Vendors</span>
          </div>
          <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
            {stats ? stats.vendors : users.filter((u) => u.role.includes('VENDOR')).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Service Providers</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className="font-medium">Verified Email</span>
          </div>
          <div className="text-xl font-bold text-slate-900 dark:text-white">
            {stats ? stats.email_verified : users.filter((u) => u.email_verified).length}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">OTP Verified</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 text-xs">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="font-medium">Pending OTP</span>
          </div>
          <div className="text-xl font-bold text-amber-600 dark:text-amber-400">
            {stats ? stats.pending_verification : users.filter((u) => !u.email_verified).length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Awaiting Verification</div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-xl p-3.5 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-1 text-xs">
            <Key className="w-4 h-4 text-sky-500" />
            <span className="font-medium">Active Sessions</span>
          </div>
          <div className="text-xl font-bold text-sky-600 dark:text-sky-400">
            {stats ? stats.active_sessions : '—'}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Logged In Tokens</div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[240px] max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, email, phone, organization, plan, or tier..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right Toolbar Controls: Export & Sort */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportData}
              disabled={loading || filteredUsers.length === 0}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              title="Export visible user rows to CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" />
              <span>Export CSV</span>
            </button>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1 font-medium">
                <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
              </span>
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              >
                <option value="newest">Newest Sign-ups First</option>
                <option value="oldest">Oldest Sign-ups First</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> View:
          </span>
          {[
            { id: 'ALL', label: 'All Sign-up Users', count: users.length },
            { id: 'END_CUSTOMER', label: 'End Customers', count: users.filter((u) => u.role === 'END_CUSTOMER').length },
            { id: 'VENDOR', label: 'Vendors', count: users.filter((u) => u.role.includes('VENDOR')).length },
            { id: 'VERIFIED', label: 'Verified Email', count: users.filter((u) => u.email_verified).length },
            { id: 'PENDING', label: 'Pending Verification', count: users.filter((u) => !u.email_verified).length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id as any)}
              className={`px-3 py-1 text-xs rounded-lg font-medium transition flex items-center gap-1.5 ${
                roleFilter === tab.id
                  ? 'bg-cyan-600 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                roleFilter === tab.id ? 'bg-cyan-700 text-cyan-100' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Users Table with Separate Plan and Tier Columns */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-cyan-600" />
            <span>Loading real-time sign-up records from PostgreSQL...</span>
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-500 flex flex-col items-center justify-center gap-2">
            <span className="font-semibold text-rose-600">Error loading sign-up users</span>
            <span className="text-slate-500">{error}</span>
            <button
              onClick={fetchUsers}
              className="mt-2 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 font-medium hover:bg-rose-200"
            >
              Retry Connection
            </button>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
            <Users className="w-8 h-8 text-slate-300 dark:text-slate-600" />
            <span className="text-sm font-semibold text-slate-600 dark:text-slate-300">No users match your criteria</span>
            <span className="text-xs text-slate-400">
              {searchQuery ? `No results found for "${searchQuery}"` : 'No sign-up records found for this filter.'}
            </span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-slate-800 font-bold">
                <tr>
                  <th className="px-4 py-3.5 whitespace-nowrap">User (Name &amp; Email)</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Account Type</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Phone &amp; Organization</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Verification</th>
                  {/* SEPARATE PLAN COLUMN */}
                  <th className="px-4 py-3.5 whitespace-nowrap">Plan</th>
                  {/* SEPARATE TIER COLUMN */}
                  <th className="px-4 py-3.5 whitespace-nowrap">Tier</th>
                  {/* SEPARATE LICENSE EXPIRY COLUMN */}
                  <th className="px-4 py-3.5 whitespace-nowrap">License Expiry</th>
                  <th className="px-4 py-3.5 whitespace-nowrap">Registered At</th>
                  <th className="px-4 py-3.5 whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-sans">
                {filteredUsers.map((user) => {
                  const isVendor = user.role.includes('VENDOR');
                  const isSuperAdmin = user.role === 'SUPER_ADMIN';

                  const planName = user.plan || 'Cloud - Azure';
                  const tierName = user.tier || 'Gold';

                  // Tier styling badge
                  const tierColors: Record<string, string> = {
                    Gold: 'bg-amber-50 text-amber-900 border-amber-300 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
                    Silver: 'bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
                    Bronze: 'bg-orange-50 text-orange-900 border-orange-300 dark:bg-orange-950/50 dark:text-orange-300 dark:border-orange-800',
                    Trial: 'bg-indigo-50 text-indigo-900 border-indigo-300 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800',
                  };
                  const tierBadgeClass = tierColors[tierName] || tierColors.Gold;

                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition cursor-pointer group"
                    >
                      {/* Name & Email */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isVendor
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                              : isSuperAdmin
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-cyan-100 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800'
                          }`}>
                            {getInitials(user.full_name)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{user.full_name}</span>
                              <span className="text-[10px] text-slate-400 font-mono">#{user.id}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
                              <span className="truncate max-w-[190px]" title={user.email}>{user.email}</span>
                              <button
                                onClick={(e) => handleCopyEmail(user.email, e)}
                                title="Copy Email"
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded transition"
                              >
                                {copiedEmail === user.email ? (
                                  <Check className="w-3 h-3 text-emerald-500" />
                                ) : (
                                  <Copy className="w-3 h-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Account Type */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {isVendor ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800/60">
                            <Building2 className="w-3 h-3" />
                            Vendor
                          </span>
                        ) : isSuperAdmin ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60">
                            <Shield className="w-3 h-3" />
                            Super Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-300 dark:border-cyan-800/60">
                            <UserCheck className="w-3 h-3" />
                            End Customer
                          </span>
                        )}
                        {user.vendor_code && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Code: {user.vendor_code}
                          </div>
                        )}
                      </td>

                      {/* Contact & Organization */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 text-slate-700 dark:text-slate-300 font-medium">
                          <Phone className="w-3 h-3 text-emerald-500" />
                          <span>{user.phone || '—'}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[150px]">{user.organization || '—'}</span>
                        </div>
                      </td>

                      {/* Verification */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        {user.email_verified ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            Verified
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-500" />
                            Pending OTP
                          </span>
                        )}
                      </td>

                      {/* SEPARATE PLAN COLUMN */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-bold text-[11px] bg-sky-50 text-sky-800 border border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800/60 shadow-2xs">
                          <Cloud className="w-3 h-3 text-sky-500" />
                          {planName}
                        </span>
                      </td>

                      {/* SEPARATE TIER COLUMN */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md font-bold text-[11px] border shadow-2xs ${tierBadgeClass}`}>
                          <Sparkles className="w-3 h-3 text-amber-500 fill-amber-500/20" />
                          {tierName} Tier
                        </span>
                      </td>

                      {/* SEPARATE LICENSE EXPIRY COLUMN */}
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-mono text-slate-800 dark:text-slate-200 text-[11px] font-semibold">
                          <Calendar className="w-3 h-3 text-emerald-500" />
                          <span>{user.license_exp_date || '2027-11-11'}</span>
                        </div>
                        <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Active / Live
                        </div>
                      </td>

                      {/* Registered Date */}
                      <td className="px-4 py-3 whitespace-nowrap text-slate-500 dark:text-slate-400 text-[11px]">
                        <div>{formatDate(user.created_at)}</div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedUser(user);
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/40 hover:bg-cyan-100 dark:hover:bg-cyan-900/60 border border-cyan-200 dark:border-cyan-800/60 transition cursor-pointer"
                        >
                          Details →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Details Modal / Drawer */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between border-b border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-cyan-500/20 text-cyan-300 font-bold text-base flex items-center justify-center border border-cyan-500/30">
                  {getInitials(selectedUser.full_name)}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    {selectedUser.full_name}
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-mono">
                      {selectedUser.user_id}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300">{selectedUser.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Account Identity & Role */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Account Type</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {selectedUser.role.includes('VENDOR') ? 'Vendor (Partner)' : selectedUser.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'End Customer'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Account Status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Active
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold tracking-wider mb-0.5">Email Verification</span>
                  <span className={`font-semibold ${selectedUser.email_verified ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                    {selectedUser.email_verified ? '✓ Verified with OTP' : '⏳ Pending OTP Verification'}
                  </span>
                </div>
              </div>

              {/* Contact Information */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-cyan-600" /> Contact &amp; Organization Details
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Phone Number</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold">{selectedUser.phone || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Organization / Company</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.organization || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Vendor Code</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{selectedUser.vendor_code || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Customer Reference</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{selectedUser.customer || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Security & Verification Metadata */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2.5">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Security &amp; Activity
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Registration Timestamp</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{formatDate(selectedUser.created_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Verification Timestamp</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200">{formatDate(selectedUser.verified_at || selectedUser.updated_at)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Password Encryption</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Bcrypt Hashed (12 rounds)</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Sessions</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{selectedUser.active_sessions_count || 0} active token session(s)</span>
                  </div>
                </div>
              </div>

              {/* Connected Cloud Subscription & Tier (Separated) */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/60 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <BadgeCheck className="w-3.5 h-3.5 text-purple-600" /> Cloud Subscription &amp; Tier
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Cloud Plan</span>
                    <span className="inline-flex items-center gap-1 font-bold text-sky-700 dark:text-sky-300">
                      <Cloud className="w-3.5 h-3.5 text-sky-500" />
                      {selectedUser.plan || 'Cloud - Azure'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Subscription Tier</span>
                    <span className="inline-flex items-center gap-1 font-bold text-amber-700 dark:text-amber-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      {selectedUser.tier || 'Gold'} Tier
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">License Expiration</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {selectedUser.license_exp_date || '2027-11-11'} (Active)
                    </span>
                  </div>
                  {selectedUser.tenant_name && (
                    <div className="sm:col-span-3 pt-1 border-t border-slate-200 dark:border-slate-700/60">
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Connected Tenant</span>
                      <span className="font-mono text-slate-800 dark:text-slate-200">{selectedUser.tenant_name} [{selectedUser.azure_tenant_id}]</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Linked Organization — only shown when tenant verified */}
              {selectedUser.azure_tenant_id && selectedUser.org_display_name && (
                <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 space-y-2.5">
                  <h4 className="font-bold text-emerald-900 dark:text-emerald-300 text-xs uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    Linked Organization
                    <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-700 ml-1">
                      LIVE AZURE ENTRA ID
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                    {selectedUser.org_display_name && (
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Organization Name</span>
                        <span className="font-bold text-slate-900 dark:text-white">{selectedUser.org_display_name}</span>
                      </div>
                    )}
                    {selectedUser.org_domain && (
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Primary Domain</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{selectedUser.org_domain}</span>
                      </div>
                    )}
                    {selectedUser.org_phone && (
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Org Phone</span>
                        <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{selectedUser.org_phone}</span>
                      </div>
                    )}
                    {selectedUser.org_email && (
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Org Email (Admin)</span>
                        <span className="font-mono text-slate-800 dark:text-slate-200">{selectedUser.org_email}</span>
                      </div>
                    )}
                    {(selectedUser.org_city || selectedUser.org_country) && (
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">City / Country</span>
                        <span className="text-slate-800 dark:text-slate-200">
                          {[selectedUser.org_city, selectedUser.org_state, selectedUser.org_country].filter(Boolean).join(', ')}
                        </span>
                      </div>
                    )}
                    {selectedUser.org_street && (
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Street Address</span>
                        <span className="text-slate-800 dark:text-slate-200">{selectedUser.org_street}</span>
                      </div>
                    )}
                    {selectedUser.org_license && (
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">M365 License</span>
                        <span className="font-semibold text-amber-700 dark:text-amber-300">{selectedUser.org_license}</span>
                      </div>
                    )}
                    {selectedUser.org_license_exp_date && (
                      <div>
                        <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">License Expiry</span>
                        <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">{selectedUser.org_license_exp_date}</span>
                      </div>
                    )}
                    {/* Stats row */}
                    <div className="sm:col-span-2 mt-1 pt-2 border-t border-emerald-200 dark:border-emerald-800/60 grid grid-cols-4 gap-2">
                      {[
                        { label: 'Users', value: selectedUser.org_users_count, icon: '👥' },
                        { label: 'Groups', value: selectedUser.org_groups_count, icon: '🏷️' },
                        { label: 'Apps', value: selectedUser.org_apps_count, icon: '📦' },
                        { label: 'Devices', value: selectedUser.org_devices_count, icon: '💻' },
                      ].map((stat) => (
                        <div key={stat.label} className="text-center p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 border border-emerald-200 dark:border-emerald-800/60">
                          <div className="text-base">{stat.icon}</div>
                          <div className="font-bold text-emerald-900 dark:text-emerald-200 text-sm">{stat.value ?? '—'}</div>
                          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">{stat.label}</div>
                        </div>
                      ))}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-emerald-700 dark:text-emerald-400 block text-[10px] uppercase font-bold">Azure Tenant ID</span>
                      <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 break-all">{selectedUser.azure_tenant_id}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 transition cursor-pointer"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
