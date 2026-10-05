import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck, ArrowLeft, BarChart3, Cloud, IndianRupee,
  AlertCircle, Building2, RefreshCw, TrendingUp, Clock, CheckCircle2,
  ChevronDown, ChevronUp, X, Table2
} from 'lucide-react';
import { useLocation } from 'wouter';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';

const USD_TO_INR = 83.92;

const toINR = (usd: number) => usd * USD_TO_INR;

const fmtINR = (usd: number): string => {
  const val = toINR(usd);
  if (val >= 10000000) return `\u20b9${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000)   return `\u20b9${(val / 100000).toFixed(2)} L`;
  return `\u20b9${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
};

const fmtINRFull = (usd: number) =>
  `\u20b9${toINR(usd).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

interface Sub { id: string; name: string; state: string; subscriptionId: string; }
interface ServiceCost { name: string; cost: number; costINR: number; color: string; }
interface DaySpend { date: string; usd: number; inr: number; }

const COLORS = ['#0ea5e9', '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6'];

const DEMO_SUBS: Sub[] = [
  { id: 'd1', subscriptionId: 'xxxxxxxx-prod-xxxx-xxxx-xxxxxxxxxxxx', name: 'Production Workloads', state: 'Enabled' },
  { id: 'd2', subscriptionId: 'xxxxxxxx-stg-xxxx-xxxx-xxxxxxxxxxxx',  name: 'Staging Environment',  state: 'Enabled' },
  { id: 'd3', subscriptionId: 'xxxxxxxx-rnd-xxxx-xxxx-xxxxxxxxxxxx',  name: 'R&D Sandbox',           state: 'Enabled' },
];

const DEMO_SERVICES: ServiceCost[] = [
  { name: 'Virtual Machines',  cost: 2300.75, costINR: toINR(2300.75), color: COLORS[0] },
  { name: 'Azure SQL DB',      cost: 840.50,  costINR: toINR(840.50),  color: COLORS[1] },
  { name: 'App Service',       cost: 1250.00, costINR: toINR(1250.00), color: COLORS[2] },
  { name: 'Storage Accounts',  cost: 410.20,  costINR: toINR(410.20),  color: COLORS[3] },
  { name: 'Bandwidth',         cost: 180.90,  costINR: toINR(180.90),  color: COLORS[4] },
];

const makeDemoTrend = (): DaySpend[] => {
  const days: DaySpend[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const usd = 120 + Math.random() * 80;
    days.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      usd: +usd.toFixed(2),
      inr: +toINR(usd).toFixed(2),
    });
  }
  return days;
};

export default function CostDashboard() {
  const [, setLocation] = useLocation();
  const [loading, setLoading]           = useState(true);
  const [refreshing, setRefreshing]     = useState(false);
  const [isLive, setIsLive]             = useState(false);
  const [fetchedAt, setFetchedAt]       = useState<string | null>(null);
  const [subs, setSubs]                 = useState<Sub[]>([]);
  const [totalUSD, setTotalUSD]         = useState(0);
  const [forecastUSD, setForecast]      = useState(0);
  const [budgetUSD]                     = useState(6000);
  const [services, setServices]         = useState<ServiceCost[]>(DEMO_SERVICES);
  const [trend, setTrend]               = useState<DaySpend[]>(makeDemoTrend());
  // Interactive state
  const [selectedService, setSelectedService] = useState<ServiceCost | null>(null);
  const [expandedSub, setExpandedSub]         = useState<string | null>(null);
  const [showDailyTable, setShowDailyTable]   = useState(false);

  const fetchData = useCallback(async () => {
    const mgmtToken = sessionStorage.getItem('mgmt_token');

    /* ── No ARM token: fall back to demo ── */
    if (!mgmtToken) {
      setTotalUSD(4982.35); setForecast(5240.00);
      setSubs(DEMO_SUBS); setIsLive(false);
      setLoading(false); setRefreshing(false);
      return;
    }

    const arm = new Headers({ Authorization: `Bearer ${mgmtToken}`, 'Content-Type': 'application/json' });

    try {
      /* 1 ── Subscriptions */
      let subList: Sub[] = [];
      try {
        const r = await fetch('https://management.azure.com/subscriptions?api-version=2022-12-01', { headers: arm });
        if (r.ok) {
          const d = await r.json();
          subList = (d.value || []).map((s: any) => ({
            id: s.id, subscriptionId: s.subscriptionId, name: s.displayName, state: s.state,
          }));
          setSubs(subList);
        }
      } catch {}

      if (!subList.length) {
        setTotalUSD(4982.35); setForecast(5240.00); setSubs(DEMO_SUBS);
        setIsLive(false); setLoading(false); setRefreshing(false);
        return;
      }

      const sid = subList[0].subscriptionId;
      const now = new Date();
      const fromMTD  = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
      const toToday  = now.toISOString().slice(0, 10);
      const from7d   = new Date(now); from7d.setDate(from7d.getDate() - 6);
      const from7dS  = from7d.toISOString().slice(0, 10);
      const costURL  = `https://management.azure.com/subscriptions/${sid}/providers/Microsoft.CostManagement/query?api-version=2023-03-01`;
      const post = (body: any) => fetch(costURL, { method: 'POST', headers: arm, body: JSON.stringify(body) });

      /* 2 ── MTD total */
      try {
        const r = await post({
          type: 'ActualCost', timeframe: 'Custom',
          timePeriod: { from: fromMTD, to: toToday },
          dataset: { granularity: 'None', aggregation: { totalCost: { name: 'Cost', function: 'Sum' } } },
        });
        if (r.ok) {
          const d = await r.json();
          const mtd = +(d.properties?.rows?.[0]?.[0] ?? 0);
          setTotalUSD(mtd);
          const dp = now.getDate();
          const dim = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
          setForecast((mtd / dp) * dim);
        }
      } catch {}

      /* 3 ── 7-day daily trend */
      try {
        const r = await post({
          type: 'ActualCost', timeframe: 'Custom',
          timePeriod: { from: from7dS, to: toToday },
          dataset: { granularity: 'Daily', aggregation: { totalCost: { name: 'Cost', function: 'Sum' } } },
        });
        if (r.ok) {
          const d = await r.json();
          const rows: any[] = d.properties?.rows || [];
          const cols: any[] = d.properties?.columns || [];
          const ci = cols.findIndex((c: any) => c.name === 'Cost');
          const di = cols.findIndex((c: any) => c.name === 'UsageDate' || c.name === 'BillingPeriodStartDate');
          if (rows.length && ci >= 0) {
            setTrend(rows.slice(-7).map((row: any) => {
              const raw = String(row[di] || '');
              const ds = raw.length === 8
                ? `${raw.slice(4, 6)}/${raw.slice(6, 8)}`
                : raw.slice(5, 10).replace('-', '/');
              const usd = +(row[ci]) || 0;
              return { date: ds, usd, inr: +toINR(usd).toFixed(2) };
            }));
          }
        }
      } catch {}

      /* 4 ── Cost by service */
      try {
        const r = await post({
          type: 'ActualCost', timeframe: 'Custom',
          timePeriod: { from: fromMTD, to: toToday },
          dataset: {
            granularity: 'None',
            aggregation: { totalCost: { name: 'Cost', function: 'Sum' } },
            grouping: [{ type: 'Dimension', name: 'ServiceName' }],
          },
        });
        if (r.ok) {
          const d = await r.json();
          const rows: any[] = d.properties?.rows || [];
          const cols: any[] = d.properties?.columns || [];
          const ci = cols.findIndex((c: any) => c.name === 'Cost');
          const ni = cols.findIndex((c: any) => c.name === 'ServiceName');
          if (rows.length && ci >= 0 && ni >= 0) {
            const parsed: ServiceCost[] = rows
              .filter((row: any) => +row[ci] > 0)
              .sort((a: any, b: any) => b[ci] - a[ci])
              .slice(0, 7)
              .map((row: any, i: number) => {
                const usd = +row[ci] || 0;
                return { name: row[ni] || 'Other', cost: usd, costINR: toINR(usd), color: COLORS[i % COLORS.length] };
              });
            if (parsed.length) setServices(parsed);
          }
        }
      } catch {}

      setIsLive(true);
      setFetchedAt(new Date().toISOString());
    } catch {
      setIsLive(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const budgetPct = Math.min(100, Math.round((totalUSD / budgetUSD) * 100));
  const topSvc    = services[0];
  const topPct    = totalUSD > 0 ? Math.round((topSvc?.cost / totalUSD) * 100) : 46;

  /* ── Loading screen ── */
  if (loading) return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f7fa]">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <span className="absolute inset-0 animate-spin rounded-full border-4 border-cyan-500/20 border-t-cyan-500" />
          <IndianRupee className="absolute inset-0 m-auto h-6 w-6 text-cyan-500" />
        </div>
        <p className="text-sm font-semibold text-slate-600">Fetching Azure Cost Data in \u20b9 INR\u2026</p>
        <p className="text-xs text-slate-400">Connecting to Azure Cost Management API</p>
      </div>
    </div>
  );

  /* ── Main render ── */
  return (
    <div className="min-h-screen bg-[#f4f7fa] font-sans" style={{ zoom: '0.82' }}>

      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-slate-200/60 bg-white/90 px-6 py-3.5 backdrop-blur-xl sm:px-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setLocation('/dashboard')}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-slate-800">Azure FinOps — Cost Analytics</h1>
              <p className="text-[0.7rem] font-medium text-slate-500">
                All values in <span className="font-bold text-emerald-600">Indian Rupees (\u20b9 INR)</span> &nbsp;&middot;&nbsp; 1 USD = \u20b9{USD_TO_INR.toFixed(2)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold border ${isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isLive ? 'Live Azure Cost Data' : 'Demo Mode'}
            </span>
            <button onClick={onRefresh} disabled={refreshing}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-[#0ea5e9] hover:text-white transition-colors disabled:opacity-50">
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-1.5 rounded-full bg-cyan-50 px-4 py-1.5 text-xs font-semibold text-cyan-700">
              <ShieldCheck className="h-4 w-4" /><span>CXO / IT Admin View</span>
            </div>
          </div>
        </div>
        {fetchedAt && (
          <div className="mx-auto max-w-7xl mt-1 flex items-center gap-1.5 text-[0.65rem] text-slate-400">
            <Clock className="h-3 w-3" /> Last fetched: {new Date(fetchedAt).toLocaleString()}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-7xl px-6 py-7 sm:px-10 space-y-7">

        {/* KPI Cards */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {/* MTD */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month-to-Date</p>
              <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600"><IndianRupee className="h-4 w-4" /></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{fmtINR(totalUSD)}</h3>
            <p className="mt-0.5 text-[0.7rem] text-slate-400">{fmtINRFull(totalUSD)}</p>
            <p className="mt-1 text-[0.7rem] text-slate-400">&asymp; ${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</p>
            <div className="mt-3 flex items-center gap-1 text-xs font-semibold text-emerald-600">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>{isLive ? 'Live Azure Cost Mgmt' : 'Demo data'}</span>
            </div>
          </div>

          {/* Forecast */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Month-End Forecast</p>
              <div className="rounded-xl bg-blue-50 p-2 text-blue-600"><BarChart3 className="h-4 w-4" /></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{fmtINR(forecastUSD)}</h3>
            <p className="mt-0.5 text-[0.7rem] text-slate-400">Budget: {fmtINR(budgetUSD)}</p>
            <div className="mt-3">
              <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${budgetPct > 90 ? 'bg-rose-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${budgetPct}%` }} />
              </div>
              <p className="mt-1 text-[0.65rem] text-slate-400">{budgetPct}% of {fmtINR(budgetUSD)} budget used</p>
            </div>
          </div>

          {/* Subscriptions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Subscriptions</p>
              <div className="rounded-xl bg-purple-50 p-2 text-purple-600"><Building2 className="h-4 w-4" /></div>
            </div>
            <h3 className="text-3xl font-black text-slate-800">{subs.length}</h3>
            <p className="mt-0.5 text-[0.7rem] text-slate-400">{subs.filter(s => s.state === 'Enabled').length} active billing scope{subs.length !== 1 ? 's' : ''}</p>
            <div className="mt-3 space-y-1">
              {subs.slice(0, 2).map((s, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
                  <span className="text-[0.68rem] text-slate-500 truncate">{s.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Top Driver */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Top Cost Driver</p>
              <div className="rounded-xl bg-amber-50 p-2 text-amber-600"><Cloud className="h-4 w-4" /></div>
            </div>
            <h3 className="text-xl font-black text-slate-800 leading-tight">{topSvc?.name || 'Virtual Machines'}</h3>
            <p className="mt-0.5 text-[0.7rem] text-slate-400">{fmtINR(topSvc?.cost || 0)}</p>
            <div className="mt-3 flex items-center gap-1.5">
              <div className="h-1.5 flex-1 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-amber-400 rounded-full" style={{ width: `${topPct}%` }} />
              </div>
              <span className="text-xs font-bold text-amber-600">{topPct}%</span>
            </div>
            <p className="mt-1 text-[0.65rem] text-slate-400">of total MTD spend</p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Daily Trend */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-800">7-Day Daily Spend Trend</h3>
                <p className="text-xs text-slate-400 mt-0.5">Daily cost in \u20b9 INR</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                {isLive ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <AlertCircle className="h-3.5 w-3.5 text-amber-400" />}
                {isLive ? 'Live' : 'Demo'}
              </div>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }} dx={-4}
                    tickFormatter={(v) => v >= 100000 ? `\u20b9${(v / 100000).toFixed(0)}L` : `\u20b9${(v / 1000).toFixed(0)}K`} />
                  <Tooltip
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', fontSize: '12px' }}
                    formatter={(val: number) => [`\u20b9${val.toLocaleString('en-IN')}`, 'Daily Spend']}
                  />
                  <Line type="monotone" dataKey="inr" stroke="#0ea5e9" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#0ea5e9', strokeWidth: 2, stroke: '#fff' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Service Breakdown */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5">
              <h3 className="text-base font-bold text-slate-800">Spend by Azure Service</h3>
              <p className="text-xs text-slate-400 mt-0.5">MTD cost allocation in \u20b9 INR</p>
            </div>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={services} layout="vertical" margin={{ top: 0, right: 16, left: 8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                  <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(v) => v >= 100000 ? `\u20b9${(v / 100000).toFixed(0)}L` : `\u20b9${(v / 1000).toFixed(0)}K`} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#475569' }} width={120} />
                  <Tooltip cursor={{ fill: '#f8fafc' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.12)', fontSize: '12px' }}
                    formatter={(val: number) => [`\u20b9${val.toLocaleString('en-IN', { maximumFractionDigits: 0 })}`, 'Cost']}
                  />
                  <Bar dataKey="costINR" radius={[0, 5, 5, 0]} barSize={18}>
                    {services.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Clickable Service Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {services.slice(0, 5).map((svc, i) => (
            <button key={i} onClick={() => setSelectedService(selectedService?.name === svc.name ? null : svc)}
              className={`rounded-xl border p-4 shadow-sm hover:shadow-md transition-all text-left cursor-pointer focus:outline-none ${ selectedService?.name === svc.name ? 'ring-2 ring-offset-1 shadow-md scale-[1.02]' : 'border-slate-100 bg-white hover:border-slate-200' }`}
              style={{ ringColor: svc.color }}>
              <div className="h-2 w-8 rounded-full mb-3" style={{ backgroundColor: svc.color }} />
              <p className="text-[0.7rem] font-semibold text-slate-500 truncate">{svc.name}</p>
              <p className="text-lg font-black text-slate-800 mt-1">{fmtINR(svc.cost)}</p>
              <p className="text-[0.65rem] text-slate-400 mt-0.5">${svc.cost.toFixed(2)} USD</p>
              <p className="text-[0.65rem] font-bold mt-1.5" style={{ color: svc.color }}>
                {totalUSD > 0 ? `${Math.round((svc.cost / totalUSD) * 100)}%` : '\u2014'} of total
              </p>
              <p className="text-[0.6rem] text-slate-300 mt-2">{selectedService?.name === svc.name ? 'Click to collapse' : 'Click for detail'}</p>
            </button>
          ))}
        </div>

        {/* Service Detail Panel (slide-in) */}
        {selectedService && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-fade-in">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100" style={{ borderLeftWidth: '4px', borderLeftColor: selectedService.color }}>
              <div className="flex items-center gap-3">
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: selectedService.color }} />
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Service Detail</p>
                  <h4 className="font-bold text-slate-800">{selectedService.name}</h4>
                </div>
              </div>
              <button onClick={() => setSelectedService(null)} className="h-7 w-7 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 text-slate-400 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-0 divide-x divide-y divide-slate-100">
              <div className="p-5">
                <p className="text-xs text-slate-400 font-semibold mb-1">MTD Cost (INR)</p>
                <p className="text-2xl font-black text-slate-800">{fmtINR(selectedService.cost)}</p>
                <p className="text-[0.7rem] text-slate-400 mt-0.5">{fmtINRFull(selectedService.cost)}</p>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-400 font-semibold mb-1">MTD Cost (USD)</p>
                <p className="text-2xl font-black text-slate-800">${selectedService.cost.toLocaleString(undefined,{minimumFractionDigits:2})}</p>
                <p className="text-[0.7rem] text-slate-400 mt-0.5">1 USD = \u20b9{USD_TO_INR}</p>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-400 font-semibold mb-1">% of Total Spend</p>
                <p className="text-2xl font-black" style={{ color: selectedService.color }}>
                  {totalUSD > 0 ? `${Math.round((selectedService.cost / totalUSD) * 100)}%` : '\u2014'}
                </p>
                <div className="mt-2 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${totalUSD > 0 ? Math.round((selectedService.cost / totalUSD) * 100) : 0}%`, backgroundColor: selectedService.color }} />
                </div>
              </div>
              <div className="p-5">
                <p className="text-xs text-slate-400 font-semibold mb-1">Daily Avg (INR)</p>
                <p className="text-2xl font-black text-slate-800">{fmtINR(selectedService.cost / (new Date().getDate()))}</p>
                <p className="text-[0.7rem] text-slate-400 mt-0.5">Based on {new Date().getDate()} days MTD</p>
              </div>
            </div>
          </div>
        )}

        {/* Daily Trend Table Toggle */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <button onClick={() => setShowDailyTable(v => !v)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50/60 transition-colors border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Table2 className="h-4 w-4 text-slate-400" />
              <span className="text-sm font-bold text-slate-800">Daily Spend Breakdown</span>
              <span className="text-[0.7rem] text-slate-400">— scroll through all {trend.length} days in \u20b9 INR</span>
            </div>
            {showDailyTable
              ? <ChevronUp className="h-4 w-4 text-slate-400" />
              : <ChevronDown className="h-4 w-4 text-slate-400" />}
          </button>
          {showDailyTable && (
            <div className="overflow-x-auto max-h-[260px] overflow-y-auto">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wider text-slate-400 z-10">
                  <tr>
                    <th className="border-b border-slate-100 px-6 py-3 font-semibold">Date</th>
                    <th className="border-b border-slate-100 px-6 py-3 font-semibold text-right">Cost (\u20b9 INR)</th>
                    <th className="border-b border-slate-100 px-6 py-3 font-semibold text-right">Cost (USD)</th>
                    <th className="border-b border-slate-100 px-6 py-3 font-semibold text-right">Bar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trend.map((d, i) => {
                    const maxINR = Math.max(...trend.map(t => t.inr));
                    const pct = maxINR > 0 ? Math.round((d.inr / maxINR) * 100) : 0;
                    return (
                      <tr key={i} className="hover:bg-sky-50/40 transition-colors cursor-default">
                        <td className="px-6 py-2.5 font-semibold text-slate-700">{d.date}</td>
                        <td className="px-6 py-2.5 text-right font-bold text-slate-800">{fmtINR(d.usd)}</td>
                        <td className="px-6 py-2.5 text-right text-slate-400 font-mono text-xs">${d.usd.toFixed(2)}</td>
                        <td className="px-6 py-2.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="h-2 rounded-full bg-[#0ea5e9]/20 w-24 overflow-hidden">
                              <div className="h-full rounded-full bg-[#0ea5e9]" style={{ width: `${pct}%` }} />
                            </div>
                            <span className="text-[0.65rem] text-slate-400 w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Subscriptions Table — Clickable Rows with Drill-down */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="border-b border-slate-100 bg-slate-50/50 px-6 py-4 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Azure Subscriptions</h3>
              <p className="text-xs text-slate-400">Click a row to expand billing details</p>
            </div>
            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${isLive ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              {isLive ? 'Live ARM' : 'Demo Data'}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-xs uppercase tracking-wider text-slate-400">
                <tr>
                  <th className="border-b border-slate-100 px-6 py-3.5 font-semibold">Subscription Name</th>
                  <th className="border-b border-slate-100 px-6 py-3.5 font-semibold">Subscription ID</th>
                  <th className="border-b border-slate-100 px-6 py-3.5 font-semibold">Status</th>
                  <th className="border-b border-slate-100 px-6 py-3.5 font-semibold text-right">MTD Cost (\u20b9 INR)</th>
                  <th className="border-b border-slate-100 px-4 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {subs.map((sub, i) => (
                  <>
                    <tr key={sub.id}
                      onClick={() => setExpandedSub(expandedSub === sub.id ? null : sub.id)}
                      className="cursor-pointer hover:bg-sky-50/50 transition-colors border-b border-slate-100">
                      <td className="px-6 py-3.5 font-semibold text-slate-800">{sub.name}</td>
                      <td className="px-6 py-3.5 font-mono text-xs text-slate-400 max-w-[200px] truncate">{sub.subscriptionId}</td>
                      <td className="px-6 py-3.5">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${sub.state === 'Enabled' || sub.state === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${sub.state === 'Enabled' || sub.state === 'Active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          {sub.state}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-bold text-slate-800">
                        {i === 0 ? fmtINR(totalUSD) : '\u20b9 0'}
                      </td>
                      <td className="px-4 py-3.5 text-slate-400">
                        {expandedSub === sub.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </td>
                    </tr>
                    {expandedSub === sub.id && (
                      <tr key={`${sub.id}-detail`} className="bg-sky-50/30">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                              <p className="text-[0.7rem] font-semibold text-slate-400 mb-1">MTD Spend (INR)</p>
                              <p className="text-xl font-black text-slate-800">{i === 0 ? fmtINR(totalUSD) : '\u20b9 0'}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                              <p className="text-[0.7rem] font-semibold text-slate-400 mb-1">MTD Spend (USD)</p>
                              <p className="text-xl font-black text-slate-800">{i === 0 ? `$${totalUSD.toFixed(2)}` : '$0.00'}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                              <p className="text-[0.7rem] font-semibold text-slate-400 mb-1">Subscription State</p>
                              <p className="text-xl font-black text-emerald-600">{sub.state}</p>
                            </div>
                            <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                              <p className="text-[0.7rem] font-semibold text-slate-400 mb-1">Sub ID</p>
                              <p className="text-xs font-mono text-slate-500 break-all">{sub.subscriptionId}</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
          <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between bg-slate-50/30">
            <span className="text-xs text-slate-400">1 USD = \u20b9{USD_TO_INR.toFixed(2)} INR \u00b7 Rates are indicative</span>
            <button onClick={onRefresh} disabled={refreshing}
              className="text-xs font-bold text-[#0ea5e9] hover:text-[#0284c7] flex items-center gap-1.5 transition-colors">
              <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} /> Refresh Now
            </button>
          </div>
        </div>

      </main>
    </div>
  );
}

