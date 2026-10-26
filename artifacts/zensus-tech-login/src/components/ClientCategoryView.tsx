import { useState } from 'react';
import {
  Layers,
  Cloud,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Server,
  ArrowUpRight,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Award,
  Users,
  CreditCard,
  Building2,
  Clock
} from 'lucide-react';
import { useLocation } from 'wouter';
import {
  type CustomerData,
  type CategoryType
} from '@/lib/customer-store';

interface ClientCategoryViewProps {
  customer: CustomerData;
  category: CategoryType;
  onNavigateToTab?: (tabId: string) => void;
}

export function ClientCategoryView({ customer, category, onNavigateToTab }: ClientCategoryViewProps) {
  const [, setLocation] = useLocation();
  const o365 = customer.categories.office365.packages;
  const azureSubs = customer.categories.azure.subscriptions;

  const totalSeats = o365.starter.seats + o365.business.seats + o365.premium.seats;
  const totalValue =
    o365.starter.seats * o365.starter.unitPrice +
    o365.business.seats * o365.business.unitPrice +
    o365.premium.seats * o365.premium.unitPrice;

  if (category === 'office365') {
    return (
      <div className="space-y-6">
        {/* Category Header Card */}
        <div className="bg-gradient-to-r from-sky-900 via-blue-900 to-indigo-950 rounded-2xl p-6 text-white border border-sky-800/60 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30">
                  Category: Office 365
                </span>
                <span className="text-xs text-sky-200/80 font-medium">SaaS Managed Services</span>
              </div>
              <h2 className="text-2xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2.5">
                <Layers className="h-6 w-6 text-sky-400" />
                <span>Client Plan &amp; Packaging Model</span>
              </h2>
              <p className="text-xs text-sky-100/70 mt-1 max-w-xl">
                Mapped to <span className="font-semibold text-white">{customer.domainId}</span> (Tenant: {customer.tenantId.substring(0, 13)}...). Tiers reflect the client specification with Bronze, Silver, and Gold service levels.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 text-right">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-sky-200">Total Managed Seats</p>
                <p className="text-xl font-black text-white">{totalSeats} Licenses</p>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/15 text-right">
                <p className="text-[0.65rem] font-bold uppercase tracking-wider text-emerald-300">Monthly Contract</p>
                <p className="text-xl font-black text-emerald-400">₹{totalValue.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 3 Tier Cards: Starter (30) Bronze / Business (15) Silver / Premium (5) Gold */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* 1. Starter (Bronze) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:border-amber-400/80 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center font-black text-sm border border-amber-200">
                    B
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{o365.starter.name}</h3>
                    <p className="text-[0.68rem] text-slate-500">Standard Workforce</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                  Bronze
                </span>
              </div>

              <div className="my-4 flex items-baseline justify-between bg-amber-50/50 p-3 rounded-xl border border-amber-100/70">
                <div>
                  <span className="text-3xl font-black text-slate-900">({o365.starter.seats})</span>
                  <span className="text-xs font-semibold text-slate-500 ml-1.5">Seats</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-amber-900">₹{o365.starter.unitPrice}</span>
                  <span className="text-[0.68rem] text-slate-500"> / seat</span>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Included Features</p>
                {o365.starter.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Monthly subtotal:</span>
              <span className="font-bold text-slate-800 font-mono">
                ₹{(o365.starter.seats * o365.starter.unitPrice).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 2. Business (Silver) */}
          <div className="bg-white rounded-2xl p-5 border-2 border-slate-300 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)] hover:border-sky-500 transition-all flex flex-col justify-between group relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-sky-600 text-white text-[0.6rem] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
              Most Popular
            </div>
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mt-1">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-800 flex items-center justify-center font-black text-sm border border-slate-300">
                    S
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{o365.business.name}</h3>
                    <p className="text-[0.68rem] text-slate-500">Productivity &amp; Collaboration</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider bg-slate-200 text-slate-800 border border-slate-300">
                  Silver
                </span>
              </div>

              <div className="my-4 flex items-baseline justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-3xl font-black text-slate-900">({o365.business.seats})</span>
                  <span className="text-xs font-semibold text-slate-500 ml-1.5">Seats</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-slate-900">₹{o365.business.unitPrice}</span>
                  <span className="text-[0.68rem] text-slate-500"> / seat</span>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Included Features</p>
                {o365.business.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-sky-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Monthly subtotal:</span>
              <span className="font-bold text-slate-800 font-mono">
                ₹{(o365.business.seats * o365.business.unitPrice).toLocaleString()}
              </span>
            </div>
          </div>

          {/* 3. Premium (Gold) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] hover:border-yellow-400/80 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-yellow-50 text-yellow-800 flex items-center justify-center font-black text-sm border border-yellow-200">
                    G
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">{o365.premium.name}</h3>
                    <p className="text-[0.68rem] text-slate-500">Security &amp; Executive Suite</p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-extrabold uppercase tracking-wider bg-yellow-100 text-yellow-900 border border-yellow-300">
                  Gold
                </span>
              </div>

              <div className="my-4 flex items-baseline justify-between bg-yellow-50/50 p-3 rounded-xl border border-yellow-100/70">
                <div>
                  <span className="text-3xl font-black text-slate-900">({o365.premium.seats})</span>
                  <span className="text-xs font-semibold text-slate-500 ml-1.5">Seats</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-yellow-900">₹{o365.premium.unitPrice}</span>
                  <span className="text-[0.68rem] text-slate-500"> / seat</span>
                </div>
              </div>

              <div className="space-y-2 mt-3">
                <p className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">Included Features</p>
                {o365.premium.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="h-3.5 w-3.5 text-yellow-600 shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>Monthly subtotal:</span>
              <span className="font-bold text-slate-800 font-mono">
                ₹{(o365.premium.seats * o365.premium.unitPrice).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Azure Category View
  return (
    <div className="space-y-6">
      {/* Azure Header Card */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-sky-950 rounded-2xl p-6 text-white border border-indigo-800/60 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                Category: Azure
              </span>
              <span className="text-xs text-indigo-200/80 font-medium">Cloud IaaS &amp; Subscriptions</span>
            </div>
            <h2 className="text-2xl font-black tracking-tight text-white mt-1.5 flex items-center gap-2.5">
              <Cloud className="h-6 w-6 text-indigo-400" />
              <span>Azure Subscription Mapping</span>
            </h2>
            <p className="text-xs text-indigo-100/70 mt-1 max-w-xl">
              Linked Subscriptions for <span className="font-semibold text-white">{customer.name}</span>. Matches the client's Subscriber ID / Subscription ID branch.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocation('/cost-dashboard')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              <span>Open Azure Cost Analytics</span>
              <ArrowUpRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subscription List */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Active Azure Subscriptions ({azureSubs.length})</h3>
            <p className="text-xs text-slate-500">Subscriptions attached to Tenant ID: {customer.tenantId}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {azureSubs.map((sub, idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl border border-slate-200/80 hover:border-indigo-300 bg-slate-50/60 hover:bg-white transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <h4 className="font-bold text-sm text-slate-900">{sub.name}</h4>
                  <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    {sub.state}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-500">
                  Subscription ID: <span className="text-indigo-600 font-semibold">{sub.subscriptionId}</span>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <p className="text-[0.65rem] text-slate-400 font-medium">Resource Groups</p>
                  <p className="font-bold text-slate-800">{sub.resourceGroupsCount} Groups</p>
                </div>
                <div className="text-right">
                  <p className="text-[0.65rem] text-slate-400 font-medium">Est. Monthly</p>
                  <p className="font-bold text-indigo-600 font-mono">${sub.monthlySpendUSD.toFixed(2)}</p>
                </div>
                <button
                  onClick={() => setLocation('/cost-dashboard')}
                  className="p-2 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                  title="View Spend Details"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
