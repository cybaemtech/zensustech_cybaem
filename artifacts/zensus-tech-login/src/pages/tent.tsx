import { useState, type FormEvent } from 'react';
import { useLocation } from 'wouter';
import { Check, Eye, EyeOff, ShieldCheck, ArrowRight, CircleHelp, Building2, KeyRound } from 'lucide-react';
import { LIVE_API_BASE } from '@/lib/live-api';

type ConnectionCheckStatus = 'wait' | 'process' | 'finish' | 'error';
type ConnectionCheck = { title: string; description: string; status: ConnectionCheckStatus };

const AZURE_PERMISSION_CHECKS = [
  ['User.Read.All', 'User Profiles'],
  ['Directory.Read.All', 'Directory Data'],
  ['SecurityEvents.Read.All', 'Security Events'],
  ['SecurityAlert.Read.All', 'Security Alerts'],
  ['AuditLog.Read.All', 'Audit Logs'],
  ['Group.Read.All', 'Group Memberships'],
  ['Policy.Read.All', 'Tenant Policies'],
  ['Application.Read.All', 'Application Metadata'],
  ['Domain.Read.All', 'Domain Info'],
  ['UserAuthenticationMethod.Read.All', 'Auth Methods'],
  ['AdministrativeUnit.Read.All', 'Admin Units'],
  ['SecurityActions.Read.All', 'Security Actions'],
  ['IdentityProvider.Read.All', 'Identity Providers'],
  ['AuditActivity.Read', 'Audit Activities'],
] as const;

