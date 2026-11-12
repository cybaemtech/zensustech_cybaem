/**
 * Auth API client — wraps all /api/v1/auth/* endpoints.
 * Stores session token in sessionStorage as fallback to HttpOnly cookie.
 */

const API_BASE = '/api/v1';

export interface AuthUser {
  id: number;
  full_name: string;
  email: string;
  role: string;
  email_verified: boolean;
  has_tenant: boolean;
  tenant?: Record<string, unknown> | null;
}

export interface SignupPayload {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  role?: string;
  phone?: string;
  organization?: string;
  customer?: string;
  vendor_code?: string;
}

export interface SignupResult {
  message: string;
  email: string;
  needs_verification: boolean;
}

export interface LoginResult {
  message: string;
  user?: AuthUser;
  has_tenant?: boolean;
  needs_tenant?: boolean;
  needs_verification?: boolean;
  redirect?: string;
  session_token?: string;
  tenant?: {
    tenant_id: string;
    client_id?: string;
    tenant_name?: string;
    provider_name?: string;
  } | null;
  tokens?: {
    graph_token?: string | null;
    mgmt_token?: string | null;
  } | null;
}

function getSessionToken(): string | null {
  return sessionStorage.getItem('zt_session');
}

function setSessionToken(token: string | null) {
  if (token) {
    sessionStorage.setItem('zt_session', token);
  } else {
    sessionStorage.removeItem('zt_session');
  }
}

async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getSessionToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['X-ZT-Session'] = token;

  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data?.detail || `API error ${res.status}`);
  }
  return data;
}

export async function signup(payload: SignupPayload): Promise<SignupResult> {
  return apiFetch('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function login(email: string, password: string): Promise<LoginResult> {
  const data: LoginResult = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  if (data.session_token) setSessionToken(data.session_token);
  return data;
}

export async function verifyOtp(email: string, otp: string): Promise<LoginResult> {
  const data: LoginResult = await apiFetch('/auth/verify-email', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  });
  if (data.session_token) setSessionToken(data.session_token);
  return data;
}

export async function resendOtp(email: string): Promise<{ message: string }> {
  return apiFetch('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(email: string, otp: string, new_password: string): Promise<{ message: string }> {
  return apiFetch('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ email, otp, new_password }),
  });
}

export async function logout(): Promise<void> {
  try {
    await apiFetch('/auth/logout', { method: 'POST' });
  } finally {
    setSessionToken(null);
    sessionStorage.clear();
  }
}

export async function getMe(): Promise<AuthUser> {
  return apiFetch('/auth/me');
}

export interface HtmlEmailMessage {
  to: string;
  from: string;
  subject: string;
  html: string;
  text: string;
  otp: string;
  created_at: string;
  delivery_status?: string;
  delivery_method?: string;
}

export async function getLatestEmail(email: string): Promise<HtmlEmailMessage> {
  return apiFetch(`/auth/latest-email?email=${encodeURIComponent(email)}`);
}

export function clearSession() {
  setSessionToken(null);
  sessionStorage.clear();
}
