import React, { useState, useMemo, useEffect } from 'react';
import {
  Download,
  RefreshCw,
  Columns,
  HelpCircle,
  Plus,
  Minus,
  Search,
  Check,
  Copy,
  Clock,
  Shield,
  Eye,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  ArrowUpDown,
  Laptop,
  UserCheck,
  CheckCircle2,
  XCircle,
  Code2,
  Info
} from 'lucide-react';

export interface AuditLogItem {
  id: string;
  category: string;
  correlationId?: string;
  result: string;
  resultReason?: string;
  activityDisplayName: string;
  activityDateTime: string;
  loggedByService?: string;
  operationType?: string;
  initiatedBy?: {
    user?: {
      id?: string;
      displayName?: string;
      userPrincipalName?: string;
      ipAddress?: string;
      userType?: string;
      agentType?: string;
      homeTenantId?: string | null;
      homeTenantName?: string | null;
    } | null;
    app?: {
      appId?: string | null;
      displayName?: string | null;
      servicePrincipalId?: string | null;
      servicePrincipalName?: string | null;
    } | null;
  };
  targetResources?: Array<{
    id?: string;
    displayName?: string | null;
    type?: string;
    userPrincipalName?: string | null;
    groupType?: string | null;
    modifiedProperties?: Array<{
      displayName: string;
      oldValue?: string | null;
      newValue?: string | null;
    }>;
  }>;
  additionalDetails?: Array<{
    key: string;
    value: string;
  }>;
  [key: string]: any;
}

interface AuditLogExplorerProps {
  logs: AuditLogItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onClose?: () => void;
  isModal?: boolean;
  initialSelectedId?: string | null;
}