export function TenantPage() {
  const [, setLocation] = useLocation();
  const [tenantId, setTenantId] = useState(() => sessionStorage.getItem('azure_tenant_id') || '');
  const [clientId, setClientId] = useState(() => sessionStorage.getItem('azure_client_id') || '');
  const [clientSecret, setClientSecret] = useState('');
  const [showClientSecret, setShowClientSecret] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [connectionTestMessage, setConnectionTestMessage] = useState('');
  const [connectionTestError, setConnectionTestError] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionChecks, setConnectionChecks] = useState<ConnectionCheck[]>([]);
  const [connectionCheckSummary, setConnectionCheckSummary] = useState('');

  const authEmail = sessionStorage.getItem('auth_email') || '';

  const handleVerificationSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantId.trim() || !clientId.trim() || !clientSecret.trim()) {
      setVerificationError('Enter all three Azure connection values to continue.');
      return;
    }

    setVerificationError('');
    setIsSubmitting(true);

    try {
      const liveConnectResponse = await fetch(`${LIVE_API_BASE}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenantId.trim(),
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),
      });
      const liveConnectData = await liveConnectResponse.json();
      if (!liveConnectResponse.ok || !liveConnectData.graph_token || !liveConnectData.mgmt_token) {
        throw new Error(liveConnectData.detail || 'Could not establish live API tokens for this tenant.');
      }
      sessionStorage.setItem('mgmt_token', liveConnectData.mgmt_token);
      sessionStorage.setItem('graph_token', liveConnectData.graph_token);

      let orgDetails = null;
      try {
        const orgRes = await fetch(`${LIVE_API_BASE}/tenant/organization`, {
          headers: { 'X-Graph-Token': liveConnectData.graph_token },
        });
        if (orgRes.ok) {
          const orgData = await orgRes.json();
          orgDetails = orgData?.organization || null;
        }
      } catch {}

      sessionStorage.setItem('azure_tenant_id', tenantId.trim());
      sessionStorage.setItem('azure_client_id', clientId.trim());
      sessionStorage.setItem('is_authenticated', 'true');
      sessionStorage.removeItem('azure_client_secret');
      if (orgDetails) {
        sessionStorage.setItem('azure_org_details', JSON.stringify(orgDetails));
      }
      
      setLocation('/dashboard');
    } catch (err: any) {
      setVerificationError(
        err.message ? `Connection error: ${err.message}` : 'Failed to reach verification endpoint.',
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestConnection = async () => {
    if (!tenantId.trim() || !clientId.trim() || !clientSecret.trim()) {
      setConnectionTestError('Enter all three Azure connection values to test the connection.');
      setConnectionTestMessage('');
      return;
    }
    setConnectionTestError('');
    setConnectionTestMessage('');
    setConnectionCheckSummary('');
    setConnectionChecks([
      { title: 'API Authentication', description: 'Checking Secret', status: 'process' },
      { title: 'Permission Check', description: 'Checking permission', status: 'wait' },
    ]);
    setIsTestingConnection(true);
    try {
      const response = await fetch(`${LIVE_API_BASE}/connect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenantId.trim(), clientId: clientId.trim(), clientSecret: clientSecret.trim() }),
      });
      const data = await response.json();
      if (!response.ok || !data.graph_token || !data.mgmt_token) {
        setConnectionChecks((checks) => checks.map((check, index) => index === 0 ? { ...check, status: 'error' } : check));
        throw new Error(data.detail || data.message || 'Azure authentication failed. Check the tenant ID, client ID, and secret.');
      }
      sessionStorage.setItem('azure_tenant_id', tenantId.trim());
      sessionStorage.setItem('azure_client_id', clientId.trim());
      sessionStorage.setItem('is_authenticated', 'true');
      sessionStorage.removeItem('azure_client_secret');
      sessionStorage.setItem('mgmt_token', data.mgmt_token);
      sessionStorage.setItem('graph_token', data.graph_token);

      const diagnosticHeaders = new Headers({
        Authorization: `Bearer ${data.mgmt_token}`,
        'X-Graph-Token': data.graph_token,
      });
      const diagnosticEndpoints = [
        ['users', `${LIVE_API_BASE}/tenant/users`, 'users'],
        ['applications', `${LIVE_API_BASE}/tenant/applications`, 'applications'],
        ['organization', `${LIVE_API_BASE}/tenant/organization`, 'organization'],
        ['licenses', `${LIVE_API_BASE}/microsoft0365/license_and_usage_details`, 'tableData'],
        ['secureScore', `${LIVE_API_BASE}/microsoft0365/secure/score`, 'data'],
        ['subscriptions', `${LIVE_API_BASE}/subscriptions`, 'value'],
      ] as const;
      const endpointResults = await Promise.all(diagnosticEndpoints.map(async ([key, url, dataKey]) => {
        try {
          const endpointResponse = await fetch(url, { headers: diagnosticHeaders });
          const body = await endpointResponse.json().catch(() => ({}));
          const payload = body?.[dataKey];
          const count = Array.isArray(payload) ? payload.length : payload && typeof payload === 'object' ? 1 : 0;
          const message = body?.detail || body?.error || body?.message;
          return [key, {
            ok: endpointResponse.ok,
            status: endpointResponse.status,
            count,
            message: message || (endpointResponse.ok ? undefined : `HTTP ${endpointResponse.status}`),
          }] as const;
        } catch (diagnosticError: any) {
          return [key, { ok: false, status: 0, count: 0, message: diagnosticError.message || 'Request failed before reaching the API.' }] as const;
        }
      }));
      const graphResults = Object.fromEntries(endpointResults.filter(([key]) => key !== 'subscriptions'));
      const subscriptionResult = endpointResults.find(([key]) => key === 'subscriptions')?.[1];
      const apiDiagnostics = {
        graph: graphResults,
        subscriptions: {
          ...subscriptionResult,
          ok: Boolean(subscriptionResult?.ok && subscriptionResult.count > 0),
          message: subscriptionResult?.ok && subscriptionResult.count === 0
            ? 'Authentication succeeded, but this service principal has no visible Azure subscriptions.'
            : subscriptionResult?.message,
        },
      } as any;

      setConnectionChecks([
        { title: 'API Authentication', description: 'Checking Secret', status: 'finish' },
        { title: 'Permission Check', description: 'Checking permission', status: 'process' },
      ]);
      let roles: string[] = [];
      try {
        const tokenPayload = data.graph_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const decoded = JSON.parse(decodeURIComponent(Array.from(atob(tokenPayload), (char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`).join('')));
        roles = Array.isArray(decoded.roles) ? decoded.roles : [];
      } catch {
        // Some identity providers return unpadded tokens
      }

      const permissionChecks = AZURE_PERMISSION_CHECKS.map(([permission, title]): ConnectionCheck => ({
        title,
        description: `Checking ${permission}`,
        status: 'wait',
      }));
      const apiCheckNames = [
        ['users', 'Live Users API'],
        ['applications', 'Live Applications API'],
        ['organization', 'Live Organization API'],
        ['licenses', 'Live License API'],
        ['secureScore', 'Live Secure Score API'],
      ] as const;
      const liveApiChecks: ConnectionCheck[] = apiCheckNames.map(([, title]) => ({
        title,
        description: 'Checking live API access',
        status: 'wait',
      }));
      liveApiChecks.push({ title: 'Azure Subscription Access', description: 'Checking Azure Resource Manager access', status: 'wait' });
      setConnectionChecks((checks) => [...checks.slice(0, 2), ...permissionChecks, ...liveApiChecks]);
      let grantedCount = 0;
      for (let index = 0; index < AZURE_PERMISSION_CHECKS.length; index += 1) {
        const [permission] = AZURE_PERMISSION_CHECKS[index];
        setConnectionChecks((checks) => checks.map((check, checkIndex) => checkIndex === index + 2 ? { ...check, status: 'process' } : check));
        await new Promise((resolve) => window.setTimeout(resolve, 80));
        const granted = roles.includes(permission);
        if (granted) grantedCount += 1;
        setConnectionChecks((checks) => checks.map((check, checkIndex) => checkIndex === index + 2 ? { ...check, status: granted ? 'finish' : 'error' } : check));
      }
      const graphDiagnostics = apiDiagnostics?.graph || {};
      const subscriptionDiagnostics = apiDiagnostics?.subscriptions;
      const resolvedApiChecks: ConnectionCheck[] = apiCheckNames.map(([key, title]) => {
        const result = graphDiagnostics[key];
        const ok = result?.ok === true;
        const dataCount = result?.count ?? result?.sampleCount ?? 0;
        return {
          title,
          description: apiDiagnostics?.error || (ok ? `HTTP ${result.status}: API access confirmed${dataCount ? ` (${dataCount} record${dataCount === 1 ? '' : 's'}).` : '; no records returned.'}` : `HTTP ${result?.status ?? '—'}: ${result?.message || 'No response from this API.'}`),
          status: ok ? 'finish' as const : 'error' as const,
        };
      });
      const subscriptionCount = subscriptionDiagnostics?.count || 0;
      resolvedApiChecks.push({
        title: 'Azure Subscription Access',
        description: apiDiagnostics?.error || subscriptionDiagnostics?.message || `HTTP ${subscriptionDiagnostics?.status ?? '—'}: No subscription response.`,
        status: subscriptionDiagnostics?.ok === true ? 'finish' as const : 'error' as const,
      });
      setConnectionChecks((checks) => checks.map((check, index) => {
        if (index === 1) return { ...check, status: roles.length ? 'finish' : 'error', description: roles.length ? 'Graph token roles decoded; live APIs checked below' : 'No application roles were granted' };
        if (index >= AZURE_PERMISSION_CHECKS.length + 2) return resolvedApiChecks[index - AZURE_PERMISSION_CHECKS.length - 2];
        return check;
      }));
      const successfulApiCount = Object.values(graphDiagnostics).filter((result: any) => result?.ok === true).length;
      setConnectionCheckSummary(`${grantedCount} of ${AZURE_PERMISSION_CHECKS.length} checked Graph roles granted · ${successfulApiCount} of ${apiCheckNames.length} live Graph APIs reachable · ${subscriptionCount} Azure subscriptions accessible`);
      setConnectionTestMessage('Authentication completed. Live API access results are confirmed.');
    } catch (err: any) {
      setConnectionTestError(err.message || 'Could not reach the Azure connection endpoint.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-[#f8fafc] font-sans">
      {/* Background decoration */}
      <div 
        className="fixed inset-0 pointer-events-none z-0 opacity-80"
        style={{
          background: `
            radial-gradient(circle at 10% 15%, rgba(14, 165, 233, 0.04) 0%, transparent 40%),
            radial-gradient(circle at 90% 85%, rgba(59, 130, 246, 0.05) 0%, transparent 45%),
            linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)
          `,
        }}
      />

      <div className="relative z-10 w-full max-w-xl bg-white rounded-2xl shadow-[0_12px_45px_-8px_rgba(15,23,42,0.12),0_2px_8px_-2px_rgba(15,23,42,0.06)] border border-slate-200/90 p-6 sm:p-8 lg:p-10">
        {/* Back link */}
        <button
          type="button"
          onClick={() => setLocation('/')}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors mb-5 cursor-pointer"
        >
          <span className="text-base leading-none">←</span>
          <span>Back to Sign in</span>
        </button>

        {/* Top ZensusTech Logo Header */}
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <img
              src="/ZensusTech_Logo.PNG"
              alt="ZensusTech"
              className="h-7 w-auto max-w-[100px] object-contain rounded"
            />
            <div className="border-l border-slate-200 pl-2">
              <span className="font-extrabold text-xs tracking-wider text-slate-800 leading-none block">
                ZENSUSTECH
              </span>
              <span className="text-[8px] font-medium tracking-widest text-slate-400 uppercase">
                Cloud Operations
              </span>
            </div>
          </div>
          {authEmail && (
            <span className="text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
              {authEmail}
            </span>
          )}
        </div>

        {/* Title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Connect Azure Tenant
            </h2>
            <p className="text-xs text-slate-500">
              Verify Microsoft Entra ID credentials for your ZensusTech workspace
            </p>
          </div>
        </div>

        {/* Verification Form */}
        <form onSubmit={handleVerificationSubmit} noValidate className="space-y-4 mt-6">
          <div>
            <label htmlFor="tenant-id" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tenant ID
            </label>
            <input
              id="tenant-id"
              name="tenantId"
              type="text"
              value={tenantId}
              onChange={(event) => {
                setTenantId(event.target.value);
                setVerificationError('');
                setConnectionTestMessage('');
                setConnectionTestError('');
              }}
              placeholder="e.g. 9414ece9-9039-40b7-a6a7-7ecbe7409245"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:border-[#008cff] focus:ring-4 focus:ring-[#008cff]/15 focus:outline-none transition-all font-mono"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="client-id" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Client ID (Application ID)
            </label>
            <input
              id="client-id"
              name="clientId"
              type="text"
              value={clientId}
              onChange={(event) => {
                setClientId(event.target.value);
                setVerificationError('');
                setConnectionTestMessage('');
                setConnectionTestError('');
              }}
              placeholder="e.g. dc44a044-6663-44f2-95f0-6215ad304d9e"
              className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:border-[#008cff] focus:ring-4 focus:ring-[#008cff]/15 focus:outline-none transition-all font-mono"
            />
          </div>

          <div>
            <label htmlFor="client-secret" className="block text-xs font-semibold text-slate-700 mb-1.5">
              Client Secret Value
            </label>
            <div className="relative">
              <input
                id="client-secret"
                name="clientSecret"
                type={showClientSecret ? 'text' : 'password'}
                value={clientSecret}
                onChange={(event) => {
                  setClientSecret(event.target.value);
                  setVerificationError('');
                  setConnectionTestMessage('');
                  setConnectionTestError('');
                }}
                placeholder="Enter Azure client secret value"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-lg border border-slate-300 text-xs sm:text-sm text-slate-900 bg-white focus:border-[#008cff] focus:ring-4 focus:ring-[#008cff]/15 focus:outline-none transition-all font-mono"
              />
              <button
                type="button"
                onClick={() => setShowClientSecret((visible) => !visible)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showClientSecret ? 'Hide secret' : 'Show secret'}
              >
                {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {connectionTestError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50/70 p-3 text-xs text-rose-800">
              <CircleHelp className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{connectionTestError}</span>
            </div>
          )}

          {connectionTestMessage && (
            <div className="flex items-start gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs text-emerald-800">
              <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{connectionTestMessage}</span>
            </div>
          )}

          {connectionChecks.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-slate-50 p-4" aria-label="Azure permission checks">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2.5">
                VERIFYING PERMISSIONS
              </p>
              <div className="space-y-1.5 overflow-y-auto max-h-48 pr-1">
                {connectionChecks.map((check, index) => (
                  <div key={`${check.title}-${index}`} className="flex items-start gap-2.5 rounded-lg bg-white p-2 border border-slate-200 text-xs">
                    <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                      check.status === 'finish'
                        ? 'bg-emerald-100 text-emerald-700'
                        : check.status === 'error'
                        ? 'bg-rose-100 text-rose-700'
                        : check.status === 'process'
                        ? 'bg-blue-100 text-blue-700 animate-pulse'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {check.status === 'finish' ? '✓' : check.status === 'error' ? '!' : index + 1}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-800">{check.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{check.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {connectionCheckSummary && (
                <p className="mt-2 text-xs font-semibold text-emerald-700 border-t border-slate-200 pt-2">
                  {connectionCheckSummary}
                </p>
              )}
            </section>
          )}

          {verificationError && (
            <div className="flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              <CircleHelp className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{verificationError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
            <button
              type="button"
              disabled={isSubmitting || isTestingConnection}
              onClick={handleTestConnection}
              className="w-full py-2.5 px-4 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
            >
              {isTestingConnection ? 'Testing...' : 'Test Connection'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isTestingConnection}
              className="w-full py-2.5 px-4 rounded-lg bg-[#008cff] hover:bg-[#007be6] text-white text-xs font-semibold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
            >
              {isSubmitting ? (
                <span>Verifying...</span>
              ) : (
                <>
                  <span>Verify and Continue</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
          <ShieldCheck className="w-3.5 h-3.5 text-sky-500 shrink-0" />
          <span>Encrypted token handshake · Direct Microsoft Entra ID verification</span>
        </div>
      </div>
    </div>
  );
}

export default TenantPage;

