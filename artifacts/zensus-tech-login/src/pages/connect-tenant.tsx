import React, { useState } from 'react';
import { useLocation } from 'wouter';
import {
  Cloud, Server, Globe2, Layers, Mail, ChevronRight, Check, ArrowLeft, ShieldCheck
} from 'lucide-react';
import { connectTenant, TenantConnectPayload } from '@/lib/tenant-api';

type ProviderType = 'cloud' | 'office365';
type CloudProvider = 'azure' | 'gcp' | 'aws' | 'native_cloud';
type Plan = 'Trial' | 'Bronze' | 'Silver' | 'Gold';

const CLOUD_PROVIDERS: { id: CloudProvider; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: 'azure', label: 'Microsoft Azure', icon: <Server className="w-5 h-5 text-blue-500" />, desc: 'Enterprise cloud platform by Microsoft' },
  { id: 'gcp', label: 'Google Cloud Platform', icon: <Globe2 className="w-5 h-5 text-red-400" />, desc: "Google's scalable cloud infrastructure" },
  { id: 'aws', label: 'Amazon Web Services', icon: <Cloud className="w-5 h-5 text-amber-500" />, desc: "World's most comprehensive cloud" },
  { id: 'native_cloud', label: 'Native Cloud', icon: <Layers className="w-5 h-5 text-indigo-500" />, desc: 'Cloud-native deployments & microservices' },
];

const PLANS: { id: Plan; desc: string; color: string }[] = [
  { id: 'Trial', desc: '30-day free evaluation', color: 'text-slate-600 border-slate-300 bg-slate-50' },
  { id: 'Bronze', desc: 'Basic governance & monitoring', color: 'text-amber-700 border-amber-300 bg-amber-50' },
  { id: 'Silver', desc: 'Advanced analytics & reports', color: 'text-slate-500 border-slate-400 bg-slate-100' },
  { id: 'Gold', desc: 'Full enterprise suite', color: 'text-yellow-700 border-yellow-400 bg-yellow-50' },
];

