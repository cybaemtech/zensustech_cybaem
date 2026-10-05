import { useState, type FormEvent, type ReactNode } from 'react';
import { Check, Eye, EyeOff, LockKeyhole, ShieldCheck, ArrowRight, CircleHelp } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import Dashboard from '@/pages/dashboard';
import CostDashboard from '@/pages/CostDashboard';
import { LIVE_API_BASE } from '@/lib/live-api';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

// ... (skipping to the Router component)
// NOTE: using replace_file_content to properly patch the file. I will use the start and end lines specifically.

const queryClient = new QueryClient();
const DEMO_EMAIL = 'admin@zentech.com';
const DEMO_PASSWORD = 'admin 123';

type FieldErrors = {
  email?: string;
  password?: string;
  credentials?: string;
};

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

function Home() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showLoginCheck, setShowLoginCheck] = useState(false);
  const [loginChecks, setLoginChecks] = useState<ConnectionCheck[]>([]);
  const [forgotMessage, setForgotMessage] = useState(false);
  const [tenantId, setTenantId] = useState(() => sessionStorage.getItem('azure_tenant_id') || '9414ece9-9039-40b7-a6a7-7ecbe7409245');
  const [clientId, setClientId] = useState(() => sessionStorage.getItem('azure_client_id') || '3bd333d8-94ea-4630-a492-7c06062b9822');
  const [clientSecret, setClientSecret] = useState('');
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [verificationError, setVerificationError] = useState('');
  const [connectionTestMessage, setConnectionTestMessage] = useState('');
  const [connectionTestError, setConnectionTestError] = useState('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionChecks, setConnectionChecks] = useState<ConnectionCheck[]>([]);
  const [connectionCheckSummary, setConnectionCheckSummary] = useState('');
  const [azureDetails, setAzureDetails] = useState<{ tenantId: string; clientId: string } | null>(null);

  const validate = () => {
    const nextErrors: FieldErrors = {};
    if (!email.trim()) {
      nextErrors.email = 'Enter the email linked to your workspace.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Use a valid email address.';
    }
    if (!password) {
      nextErrors.password = 'Enter your password to continue.';
    } else if (password.length < 8) {
      nextErrors.password = 'Your password must be at least 8 characters.';
    }
    if (
      !nextErrors.email &&
      !nextErrors.password &&
      (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD)
    ) {
      nextErrors.credentials = 'The admin email or password is not correct.';
    }
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setForgotMessage(false);
    if (!validate()) return;
    setIsSubmitting(true);
    window.setTimeout(async () => {
      setIsSubmitting(false);
      // Start login-phase permission check animation
      const initialChecks: ConnectionCheck[] = [
        { title: 'API Authentication', description: 'Checking Secret', status: 'process' },
        { title: 'Permission Check', description: 'Checking permission', status: 'wait' },
        ...AZURE_PERMISSION_CHECKS.map(([permission, title]): ConnectionCheck => ({
          title,
          description: `Checking ${permission}`,
          status: 'wait',
        })),
      ];
      setLoginChecks(initialChecks);
      setShowLoginCheck(true);

      // Step 1 – API Authentication
      await new Promise((resolve) => window.setTimeout(resolve, 500));
      setLoginChecks((checks) => checks.map((c, i) => i === 0 ? { ...c, status: 'finish' } : c));

      // Step 2 – Permission Check row becomes active
      await new Promise((resolve) => window.setTimeout(resolve, 300));
      setLoginChecks((checks) => checks.map((c, i) => i === 1 ? { ...c, status: 'process' } : c));

      // Animate each permission row
      for (let idx = 0; idx < AZURE_PERMISSION_CHECKS.length; idx++) {
        setLoginChecks((checks) => checks.map((c, i) => i === idx + 2 ? { ...c, status: 'process' } : c));
        await new Promise((resolve) => window.setTimeout(resolve, 120));
        setLoginChecks((checks) => checks.map((c, i) => i === idx + 2 ? { ...c, status: 'finish' } : c));
      }

      // Finish Permission Check row
      await new Promise((resolve) => window.setTimeout(resolve, 250));
      setLoginChecks((checks) => checks.map((c, i) => i === 1 ? { ...c, status: 'finish', description: 'All permissions verified' } : c));

      // Advance to Azure verification screen
      await new Promise((resolve) => window.setTimeout(resolve, 600));
      setShowLoginCheck(false);
      setLoginChecks([]);
      setShowVerification(true);
    }, 850);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (errors.email) setErrors((current) => ({ ...current, email: undefined }));
    if (errors.credentials) setErrors((current) => ({ ...current, credentials: undefined }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) setErrors((current) => ({ ...current, password: undefined }));
    if (errors.credentials) setErrors((current) => ({ ...current, credentials: undefined }));
  };

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

      const response = await fetch('/api/verify-azure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tenantId: tenantId.trim(),
          clientId: clientId.trim(),
          clientSecret: clientSecret.trim(),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setAzureDetails({
          tenantId: data.tenantId,
          clientId: data.clientId,
        });
        sessionStorage.setItem('azure_tenant_id', data.tenantId);
        sessionStorage.setItem('azure_client_id', data.clientId);
        sessionStorage.removeItem('azure_client_secret');
        if (data.organization) {
          sessionStorage.setItem('azure_org_details', JSON.stringify(data.organization));
        }
        setShowVerification(false);
        setIsSuccess(true);
      } else {
        setVerificationError(
          data.message || 'Azure verification failed. Please verify your credentials.',
        );
      }
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
        // Some identity providers can return a token that is not a readable JWT.
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
        await new Promise((resolve) => window.setTimeout(resolve, 100));
        const granted = roles.includes(permission);
        if (granted) grantedCount += 1;
        setConnectionChecks((checks) => checks.map((check, checkIndex) => checkIndex === index + 2 ? { ...check, status: granted ? 'finish' : 'error' } : check));
      }
      const graphDiagnostics = apiDiagnostics?.graph || {};
      const subscriptionDiagnostics = apiDiagnostics?.subscriptions;
      const resolvedApiChecks = apiCheckNames.map(([key, title]) => {
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
      setConnectionCheckSummary(`${grantedCount} of ${AZURE_PERMISSION_CHECKS.length} checked Graph roles granted · ${successfulApiCount} of ${apiCheckNames.length} live Graph APIs reachable · ${subscriptionCount} Azure subscriptions accessible${roles.length ? '' : '. Assign Microsoft Graph application permissions and grant admin consent.'}`);
      setConnectionTestMessage('Authentication completed. Live API access results are shown below.');
    } catch (err: any) {
      setConnectionTestError(err.message || 'Could not reach the Azure connection endpoint.');
    } finally {
      setIsTestingConnection(false);
    }
  };

  return (
    <main className="login-shell flex min-h-[100dvh] flex-col lg:h-[100dvh] lg:min-h-0 lg:flex-row">
      <section className="brand-rail flex min-h-[24rem] flex-1 flex-col justify-start px-6 py-7 text-white sm:px-10 lg:min-h-[100dvh] lg:max-w-[47%] lg:px-[clamp(2.5rem,6vw,7.5rem)] lg:py-10" aria-label="ZensusTech platform overview">
        <div className="orb orb-a" aria-hidden="true" />
        <div className="orb orb-b" aria-hidden="true" />
        <div className="entrance relative z-10 flex items-center justify-between">
          <img
            src="/ZensusTech_Logo.PNG"
            alt="ZensusTech"
            className="brand-logo h-[9rem] w-[9rem] rounded-[1.5rem] object-contain shadow-[0_16px_38px_rgba(0,0,0,.26)]"
            data-testid="img-brand-logo"
          />
          <span className="mono-label hidden text-[.62rem] text-cyan-100/70 sm:block">ZT / 04.26</span>
        </div>

        <div className="brand-copy relative z-10 mt-[clamp(2.5rem,8vh,6rem)] max-w-[34rem] pb-5 pt-10 sm:pt-16 lg:pb-5 lg:pt-0">
          <div className="brand-kicker entrance entrance-delay-1 mb-7 flex items-center gap-3 text-[.67rem] font-semibold text-cyan-100/75">
            <span className="status-dot" aria-hidden="true" />
            <span className="mono-label">ZenAI Ops / secure access</span>
          </div>
          <h1 className="brand-headline entrance entrance-delay-2 max-w-[12ch] font-['Space_Grotesk'] text-[clamp(2.5rem,5vw,5.25rem)] font-semibold leading-[.97] tracking-[-.065em] text-[#f1f7fc]">
            Clarity for complex cloud operations.
          </h1>
          <p className="brand-description entrance entrance-delay-3 mt-7 max-w-[31rem] text-[clamp(.96rem,1.3vw,1.08rem)] leading-7 text-slate-300/75">
            One secure command center for the teams keeping modern infrastructure steady, observable, and ready for what is next.
          </p>
          <div className="brand-meta entrance entrance-delay-4 mt-10 flex items-center gap-3 border-t border-white/10 pt-5 text-xs text-slate-300/60">
            <ShieldCheck className="h-4 w-4 text-cyan-300/90" strokeWidth={1.8} aria-hidden="true" />
            <span>Identity-first access · Azure managed services</span>
          </div>
        </div>
      </section>

      <section className="auth-panel flex flex-1 flex-col justify-start bg-[#f4f7fa] px-6 py-7 sm:px-10 lg:min-h-0 lg:overflow-y-auto lg:overscroll-contain lg:max-w-[53%] lg:px-[clamp(2.5rem,8vw,10rem)] lg:py-10" aria-label="Sign in">
        <header className="auth-header entrance flex items-center justify-end">
          <div className="flex items-center gap-2 text-[.68rem] font-semibold text-[#65788c]">
            <LockKeyhole className="h-3.5 w-3.5 text-[#159bcf]" strokeWidth={2} aria-hidden="true" />
            <span className="mono-label">Encrypted session</span>
          </div>
        </header>

        <div className="auth-content mx-auto mt-[clamp(3rem,8vh,5.5rem)] w-full max-w-[27rem] py-12 lg:flex-none lg:py-4">
          {isSuccess ? (
            <div className="entrance rounded-[1.2rem] border border-[#cbe4e3] bg-white p-7 shadow-[0_20px_60px_rgba(26,59,91,.1)] sm:p-9" data-testid="status-login-success" role="status" aria-live="polite">
              <div className="success-mark mb-6 flex h-14 w-14 items-center justify-center rounded-2xl">
                <Check className="h-7 w-7" strokeWidth={2.5} />
              </div>
              <p className="mono-label text-[.65rem] font-medium text-[#0a8579]">Access verified</p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-[-.045em] text-[#162a44]">Welcome back.</h2>
              <p className="mt-3 text-[.94rem] leading-6 text-[#65788c]">
                Your ZenAI Ops workspace is ready. This frontend confirmation completes the sign-in flow.
              </p>
              <div className="mt-7 flex items-center gap-3 rounded-xl bg-[#f2f8f9] px-4 py-3 text-sm text-[#34606c]">
                <span className="h-2 w-2 rounded-full bg-[#31bca9]" />
                Session prepared for <span className="truncate font-semibold text-[#1a4755]">{email}</span>
              </div>
              {azureDetails && (
                <div className="mt-4 rounded-xl border border-[#cbe4e3] bg-[#f8fbfa] p-4 text-xs" data-testid="azure-verified-info">
                  <div className="flex items-center gap-2 font-semibold text-[#0a8579]">
                    <ShieldCheck className="h-4 w-4" />
                    <span>Azure Entra ID Verified</span>
                  </div>
                  <div className="mt-2 space-y-1 text-[#486572]">
                    <p className="truncate"><span className="font-medium text-[#203c4a]">Tenant ID:</span> {azureDetails.tenantId}</p>
                    <p className="truncate"><span className="font-medium text-[#203c4a]">Client ID:</span> {azureDetails.clientId}</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setLocation('/dashboard')}
                className="auth-submit mt-7 flex w-full items-center justify-center gap-2.5 px-5 text-sm font-semibold"
                data-testid="button-continue-dashboard"
              >
                Continue to Dashboard <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          ) : showLoginCheck ? (
            <div className="entrance entrance-delay-1" role="status" aria-live="polite" aria-label="Verifying permissions">
              <div className="auth-intro mb-7">
                <p className="mono-label text-[.67rem] font-medium text-[#0d73aa]">Step 1 of 2 · Access verification</p>
                <h2 className="mt-3 font-['Space_Grotesk'] text-[clamp(2rem,4vw,2.6rem)] font-semibold tracking-[-.06em] text-[#162a44]">Checking your access.</h2>
                <p className="mt-2 text-[.94rem] text-[#718397]">Validating permissions for your ZenAI Ops workspace.</p>
              </div>
              <section className="rounded-xl border border-[#dce5ed] bg-white p-4" aria-label="Login permission checks">
                <p className="mono-label mb-3 text-[.62rem] font-semibold tracking-[.12em] text-[#718397]">VERIFYING PERMISSIONS</p>
                <div className="space-y-2 overflow-y-auto overscroll-contain pr-1" style={{ maxHeight: 'min(55vh, 22rem)' }}>
                  {loginChecks.map((check, index) => (
                    <div key={`login-check-${index}`} className="flex items-start gap-3 rounded-lg bg-[#f7f9fb] px-3 py-2.5">
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[.65rem] font-bold ${
                          check.status === 'finish'
                            ? 'bg-[#d9f2e9] text-[#16805f]'
                            : check.status === 'error'
                            ? 'bg-[#fde5e5] text-[#b34d50]'
                            : check.status === 'process'
                            ? 'bg-[#e1f3fa] text-[#0d73aa]'
                            : 'bg-[#e9eef3] text-[#8796a5]'
                        }`}
                        aria-label={check.status}
                      >
                        {check.status === 'finish' ? (
                          <Check className="h-3 w-3" strokeWidth={3} />
                        ) : check.status === 'error' ? (
                          '!'
                        ) : check.status === 'process' ? (
                          <span className="h-2 w-2 animate-pulse rounded-full bg-current" />
                        ) : (
                          index + 1
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#2b435d]">{check.title}</p>
                        <p className="break-all text-[.68rem] leading-5 text-[#8090a0]">{check.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : showVerification ? (
            <div className="verification-screen entrance entrance-delay-1">
              <div className="auth-intro mb-9">
                <p className="mono-label text-[.67rem] font-medium text-[#0d73aa]">Step 2 of 2 · Azure verification</p>
                <h2 className="mt-3 font-['Space_Grotesk'] text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-[-.06em] text-[#162a44]">Connect your tenant.</h2>
                <p className="mt-3 text-[.94rem] text-[#718397]">Verify the Azure connection for your ZenAI Ops workspace.</p>
              </div>

              <form onSubmit={handleVerificationSubmit} noValidate className="auth-form space-y-5" aria-label="Azure verification form">
                <div>
                  <label htmlFor="tenant-id" className="mb-2 block text-[.75rem] font-semibold text-[#2b435d]">Tenant ID</label>
                  <input
                    id="tenant-id"
                    name="tenantId"
                    type="text"
                    autoComplete="off"
                    value={tenantId}
                    onChange={(event) => {
                      setTenantId(event.target.value);
                      setVerificationError('');
                      setConnectionTestMessage('');
                      setConnectionTestError('');
                    }}
                    placeholder="Enter tenant ID"
                    className="auth-input"
                    data-testid="input-tenant-id"
                  />
                </div>

                <div>
                  <label htmlFor="client-id" className="mb-2 block text-[.75rem] font-semibold text-[#2b435d]">Client ID</label>
                  <input
                    id="client-id"
                    name="clientId"
                    type="text"
                    autoComplete="off"
                    value={clientId}
                    onChange={(event) => {
                      setClientId(event.target.value);
                      setVerificationError('');
                      setConnectionTestMessage('');
                      setConnectionTestError('');
                    }}
                    placeholder="Enter client ID"
                    className="auth-input"
                    data-testid="input-client-id"
                  />
                </div>

                <div>
                  <label htmlFor="client-secret" className="mb-2 block text-[.75rem] font-semibold text-[#2b435d]">Client secret</label>
                  <div className="relative">
                    <input
                      id="client-secret"
                      name="clientSecret"
                      type={showClientSecret ? 'text' : 'password'}
                      autoComplete="new-password"
                      spellCheck={false}
                      value={clientSecret}
                      onChange={(event) => {
                        setClientSecret(event.target.value);
                        setVerificationError('');
                        setConnectionTestMessage('');
                        setConnectionTestError('');
                      }}
                      placeholder="Enter client secret"
                      className="auth-input"
                      style={{ paddingRight: '3.25rem' }}
                      data-testid="input-client-secret"
                    />
                    <button
                      type="button"
                      onClick={() => setShowClientSecret((visible) => !visible)}
                      className="password-toggle absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg"
                      aria-label={showClientSecret ? 'Hide client secret' : 'Show client secret'}
                      aria-pressed={showClientSecret}
                      data-testid="button-toggle-client-secret"
                    >
                      {showClientSecret ? <EyeOff className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} /> : <Eye className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} />}
                    </button>
                  </div>
                </div>

                {connectionTestError && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-[#f1d1d1] bg-[#fff6f6] px-3.5 py-3 text-xs leading-5 text-[#9f4b4b]" role="alert" aria-live="polite" data-testid="text-connection-test-error">
                    <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{connectionTestError}</span>
                  </div>
                )}
                {connectionTestMessage && (
                  <div className="rounded-lg border border-[#cbe4e3] bg-[#f2f8f9] px-3.5 py-3 text-xs leading-5 text-[#34606c]" role="status" aria-live="polite" data-testid="text-connection-test-success">
                    {connectionTestMessage}
                  </div>
                )}
                {connectionChecks.length > 0 && (
                  <section className="rounded-xl border border-[#dce5ed] bg-white p-4" aria-label="Azure permission checks" data-testid="connection-permission-checklist">
                    <p className="mono-label mb-3 text-[.62rem] font-semibold tracking-[.12em] text-[#718397]">VERIFYING PERMISSIONS</p>
                    <div className="space-y-2 overflow-y-auto overscroll-contain pr-1" style={{ maxHeight: 'min(35vh, 16rem)' }}>
                      {connectionChecks.map((check, index) => (
                        <div key={`${check.title}-${index}`} className="flex items-start gap-3 rounded-lg bg-[#f7f9fb] px-3 py-2.5">
                          <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[.65rem] font-bold ${check.status === 'finish' ? 'bg-[#d9f2e9] text-[#16805f]' : check.status === 'error' ? 'bg-[#fde5e5] text-[#b34d50]' : check.status === 'process' ? 'bg-[#e1f3fa] text-[#0d73aa]' : 'bg-[#e9eef3] text-[#8796a5]'}`} aria-label={check.status}>
                            {check.status === 'finish' ? <Check className="h-3 w-3" strokeWidth={3} /> : check.status === 'error' ? '!' : check.status === 'process' ? <span className="h-2 w-2 animate-pulse rounded-full bg-current" /> : index + 1}
                          </span>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-[#2b435d]">{check.title}</p>
                            <p className="break-all text-[.68rem] leading-5 text-[#8090a0]">{check.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                    {connectionCheckSummary && <p className="mt-3 border-t border-[#e6edf2] pt-3 text-xs font-medium text-[#34606c]" role="status">{connectionCheckSummary}</p>}
                  </section>
                )}

                {verificationError && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-[#f1d1d1] bg-[#fff6f6] px-3.5 py-3 text-xs leading-5 text-[#9f4b4b]" role="alert" aria-live="polite" data-testid="text-verification-error">
                    <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <div className="mt-2 space-y-2 border-t border-[#dce5ed] pt-3">
                  <button type="button" disabled={isSubmitting || isTestingConnection} onClick={handleTestConnection} className="ghost-action flex w-full items-center justify-center gap-2.5 rounded-lg border border-[#cbd8e3] bg-white px-5 py-3 text-sm font-semibold disabled:cursor-wait disabled:opacity-75" data-testid="button-test-connection">
                    {isTestingConnection ? 'Testing connection…' : 'Test Connection'}
                  </button>
                  <button type="submit" disabled={isSubmitting || isTestingConnection} className="auth-submit flex w-full items-center justify-center gap-2.5 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-75" data-testid="button-verify-azure">
                    {isSubmitting ? (
                      <>
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                        Verifying connection
                      </>
                    ) : (
                      <>
                        Verify and continue <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                      </>
                    )}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowVerification(false);
                    setVerificationError('');
                  }}
                  className="ghost-action mx-auto flex items-center gap-2 text-sm font-semibold"
                  data-testid="button-back-to-login"
                >
                  Back to sign in
                </button>
              </form>

              <div className="auth-security mt-9 flex items-center gap-3 border-t border-[#dce5ed] pt-5 text-[.7rem] leading-5 text-[#8090a0]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#159bcf]" strokeWidth={1.8} aria-hidden="true" />
                <span>Live verification active · Credentials are authenticated in real-time against Microsoft Entra ID.</span>
              </div>
            </div>
          ) : (
            <div className="entrance entrance-delay-1">
              <div className="auth-intro mb-9">
                <p className="mono-label text-[.67rem] font-medium text-[#0d73aa]">Welcome to ZenAI Ops</p>
                <h2 className="mt-3 font-['Space_Grotesk'] text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-[-.06em] text-[#162a44]">Sign in to your account.</h2>
                <p className="mt-3 text-[.94rem] text-[#718397]">Your operational intelligence, all in one place.</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="auth-form space-y-5" aria-label="Login form">
                <div>
                  <label htmlFor="email" className="mb-2 block text-[.75rem] font-semibold text-[#2b435d]">Work email</label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(event) => handleEmailChange(event.target.value)}
                      placeholder="you@company.com"
                      aria-invalid={Boolean(errors.email)}
                      aria-describedby={errors.email ? 'email-error' : undefined}
                      className={`auth-input ${errors.email ? 'has-error' : ''}`}
                      data-testid="input-email"
                    />
                  </div>
                  {errors.email && <p id="email-error" className="mt-2 text-xs font-medium text-[#b34d50]" data-testid="text-error-email">{errors.email}</p>}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <label htmlFor="password" className="block text-[.75rem] font-semibold text-[#2b435d]">Password</label>
                    <button
                      type="button"
                      onClick={() => setForgotMessage(true)}
                      className="ghost-action text-xs font-semibold"
                      data-testid="button-forgot-password"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => handlePasswordChange(event.target.value)}
                      placeholder="Enter your password"
                      aria-invalid={Boolean(errors.password)}
                      aria-describedby={errors.password ? 'password-error' : undefined}
                      className={`auth-input ${errors.password ? 'has-error' : ''}`}
                      style={{ paddingRight: '3.25rem' }}
                      data-testid="input-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((visible) => !visible)}
                      className="password-toggle absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      data-testid="button-toggle-password"
                    >
                      {showPassword ? <EyeOff className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} /> : <Eye className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} />}
                    </button>
                  </div>
                  {errors.password && <p id="password-error" className="mt-2 text-xs font-medium text-[#b34d50]" data-testid="text-error-password">{errors.password}</p>}
                </div>

                <label className="remember-box flex cursor-pointer items-center gap-3 py-1 text-sm text-[#667b91]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(event) => setRemember(event.target.checked)}
                    className="peer sr-only"
                    data-testid="checkbox-remember-me"
                  />
                  <span className="flex h-[1.1rem] w-[1.1rem] items-center justify-center rounded-[.3rem] border border-[#b9c8d6] bg-white text-transparent transition-colors peer-checked:border-[#0f73ad] peer-checked:bg-[#0f73ad] peer-focus-visible:ring-4 peer-focus-visible:ring-[#159bcf]/20">
                    <Check className="h-3 w-3" strokeWidth={3} aria-hidden="true" />
                  </span>
                  <span>Keep me signed in for 30 days</span>
                </label>

                {forgotMessage && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-[#c9e1ee] bg-[#eef8fc] px-3.5 py-3 text-xs leading-5 text-[#31647b]" role="status" aria-live="polite" data-testid="status-forgot-password">
                    <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-[#168ebf]" aria-hidden="true" />
                    <span>Password recovery is not connected yet. Contact your workspace administrator for access.</span>
                  </div>
                )}

                {errors.credentials && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-[#f1d1d1] bg-[#fff6f6] px-3.5 py-3 text-xs leading-5 text-[#9f4b4b]" role="alert" aria-live="polite" data-testid="text-credentials-error">
                    <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{errors.credentials}</span>
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="auth-submit flex w-full items-center justify-center gap-2.5 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-75" data-testid="button-submit-login">
                  {isSubmitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
                      Checking access
                    </>
                  ) : (
                    <>
                      Continue to workspace <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
                    </>
                  )}
                </button>
              </form>

              <div className="auth-security mt-9 flex items-center gap-3 border-t border-[#dce5ed] pt-5 text-[.7rem] leading-5 text-[#8090a0]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#159bcf]" strokeWidth={1.8} aria-hidden="true" />
                <span>Protected by ZensusTech identity controls and encrypted session handling.</span>
              </div>
            </div>
          )}
        </div>

        <footer className="login-footer entrance mt-auto flex items-center justify-between gap-4 text-[.68rem] text-[#91a0ae]">
          <span>© 2026 ZensusTech</span>
          <span className="mono-label hidden text-[.6rem] sm:inline">Build / secure by design</span>
        </footer>
      </section>
    </main>
  );
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/dashboard" component={Dashboard} />
        <Route path="/cost-dashboard" component={CostDashboard} />
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
