import { useState, type FormEvent, type ReactNode } from "react";
import { ArrowRight, CircleHelp, Eye, EyeOff, LockKeyhole, LogOut, ShieldCheck } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useAuth } from "@workspace/replit-auth-web";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Route, Switch, useLocation, Router as WouterRouter } from "wouter";

const queryClient = new QueryClient();

type Status = "idle" | "submitting" | "verified";

function StatusMessage({
  children,
  tone = "error",
  testId,
}: {
  children: ReactNode;
  tone?: "error" | "info" | "success";
  testId: string;
}) {
  const styles = {
    error: "border-[#f1d1d1] bg-[#fff6f6] text-[#9f4b4b]",
    info: "border-[#c9e1ee] bg-[#eef8fc] text-[#31647b]",
    success: "border-[#cbe4e3] bg-[#f0fbf8] text-[#176d65]",
  };

  return (
    <div className={`flex items-start gap-2.5 rounded-lg border px-3.5 py-3 text-xs leading-5 ${styles[tone]}`} role={tone === "error" ? "alert" : "status"} aria-live="polite" data-testid={testId}>
      <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}

function AzureVerification({
  onExpired,
  onVerified,
}: {
  onExpired: () => void;
  onVerified: () => void;
}) {
  const [tenantId, setTenantId] = useState("");
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantId.trim() || !clientId.trim() || !clientSecret.trim()) {
      setError("Enter all three Azure connection values to continue.");
      return;
    }

    setError("");
    setStatus("submitting");
    try {
      const response = await fetch("/api/auth/azure-config", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, clientId, clientSecret }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (response.status === 401) {
        setClientSecret("");
        setStatus("idle");
        onExpired();
        return;
      }
      if (!response.ok) {
        throw new Error(data.error ?? "We could not verify this Azure connection.");
      }

      setClientSecret("");
      setStatus("verified");
      onVerified();
    } catch (cause) {
      setStatus("idle");
      setError(cause instanceof Error ? cause.message : "We could not verify this Azure connection.");
    }
  };

  if (status === "verified") {
    return (
      <div className="entrance entrance-delay-1 rounded-[1.2rem] border border-[#cbe4e3] bg-white p-7 shadow-[0_20px_60px_rgba(26,59,91,.1)] sm:p-9" data-testid="status-login-success" role="status" aria-live="polite">
        <div className="success-mark flex h-12 w-12 items-center justify-center rounded-full">
          <ShieldCheck className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <p className="mono-label mt-7 text-[.67rem] font-medium text-[#0d73aa]">Connection verified</p>
        <h2 className="mt-3 font-['Space_Grotesk'] text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-[-.06em] text-[#162a44]">You’re all set.</h2>
        <p className="mt-3 text-[.94rem] leading-6 text-[#718397]">Your Azure connection was verified securely on the server. The client secret was not stored.</p>
        <button type="button" onClick={() => window.location.reload()} className="ghost-action mt-8 flex items-center gap-2 text-sm font-semibold" data-testid="button-return-login">
          Verify another connection <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <div className="entrance entrance-delay-1">
      <div className="auth-intro mb-9">
        <p className="mono-label text-[.67rem] font-medium text-[#0d73aa]">Step 2 of 2 · Azure verification</p>
        <h2 className="mt-3 font-['Space_Grotesk'] text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-[-.06em] text-[#162a44]">Connect your tenant.</h2>
        <p className="mt-3 text-[.94rem] text-[#718397]">Verify the Azure connection for your ZenAI Ops workspace.</p>
      </div>

      <form onSubmit={submit} noValidate className="auth-form space-y-5" aria-label="Azure verification form">
        <div>
          <label htmlFor="tenant-id" className="mb-2 block text-[.75rem] font-semibold text-[#2b435d]">Tenant ID</label>
          <input id="tenant-id" name="tenantId" type="text" autoComplete="off" value={tenantId} onChange={(event) => { setTenantId(event.target.value); setError(""); }} placeholder="Enter tenant ID" className="auth-input" data-testid="input-tenant-id" />
        </div>
        <div>
          <label htmlFor="client-id" className="mb-2 block text-[.75rem] font-semibold text-[#2b435d]">Client ID</label>
          <input id="client-id" name="clientId" type="text" autoComplete="off" value={clientId} onChange={(event) => { setClientId(event.target.value); setError(""); }} placeholder="Enter client ID" className="auth-input" data-testid="input-client-id" />
        </div>
        <div>
          <label htmlFor="client-secret" className="mb-2 block text-[.75rem] font-semibold text-[#2b435d]">Client secret</label>
          <div className="relative">
            <input id="client-secret" name="clientSecret" type={showClientSecret ? "text" : "password"} autoComplete="new-password" spellCheck={false} value={clientSecret} onChange={(event) => { setClientSecret(event.target.value); setError(""); }} placeholder="Enter client secret" className="auth-input pr-12" data-testid="input-client-secret" />
            <button type="button" onClick={() => setShowClientSecret((visible) => !visible)} className="password-toggle absolute right-1.5 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg" aria-label={showClientSecret ? "Hide client secret" : "Show client secret"} aria-pressed={showClientSecret} data-testid="button-toggle-client-secret">
              {showClientSecret ? <EyeOff className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} /> : <Eye className="h-[1.05rem] w-[1.05rem]" strokeWidth={1.8} />}
            </button>
          </div>
        </div>

        {error && <StatusMessage testId="text-verification-error">{error}</StatusMessage>}
        <button type="submit" disabled={status === "submitting"} className="auth-submit flex w-full items-center justify-center gap-2.5 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-75" data-testid="button-verify-azure">
          {status === "submitting" ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" /> Verifying connection</> : <>Verify and continue <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" /></>}
        </button>
      </form>

      <div className="auth-security mt-9 flex items-center gap-3 border-t border-[#dce5ed] pt-5 text-[.7rem] leading-5 text-[#8090a0]">
        <ShieldCheck className="h-4 w-4 shrink-0 text-[#159bcf]" strokeWidth={1.8} aria-hidden="true" />
        <span>Connection values are sent over HTTPS to the secure server and are never saved in this browser.</span>
      </div>
    </div>
  );
}