export function AuditLogExplorer({
  logs,
  onRefresh,
  isRefreshing = false,
  onClose,
  isModal = false,
  initialSelectedId = null
}: AuditLogExplorerProps) {
  // View mode: 'forensic' (Image 2 style) or 'azure' (Image 1 style)
  const [viewMode, setViewMode] = useState<'forensic' | 'azure'>('forensic');

  // Filters matching Image 1 - default category to 'All' so all 12 items are loaded!
  const [dateFilter, setDateFilter] = useState<'24h' | '7d' | '14d' | '30d' | 'all'>('7d');
  const [dateMode, setDateMode] = useState<'local' | 'utc'>('local');
  const [serviceFilter, setServiceFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [activityFilter, setActivityFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Success' | 'Failure'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Pagination state: Default to 8 items per page
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(8);

  // Dropdown open states for Azure filter chips
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  // Column visibility for Azure view
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    date: true,
    service: true,
    category: true,
    activity: true,
    status: true,
    statusReason: true,
    target: true,
    initiatedBy: true,
  });

  // Expandable row state for Forensic Explorer (Image 2 style)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const s = new Set<string>();
    if (initialSelectedId) s.add(initialSelectedId);
    return s;
  });

  // Selected item for slide-over fullinfo drawer
  const [inspectItem, setInspectItem] = useState<AuditLogItem | null>(() => {
    if (initialSelectedId) {
      return logs.find(l => l.id === initialSelectedId) || null;
    }
    return null;
  });

  // Sorting
  const [sortField, setSortField] = useState<'date' | 'activity' | 'category' | 'service'>('date');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Copy feedback state
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Auto-fetch if logs are empty on mount
  useEffect(() => {
    if (logs.length === 0 && onRefresh) {
      onRefresh();
    }
  }, [logs.length, onRefresh]);

  // Reset to page 1 whenever any filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [dateFilter, serviceFilter, categoryFilter, activityFilter, statusFilter, searchQuery, pageSize]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Distinct values for filter dropdowns
  const availableServices = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.loggedByService) set.add(l.loggedByService); });
    return ['All', ...Array.from(set)];
  }, [logs]);

  const availableCategories = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.category) set.add(l.category); });
    return ['All', ...Array.from(set)];
  }, [logs]);

  const availableActivities = useMemo(() => {
    const set = new Set<string>();
    logs.forEach(l => { if (l.activityDisplayName) set.add(l.activityDisplayName); });
    return ['All', ...Array.from(set)];
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    const now = new Date().getTime();
    return logs.filter(item => {
      // Date filter
      if (dateFilter !== 'all' && item.activityDateTime) {
        const itemTime = new Date(item.activityDateTime).getTime();
        if (!isNaN(itemTime)) {
          const hoursAgo = (now - itemTime) / (1000 * 60 * 60);
          if (dateFilter === '24h' && hoursAgo > 24) return false;
          if (dateFilter === '7d' && hoursAgo > 24 * 7) return false;
          if (dateFilter === '14d' && hoursAgo > 24 * 14) return false;
          if (dateFilter === '30d' && hoursAgo > 24 * 30) return false;
        }
      }

      // Service filter
      if (serviceFilter !== 'All' && item.loggedByService !== serviceFilter) {
        return false;
      }

      // Category filter
      if (categoryFilter !== 'All' && item.category !== categoryFilter) {
        return false;
      }

      // Activity filter
      if (activityFilter !== 'All' && item.activityDisplayName !== activityFilter) {
        return false;
      }

      // Status filter
      if (statusFilter === 'Success' && item.result === 'failure') return false;
      if (statusFilter === 'Failure' && item.result !== 'failure') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const actor = (item.initiatedBy?.user?.displayName || item.initiatedBy?.app?.displayName || item.initiatedBy?.user?.userPrincipalName || '').toLowerCase();
        const target = (item.targetResources?.[0]?.displayName || item.targetResources?.[0]?.userPrincipalName || '').toLowerCase();
        const activity = (item.activityDisplayName || '').toLowerCase();
        const reason = (item.resultReason || '').toLowerCase();
        const service = (item.loggedByService || '').toLowerCase();
        const modProps = (item.targetResources?.[0]?.modifiedProperties || []).map(p => `${p.displayName} ${p.newValue}`).join(' ').toLowerCase();

        if (
          !activity.includes(q) &&
          !actor.includes(q) &&
          !target.includes(q) &&
          !reason.includes(q) &&
          !service.includes(q) &&
          !modProps.includes(q)
        ) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      let comparison = 0;
      if (sortField === 'date') {
        const tA = new Date(a.activityDateTime || 0).getTime();
        const tB = new Date(b.activityDateTime || 0).getTime();
        comparison = tA - tB;
      } else if (sortField === 'activity') {
        comparison = (a.activityDisplayName || '').localeCompare(b.activityDisplayName || '');
      } else if (sortField === 'category') {
        comparison = (a.category || '').localeCompare(b.category || '');
      } else if (sortField === 'service') {
        comparison = (a.loggedByService || '').localeCompare(b.loggedByService || '');
      }
      return sortAsc ? comparison : -comparison;
    });
  }, [logs, dateFilter, serviceFilter, categoryFilter, activityFilter, statusFilter, searchQuery, sortField, sortAsc]);

  // Pagination calculations
  const totalItems = filteredLogs.length;
  const totalPages = pageSize === -1 ? 1 : Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedLogs = useMemo(() => {
    if (pageSize === -1) return filteredLogs;
    const startIdx = (safeCurrentPage - 1) * pageSize;
    return filteredLogs.slice(startIdx, startIdx + pageSize);
  }, [filteredLogs, safeCurrentPage, pageSize]);

  const startIndex = totalItems === 0 ? 0 : (safeCurrentPage - 1) * (pageSize === -1 ? totalItems : pageSize) + 1;
  const endIndex = pageSize === -1 ? totalItems : Math.min(safeCurrentPage * pageSize, totalItems);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(paginatedLogs.map(l => l.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Date formatters
  const formatDateParts = (dateStr: string, mode: 'local' | 'utc' = dateMode) => {
    if (!dateStr) return { date: '—', time: '' };
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return { date: dateStr, time: '' };

      if (mode === 'utc') {
        return {
          date: d.toISOString().slice(0, 10),
          time: d.toISOString().slice(11, 19) + ' UTC'
        };
      }

      // "Oct 26, 2026", "9:56 PM"
      const datePart = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
      return { date: datePart, time: timePart };
    } catch {
      return { date: dateStr, time: '' };
    }
  };

  const formatDate = (dateStr: string, mode: 'local' | 'utc' = dateMode, style: 'forensic' | 'azure' = 'forensic') => {
    if (!dateStr) return '—';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;

      if (mode === 'utc') {
        return d.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
      }

      if (style === 'forensic') {
        const { date, time } = formatDateParts(dateStr, mode);
        return `${date} ${time}`;
      } else {
        // Azure Portal style: "10/26/2026, 9:56:13 PM"
        return d.toLocaleString('en-US', {
          month: '2-digit',
          day: '2-digit',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        });
      }
    } catch {
      return dateStr;
    }
  };

  // Actor resolver
  const getActor = (item: AuditLogItem) => {
    if (item.initiatedBy?.user?.displayName) return item.initiatedBy.user.displayName;
    if (item.initiatedBy?.app?.displayName) return item.initiatedBy.app.displayName;
    if (item.initiatedBy?.user?.userPrincipalName) return item.initiatedBy.user.userPrincipalName;
    if (item.initiatedBy?.app?.servicePrincipalName) return item.initiatedBy.app.servicePrincipalName;
    if (item.initiatedBy?.app?.servicePrincipalId) return `SP: ${item.initiatedBy.app.servicePrincipalId.slice(0, 8)}...`;
    return 'System';
  };

  // Target resolver
  const getTargetParts = (item: AuditLogItem) => {
    const t = item.targetResources?.[0];
    if (!t) return { upnName: '—', domain: '' };
    const upn = t.userPrincipalName || t.displayName || '—';
    if (upn.includes('@')) {
      const [user, dom] = upn.split('@');
      return { upnName: user, domain: `@${dom}` };
    }
    return { upnName: upn, domain: '' };
  };

  const getTarget = (item: AuditLogItem) => {
    const t = item.targetResources?.[0];
    if (!t) return '—';
    if (t.userPrincipalName) return t.userPrincipalName;
    if (t.displayName && t.displayName !== 'Unknown') return t.displayName;
    return t.displayName || t.type || '—';
  };

  // Detail / Modified property badge resolver (Image 2 style)
  const getDetailBadge = (item: AuditLogItem) => {
    const t = item.targetResources?.[0];
    const props = t?.modifiedProperties || [];

    if (props.length > 0) {
      // Find the first meaningful property
      const p = props[0];
      const name = p.displayName || 'Property';
      let val = (p.newValue || '').trim();

      // Clean stringified JSON or quotes
      if (val.startsWith('"') && val.endsWith('"') && val.length > 1) {
        val = val.slice(1, -1);
      }

      if (val === '""' || val === '') {
        return `${name}:`;
      }

      // Handle arrays like ["Usage=FIDO,..."] or [{"DeviceName":...}]
      if (val.startsWith('["[') && val.endsWith(']"]')) {
        val = val.slice(3, -3);
      } else if (val.startsWith('["') && val.endsWith('"]')) {
        val = val.slice(2, -2);
      } else if (val.startsWith('[') && val.endsWith(']')) {
        try {
          const parsed = JSON.parse(val);
          if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object') {
            const obj = parsed[0];
            const summary = Object.entries(obj).map(([k, v]) => `${k}=${v}`).slice(0, 3).join(', ');
            return `${name}: ${summary}`;
          }
        } catch {}
      }

      return `${name}: ${val}`;
    }

    // Default configuration updated badge
    return 'Configuration updated';
  };

  // Export handlers
  const handleDownloadCsv = () => {
    const headers = ['Date', 'Service', 'Category', 'Activity', 'Status', 'StatusReason', 'Target', 'InitiatedBy', 'Details'];
    const rows = filteredLogs.map(item => [
      `"${formatDate(item.activityDateTime, dateMode, 'azure')}"`,
      `"${item.loggedByService || ''}"`,
      `"${item.category || ''}"`,
      `"${item.activityDisplayName || ''}"`,
      `"${item.result || 'success'}"`,
      `"${item.resultReason || ''}"`,
      `"${getTarget(item)}"`,
      `"${getActor(item)}"`,
      `"${getDetailBadge(item).replace(/"/g, '""')}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zensustech_audit_logs_${dateFilter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `zensustech_audit_logs_${dateFilter}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const mainExplorer = (
    <div className="bg-white rounded-2xl flex flex-col h-full w-full overflow-hidden border border-slate-200/90 shadow-xl">
      
      {/* ── Top Bar / Header ── */}
      <div className="flex flex-col border-b border-slate-200 shrink-0 bg-white">
        
        {/* Row 1: Brand / Title / Close / Switcher */}
        <div className="px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 bg-[#fbfcfd]">
          <div className="flex items-center gap-3">
            {onClose && (
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                title="Close explorer"
              >
                <X className="h-5 w-5" />
              </button>
            )}
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-slate-800 tracking-tight">
                {viewMode === 'forensic' ? 'All Forensic Explorer' : 'Users | Audit logs'}
              </h1>
              <span className="text-xs text-slate-300">|</span>
              <span className="text-xs font-semibold text-slate-500">ZensusTech</span>
            </div>
          </div>

          {/* Right Controls: View Switcher, Download, Refresh */}
          <div className="flex items-center gap-2">
            
            {/* View Switcher Pill */}
            <div className="flex items-center bg-slate-100/90 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600">
              <button
                onClick={() => setViewMode('forensic')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'forensic'
                    ? 'bg-white text-slate-900 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Forensic Explorer (Image 2 style with expandable rows)"
              >
                Forensic Explorer
              </button>
              <button
                onClick={() => setViewMode('azure')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === 'azure'
                    ? 'bg-white text-sky-700 shadow-xs border border-slate-200 font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
                title="Azure Portal View (Image 1 style with columns and filters)"
              >
                Azure Portal View
              </button>
            </div>

            {/* Download Dropdown */}
            <div className="relative">
              <button
                onClick={() => setOpenDropdown(openDropdown === 'download' ? null : 'download')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Download className="h-3.5 w-3.5 text-sky-600" />
                <span>Download</span>
                <ChevronDown className="h-3 w-3 text-slate-400" />
              </button>
              {openDropdown === 'download' && (
                <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                  <button
                    onClick={() => { handleDownloadCsv(); setOpenDropdown(null); }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors flex items-center gap-2"
                  >
                    <FileText className="h-3.5 w-3.5 text-slate-400" />
                    Download as CSV
                  </button>
                  <button
                    onClick={() => { handleDownloadJson(); setOpenDropdown(null); }}
                    className="w-full text-left px-3.5 py-2 text-xs font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-700 transition-colors flex items-center gap-2"
                  >
                    <Code2 className="h-3.5 w-3.5 text-slate-400" />
                    Download as JSON
                  </button>
                </div>
              )}
            </div>

            {/* Refresh Button */}
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${isRefreshing ? 'animate-spin text-sky-600' : ''}`} />
                <span>Refresh</span>
              </button>
            )}

            {/* Columns Toggle (in Azure Mode) */}
            {viewMode === 'azure' && (
              <div className="relative">
                <button
                  onClick={() => setOpenDropdown(openDropdown === 'columns' ? null : 'columns')}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  <Columns className="h-3.5 w-3.5 text-slate-500" />
                  <span>Columns</span>
                </button>
                {openDropdown === 'columns' && (
                  <div className="absolute right-0 mt-1 w-52 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 z-30 space-y-1 animate-in fade-in zoom-in-95">
                    <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">Toggle Columns</p>
                    {Object.entries(visibleColumns).map(([colKey, isVisible]) => (
                      <label key={colKey} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={(e) => setVisibleColumns(prev => ({ ...prev, [colKey]: e.target.checked }))}
                          className="rounded text-sky-600 focus:ring-sky-500 h-3.5 w-3.5"
                        />
                        <span className="capitalize">{colKey.replace(/([A-Z])/g, ' $1')}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )}

            {viewMode === 'forensic' && (
              <div className="flex items-center gap-1">
                <button
                  onClick={expandAll}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[0.7rem] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Expand all
                </button>
                <button
                  onClick={collapseAll}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-[0.7rem] font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Collapse all
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Row 2: Azure Informational Notice Banner (Image 1 style) */}
        {viewMode === 'azure' && (
          <div className="px-6 py-2 bg-purple-50/70 border-b border-purple-100 flex items-center justify-between text-xs text-purple-900">
            <div className="flex items-center gap-2">
              <span className="h-4 w-4 rounded-full bg-purple-600 text-white flex items-center justify-center text-[0.6rem] font-bold shrink-0">✓</span>
              <span>This view includes full audit log details, search filtering, inline fullinfo inspection, and complete JSON schema payloads.</span>
            </div>
            <span className="text-[0.7rem] font-bold text-purple-700 hover:underline cursor-pointer">
              Active Entra ID Feed
            </span>
          </div>
        )}

        {/* Row 3: Filter Chips Bar (Image 1 exact style) */}
        <div className="px-6 py-2.5 flex flex-wrap items-center gap-2 bg-white">
          
          {/* Date Range Chip */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'date' ? null : 'date')}
              className="flex items-center gap-1.5 px-3 py-1.2 rounded-full text-xs font-semibold bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-slate-700 transition-colors"
            >
              <span className="text-slate-400 font-normal">Date :</span>
              <span className="text-slate-900 font-bold">
                {dateFilter === '24h' ? 'Last 24 hours' : dateFilter === '7d' ? 'Last 7 days' : dateFilter === '14d' ? 'Last 14 days' : dateFilter === '30d' ? 'Last 30 days' : 'All time'}
              </span>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
            </button>
            {openDropdown === 'date' && (
              <div className="absolute left-0 mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                {[
                  { id: '24h', label: 'Last 24 hours' },
                  { id: '7d', label: 'Last 7 days' },
                  { id: '14d', label: 'Last 14 days' },
                  { id: '30d', label: 'Last 30 days' },
                  { id: 'all', label: 'All available' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => { setDateFilter(opt.id as any); setOpenDropdown(null); }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                      dateFilter === opt.id ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {dateFilter === opt.id && <Check className="h-3 w-3 text-sky-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Show dates as Chip */}
          <button
            onClick={() => setDateMode(dateMode === 'local' ? 'utc' : 'local')}
            className="flex items-center gap-1.5 px-3 py-1.2 rounded-full text-xs font-semibold bg-slate-100/80 border border-slate-200 hover:border-slate-300 text-slate-700 transition-colors"
            title="Toggle between Local Time and UTC"
          >
            <span className="text-slate-400 font-normal">Show dates as :</span>
            <span className="text-slate-900 font-bold">{dateMode === 'local' ? 'Local' : 'UTC'}</span>
          </button>

          {/* Service Filter Chip */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'service' ? null : 'service')}
              className={`flex items-center gap-1.5 px-3 py-1.2 rounded-full text-xs font-semibold transition-colors border ${
                serviceFilter !== 'All'
                  ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold'
                  : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-slate-400 font-normal">Service :</span>
              <span className="text-slate-900 font-bold">{serviceFilter}</span>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
            </button>
            {openDropdown === 'service' && (
              <div className="absolute left-0 mt-1.5 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 max-h-60 overflow-y-auto">
                {availableServices.map(srv => (
                  <button
                    key={srv}
                    onClick={() => { setServiceFilter(srv); setOpenDropdown(null); }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                      serviceFilter === srv ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{srv}</span>
                    {serviceFilter === srv && <Check className="h-3 w-3 text-sky-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Category Filter Chip */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'category' ? null : 'category')}
              className={`flex items-center gap-1.5 px-3.5 py-1.2 rounded-full text-xs font-semibold transition-colors border ${
                categoryFilter !== 'All'
                  ? 'bg-sky-100/70 border-sky-400 text-sky-950 font-bold shadow-2xs'
                  : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-slate-500 font-medium">Category :</span>
              <span className="text-slate-900 font-bold">{categoryFilter}</span>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
            </button>
            {openDropdown === 'category' && (
              <div className="absolute left-0 mt-1.5 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 max-h-60 overflow-y-auto">
                {availableCategories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => { setCategoryFilter(cat); setOpenDropdown(null); }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                      categoryFilter === cat ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{cat}</span>
                    {categoryFilter === cat && <Check className="h-3 w-3 text-sky-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Activity Filter Chip */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'activity' ? null : 'activity')}
              className={`flex items-center gap-1.5 px-3 py-1.2 rounded-full text-xs font-semibold transition-colors border ${
                activityFilter !== 'All'
                  ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold'
                  : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-slate-400 font-normal">Activity :</span>
              <span className="text-slate-900 font-bold truncate max-w-[140px]">{activityFilter}</span>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
            </button>
            {openDropdown === 'activity' && (
              <div className="absolute left-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95 max-h-64 overflow-y-auto">
                {availableActivities.map(act => (
                  <button
                    key={act}
                    onClick={() => { setActivityFilter(act); setOpenDropdown(null); }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                      activityFilter === act ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="truncate">{act}</span>
                    {activityFilter === act && <Check className="h-3 w-3 text-sky-600 shrink-0" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Status Filter */}
          <div className="relative">
            <button
              onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
              className={`flex items-center gap-1.5 px-3 py-1.2 rounded-full text-xs font-semibold transition-colors border ${
                statusFilter !== 'All'
                  ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold'
                  : 'bg-slate-100/80 border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              <span className="text-slate-400 font-normal">Status :</span>
              <span className="text-slate-900 font-bold">{statusFilter}</span>
              <ChevronDown className="h-3 w-3 text-slate-400 ml-0.5" />
            </button>
            {openDropdown === 'status' && (
              <div className="absolute left-0 mt-1.5 w-40 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-30 animate-in fade-in zoom-in-95">
                {(['All', 'Success', 'Failure'] as const).map(st => (
                  <button
                    key={st}
                    onClick={() => { setStatusFilter(st); setOpenDropdown(null); }}
                    className={`w-full text-left px-3.5 py-1.5 text-xs font-medium transition-colors flex items-center justify-between ${
                      statusFilter === st ? 'bg-sky-50 text-sky-700 font-bold' : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span>{st}</span>
                    {statusFilter === st && <Check className="h-3 w-3 text-sky-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Search Input Box */}
          <div className="flex-1 min-w-[200px] max-w-xs relative ml-auto">
            <Search className="h-3.5 w-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search activities, targets, actors..."
              className="w-full pl-8 pr-7 py-1 text-xs rounded-full border border-slate-200 bg-slate-50/60 focus:bg-white focus:outline-hidden focus:border-sky-500 focus:ring-1 focus:ring-sky-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Reset Filters */}
          {(serviceFilter !== 'All' || categoryFilter !== 'All' || activityFilter !== 'All' || statusFilter !== 'All' || searchQuery) && (
            <button
              onClick={() => {
                setServiceFilter('All');
                setCategoryFilter('All');
                setActivityFilter('All');
                setStatusFilter('All');
                setSearchQuery('');
              }}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1"
            >
              Reset
            </button>
          )}

        </div>
      </div>

      {/* ── Main Content Area (Table + Fullinfo) ── */}
      <div className="flex-1 overflow-auto relative custom-scrollbar">
        {totalItems === 0 ? (
          <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
            <Clock className="h-10 w-10 text-slate-300 mb-3 stroke-[1.5]" />
            <p className="font-semibold text-slate-700 text-sm">No matching audit events found</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Try adjusting the category or service filter chips above to discover other organizational transactions.
            </p>
            <button
              onClick={() => { setCategoryFilter('All'); setServiceFilter('All'); setActivityFilter('All'); setSearchQuery(''); }}
              className="mt-4 px-4 py-2 bg-sky-50 text-sky-700 border border-sky-200 text-xs font-bold rounded-xl hover:bg-sky-100 transition-colors"
            >
              View all audit logs
            </button>
          </div>
        ) : viewMode === 'forensic' ? (
          /* ── FORENSIC EXPLORER VIEW (IMAGE 2 STYLE) ── */
          <div className="w-full">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-slate-100 text-sm">
                {paginatedLogs.map((item) => {
                  const isExpanded = expandedIds.has(item.id);
                  const actor = getActor(item);
                  const { upnName, domain } = getTargetParts(item);
                  const badge = getDetailBadge(item);
                  const { date, time } = formatDateParts(item.activityDateTime, dateMode);
                  const isFailure = item.result === 'failure';

                  return (
                    <React.Fragment key={item.id}>
                      <tr
                        className={`group hover:bg-slate-50/70 transition-colors cursor-pointer ${isExpanded ? 'bg-sky-50/20' : ''}`}
                        onClick={() => toggleExpand(item.id)}
                      >
                        {/* Expand Icon (+) */}
                        <td className="py-4 pl-6 pr-3 align-top text-center w-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpand(item.id); }}
                            className="h-6 w-6 rounded-md flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
                            title={isExpanded ? 'Collapse' : 'Expand fullinfo'}
                          >
                            {isExpanded ? (
                              <Minus className="h-4 w-4 text-sky-600 stroke-[2.5]" />
                            ) : (
                              <Plus className="h-4 w-4 text-slate-500 stroke-[2.5]" />
                            )}
                          </button>
                        </td>

                        {/* Column 1: Activity Display Name */}
                        <td className="py-4 px-4 align-top font-normal text-slate-800 text-[0.88rem] min-w-[210px] max-w-[260px]">
                          <div className="flex items-center gap-2">
                            <span>{item.activityDisplayName}</span>
                            {isFailure && (
                              <span className="px-1.5 py-0.5 rounded text-[0.6rem] font-bold bg-rose-100 text-rose-700">
                                FAILED
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Column 2: Initiated by Actor */}
                        <td className="py-4 px-4 align-top text-[0.84rem] text-slate-700 min-w-[180px] max-w-[240px]">
                          <p className="font-normal text-slate-800 leading-snug">{actor}</p>
                        </td>

                        {/* Column 3: Target UPN (wrapped across lines like Image 2) */}
                        <td className="py-4 px-4 align-top text-[0.84rem] text-slate-700 min-w-[180px] max-w-[220px]">
                          <p className="font-normal text-slate-800 leading-snug break-all">
                            {upnName}
                            {domain && <span className="block text-slate-500">{domain}</span>}
                          </p>
                        </td>

                        {/* Column 4: Light Blue Detail Badge (Image 2 style) */}
                        <td className="py-4 px-4 align-top">
                          <span
                            className="inline-block max-w-xl truncate px-2.5 py-1 rounded bg-[#eef6ff] text-[#0284c7] border border-[#bae6fd] text-[0.74rem] font-medium shadow-2xs"
                            title={badge}
                          >
                            {badge}
                          </span>
                        </td>

                        {/* Column 5: Date & Time (Oct 26, 2026 / 9:56 PM) */}
                        <td className="py-4 pl-4 pr-6 align-top text-right text-[0.82rem] text-slate-600 whitespace-nowrap min-w-[120px]">
                          <p>{date}</p>
                          <p className="text-slate-500 text-[0.78rem]">{time}</p>
                        </td>
                      </tr>

                      {/* Expandable Fullinfo Row */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-200">
                          <td colSpan={6} className="p-6">
                            <FullInfoCard
                              item={item}
                              dateMode={dateMode}
                              formatDate={formatDate}
                              copyToClipboard={copyToClipboard}
                              copiedKey={copiedKey}
                              onInspect={() => setInspectItem(item)}
                            />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── AZURE PORTAL VIEW (IMAGE 1 STYLE) ── */
          <div className="w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/90 text-slate-600 font-semibold select-none">
                  {visibleColumns.date && (
                    <th
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => { setSortField('date'); setSortAsc(!sortAsc); }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Date</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.service && (
                    <th
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => { setSortField('service'); setSortAsc(!sortAsc); }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Service</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.category && (
                    <th
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => { setSortField('category'); setSortAsc(!sortAsc); }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Category</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.activity && (
                    <th
                      className="py-2.5 px-3 cursor-pointer hover:bg-slate-100/80 transition-colors"
                      onClick={() => { setSortField('activity'); setSortAsc(!sortAsc); }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Activity</span>
                        <ArrowUpDown className="h-3 w-3 text-slate-400" />
                      </div>
                    </th>
                  )}
                  {visibleColumns.status && <th className="py-2.5 px-3">Status</th>}
                  {visibleColumns.statusReason && <th className="py-2.5 px-3">Status reason</th>}
                  {visibleColumns.target && <th className="py-2.5 px-3">Target(s)</th>}
                  {visibleColumns.initiatedBy && <th className="py-2.5 px-3">Initiated by</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedLogs.map((item) => {
                  const actor = getActor(item);
                  const target = getTarget(item);
                  const isFailure = item.result === 'failure';
                  const dateStr = formatDate(item.activityDateTime, dateMode, 'azure');

                  return (
                    <tr
                      key={item.id}
                      onClick={() => setInspectItem(item)}
                      className="hover:bg-sky-50/50 cursor-pointer transition-colors group"
                    >
                      {visibleColumns.date && (
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap font-mono text-[0.72rem]">
                          {dateStr}
                        </td>
                      )}
                      {visibleColumns.service && (
                        <td className="py-2.5 px-3 text-slate-800 whitespace-nowrap font-medium">
                          {item.loggedByService || 'Core Directory'}
                        </td>
                      )}
                      {visibleColumns.category && (
                        <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap">
                          {item.category}
                        </td>
                      )}
                      {visibleColumns.activity && (
                        <td className="py-2.5 px-3 font-semibold text-slate-900 group-hover:text-sky-600 transition-colors">
                          {item.activityDisplayName}
                        </td>
                      )}
                      {visibleColumns.status && (
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[0.7rem] font-bold ${
                            isFailure ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isFailure ? <XCircle className="h-3 w-3 text-rose-600" /> : <CheckCircle2 className="h-3 w-3 text-emerald-600" />}
                            {isFailure ? 'Failure' : 'Success'}
                          </span>
                        </td>
                      )}
                      {visibleColumns.statusReason && (
                        <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate" title={item.resultReason || '—'}>
                          {item.resultReason || '—'}
                        </td>
                      )}
                      {visibleColumns.target && (
                        <td className="py-2.5 px-3 font-mono text-slate-800 max-w-xs truncate" title={target}>
                          {target}
                        </td>
                      )}
                      {visibleColumns.initiatedBy && (
                        <td className="py-2.5 px-3 text-slate-700 max-w-xs truncate" title={actor}>
                          {actor}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Slide-Over Detailed Fullinfo Inspector Panel ── */}
      {inspectItem && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/50 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Inspector Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${
                  inspectItem.result === 'failure' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'
                }`}>
                  <Shield className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-widest">Audit Event Full Detail</p>
                  <h3 className="font-bold text-slate-800 text-sm">{inspectItem.activityDisplayName}</h3>
                </div>
              </div>
              <button
                onClick={() => setInspectItem(null)}
                className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {/* Inspector Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <FullInfoCard
                item={inspectItem}
                dateMode={dateMode}
                formatDate={formatDate}
                copyToClipboard={copyToClipboard}
                copiedKey={copiedKey}
              />
            </div>

            {/* Inspector Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
              <span className="text-[0.7rem] text-slate-400 font-mono">
                Event ID: {inspectItem.id.slice(0, 24)}...
              </span>
              <button
                onClick={() => setInspectItem(null)}
                className="px-4 py-2 bg-slate-800 text-white rounded-xl text-xs font-semibold hover:bg-slate-900 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Footer Pagination & Status Bar ── */}
      <div className="px-6 py-3 border-t border-slate-200 bg-[#fbfcfd] flex flex-wrap items-center justify-between gap-4 text-xs text-slate-600 shrink-0">
        
        {/* Left Side: Summary info */}
        <div className="flex items-center gap-2.5">
          <span className="text-slate-700 font-medium">
            Showing <strong className="font-bold text-slate-900">{startIndex} - {endIndex}</strong> of <strong className="font-bold text-slate-900">{totalItems}</strong> audit activities
            {totalItems !== logs.length && (
              <span className="text-slate-400 font-normal"> (filtered from {logs.length} total)</span>
            )}
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-slate-500">
            Timezone: <strong className="font-semibold text-slate-750">{dateMode === 'local' ? Intl.DateTimeFormat().resolvedOptions().timeZone : 'UTC'}</strong>
          </span>
        </div>

        {/* Right Side: Page size + Pagination Controls */}
        <div className="flex items-center gap-4">
          
          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-slate-500">Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-sky-500 cursor-pointer shadow-2xs"
            >
              <option value={8}>8</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={-1}>All ({totalItems})</option>
            </select>
          </div>

          {/* Navigation Controls: Chevrons & Page Numbers */}
          <div className="flex items-center gap-1">
            
            {/* First Page Icon */}
            <button
              onClick={() => setCurrentPage(1)}
              disabled={safeCurrentPage <= 1}
              className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:border-slate-200 disabled:cursor-not-allowed transition-colors"
              title="First Page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>

            {/* Previous Page Icon */}
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="h-8 px-2.5 rounded-lg border border-slate-200 flex items-center gap-1 text-xs font-semibold text-slate-700 hover:bg-white hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:border-slate-200 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {/* Page Number Pills */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`h-8 min-w-[2rem] px-2 rounded-lg text-xs font-bold transition-all ${
                    safeCurrentPage === pageNum
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-white hover:border hover:border-slate-200'
                  }`}
                >
                  {pageNum}
                </button>
              ))}
            </div>

            {/* Next Page Icon - clicking this displays the remaining values! */}
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="h-8 px-3 rounded-lg border flex items-center gap-1.5 text-xs font-bold transition-colors shadow-2xs text-sky-700 bg-sky-50 border-sky-300 hover:bg-sky-100 disabled:opacity-40 disabled:bg-slate-50 disabled:border-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed"
              title="Next Page (display remaining values)"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            {/* Last Page Icon */}
            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={safeCurrentPage >= totalPages}
              className="h-8 w-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-white hover:text-slate-800 hover:border-slate-300 disabled:opacity-30 disabled:hover:bg-transparent disabled:border-slate-200 disabled:cursor-not-allowed transition-colors"
              title="Last Page"
            >
              <ChevronsRight className="h-4 w-4" />
            </button>

          </div>

        </div>

      </div>

    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-950/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in">
        <div className="w-full h-full max-w-7xl flex flex-col overflow-hidden">
          {mainExplorer}
        </div>
      </div>
    );
  }

  return mainExplorer;
}

// ─────────────────────────────────────────────────────────────────────────────
// Detailed FullInfo Card Component (renders all metadata, actor, target, modified props, raw JSON)
// ─────────────────────────────────────────────────────────────────────────────

interface FullInfoCardProps {
  item: AuditLogItem;
  dateMode: 'local' | 'utc';
  formatDate: (d: string, mode: 'local' | 'utc', s: 'forensic' | 'azure') => string;
  copyToClipboard: (text: string, key: string) => void;
  copiedKey: string | null;
  onInspect?: () => void;
}

function FullInfoCard({
  item,
  dateMode,
  formatDate,
  copyToClipboard,
  copiedKey
}: FullInfoCardProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'modified' | 'json'>('details');
  const userActor = item.initiatedBy?.user;
  const appActor = item.initiatedBy?.app;
  const target = item.targetResources?.[0];
  const modifiedProperties = target?.modifiedProperties || [];
  const additionalDetails = item.additionalDetails || [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
      
      {/* Tab Navigation inside Card */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'details' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Overview & Actors
          </button>
          <button
            onClick={() => setActiveTab('modified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'modified' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>Modified Properties</span>
            <span className="px-1.5 py-0.2 rounded-full text-[0.65rem] bg-slate-100 text-slate-700">
              {modifiedProperties.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('json')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'json' ? 'bg-sky-50 text-sky-700 border border-sky-200' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>Raw JSON</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {item.correlationId && (
            <button
              onClick={() => copyToClipboard(item.correlationId || '', `corr-${item.id}`)}
              className="text-[0.68rem] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-200"
              title="Copy Correlation ID"
            >
              {copiedKey === `corr-${item.id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
              <span>Correlation ID</span>
            </button>
          )}
          <button
            onClick={() => copyToClipboard(JSON.stringify(item, null, 2), `json-${item.id}`)}
            className="text-[0.68rem] text-slate-500 hover:text-slate-800 flex items-center gap-1 px-2 py-1 rounded bg-slate-50 border border-slate-200"
            title="Copy Full Event JSON"
          >
            {copiedKey === `json-${item.id}` ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 text-slate-400" />}
            <span>Copy JSON</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Overview & Actors */}
      {activeTab === 'details' && (
        <div className="space-y-4">
          
          {/* Top Key Metadata Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50/70 p-3.5 rounded-xl border border-slate-200/80 text-xs">
            <div>
              <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Activity</p>
              <p className="font-semibold text-slate-800 mt-0.5">{item.activityDisplayName}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Category</p>
              <p className="font-semibold text-slate-800 mt-0.5">{item.category || '—'}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Service</p>
              <p className="font-semibold text-slate-800 mt-0.5">{item.loggedByService || '—'}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Result</p>
              <p className={`font-bold mt-0.5 inline-flex items-center gap-1 ${
                item.result === 'failure' ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {item.result === 'failure' ? '● Failure' : '● Success'}
                {item.resultReason ? ` (${item.resultReason})` : ''}
              </p>
            </div>
          </div>

          {/* Timestamps & IDs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-white p-3.5 rounded-xl border border-slate-200/80">
            <div>
              <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Activity Time (Local)</p>
              <p className="font-mono text-slate-700 mt-0.5">{formatDate(item.activityDateTime, 'local', 'azure')}</p>
            </div>
            <div>
              <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Activity Time (UTC)</p>
              <p className="font-mono text-slate-700 mt-0.5">{formatDate(item.activityDateTime, 'utc', 'azure')}</p>
            </div>
            <div className="md:col-span-2">
              <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Event ID</p>
              <p className="font-mono text-[0.7rem] text-slate-600 mt-0.5 break-all select-all">{item.id}</p>
            </div>
          </div>

          {/* Initiated By & Target Resources (Two Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Initiated By Card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
              <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="h-3.5 w-3.5 text-sky-500" />
                Initiated By (Actor)
              </p>

              {userActor ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Display Name:</span>
                    <span className="font-bold text-slate-800">{userActor.displayName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">UPN:</span>
                    <span className="font-mono text-slate-800">{userActor.userPrincipalName || '—'}</span>
                  </div>
                  {userActor.id && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">User ID:</span>
                      <span className="font-mono text-[0.68rem] text-slate-600">{userActor.id}</span>
                    </div>
                  )}
                  {userActor.ipAddress && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">IP Address:</span>
                      <span className="font-mono text-slate-800 font-semibold">{userActor.ipAddress}</span>
                    </div>
                  )}
                  {userActor.userType && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">User Type:</span>
                      <span className="text-slate-700 font-medium">{userActor.userType}</span>
                    </div>
                  )}
                </div>
              ) : appActor ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Application:</span>
                    <span className="font-bold text-slate-800">{appActor.displayName || 'System Service'}</span>
                  </div>
                  {appActor.servicePrincipalId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Service Principal ID:</span>
                      <span className="font-mono text-[0.68rem] text-slate-600">{appActor.servicePrincipalId}</span>
                    </div>
                  )}
                  {appActor.appId && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">App ID:</span>
                      <span className="font-mono text-[0.68rem] text-slate-600">{appActor.appId}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">Initiated by automated internal Azure background service.</p>
              )}
            </div>

            {/* Target Resources Card */}
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
              <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="h-3.5 w-3.5 text-sky-500" />
                Target Resource
              </p>

              {target ? (
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Display Name:</span>
                    <span className="font-bold text-slate-800">{target.displayName || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Type:</span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-[0.68rem] font-semibold text-slate-700">
                      {target.type || 'Resource'}
                    </span>
                  </div>
                  {target.userPrincipalName && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target UPN:</span>
                      <span className="font-mono text-slate-800">{target.userPrincipalName}</span>
                    </div>
                  )}
                  {target.id && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">Target ID:</span>
                      <span className="font-mono text-[0.68rem] text-slate-600">{target.id}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific target resource recorded.</p>
              )}
            </div>

          </div>

          {/* Additional Details Key/Value */}
          {additionalDetails.length > 0 && (
            <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2">
              <p className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider">Additional Context & Telemetry</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {additionalDetails.map((det, idx) => (
                  <div key={idx} className="p-2 rounded-lg bg-slate-50 border border-slate-200/60 flex items-center justify-between">
                    <span className="text-slate-500 font-medium">{det.key}:</span>
                    <span className="font-mono text-slate-800 text-[0.72rem] truncate max-w-[200px]" title={det.value}>
                      {det.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Tab 2: Modified Properties Table */}
      {activeTab === 'modified' && (
        <div className="space-y-3">
          {modifiedProperties.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-slate-400 text-xs">
              <Info className="h-6 w-6 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-slate-700">No properties modified directly in this transaction</p>
              <p className="text-[0.7rem] text-slate-400 mt-1">This operation registered security credentials or updated state configuration without modifying user attributes.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
                    <th className="py-2.5 px-3">Property Display Name</th>
                    <th className="py-2.5 px-3">Old Value</th>
                    <th className="py-2.5 px-3">New Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {modifiedProperties.map((prop, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3 font-semibold text-sky-900 font-mono text-[0.72rem]">
                        {prop.displayName}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-mono text-[0.72rem]">
                        {prop.oldValue && prop.oldValue !== '""' ? prop.oldValue : '—'}
                      </td>
                      <td className="py-3 px-3 font-mono text-[0.72rem] text-slate-800 break-all bg-sky-50/30">
                        {prop.newValue && prop.newValue !== '""' ? prop.newValue : '""'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Raw JSON Inspector */}
      {activeTab === 'json' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[0.68rem] font-bold text-slate-400 uppercase tracking-wider font-mono">
              Raw Audit Record (Microsoft Graph Schema)
            </span>
            <button
              onClick={() => copyToClipboard(JSON.stringify(item, null, 2), `tab-json-${item.id}`)}
              className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
            >
              {copiedKey === `tab-json-${item.id}` ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  <span>Copy raw JSON</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 rounded-xl bg-slate-900 text-emerald-400 font-mono text-[0.7rem] overflow-x-auto max-h-96 custom-scrollbar leading-relaxed">
            {JSON.stringify(item, null, 2)}
          </pre>
        </div>
      )}

    </div>
  );
}
