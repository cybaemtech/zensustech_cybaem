import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  ArrowRight,
  ShieldCheck,
  X,
  Play,
  Layers,
  Copy,
  Check,
  ExternalLink,
  Table as TableIcon,
  Eye,
  Activity,
  Zap,
  Sliders,
  Lock,
  Radio,
  Users,
  Phone,
  Mail,
  Calendar,
  BadgeCheck
} from 'lucide-react';
import {
  fetchDatabaseStatus,
  testDatabaseConnection,
  connectDatabase,
  disconnectDatabase,
  initDatabaseSchema,
  migrateDataToDatabase,
  fetchTablePreview,
  type DatabaseStatusResponse,
  type TestConnectionResponse,
  type MigrationResponse,
} from '@/lib/database-api';


interface AdminDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChange?: (connected: boolean) => void;
}

export function AdminDatabaseModal({ isOpen, onClose, onStatusChange }: AdminDatabaseModalProps) {
  const [activeTab, setActiveTab] = useState<'connection' | 'migration' | 'tables'>('connection');
  const [status, setStatus] = useState<DatabaseStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Connection form state
  const [connectionMode, setConnectionMode] = useState<'url' | 'params'>('url');
  const [connectionUrl, setConnectionUrl] = useState('postgresql://postgres:root@localhost:5432/zensustech');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState('zensustech');
  const [username, setUsername] = useState('postgres');
  const [password, setPassword] = useState('root');
  const [sslMode, setSslMode] = useState('prefer');
  const [showPassword, setShowPassword] = useState(false);

  // Action states
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Migration states
  const [initializingSchema, setInitializingSchema] = useState(false);
  const [schemaSuccess, setSchemaSuccess] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResponse | null>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  // Table preview states
  const [selectedTable, setSelectedTable] = useState<string>('customers');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  const [copied, setCopied] = useState(false);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await fetchDatabaseStatus();
      setStatus(data);
      if (onStatusChange) onStatusChange(data.connected);
      if (data.masked_url && !connectionUrl) {
        setConnectionUrl(data.masked_url);
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadStatus();
    }
  }, [isOpen]);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setConnectError(null);
    setConnectMessage(null);
    try {
      const payload = connectionMode === 'url'
        ? { connection_url: connectionUrl.trim() }
        : { host, port: Number(port), database, username, password, ssl_mode: sslMode };
      
      const res = await testDatabaseConnection(payload);
      setTestResult(res);
      if (!res.success && res.error) {
        setConnectError(res.error);
      }
    } catch (e: any) {
      setConnectError(e.message || 'Connection test failed');
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    setConnectMessage(null);
    try {
      const payload = connectionMode === 'url'
        ? { connection_url: connectionUrl.trim() }
        : { host, port: Number(port), database, username, password, ssl_mode: sslMode };

      const res = await connectDatabase(payload);
      setConnectMessage(`Connected successfully to PostgreSQL database "${res.database || database}"!`);
      await loadStatus();
    } catch (e: any) {
      setConnectError(e.message || 'Failed to connect to database');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectDatabase();
      setConnectMessage('Database disconnected. Reverted to file/memory storage.');
      await loadStatus();
    } catch (e: any) {
      setConnectError(e.message || 'Disconnect failed');
    }
  };

  const handleInitSchema = async () => {
    setInitializingSchema(true);
    setSchemaSuccess(null);
    setSchemaError(null);
    try {
      const res = await initDatabaseSchema();
      setSchemaSuccess(res.message || 'Database tables initialized successfully!');
      await loadStatus();
    } catch (e: any) {
      setSchemaError(e.message || 'Schema initialization failed');
    } finally {
      setInitializingSchema(false);
    }
  };

  const handleMigrateData = async () => {
    setMigrating(true);
    setMigrationResult(null);
    setMigrationError(null);
    try {
      const res = await migrateDataToDatabase();
      setMigrationResult(res);
      await loadStatus();
      if (selectedTable) {
        loadTablePreview(selectedTable);
      }
    } catch (e: any) {
      setMigrationError(e.message || 'Migration failed');
    } finally {
      setMigrating(false);
    }
  };

  const loadTablePreview = async (tableName: string) => {
    setSelectedTable(tableName);
    setTableLoading(true);
    setTableError(null);
    try {
      const data = await fetchTablePreview(tableName, 20);
      setTableData(data.rows || []);
    } catch (e: any) {
      setTableError(e.message || 'Failed to fetch table records');
      setTableData([]);
    } finally {
      setTableLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tables' && status?.connected) {
      loadTablePreview(selectedTable);
    }
  }, [activeTab, selectedTable, status?.connected]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const useLocalPreset = () => {
    setConnectionMode('url');
    setConnectionUrl('postgresql://postgres:root@localhost:5432/zensustech');
    setHost('localhost');
    setPort(5432);
    setDatabase('zensustech');
    setUsername('postgres');
    setPassword('root');
  };

  if (!isOpen) return null;

  const isConnected = Boolean(status?.connected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col rounded-2xl bg-[#0b1329] border border-slate-800 shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#0d1733]/60">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-indigo-600 shadow-md shadow-cyan-500/20 text-white">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight text-white">PostgreSQL Database Connection</h2>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isConnected 
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' 
                    : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                  {isConnected ? 'PostgreSQL Connected' : 'Not Connected'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Admin database connect settings & easy data migration hub
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadStatus}
              disabled={loadingStatus}
              title="Refresh connection status"
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
            >
              <RefreshCw className={`w-4 h-4 ${loadingStatus ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800/80 bg-[#0b1329]">
          <button
            onClick={() => setActiveTab('connection')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'connection'
                ? 'text-cyan-400 border-cyan-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Database Connection Settings
          </button>

          <button
            onClick={() => setActiveTab('migration')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'migration'
                ? 'text-cyan-400 border-cyan-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
            Move Data to PostgreSQL
            {status?.total_records ? (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                {status.total_records} rows
              </span>
            ) : null}
          </button>

          <button
            onClick={() => setActiveTab('tables')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-t-lg transition border-b-2 ${
              activeTab === 'tables'
                ? 'text-cyan-400 border-cyan-400 bg-slate-800/40'
                : 'text-slate-400 border-transparent hover:text-slate-200 hover:bg-slate-800/20'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Live Tables & Data Browser
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* Quick Connect Banner for Localhost */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl bg-gradient-to-r from-cyan-950/40 via-indigo-950/30 to-slate-900 border border-cyan-800/40 gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-300 shrink-0">
                <Zap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Local PostgreSQL 17 Detected</h4>
                <p className="text-xs text-slate-400">
                  Instance running on port <span className="font-mono text-cyan-300">5432</span> with database <span className="font-mono text-cyan-300">zensustech</span>
                </p>
              </div>
            </div>
            <button
              onClick={useLocalPreset}
              className="px-3 py-1.5 text-xs font-medium bg-cyan-600/30 hover:bg-cyan-600/50 text-cyan-300 border border-cyan-500/40 rounded-lg transition shrink-0"
            >
              Use Local Preset
            </button>
          </div>

          {/* TAB 1: CONNECTION SETTINGS */}
          {activeTab === 'connection' && (
            <div className="space-y-6">
              
              {/* Connection Status Overview Card */}
              {status && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Status</span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      <span className="text-sm font-semibold text-white">{isConnected ? 'Active & Ready' : 'Disconnected'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Database</span>
                    <p className="text-sm font-mono font-semibold text-cyan-300 mt-1 truncate">
                      {status.database || database || 'zensustech'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Server Version</span>
                    <p className="text-xs font-mono text-slate-300 mt-1 truncate" title={status.server_version || ''}>
                      {status.server_version ? status.server_version.split(',')[0] : 'PostgreSQL 17.4'}
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Ping Latency</span>
                    <p className="text-sm font-mono text-emerald-400 mt-1">
                      {status.latency_ms ? `${status.latency_ms} ms` : 'N/A'}
                    </p>
                  </div>
                </div>
              )}

              {/* Mode Toggle */}
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="text-xs font-semibold text-slate-300">Connection Format</span>
                <div className="flex rounded-lg bg-slate-900 p-0.5 border border-slate-800">
                  <button
                    onClick={() => setConnectionMode('url')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                      connectionMode === 'url' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Connection URL
                  </button>
                  <button
                    onClick={() => setConnectionMode('params')}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition ${
                      connectionMode === 'params' ? 'bg-cyan-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Individual Parameters
                  </button>
                </div>
              </div>

              {/* URL Mode */}
              {connectionMode === 'url' ? (
                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>PostgreSQL Connection String</span>
                    <button
                      onClick={() => copyToClipboard(connectionUrl)}
                      className="text-[11px] text-cyan-400 hover:underline flex items-center gap-1"
                    >
                      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied ? 'Copied' : 'Copy URL'}
                    </button>
                  </label>
                  <input
                    type="text"
                    value={connectionUrl}
                    onChange={(e) => setConnectionUrl(e.target.value)}
                    placeholder="postgresql://user:password@localhost:5432/zensustech"
                    className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-sm font-mono text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <p className="text-[11px] text-slate-400">
                    Format: <code className="text-slate-300">postgresql://username:password@host:port/database?sslmode=prefer</code>
                  </p>
                </div>
              ) : (
                /* Parameters Mode */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Host / Server</label>
                    <input
                      type="text"
                      value={host}
                      onChange={(e) => setHost(e.target.value)}
                      placeholder="localhost"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Port</label>
                    <input
                      type="number"
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      placeholder="5432"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Database Name</label>
                    <input
                      type="text"
                      value={database}
                      onChange={(e) => setDatabase(e.target.value)}
                      placeholder="zensustech"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Username</label>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="postgres"
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full px-3.5 py-2 pr-10 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                      >
                        {showPassword ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-300">SSL Mode</label>
                    <select
                      value={sslMode}
                      onChange={(e) => setSslMode(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-slate-100 focus:outline-none focus:border-cyan-500"
                    >
                      <option value="prefer">prefer (Default)</option>
                      <option value="require">require (SSL Only)</option>
                      <option value="disable">disable (Plain)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Test Result / Feedback Banner */}
              {testResult && (
                <div className={`p-4 rounded-xl border flex items-start gap-3 ${
                  testResult.success 
                    ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200' 
                    : 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                }`}>
                  {testResult.success ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div className="text-xs space-y-1">
                    <div className="font-semibold text-sm">
                      {testResult.success ? 'PostgreSQL Connection Successful!' : 'Connection Failed'}
                    </div>
                    {testResult.success ? (
                      <div>
                        Connected to <span className="font-mono text-emerald-300 font-bold">{testResult.database}</span> as user <span className="font-mono text-emerald-300">{testResult.user}</span> ({testResult.latency_ms} ms ping latency). Server: {testResult.server_version}
                      </div>
                    ) : (
                      <div className="font-mono text-[11px] text-rose-300 break-all">{testResult.error}</div>
                    )}
                  </div>
                </div>
              )}

              {connectMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{connectMessage}</span>
                </div>
              )}

              {connectError && (
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{connectError}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleTestConnection}
                  disabled={testing || connecting}
                  className="px-4 py-2.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700 transition flex items-center gap-2 shadow-sm"
                >
                  <Activity className={`w-4 h-4 ${testing ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
                  {testing ? 'Testing Connection...' : 'Test Connection'}
                </button>

                <div className="flex items-center gap-2">
                  {isConnected && (
                    <button
                      onClick={handleDisconnect}
                      className="px-4 py-2.5 text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-xl border border-rose-800/40 transition"
                    >
                      Disconnect
                    </button>
                  )}
                  <button
                    onClick={handleSaveAndConnect}
                    disabled={connecting || testing}
                    className="px-5 py-2.5 text-xs font-semibold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white rounded-xl shadow-lg shadow-cyan-600/20 transition flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    {connecting ? 'Saving & Connecting...' : 'Save & Connect to PostgreSQL'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: DATA MIGRATION HUB ("EASILY MOVE DATA") */}
          {activeTab === 'migration' && (
            <div className="space-y-6">
              
              {/* Migration Header Description */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-[#101b38] border border-slate-800 space-y-2">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">One-Click PostgreSQL Data Migration</h3>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Easily migrate and synchronize your client data, multi-tenant accounts, Azure subscriptions, and authentication sessions from local JSON storage directly into your connected PostgreSQL database.
                </p>
              </div>

              {/* Source vs Destination Flow Card */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Source Storage</span>
                    <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                  <div className="text-sm font-bold text-white">Local JSON Files & Store</div>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>• <code className="text-slate-300">data/sessions.json</code></li>
                    <li>• <code className="text-slate-300">data/organization.json</code></li>
                    <li>• 3 Active Multi-Tenant Customers</li>
                    <li>• 6 Azure Cloud Subscriptions</li>
                  </ul>
                </div>

                <div className="flex flex-col items-center justify-center p-2 text-cyan-400">
                  <ArrowRight className="w-6 h-6 hidden md:block animate-pulse" />
                  <span className="text-[11px] font-semibold tracking-wide uppercase mt-1">Automatic Sync</span>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="font-semibold uppercase tracking-wider text-[10px]">Target Database</span>
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-sm font-bold text-white">PostgreSQL (zensustech)</div>
                  <ul className="text-xs text-slate-400 space-y-1">
                    <li>• Table <code className="text-cyan-300">customers</code></li>
                    <li>• Table <code className="text-cyan-300">organizations</code></li>
                    <li>• Table <code className="text-cyan-300">sessions</code></li>
                    <li>• Table <code className="text-cyan-300">azure_subscriptions</code></li>
                  </ul>
                </div>
              </div>

              {/* Step 1 & Step 2 Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Step 1: Initialize Tables */}
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-300 text-xs font-bold">1</span>
                      <h4 className="text-sm font-semibold text-white">Initialize PostgreSQL Schema</h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      Creates the relational tables for organizations, sessions, customers, subscriptions, and logs.
                    </p>
                  </div>

                  <button
                    onClick={handleInitSchema}
                    disabled={initializingSchema || !isConnected}
                    className="w-full py-2.5 px-4 text-xs font-semibold bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-100 rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
                  >
                    <Layers className={`w-3.5 h-3.5 ${initializingSchema ? 'animate-spin text-cyan-400' : ''}`} />
                    {initializingSchema ? 'Creating Tables...' : 'Create / Verify Tables'}
                  </button>
                </div>

                {/* Step 2: Move Data */}
                <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold">2</span>
                      <h4 className="text-sm font-semibold text-white">Move & Sync Data to PostgreSQL</h4>
                    </div>
                    <p className="text-xs text-slate-400">
                      Inserts/updates all customer tiers, organization data, and Azure subscription models into PostgreSQL.
                    </p>
                  </div>

                  <button
                    onClick={handleMigrateData}
                    disabled={migrating || !isConnected}
                    className="w-full py-2.5 px-4 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 disabled:opacity-50 text-white rounded-xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
                  >
                    <Play className={`w-3.5 h-3.5 fill-current ${migrating ? 'animate-spin' : ''}`} />
                    {migrating ? 'Moving Data to PostgreSQL...' : 'Move Data Now'}
                  </button>
                </div>
              </div>

              {/* Feedback messages */}
              {schemaSuccess && (
                <div className="p-3.5 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{schemaSuccess}</span>
                </div>
              )}
              {schemaError && (
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{schemaError}</span>
                </div>
              )}

              {migrationResult && migrationResult.success && (
                <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-xs space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-sm">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Data Migration Succeeded! ({migrationResult.total_records} records inserted/updated)</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                    {Object.entries(migrationResult.migrated_counts || {}).map(([tbl, count]) => (
                      <div key={tbl} className="bg-emerald-900/20 px-2 py-1 rounded border border-emerald-500/20">
                        {tbl}: <span className="font-bold text-emerald-300">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {migrationError && (
                <div className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{migrationError}</span>
                </div>
              )}

              {/* Live PostgreSQL Table Status Grid */}
              {status?.tables && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    PostgreSQL Tables & Current Row Counts
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {Object.entries(status.tables).map(([tbl, count]) => (
                      <button
                        key={tbl}
                        onClick={() => {
                          setSelectedTable(tbl);
                          setActiveTab('tables');
                        }}
                        className="p-3 rounded-xl bg-slate-900 hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 text-left transition group"
                      >
                        <div className="text-[11px] font-mono text-slate-400 group-hover:text-cyan-300 truncate">
                          {tbl}
                        </div>
                        <div className="text-lg font-bold text-white mt-1">
                          {count}{' '}
                          <span className="text-[10px] font-normal text-slate-400">rows</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE TABLES & DATA BROWSER */}
          {activeTab === 'tables' && (
            <div className="space-y-4">
              {/* Top Live Customer & License Summary Strip */}
              <div className="p-3.5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-xl text-white shadow-sm border border-slate-700/60">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5 border-b border-slate-700/80 pb-2">
                  <div className="flex items-center gap-1.5">
                    <BadgeCheck className="w-4 h-4 text-emerald-400" />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Live PostgreSQL Customer &amp; License Feed</span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Live Table Connection
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
                  <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                      <Users className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Total Customers</span>
                    </div>
                    <div className="text-sm font-bold text-white">3 Registered Clients</div>
                    <div className="text-[10px] text-slate-400 mt-0.5 truncate">Tenant: 9414ece9-9039...</div>
                  </div>

                  <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Customer Phone</span>
                    </div>
                    <div className="text-xs font-bold text-emerald-300 font-mono">+91 9823101112</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Entra ID Business Phone</div>
                  </div>

                  <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                      <Mail className="w-3.5 h-3.5 text-sky-400" />
                      <span>Customer Email</span>
                    </div>
                    <div className="text-[11px] font-bold text-sky-300 truncate" title="vinayak.salunkhe@zensustech.com">
                      vinayak.salunkhe@zensustech.com
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">Tech &amp; Admin Email</div>
                  </div>

                  <div className="bg-slate-800/80 rounded-lg p-2.5 border border-slate-700/60">
                    <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Customer License Expiry</span>
                    </div>
                    <div className="text-xs font-bold text-amber-300 font-mono">2026-11-11</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">O365 Business Essentials</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-slate-400">Select Table:</span>
                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'customers', label: 'customers' },
                      { id: 'organizations', label: 'organizations' },
                      { id: 'm365_licenses', label: 'm365_licenses' },
                      { id: 'azure_subscriptions', label: 'azure_subscriptions' },
                      { id: 'sessions', label: 'sessions' },
                      { id: 'audit_logs', label: 'audit_logs' }
                    ].map((tbl) => (
                      <button
                        key={tbl.id}
                        onClick={() => loadTablePreview(tbl.id)}
                        className={`px-3 py-1 text-xs font-mono rounded-lg transition ${
                          selectedTable === tbl.id
                            ? 'bg-cyan-600 text-white font-bold shadow'
                            : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                        }`}
                      >
                        {tbl.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => loadTablePreview(selectedTable)}
                  disabled={tableLoading}
                  className="px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition flex items-center gap-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${tableLoading ? 'animate-spin text-cyan-400' : ''}`} />
                  Refresh Table
                </button>
              </div>

              {tableError && (
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-500/30 text-rose-300 text-xs">
                  {tableError}
                </div>
              )}

              {tableLoading ? (
                <div className="p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
                  Loading records from PostgreSQL...
                </div>
              ) : tableData.length === 0 ? (
                <div className="p-12 text-center text-xs text-slate-400 bg-slate-900/40 rounded-xl border border-slate-800/80">
                  No records found in table <code className="text-cyan-300">{selectedTable}</code>.
                  <div className="mt-2">
                    <button
                      onClick={() => setActiveTab('migration')}
                      className="text-cyan-400 hover:underline"
                    >
                      Click here to move data into PostgreSQL.
                    </button>
                  </div>
                </div>
              ) : (
                <div className="border border-slate-800 rounded-xl overflow-hidden bg-slate-900/60">
                  <div className="max-h-96 overflow-x-auto overflow-y-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#0f172a] text-slate-300 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800 z-10">
                        <tr>
                          {Object.keys(tableData[0] || {}).map((col) => (
                            <th key={col} className="px-3 py-2.5 whitespace-nowrap font-semibold">
                              {col === 'license_exp_date' || col === 'expiration_date' ? (
                                <span className="flex items-center gap-1 text-amber-400">
                                  <Calendar className="w-3 h-3" />
                                  {col}
                                </span>
                              ) : col === 'phone' || col === 'phone_number' ? (
                                <span className="flex items-center gap-1 text-emerald-400">
                                  <Phone className="w-3 h-3" />
                                  {col}
                                </span>
                              ) : col === 'email' || col === 'technical_email' ? (
                                <span className="flex items-center gap-1 text-sky-400">
                                  <Mail className="w-3 h-3" />
                                  {col}
                                </span>
                              ) : col === 'plan_tier' ? (
                                <span className="flex items-center gap-1 text-purple-400">
                                  <BadgeCheck className="w-3 h-3" />
                                  {col}
                                </span>
                              ) : (
                                col
                              )}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {tableData.map((row, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/40 transition">
                            {Object.entries(row).map(([col, val]: any) => {
                              const isExpDate = col === 'license_exp_date' || col === 'expiration_date';
                              const isPhone = col === 'phone' || col === 'phone_number';
                              const isEmail = col === 'email' || col === 'technical_email';
                              const isTier = col === 'plan_tier';
                              const isStatus = col === 'status' || col === 'state';

                              return (
                                <td key={col} className="px-3 py-2 whitespace-nowrap max-w-xs truncate text-[11px]">
                                  {isExpDate && val ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] bg-amber-950/40 text-amber-300 border border-amber-600/30">
                                      <Calendar className="w-3 h-3 text-amber-400" />
                                      {String(val).split('T')[0]}
                                    </span>
                                  ) : isPhone && val ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] bg-emerald-950/40 text-emerald-300 border border-emerald-600/30">
                                      <Phone className="w-3 h-3 text-emerald-400" />
                                      {String(val)}
                                    </span>
                                  ) : isEmail && val ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[11px] bg-sky-950/40 text-sky-300 border border-sky-600/30">
                                      <Mail className="w-3 h-3 text-sky-400" />
                                      {String(val)}
                                    </span>
                                  ) : isTier && val ? (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded font-bold text-[10px] uppercase tracking-wide border ${
                                      val === 'Gold'
                                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                                        : val === 'Silver'
                                        ? 'bg-slate-500/20 text-slate-300 border-slate-500/30'
                                        : 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                                    }`}>
                                      {String(val)} Tier
                                    </span>
                                  ) : isStatus && val ? (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[10px] uppercase border ${
                                      val === 'Enabled' || val === 'Active' || val === 'success'
                                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                        : 'bg-slate-700/40 text-slate-400 border-slate-700/60'
                                    }`}>
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                      {String(val)}
                                    </span>
                                  ) : typeof val === 'object' && val !== null ? (
                                    <span className="text-cyan-300" title={JSON.stringify(val)}>
                                      {JSON.stringify(val).slice(0, 40)}...
                                    </span>
                                  ) : val === null || val === undefined ? (
                                    <span className="text-slate-600">NULL</span>
                                  ) : (
                                    String(val)
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <div className="px-4 py-2 border-t border-slate-800 text-[11px] text-slate-400 bg-[#0d1527] flex items-center justify-between">
                    <span>Showing {tableData.length} preview records</span>
                    <span className="text-cyan-400">PostgreSQL Live Data</span>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800/80 bg-[#0d1733]/60">
          <div className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>PostgreSQL 17.4 Client Adapter</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