export function ConnectTenantPage() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState<'type' | 'provider' | 'details' | 'plan'>('type');
  const [providerType, setProviderType] = useState<ProviderType | null>(null);
  const [cloudProvider, setCloudProvider] = useState<CloudProvider | null>(null);
  const [plan, setPlan] = useState<Plan>('Trial');
  const [tenantId, setTenantId] = useState('');
  const [tenantName, setTenantName] = useState('');
  const [error, setError] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [success, setSuccess] = useState('');

  const handleConnect = async () => {
    if (!tenantId.trim()) {
      setError('Tenant ID is required.');
      return;
    }
    setIsConnecting(true);
    setError('');
    try {
      const payload: TenantConnectPayload = {
        tenant_id: tenantId.trim(),
        tenant_name: tenantName.trim() || undefined,
        provider_type: providerType!,
        provider_name: providerType === 'cloud' ? cloudProvider! : undefined,
        subscription_plan: plan,
      };
      const res = await connectTenant(payload);
      setSuccess(res.message || 'Tenant connected!');
      setTimeout(() => setLocation('/dashboard'), 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to connect tenant. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] font-sans">
      {/* BG pattern */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="poly-ct" width="160" height="160" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 160 0 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <path d="M 0 160 L 160 160 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <path d="M 0 0 L 0 160 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <path d="M 160 0 L 160 160 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#poly-ct)" />
      </svg>

      <div className="relative z-10 w-full max-w-lg bg-white rounded-2xl shadow-[0_12px_45px_-8px_rgba(15,23,42,0.12)] border border-slate-200/90 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#008cff] to-indigo-600 p-6 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">Connect Your Tenant</h1>
              <p className="text-blue-100 text-xs">Link your cloud or Office 365 environment</p>
            </div>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1 mt-3">
            {(['type', 'provider', 'details', 'plan'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all
                  ${step === s || (['provider', 'details', 'plan'].indexOf(step) > ['provider', 'details', 'plan'].indexOf(s))
                    ? 'bg-white text-[#008cff]'
                    : 'bg-white/30 text-white'}`}
                >
                  {i + 1}
                </div>
                {i < 3 && <div className={`flex-1 h-0.5 ${['provider', 'details', 'plan'].indexOf(step) > i - 1 ? 'bg-white/70' : 'bg-white/30'}`} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="p-6">
          {/* Success */}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
              {error}
            </div>
          )}

          {/* STEP 1: Provider Type */}
          {step === 'type' && (
            <div className="space-y-3">
              <h2 className="text-sm font-bold text-slate-800">Select Connection Type</h2>
              <button
                onClick={() => { setProviderType('cloud'); setStep('provider'); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-[#008cff] hover:bg-blue-50 transition-all text-left group"
              >
                <Cloud className="w-8 h-8 text-blue-500" />
                <div>
                  <div className="text-sm font-bold text-slate-800">Cloud</div>
                  <div className="text-xs text-slate-500">Azure, GCP, AWS, Native Cloud</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-[#008cff]" />
              </button>
              <button
                onClick={() => { setProviderType('office365'); setStep('details'); }}
                className="w-full flex items-center gap-3 p-4 rounded-xl border-2 border-slate-200 hover:border-[#008cff] hover:bg-blue-50 transition-all text-left group"
              >
                <Mail className="w-8 h-8 text-indigo-500" />
                <div>
                  <div className="text-sm font-bold text-slate-800">Microsoft Office 365</div>
                  <div className="text-xs text-slate-500">Connect your M365 tenant</div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-[#008cff]" />
              </button>
            </div>
          )}

          {/* STEP 2: Cloud Provider (only for cloud type) */}
          {step === 'provider' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setStep('type')} className="text-slate-400 hover:text-slate-600">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-sm font-bold text-slate-800">Select Cloud Provider</h2>
              </div>
              {CLOUD_PROVIDERS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setCloudProvider(p.id); setStep('details'); }}
                  className="w-full flex items-center gap-3 p-3.5 rounded-xl border-2 border-slate-200 hover:border-[#008cff] hover:bg-blue-50 transition-all text-left group"
                >
                  {p.icon}
                  <div>
                    <div className="text-sm font-semibold text-slate-800">{p.label}</div>
                    <div className="text-xs text-slate-500">{p.desc}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 ml-auto group-hover:text-[#008cff]" />
                </button>
              ))}
            </div>
          )}

          {/* STEP 3: Tenant Details */}
          {step === 'details' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setStep(providerType === 'cloud' ? 'provider' : 'type')} className="text-slate-400 hover:text-slate-600">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-sm font-bold text-slate-800">
                  {providerType === 'office365' ? 'Office 365 Tenant Details' : `${CLOUD_PROVIDERS.find(p => p.id === cloudProvider)?.label} Details`}
                </h2>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tenant ID <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={tenantId}
                  onChange={(e) => { setTenantId(e.target.value); setError(''); }}
                  placeholder={providerType === 'office365' ? 'e.g. yourdomain.onmicrosoft.com' : 'e.g. xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#008cff] focus:ring-2 focus:ring-[#008cff]/15 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tenant Name <span className="text-slate-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="e.g. Contoso Corporation"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white focus:outline-none focus:border-[#008cff] focus:ring-2 focus:ring-[#008cff]/15 transition-all"
                />
              </div>

              <button
                onClick={() => {
                  if (!tenantId.trim()) { setError('Tenant ID is required.'); return; }
                  setError('');
                  setStep('plan');
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#008cff] hover:bg-[#007be6] text-white font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2"
              >
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 4: Subscription Plan */}
          {step === 'plan' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-1">
                <button onClick={() => setStep('details')} className="text-slate-400 hover:text-slate-600">
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <h2 className="text-sm font-bold text-slate-800">Choose Subscription Plan</h2>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {PLANS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setPlan(p.id)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      plan === p.id ? 'border-[#008cff] bg-blue-50' : `border-slate-200 ${p.color} hover:border-slate-300`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-sm">{p.id}</span>
                      {plan === p.id && <Check className="w-4 h-4 text-[#008cff]" />}
                    </div>
                    <span className="text-[11px] text-slate-500">{p.desc}</span>
                  </button>
                ))}
              </div>

              {/* Summary */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Type:</span>
                  <span className="font-semibold text-slate-700 capitalize">{providerType}</span>
                </div>
                {providerType === 'cloud' && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">Provider:</span>
                    <span className="font-semibold text-slate-700">
                      {CLOUD_PROVIDERS.find(p => p.id === cloudProvider)?.label}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Tenant ID:</span>
                  <span className="font-semibold text-slate-700 truncate max-w-[180px]">{tenantId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Plan:</span>
                  <span className="font-semibold text-[#008cff]">{plan}</span>
                </div>
              </div>

              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-2.5 px-4 rounded-xl bg-[#008cff] hover:bg-[#007be6] text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isConnecting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Connecting...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Connect Tenant & Continue</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConnectTenantPage;

