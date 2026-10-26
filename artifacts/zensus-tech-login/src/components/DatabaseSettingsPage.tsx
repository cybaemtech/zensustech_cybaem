import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  HardDrive,
  ArrowRight,
  Layers,
  Copy,
  Check,
  Table as TableIcon,
  Activity,
  Zap,
  Sliders,
  Lock,
  Eye,
  Play,
  ShieldCheck,
  Server,
  Cloud,
  FileCode2,
  Download,
  Users,
  Phone,
  Mail,
  Calendar,
  BadgeCheck,
  Shield
} from 'lucide-react';
import {
  fetchDatabaseStatus,
  testDatabaseConnection,
  connectDatabase,
  disconnectDatabase,
  initDatabaseSchema,
  migrateDataToDatabase,
  fetchSqlScript,
  fetchTablePreview,
  type DatabaseStatusResponse,
  type TestConnectionResponse,
  type MigrationResponse,
  type DatabaseEngine,
} from '@/lib/database-api';


interface DatabaseSettingsPageProps {
  onStatusChange?: (connected: boolean) => void;
}

interface EngineOption {
  id: DatabaseEngine;
  name: string;
  tag: string;
  defaultPort: number;
  defaultUser: string;
  defaultDb: string;
  iconBg: string;
  accentColor: string;
  description: string;
}

const DATABASE_ENGINES: EngineOption[] = [
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    tag: 'Active Local / Cloud',
    defaultPort: 5432,
    defaultUser: 'postgres',
    defaultDb: 'zensustech',
    iconBg: 'from-blue-600 to-indigo-700',
    accentColor: '#3b82f6',
    description: 'PostgreSQL 17/16 relational database with JSONB support'
  },
  {
    id: 'mysql',
    name: 'MySQL / MariaDB',
    tag: 'Relational Store',
    defaultPort: 3306,
    defaultUser: 'root',
    defaultDb: 'zensustech',
    iconBg: 'from-amber-600 to-orange-700',
    accentColor: '#f59e0b',
    description: 'MySQL 8.0+ or MariaDB database server'
  },
  {
    id: 'mssql',
    name: 'Microsoft SQL Server',
    tag: 'Enterprise MSSQL',
    defaultPort: 1433,
    defaultUser: 'sa',
    defaultDb: 'zensustech',
    iconBg: 'from-red-600 to-rose-700',
    accentColor: '#ef4444',
    description: 'MS SQL Server 2019/2022 on-premise or VM'
  },
  {
    id: 'azure_sql',
    name: 'Azure SQL / Cloud DB',
    tag: 'Microsoft Azure Cloud',
    defaultPort: 1433,
    defaultUser: 'sqladmin',
    defaultDb: 'zensustech',
    iconBg: 'from-sky-500 to-blue-700',
    accentColor: '#0ea5e9',
    description: 'Azure SQL Database or Azure Database for PostgreSQL'
  }
];

