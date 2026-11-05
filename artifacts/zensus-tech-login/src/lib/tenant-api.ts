


/**
 * Tenant API client — wraps all /api/v1/tenants/* endpoints.
 */

const API_BASE = '/api/v1';

export interface TenantConnectPayload {
  tenant_id: string;
  tenant_name?: string;
  provider_type: 'cloud' | 'office365';
  provider_name?: 'azure' | 'gcp' | 'aws' | 'native_cloud' | '';
  subscription_plan: 'Trial' | 'Bronze' | 'Silver' | 'Gold';
}

export interface Tenant {
  id: number;
  tenant_id: string;
  tenant_name: string;
  provider_type: string;
  provider_name: string;
  subscription_plan: string;
  connection_status: string;
  created_at: string;
  updated_at: string;
}

function getSessionToken(): string | null {
  return sessionStorage.getItem('zt_session');
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
  if (!res.ok) throw new Error(data?.detail || `API error ${res.status}`);
  return data;
}

export async function connectTenant(payload: TenantConnectPayload): Promise<{ message: string; redirect: string }> {
  return apiFetch('/tenants/connect', { method: 'POST', body: JSON.stringify(payload) });
}

export async function getMyTenants(): Promise<{ tenants: Tenant[] }> {
  return apiFetch('/tenants/my-tenants');
}

export async function getTenant(tenantDbId: number): Promise<Tenant> {
  return apiFetch(`/tenants/${tenantDbId}`);
}

export async function reconnectTenant(tenantDbId: number): Promise<{ message: string; redirect: string }> {
  return apiFetch(`/tenants/${tenantDbId}/reconnect`, { method: 'POST' });
}

