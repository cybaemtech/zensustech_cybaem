import { useState, type FormEvent, type ReactNode } from 'react';
import { Check, Eye, EyeOff, LockKeyhole, ShieldCheck, ArrowRight, CircleHelp } from 'lucide-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient();
const DEMO_EMAIL = 'admin@zentech.com';
const DEMO_PASSWORD = 'admin 123';

type FieldErrors = {
  email?: string;
  password?: string;
  credentials?: string;
};

function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [forgotMessage, setForgotMessage] = useState(false);
  const [tenantId, setTenantId] = useState('');
  const [clientId, setClientId] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [verificationError, setVerificationError] = useState('');

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
    window.setTimeout(() => {
      setIsSubmitting(false);
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

  const handleVerificationSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tenantId.trim() || !clientId.trim() || !clientSecret.trim()) {
      setVerificationError('Enter all three Azure connection values to continue.');
      return;
    }

    setVerificationError('');
    setIsSubmitting(true);
    window.setTimeout(() => {
      setIsSubmitting(false);
      setShowVerification(false);
      setIsSuccess(true);
    }, 850);
  };

  return (
    <main className="login-shell flex min-h-[100dvh] flex-col lg:flex-row">
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

      <section className="auth-panel flex flex-1 flex-col justify-start bg-[#f4f7fa] px-6 py-7 sm:px-10 lg:max-w-[53%] lg:px-[clamp(2.5rem,8vw,10rem)] lg:py-10" aria-label="Sign in">
        <header className="auth-header entrance flex items-center justify-end">
          <div className="flex items-center gap-2 text-[.68rem] font-semibold text-[#65788c]">
            <LockKeyhole className="h-3.5 w-3.5 text-[#159bcf]" strokeWidth={2} aria-hidden="true" />
            <span className="mono-label">Encrypted session</span>
          </div>
        </header>

        <div className="auth-content mx-auto mt-[clamp(3rem,8vh,5.5rem)] w-full max-w-[27rem] py-12 lg:py-4">
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
              <button
                type="button"
                onClick={() => setIsSuccess(false)}
                className="ghost-action mt-7 inline-flex items-center gap-2 text-sm font-semibold"
                data-testid="button-return-login"
              >
                Return to sign in <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
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
                      }}
                      placeholder="Enter client secret"
                      className="auth-input pr-12"
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

                {verificationError && (
                  <div className="flex items-start gap-2.5 rounded-lg border border-[#f1d1d1] bg-[#fff6f6] px-3.5 py-3 text-xs leading-5 text-[#9f4b4b]" role="alert" aria-live="polite" data-testid="text-verification-error">
                    <CircleHelp className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{verificationError}</span>
                  </div>
                )}

                <button type="submit" disabled={isSubmitting} className="auth-submit flex w-full items-center justify-center gap-2.5 px-5 text-sm font-semibold disabled:cursor-wait disabled:opacity-75" data-testid="button-verify-azure">
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
                <span>Demo verification only. Values stay in this browser and are not sent to Azure.</span>
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
                      className={`auth-input pr-12 ${errors.password ? 'has-error' : ''}`}
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