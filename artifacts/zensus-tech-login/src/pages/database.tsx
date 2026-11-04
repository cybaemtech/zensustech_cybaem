import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Database,
  ArrowLeft,
  LayoutDashboard,
  PanelsTopLeft,
  LogOut,
  ShieldCheck,
} from 'lucide-react';
import { DatabaseSettingsPage } from '@/components/DatabaseSettingsPage';
import { getActiveCustomer } from '@/lib/customer-store';

export function DatabasePage() {
  const [, setLocation] = useLocation();
  const [tenantId] = useState(() => sessionStorage.getItem('azure_tenant_id') || '9414ece9-9039-40b7-a6a7-7ecbe7409245');
  const activeCustomer = getActiveCustomer();

  const handleLogout = () => {
    sessionStorage.clear();
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans select-none">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-[#0d1424]/90 backdrop-blur-md border-b border-slate-800 px-4 sm:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setLocation('/dashboard')}
            className="p-1.5 rounded-lg border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Database className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs tracking-wider text-white">
                  ZENSUSTECH
                </span>
                <span className="text-[10px] text-cyan-400 font-semibold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
                  DATABASE CONNECT
                </span>
              </div>
              <p className="text-[11px] text-slate-400">PostgreSQL Cloud Database & Multi-Engine Migration</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => setLocation('/dashboard')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => setLocation('/microsoft0365')}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800/70 hover:bg-slate-800 text-xs font-semibold text-slate-300 transition-all cursor-pointer"
          >
            <PanelsTopLeft className="w-3.5 h-3.5 text-sky-400" />
            <span>Microsoft O365</span>
          </button>

          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-xs transition-all cursor-pointer"
            title="Log Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Log Out</span>
          </button>
        </div>
      </header>

      {/* Customer / Tenant Quick Strip */}
      <div className="bg-[#0b101c] border-b border-slate-800/80 px-4 sm:px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Customer:</span>
            <span className="font-semibold text-slate-200">
              {activeCustomer?.name || 'Zensus Technologies'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-500">Tenant:</span>
            <span className="font-mono text-slate-300 text-[11px] bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700">
              {tenantId}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>PostgreSQL Engine Live</span>
          </div>
        </div>
      </div>

      {/* Main Database Settings Component */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        <DatabaseSettingsPage />
      </main>
    </div>
  );
}

export default DatabasePage;