export function DatabaseSettingsPage({ onStatusChange }: DatabaseSettingsPageProps) {
  const [selectedEngine, setSelectedEngine] = useState<DatabaseEngine>('postgresql');
  const [activeTab, setActiveTab] = useState<'connection' | 'migration' | 'tables' | 'sql_script'>('connection');
  const [status, setStatus] = useState<DatabaseStatusResponse | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  // Connection fields
  const [connectionMode, setConnectionMode] = useState<'url' | 'params'>('params');
  const [connectionUrl, setConnectionUrl] = useState('postgresql://postgres:root@localhost:5432/zensustech');
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState(5432);
  const [database, setDatabase] = useState('zensustech');
  const [username, setUsername] = useState('postgres');
  const [password, setPassword] = useState('root');
  const [sslMode, setSslMode] = useState('prefer');
  const [showPassword, setShowPassword] = useState(false);

  // Actions
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestConnectionResponse | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connectMessage, setConnectMessage] = useState<string | null>(null);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Migration
  const [initializingSchema, setInitializingSchema] = useState(false);
  const [schemaSuccess, setSchemaSuccess] = useState<string | null>(null);
  const [schemaError, setSchemaError] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationResponse | null>(null);
  const [migrationError, setMigrationError] = useState<string | null>(null);

  // Tables
  const [selectedTable, setSelectedTable] = useState<string>('customers');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  // SQL Script
  const [sqlScript, setSqlScript] = useState<string>('');
  const [sqlLoading, setSqlLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const [copiedUri, setCopiedUri] = useState(false);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const data = await fetchDatabaseStatus();
      setStatus(data);
      if (onStatusChange) onStatusChange(data.connected);
      if (data.database_type) {
        const eng = data.database_type.toLowerCase() as DatabaseEngine;
        if (DATABASE_ENGINES.some(e => e.id === eng)) {
          setSelectedEngine(eng);
        }
      }
    } catch (e: any) {
      console.error(e);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  // When engine changes, update default parameters
  const handleSelectEngine = (engine: DatabaseEngine) => {
    setSelectedEngine(engine);
    setTestResult(null);
    setConnectMessage(null);
    setConnectError(null);
    const opt = DATABASE_ENGINES.find(e => e.id === engine);
    if (!opt) return;

    setPort(opt.defaultPort);
    setUsername(opt.defaultUser);
    setDatabase(opt.defaultDb);

    if (engine === 'postgresql') {
      setHost('localhost');
      setPassword('root');
      setConnectionUrl(`postgresql://${opt.defaultUser}:root@localhost:${opt.defaultPort}/${opt.defaultDb}`);
    } else if (engine === 'mysql') {
      setHost('localhost');
      setPassword('');
      setConnectionUrl(`mysql://${opt.defaultUser}:password@localhost:${opt.defaultPort}/${opt.defaultDb}`);
    } else if (engine === 'mssql') {
      setHost('localhost');
      setPassword('Password123');
      setConnectionUrl(`mssql://${opt.defaultUser}:Password123@localhost:${opt.defaultPort}/${opt.defaultDb}`);
    } else if (engine === 'azure_sql') {
      setHost('your-server.database.windows.net');
      setPassword('StrongAzurePass!123');
      setSslMode('require');
      setConnectionUrl(`mssql://${opt.defaultUser}:StrongAzurePass!123@your-server.database.windows.net:${opt.defaultPort}/${opt.defaultDb}?encrypt=true`);
    }
  };

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    setConnectError(null);
    setConnectMessage(null);
    try {
      const payload = connectionMode === 'url'
        ? { engine: selectedEngine, connection_url: connectionUrl.trim() }
        : { engine: selectedEngine, host, port: Number(port), database, username, password, ssl_mode: sslMode };
      
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
        ? { engine: selectedEngine, connection_url: connectionUrl.trim() }
        : { engine: selectedEngine, host, port: Number(port), database, username, password, ssl_mode: sslMode };

      const res = await connectDatabase(payload);
      setConnectMessage(`Connected successfully to ${selectedEngine.toUpperCase()} database "${res.database || database}"!`);
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
      setConnectMessage('Database disconnected.');
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
      const res = await initDatabaseSchema(selectedEngine);
      setSchemaSuccess(res.message || 'Tables initialized successfully!');
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
      const data = await fetchTablePreview(tableName, 25);
      setTableData(data.rows || []);
    } catch (e: any) {
      setTableError(e.message || 'Failed to fetch table records');
      setTableData([]);
    } finally {
      setTableLoading(false);
    }
  };

  const loadSqlScript = async (engine: DatabaseEngine) => {
    setSqlLoading(true);
    try {
      const text = await fetchSqlScript(engine);
      setSqlScript(text);
    } catch (e: any) {
      console.error(e);
    } finally {
      setSqlLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'tables' && status?.connected) {
      loadTablePreview(selectedTable);
    } else if (activeTab === 'sql_script') {
      loadSqlScript(selectedEngine);
    }
  }, [activeTab, selectedTable, selectedEngine, status?.connected]);

  const copyToClipboard = (text: string, type: 'uri' | 'sql') => {
    navigator.clipboard.writeText(text);
    if (type === 'uri') {
      setCopiedUri(true);
      setTimeout(() => setCopiedUri(false), 2000);
    } else {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2000);
    }
  };

  const isConnected = Boolean(status?.connected);
  const activeEngineOpt = DATABASE_ENGINES.find(e => e.id === selectedEngine) || DATABASE_ENGINES[0];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Header Card */}
      <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)]">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`h-14 w-14 rounded-2xl bg-gradient-to-tr ${activeEngineOpt.iconBg} text-white flex items-center justify-center shadow-md`}>
              <Database className="h-7 w-7" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">Database Connection &amp; Data Integration</h2>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  isConnected 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
                  {isConnected ? `${status?.server_version?.split(' ')[0] || 'Database'} Connected` : 'Setup Required'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Easily connect to PostgreSQL, MySQL, Microsoft SQL Server, or Azure SQL to store and move your operational data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full lg:w-auto">
            <button
              onClick={() => handleSelectEngine('postgresql')}
              className="px-3.5 py-2 text-xs font-semibold bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <Zap className="w-3.5 h-3.5 text-cyan-600" />
              <span>Connect Localhost (5432)</span>
            </button>
            <button
              onClick={loadStatus}
              disabled={loadingStatus}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-xl transition flex items-center gap-1.5 shadow-xs"
              title="Refresh status"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingStatus ? 'animate-spin text-cyan-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Database Engine Selector Cards */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-3">
            Select Destination Database Engine
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {DATABASE_ENGINES.map((eng) => {
              const isSelected = selectedEngine === eng.id;
              return (
                <button
                  key={eng.id}
                  type="button"
                  onClick={() => handleSelectEngine(eng.id)}
                  className={`p-4 rounded-xl border text-left transition-all relative ${
                    isSelected
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md ring-2 ring-sky-500/30'
                      : 'bg-slate-50 hover:bg-white text-slate-700 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isSelected ? 'bg-sky-500/20 text-sky-300' : 'bg-slate-200/80 text-slate-600'
                    }`}>
                      Port {eng.defaultPort}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-sky-400" />}
                  </div>
                  <div className="font-bold text-sm">{eng.name}</div>
                  <div className={`text-[11px] mt-1 leading-snug line-clamp-1 ${isSelected ? 'text-slate-300' : 'text-slate-500'}`}>
                    {eng.description}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Quick Connection Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Active Target</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{activeEngineOpt.name}</p>
            <p className="text-[0.68rem] text-slate-500 truncate">{status?.server_version?.split(',')[0] || activeEngineOpt.tag}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Database Name</p>
            <p className="text-sm font-mono font-bold text-cyan-700 mt-0.5 truncate">{database}</p>
            <p className="text-[0.68rem] text-slate-500">Host: {host}:{port}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Ping Latency</p>
            <p className="text-sm font-mono font-bold text-emerald-600 mt-0.5">
              {status?.latency_ms ? `${status.latency_ms} ms` : isConnected ? '< 100 ms' : 'Not Connected'}
            </p>
            <p className="text-[0.68rem] text-slate-500">Server response</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
            <p className="text-[0.65rem] font-bold text-slate-400 uppercase tracking-wider">Stored Records</p>
            <p className="text-sm font-mono font-bold text-indigo-600 mt-0.5">
              {status?.total_records ?? 0} rows
            </p>
            <p className="text-[0.68rem] text-slate-500">Synchronized in DB</p>
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('connection')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition border-b-2 ${
            activeTab === 'connection'
              ? 'text-cyan-700 border-cyan-600 bg-white rounded-t-xl shadow-xs'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          1. Connection &amp; Integration Settings
        </button>

        <button
          onClick={() => setActiveTab('migration')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition border-b-2 ${
            activeTab === 'migration'
              ? 'text-cyan-700 border-cyan-600 bg-white rounded-t-xl shadow-xs'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
          2. Move Data to {activeEngineOpt.name}
          {status?.total_records ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-100 text-emerald-800 font-mono font-bold">
              {status.total_records} rows
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('tables')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition border-b-2 ${
            activeTab === 'tables'
              ? 'text-cyan-700 border-cyan-600 bg-white rounded-t-xl shadow-xs'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          <TableIcon className="w-3.5 h-3.5" />
          3. Live Tables &amp; Stored Values
        </button>

        <button
          onClick={() => setActiveTab('sql_script')}
          className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition border-b-2 ${
            activeTab === 'sql_script'
              ? 'text-cyan-700 border-cyan-600 bg-white rounded-t-xl shadow-xs'
              : 'text-slate-500 border-transparent hover:text-slate-800'
          }`}
        >
          <FileCode2 className="w-3.5 h-3.5" />
          4. Export Migration SQL Script
        </button>
      </div>

      {/* TAB 1: CONNECTION & INTEGRATION SETTINGS */}
      {activeTab === 'connection' && (
        <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                {activeEngineOpt.name} Integration Fields
              </h3>
              <p className="text-xs text-slate-500">
                Specify your connection details to connect and store records in {activeEngineOpt.name}.
              </p>
            </div>

            <div className="flex rounded-lg bg-slate-100 p-1 border border-slate-200">
              <button
                onClick={() => setConnectionMode('params')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  connectionMode === 'params' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Form Fields
              </button>
              <button
                onClick={() => setConnectionMode('url')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md transition ${
                  connectionMode === 'url' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Connection URI String
              </button>
            </div>
          </div>

          {/* Form Fields Mode */}
          {connectionMode === 'params' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Server Host / Endpoint</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="localhost"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Port Number</label>
                <input
                  type="number"
                  value={port}
                  onChange={(e) => setPort(Number(e.target.value))}
                  placeholder={String(activeEngineOpt.defaultPort)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Database Name</label>
                <input
                  type="text"
                  value={database}
                  onChange={(e) => setDatabase(e.target.value)}
                  placeholder="zensustech"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder={activeEngineOpt.defaultUser}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <Eye className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700">Encryption / SSL Mode</label>
                <select
                  value={sslMode}
                  onChange={(e) => setSslMode(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white"
                >
                  <option value="prefer">prefer (Default)</option>
                  <option value="require">require (Cloud SSL / Azure)</option>
                  <option value="disable">disable (Plaintext)</option>
                </select>
              </div>
            </div>
          ) : (
            /* URI Mode */
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Target Connection URI</label>
                <button
                  type="button"
                  onClick={() => copyToClipboard(connectionUrl, 'uri')}
                  className="text-xs text-cyan-700 hover:underline flex items-center gap-1 font-semibold"
                >
                  {copiedUri ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedUri ? 'Copied' : 'Copy URI'}
                </button>
              </div>
              <input
                type="text"
                value={connectionUrl}
                onChange={(e) => setConnectionUrl(e.target.value)}
                placeholder={`${selectedEngine}://user:password@host:port/database`}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono text-slate-800 focus:outline-none focus:border-cyan-600 focus:bg-white transition"
              />
            </div>
          )}

          {/* Test Connection Banner */}
          {testResult && (
            <div className={`p-4 rounded-xl border flex items-start gap-3 ${
              testResult.success 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              {testResult.success ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <div className="font-bold text-sm">
                  {testResult.success ? `${activeEngineOpt.name} Connection Successful!` : 'Connection Failed'}
                </div>
                {testResult.success ? (
                  <div>
                    Connected to <span className="font-mono font-bold">{testResult.database}</span> as user <span className="font-mono font-bold">{testResult.user}</span> ({testResult.latency_ms} ms ping latency). Server version: {testResult.server_version}
                  </div>
                ) : (
                  <div className="font-mono text-[11px] text-rose-700 break-all">{testResult.error}</div>
                )}
              </div>
            </div>
          )}

          {connectMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{connectMessage}</span>
            </div>
          )}

          {connectError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{connectError}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              onClick={handleTestConnection}
              disabled={testing || connecting}
              className="px-4 py-2.5 text-xs font-bold bg-white hover:bg-slate-50 text-slate-700 rounded-xl border border-slate-300 transition flex items-center gap-2 shadow-xs"
            >
              <Activity className={`w-4 h-4 ${testing ? 'animate-spin text-cyan-600' : 'text-slate-500'}`} />
              {testing ? 'Testing Connectivity...' : `Test ${activeEngineOpt.name} Connection`}
            </button>

            <div className="flex items-center gap-2">
              {isConnected && (
                <button
                  onClick={handleDisconnect}
                  className="px-4 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 rounded-xl border border-rose-200 transition"
                >
                  Disconnect
                </button>
              )}
              <button
                onClick={handleSaveAndConnect}
                disabled={connecting || testing}
                className="px-5 py-2.5 text-xs font-bold bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {connecting ? 'Saving & Connecting...' : `Save & Connect to ${activeEngineOpt.name}`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MOVE DATA TO SELECTED DATABASE */}
      {activeTab === 'migration' && (
        <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              Move &amp; Store Data into {activeEngineOpt.name}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Easily migrate your existing customer accounts, organizations, Azure subscriptions, and authentication sessions into your target database.
            </p>
          </div>

          {/* Visual Migration Flow */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-bold uppercase tracking-wider text-[10px]">Source Storage</span>
                <HardDrive className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-sm font-bold text-slate-900">Local JSON &amp; App Cache</div>
              <ul className="text-xs text-slate-600 space-y-1.5">
                <li>• <code className="text-slate-800 font-bold">data/sessions.json</code></li>
                <li>• <code className="text-slate-800 font-bold">data/organization.json</code></li>
                <li>• 3 Multi-Tenant Enterprise Customers</li>
                <li>• 6 Azure Cloud Subscriptions</li>
              </ul>
            </div>

            <div className="flex flex-col items-center justify-center p-3 text-cyan-600">
              <ArrowRight className="w-8 h-8 hidden md:block animate-pulse text-cyan-600" />
              <span className="text-[11px] font-bold tracking-wide uppercase mt-1 text-cyan-700">One-Click Move</span>
            </div>

            <div className="p-5 rounded-2xl bg-cyan-50/50 border border-cyan-200/80 space-y-2.5">
              <div className="flex items-center justify-between text-xs text-cyan-800">
                <span className="font-bold uppercase tracking-wider text-[10px]">Destination Database</span>
                <Database className="w-4 h-4 text-cyan-600" />
              </div>
              <div className="text-sm font-bold text-cyan-950">{activeEngineOpt.name} ({database})</div>
              <ul className="text-xs text-cyan-900 space-y-1.5">
                <li>• Table <code className="font-bold">customers</code></li>
                <li>• Table <code className="font-bold">organizations</code></li>
                <li>• Table <code className="font-bold">sessions</code></li>
                <li>• Table <code className="font-bold">azure_subscriptions</code></li>
              </ul>
            </div>
          </div>

          {/* Step 1 & Step 2 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            
            {/* Step 1: Initialize Tables */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-100 text-cyan-800 text-xs font-black">1</span>
                  <h4 className="text-sm font-bold text-slate-800">Initialize {activeEngineOpt.name} Schema</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Creates tables for organizations, sessions, customers, subscriptions, and audit logs.
                </p>
              </div>

              <button
                onClick={handleInitSchema}
                disabled={initializingSchema}
                className="w-full py-2.5 px-4 text-xs font-bold bg-white hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-300 transition flex items-center justify-center gap-2 shadow-xs"
              >
                <Layers className={`w-4 h-4 ${initializingSchema ? 'animate-spin text-cyan-600' : 'text-slate-500'}`} />
                {initializingSchema ? 'Creating Tables...' : `Create ${activeEngineOpt.name} Tables`}
              </button>
            </div>

            {/* Step 2: Move Data */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black">2</span>
                  <h4 className="text-sm font-bold text-slate-800">Move &amp; Store Data Values</h4>
                </div>
                <p className="text-xs text-slate-500">
                  Transfers all customer tiers, organization data, and Azure subscription models into {activeEngineOpt.name}.
                </p>
              </div>

              <button
                onClick={handleMigrateData}
                disabled={migrating}
                className="w-full py-2.5 px-4 text-xs font-bold bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Play className={`w-4 h-4 fill-current ${migrating ? 'animate-spin' : ''}`} />
                {migrating ? 'Moving Data...' : `Move Data to ${activeEngineOpt.name} Now`}
              </button>
            </div>
          </div>

          {/* Feedback */}
          {schemaSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{schemaSuccess}</span>
            </div>
          )}

          {migrationResult && migrationResult.success && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Data Successfully Synchronized into {activeEngineOpt.name}! ({migrationResult.total_records} records stored)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                {Object.entries(migrationResult.migrated_counts || {}).map(([tbl, count]) => (
                  <div key={tbl} className="bg-white px-2.5 py-1.5 rounded-lg border border-emerald-200 flex items-center justify-between">
                    <span className="text-slate-600">{tbl}:</span>
                    <span className="font-bold text-emerald-700">{count} rows</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Table Counts */}
          {status?.tables && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Target Database Tables &amp; Row Counts
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {Object.entries(status.tables).map(([tbl, count]) => (
                  <button
                    key={tbl}
                    onClick={() => {
                      setSelectedTable(tbl);
                      setActiveTab('tables');
                    }}
                    className="p-3.5 rounded-xl bg-slate-50 hover:bg-white border border-slate-200 hover:border-cyan-400 text-left transition group shadow-xs"
                  >
                    <div className="text-[11px] font-mono text-slate-500 group-hover:text-cyan-700 truncate font-semibold">
                      {tbl}
                    </div>
                    <div className="text-lg font-black text-slate-800 mt-1">
                      {count} <span className="text-[10px] font-normal text-slate-400">rows</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: LIVE TABLES */}
      {activeTab === 'tables' && (
        <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-5">
          {/* Top Live Customer & License Summary Strip */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-xl text-white shadow-sm border border-slate-700/60">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3 border-b border-slate-700/80 pb-2.5">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live PostgreSQL Database Customer &amp; License Feed</span>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Active Database Connection Live
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Users className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Total Customers</span>
                </div>
                <div className="text-base font-bold text-white">3 Registered Clients</div>
                <div className="text-[11px] text-slate-400 mt-0.5 truncate">Active Tenant: 9414ece9-9039...</div>
              </div>

              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Customer Phone</span>
                </div>
                <div className="text-sm font-bold text-emerald-300 font-mono">+91 9823101112</div>
                <div className="text-[11px] text-slate-400 mt-0.5">ZensusTech Entra Profile</div>
              </div>

              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Mail className="w-3.5 h-3.5 text-sky-400" />
                  <span>Customer Email</span>
                </div>
                <div className="text-xs font-bold text-sky-300 truncate" title="vinayak.salunkhe@zensustech.com">
                  vinayak.salunkhe@zensustech.com
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">Technical &amp; Billing Admin</div>
              </div>

              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-700/60">
                <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>Customer License Expiry</span>
                </div>
                <div className="text-sm font-bold text-amber-300 font-mono">2026-11-11</div>
                <div className="text-[11px] text-slate-400 mt-0.5">O365 Business Essentials (Active)</div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-700">Browse Live PostgreSQL Table:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { id: 'customers', label: 'customers', desc: 'Customer Details, Phone, Email & Exp Date' },
                  { id: 'organizations', label: 'organizations', desc: 'Tenant Profile, Contacts & License' },
                  { id: 'm365_licenses', label: 'm365_licenses', desc: 'Purchased SKUs, Seats & Expiration Dates' },
                  { id: 'azure_subscriptions', label: 'azure_subscriptions', desc: 'Azure Cloud Subscriptions & Spend' },
                  { id: 'sessions', label: 'sessions', desc: 'Connected Tenant Session State' },
                  { id: 'audit_logs', label: 'audit_logs', desc: 'Handshake & System Audit Logs' }
                ].map((tbl) => (
                  <button
                    key={tbl.id}
                    onClick={() => loadTablePreview(tbl.id)}
                    title={tbl.desc}
                    className={`px-3 py-1.5 text-xs font-mono rounded-lg transition flex items-center gap-1 ${
                      selectedTable === tbl.id
                        ? 'bg-cyan-600 text-white font-bold shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200'
                    }`}
                  >
                    <span>{tbl.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => loadTablePreview(selectedTable)}
              disabled={tableLoading}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition flex items-center gap-1.5 shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${tableLoading ? 'animate-spin text-cyan-600' : ''}`} />
              Refresh Table
            </button>
          </div>

          {tableLoading ? (
            <div className="p-12 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-cyan-600" />
              Loading records from PostgreSQL...
            </div>
          ) : tableData.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-slate-200">
              No records found in table <code className="text-cyan-700 font-bold">{selectedTable}</code>.
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
              <div className="max-h-[500px] overflow-x-auto overflow-y-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-50 text-slate-600 uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-200 z-10">
                    <tr>
                      {Object.keys(tableData[0] || {}).map((col) => (
                        <th key={col} className="px-3.5 py-3 whitespace-nowrap font-bold">
                          {col === 'license_exp_date' || col === 'expiration_date' ? (
                            <span className="flex items-center gap-1 text-amber-700">
                              <Calendar className="w-3 h-3" />
                              {col}
                            </span>
                          ) : col === 'phone' || col === 'phone_number' ? (
                            <span className="flex items-center gap-1 text-emerald-700">
                              <Phone className="w-3 h-3" />
                              {col}
                            </span>
                          ) : col === 'email' || col === 'technical_email' ? (
                            <span className="flex items-center gap-1 text-blue-700">
                              <Mail className="w-3 h-3" />
                              {col}
                            </span>
                          ) : col === 'plan_tier' ? (
                            <span className="flex items-center gap-1 text-purple-700">
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
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {tableData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        {Object.entries(row).map(([col, val]: any) => {
                          const isExpDate = col === 'license_exp_date' || col === 'expiration_date';
                          const isPhone = col === 'phone' || col === 'phone_number';
                          const isEmail = col === 'email' || col === 'technical_email';
                          const isTier = col === 'plan_tier';
                          const isStatus = col === 'status' || col === 'state';

                          return (
                            <td key={col} className="px-3.5 py-2.5 whitespace-nowrap max-w-xs truncate text-[11px]">
                              {isExpDate && val ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] bg-amber-50 text-amber-700 border border-amber-200">
                                  <Calendar className="w-3 h-3 text-amber-600" />
                                  {String(val).split('T')[0]}
                                </span>
                              ) : isPhone && val ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Phone className="w-3 h-3 text-emerald-600" />
                                  {String(val)}
                                </span>
                              ) : isEmail && val ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                                  <Mail className="w-3 h-3 text-blue-600" />
                                  {String(val)}
                                </span>
                              ) : isTier && val ? (
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wide border ${
                                  val === 'Gold'
                                    ? 'bg-amber-100/70 text-amber-800 border-amber-300'
                                    : val === 'Silver'
                                    ? 'bg-slate-100 text-slate-800 border-slate-300'
                                    : 'bg-orange-100/70 text-orange-800 border-orange-300'
                                }`}>
                                  {String(val)} Tier
                                </span>
                              ) : isStatus && val ? (
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase border ${
                                  val === 'Enabled' || val === 'Active' || val === 'success'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-slate-100 text-slate-600 border-slate-200'
                                }`}>
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  {String(val)}
                                </span>
                              ) : typeof val === 'object' && val !== null ? (
                                <span className="text-cyan-700 font-semibold" title={JSON.stringify(val)}>
                                  {JSON.stringify(val).slice(0, 40)}...
                                </span>
                              ) : val === null || val === undefined ? (
                                <span className="text-slate-400">NULL</span>
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
            </div>
          )}
        </div>
      )}

      {/* TAB 4: EXPORT MIGRATION SQL SCRIPT */}
      {activeTab === 'sql_script' && (
        <div className="bg-white rounded-2xl p-6 lg:p-8 border border-slate-200/80 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.04)] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Ready-to-Run SQL Migration Script ({activeEngineOpt.name})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Run this directly in SSMS, MySQL Workbench, or Azure Query Editor to create the schema and store data instantly.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => copyToClipboard(sqlScript, 'sql')}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition flex items-center gap-1.5"
              >
                {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedSql ? 'Copied' : 'Copy SQL Script'}</span>
              </button>

              <a
                href={`/api/v1/database/export-sql?engine=${selectedEngine}`}
                download={`zensustech_${selectedEngine}_migration.sql`}
                className="px-4 py-2 text-xs font-semibold bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download .sql File</span>
              </a>
            </div>
          </div>

          {sqlLoading ? (
            <div className="p-12 text-center text-xs text-slate-500">Generating SQL script...</div>
          ) : (
            <div className="relative">
              <pre className="p-5 bg-slate-900 text-emerald-400 font-mono text-xs rounded-xl overflow-x-auto max-h-[480px] leading-relaxed border border-slate-800">
                {sqlScript || '-- Loading SQL dump...'}
              </pre>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
