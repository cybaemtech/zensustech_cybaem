import { type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import { useEffect } from 'react';

// Modular Separate Pages per User Architecture Request
import { LoginPage } from '@/pages/login';
import { TenantPage } from '@/pages/tent';
import Dashboard from '@/pages/dashboard';
import { Microsoft0365Page } from '@/pages/microsoft0365';
import { DatabasePage } from '@/pages/database';
import CostDashboard from '@/pages/CostDashboard';
import NotFound from '@/pages/not-found';
import { OtpVerifyPage } from '@/pages/otp-verify';

const queryClient = new QueryClient();

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const [, setLocation] = useLocation();
  // Check both old Azure-token-based auth AND new email/password session auth
  // zt_session alone is sufficient after email/password sign-in
  const isAuthenticated =
    sessionStorage.getItem('is_authenticated') === 'true' &&
    Boolean(
      sessionStorage.getItem('zt_session') ||
      sessionStorage.getItem('graph_token') ||
      sessionStorage.getItem('mgmt_token')
    );

  useEffect(() => {
    if (!isAuthenticated) {
      setLocation('/');
    }
  }, [isAuthenticated, setLocation]);

  if (!isAuthenticated) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#070b14] text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-sky-400 border-t-transparent" />
          <p className="text-xs text-slate-400">Verifying enterprise session authentication...</p>
        </div>
      </div>
    );
  }

  return <Component />;
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function Router() {
  return (
    <RoutedErrorBoundary>
      <Switch>
        {/* Login and Sign up page */}
        <Route path="/" component={() => <LoginPage initialMode="signin" />} />
        <Route path="/login" component={() => <LoginPage initialMode="signin" />} />
        <Route path="/signin" component={() => <LoginPage initialMode="signin" />} />
        <Route path="/signup" component={() => <LoginPage initialMode="signup" />} />

        {/* Tenant Verification Page (tent.tsx / tenant.tsx) */}
        <Route path="/tent" component={TenantPage} />
        <Route path="/tenant" component={TenantPage} />

        {/* OTP Verification Page */}
        <Route path="/otp-verify" component={OtpVerifyPage} />

        {/* /connect-tenant removed — all post-auth flows go to /tent */}

        {/* Main Dashboard (dashboard.tsx) */}
        <Route path="/dashboard">
          {() => <ProtectedRoute component={Dashboard} />}
        </Route>

        {/* Microsoft O365 Managed Services Page (microsoft0365.tsx / m365) */}
        <Route path="/microsoft0365">
          {() => <ProtectedRoute component={Microsoft0365Page} />}
        </Route>
        <Route path="/m365">
          {() => <ProtectedRoute component={Microsoft0365Page} />}
        </Route>

        {/* Database Connect Page (database.tsx) */}
        <Route path="/database">
          {() => <ProtectedRoute component={DatabasePage} />}
        </Route>

        {/* Cost & Billing Analytics Page */}
        <Route path="/cost-dashboard">
          {() => <ProtectedRoute component={CostDashboard} />}
        </Route>

        {/* 404 Fallback */}
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

export function App() {
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