function Home() {
  const { user, isLoading, isAuthenticated, error: authError, login, logout } = useAuth();
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isVerified, setIsVerified] = useState(false);

  return (
    <main className="login-shell flex min-h-[100dvh] flex-col lg:flex-row">
      <section className="brand-rail flex min-h-[24rem] flex-1 flex-col justify-start px-6 py-7 text-white sm:px-10 lg:min-h-[100dvh] lg:max-w-[47%] lg:px-[clamp(2.5rem,6vw,7rem)] lg:py-10">
        <div className="entrance flex items-center gap-3 text-[.78rem] font-semibold tracking-[.12em]">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/20 bg-white/10"><LockKeyhole className="h-4 w-4" strokeWidth={1.8} /></div>
          <span>ZENSUSTECH</span>
        </div>
        <div className="brand-copy entrance entrance-delay-1 mt-auto mb-auto max-w-[32rem] py-16">
          <p className="mono-label text-[.7rem] text-[#8edbea]">Identity-first access</p>
          <h1 className="mt-5 max-w-[26rem] font-['Space_Grotesk'] text-[clamp(2.7rem,6vw,5.6rem)] font-semibold leading-[.95] tracking-[-.075em]">Operate with clarity.</h1>
          <p className="mt-7 max-w-[25rem] text-[.95rem] leading-7 text-[#a9c1d5]">A secure workspace for the teams shaping what comes next.</p>
        </div>
        <div className="entrance entrance-delay-2 flex items-center gap-3 text-[.72rem] text-[#8faec4]"><span className="status-dot" aria-hidden="true" /> Encrypted workspace access</div>
      </section>

      <section className="auth-panel flex flex-1 flex-col justify-start bg-[#f4f7fa] px-6 py-7 sm:px-10 lg:max-w-[53%] lg:px-[clamp(2.5rem,8vw,10rem)] lg:py-10" aria-label="Sign in">
        <header className="auth-header entrance flex items-center justify-between">
          <div className="flex items-center gap-2 text-[.7rem] text-[#8090a0]"><ShieldCheck className="h-4 w-4 text-[#159bcf]" strokeWidth={1.8} /><span className="mono-label">Encrypted session</span></div>
          {isAuthenticated && <button type="button" onClick={logout} className="ghost-action flex items-center gap-2 text-xs font-semibold" data-testid="button-logout"><LogOut className="h-3.5 w-3.5" /> Sign out</button>}
        </header>

        <div className="auth-content mx-auto mt-[clamp(3rem,8vh,5.5rem)] w-full max-w-[27rem] py-12 lg:py-4">
          {isLoading ? (
            <div className="entrance rounded-[1.2rem] border border-[#dce5ed] bg-white p-7 shadow-[0_20px_60px_rgba(26,59,91,.07)] sm:p-9" role="status" aria-live="polite" data-testid="status-session-loading">
              <span className="mb-6 block h-8 w-8 animate-spin rounded-full border-2 border-[#c8d7e3] border-t-[#0f73ad]" aria-hidden="true" />
              <p className="mono-label text-[.67rem] font-medium text-[#0d73aa]">Secure session</p>
              <h2 className="mt-3 font-['Space_Grotesk'] text-3xl font-semibold tracking-[-.06em] text-[#162a44]">Checking access.</h2>
              <p className="mt-3 text-[.94rem] text-[#718397]">Confirming your workspace identity.</p>
            </div>
          ) : !isAuthenticated ? (
            <div className="entrance entrance-delay-1">
              <div className="auth-intro mb-9">
                <p className="mono-label text-[.67rem] font-medium text-[#0d73aa]">Welcome to ZenAI Ops</p>
                <h2 className="mt-3 font-['Space_Grotesk'] text-[clamp(2rem,4vw,2.8rem)] font-semibold tracking-[-.06em] text-[#162a44]">Sign in to your account.</h2>
                <p className="mt-3 text-[.94rem] text-[#718397]">Use your managed workspace identity to continue.</p>
              </div>
              {(authError || sessionExpired) && <StatusMessage testId="text-auth-error">{sessionExpired ? "Your secure session expired. Sign in again to continue." : authError}</StatusMessage>}
              <button type="button" onClick={login} className="auth-submit mt-7 flex w-full items-center justify-center gap-2.5 px-5 text-sm font-semibold" data-testid="button-submit-login">
                Continue with workspace identity <ArrowRight className="h-4 w-4" strokeWidth={2.2} aria-hidden="true" />
              </button>
              <div className="auth-security mt-9 flex items-center gap-3 border-t border-[#dce5ed] pt-5 text-[.7rem] leading-5 text-[#8090a0]">
                <ShieldCheck className="h-4 w-4 shrink-0 text-[#159bcf]" strokeWidth={1.8} aria-hidden="true" />
                <span>Protected by ZensusTech identity controls and encrypted session handling.</span>
              </div>
            </div>
          ) : (
            <>
              {sessionExpired && <StatusMessage testId="text-session-expired">Your secure session expired. Sign in again to continue.</StatusMessage>}
              {!sessionExpired && !isVerified && <p className="mb-7 text-xs text-[#718397]" data-testid="text-authenticated-user">Signed in as {user?.email ?? "workspace member"}.</p>}
              {sessionExpired ? (
                <button type="button" onClick={login} className="auth-submit mt-7 flex w-full items-center justify-center gap-2.5 px-5 text-sm font-semibold" data-testid="button-re-authenticate">Sign in again <ArrowRight className="h-4 w-4" /></button>
              ) : (
                <AzureVerification onExpired={() => setSessionExpired(true)} onVerified={() => setIsVerified(true)} />
              )}
            </>
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
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;