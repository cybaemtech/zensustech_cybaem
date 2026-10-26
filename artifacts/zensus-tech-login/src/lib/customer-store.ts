/**
 * Customer & Multi-Tenant Store
 * Implements the client's hierarchy:
 * Client -> Customer (Domain ID) -> Tenant ID -> Category [Office 365, Azure]
 *   Office 365 -> (30) Starter [100 / Bronze], (15) Business [200 / Silver], (5) Premium [500 / Gold]
 *   Azure -> Subscription ID(s)
 *
 * All customer data is fetched dynamically from live sessions / Microsoft Graph API.
 * No hardcoded customer values.
 */

export interface O365Package {
  name: string;
  seats: number;
  unitPrice: number;
  tier: 'Bronze' | 'Silver' | 'Gold';
  tierColor: string;
  features: string[];
}

export interface AzureSubscriptionItem {
  subscriptionId: string;
  name: string;
  state: 'Enabled' | 'Disabled' | 'Suspended';
  resourceGroupsCount: number;
  monthlySpendUSD: number;
}

export interface CustomerData {
  id: string;
  name: string;
  domainId: string;
  tenantId: string;
  clientId?: string;
  phone?: string;
  email?: string;
  planTier?: 'Bronze' | 'Silver' | 'Gold';
  licensesCount?: number;
  licenseExpDate?: string;
  categories: {
    office365: {
      enabled: boolean;
      tier: 'Bronze' | 'Silver' | 'Gold';
      packages: {
        starter: O365Package;
        business: O365Package;
        premium: O365Package;
      };
    };
    azure: {
      enabled: boolean;
      subscriptions: AzureSubscriptionItem[];
    };
  };
}

// ─── Default package template (structure only, seats from live data) ────────
function makeDefaultPackages(): CustomerData['categories']['office365']['packages'] {
  return {
    starter: {
      name: 'Starter Plan',
      seats: 0,
      unitPrice: 100,
      tier: 'Bronze',
      tierColor: '#cd7f32',
      features: ['Web Office Apps', 'Exchange Online 50GB', 'OneDrive 1TB', 'Teams Basic'],
    },
    business: {
      name: 'Business Plan',
      seats: 0,
      unitPrice: 200,
      tier: 'Silver',
      tierColor: '#94a3b8',
      features: ['Desktop Office Apps', 'SharePoint Online', 'Teams Standard', 'Standard Compliance'],
    },
    premium: {
      name: 'Premium Plan',
      seats: 0,
      unitPrice: 500,
      tier: 'Gold',
      tierColor: '#eab308',
      features: ['Intune Endpoint Management', 'Defender for Business', 'Entra ID P1', 'Zero Trust Protection'],
    },
  };
}

// ─── Build CustomerData from a raw session/API entry (no hardcoded values) ──
export function buildCustomerFromSession(raw: any, index: number): CustomerData {
  const tenantId = raw.tenantId || raw.tenant_id || '';
  const clientId = raw.clientId || raw.client_id || '';
  const org = raw.organization || {};
  const displayName = org.displayName || org.display_name || raw.displayName || '';
  const domainId = org.primaryDomain || org.primary_domain || tenantId;
  const phone = org.phone_number || (Array.isArray(org.businessPhones) ? org.businessPhones[0] : '') || '';
  const email = org.email || (Array.isArray(org.technicalNotificationMails) ? org.technicalNotificationMails[0] : '') || '';
  const licenseExpDate = org.license_exp_date || org.licenseExpDate || raw.licenseExpDate || '';
  const licensesCount = typeof org.licensesCount === 'number' ? org.licensesCount : (raw.licensesCount || 0);
  const planTier = (raw.planTier || 'Bronze') as 'Bronze' | 'Silver' | 'Gold';

  const subs: AzureSubscriptionItem[] = (raw.subscriptions || []).map((s: any) => ({
    subscriptionId: s.subscriptionId || s.id || '',
    name: s.displayName || s.name || 'Azure Subscription',
    state: (s.state || 'Enabled') as 'Enabled' | 'Disabled' | 'Suspended',
    resourceGroupsCount: s.resourceGroupsCount || 0,
    monthlySpendUSD: s.monthlySpendUSD || 0,
  }));

  const label = displayName ? `Customer #${index + 1} (${displayName})` : `Customer #${index + 1}`;

  return {
    id: `cust-${tenantId || index + 1}`,
    name: label,
    domainId,
    tenantId,
    clientId,
    phone,
    email,
    planTier,
    licensesCount,
    licenseExpDate,
    categories: {
      office365: {
        enabled: true,
        tier: planTier,
        packages: makeDefaultPackages(),
      },
      azure: {
        enabled: subs.length > 0,
        subscriptions: subs,
      },
    },
  };
}

// ─── In-memory dynamic customer list (populated via API) ───────────────────
let _dynamicCustomers: CustomerData[] = [];
let _customersLoaded = false;

// Seed immediately from sessionStorage so getActiveCustomer() never returns
// null during the first render when a user is already logged in.
(function seedFromSession() {
  if (typeof window === 'undefined') return;
  const tenantId = sessionStorage.getItem('azure_tenant_id') || '';
  const clientId = sessionStorage.getItem('azure_client_id') || '';
  if (tenantId && _dynamicCustomers.length === 0) {
    let org: any = {};
    try {
      const raw = sessionStorage.getItem('azure_org_details');
      if (raw) org = JSON.parse(raw);
    } catch {}
    _dynamicCustomers = [buildCustomerFromSession({ tenantId, clientId, organization: org }, 0)];
  }
})();

/** Returns the currently loaded customers (may be empty before fetch completes). */
export function getDynamicCustomers(): CustomerData[] {
  return _dynamicCustomers;
}

/** Fetch customers from the live /api/v1/customers endpoint and populate store. */
export async function loadCustomersFromAPI(): Promise<CustomerData[]> {
  try {
    const res = await fetch('/api/v1/customers');
    if (res.ok) {
      const data = await res.json();
      const rawList: any[] = Array.isArray(data.customers) ? data.customers : [];
      if (rawList.length > 0) {
        _dynamicCustomers = rawList.map((raw, idx) => buildCustomerFromSession(raw, idx));
        _customersLoaded = true;
        if (!sessionStorage.getItem(CUSTOMER_STORAGE_KEY) && _dynamicCustomers.length > 0) {
          sessionStorage.setItem(CUSTOMER_STORAGE_KEY, _dynamicCustomers[0].id);
          sessionStorage.setItem('azure_tenant_id', _dynamicCustomers[0].tenantId);
        }
        window.dispatchEvent(new CustomEvent('zensustech_customers_loaded', { detail: _dynamicCustomers }));
        return _dynamicCustomers;
      }
    }
  } catch (e) {
    console.warn('[customer-store] Failed to load customers from API:', e);
  }

  // Fallback: build from current session tenant only
  const tenantId = sessionStorage.getItem('azure_tenant_id') || '';
  const clientId = sessionStorage.getItem('azure_client_id') || '';
  if (tenantId) {
    const fallback = buildCustomerFromSession({ tenantId, clientId }, 0);
    _dynamicCustomers = [fallback];
    _customersLoaded = true;
    window.dispatchEvent(new CustomEvent('zensustech_customers_loaded', { detail: _dynamicCustomers }));
  }
  return _dynamicCustomers;
}

export function isCustomersLoaded(): boolean {
  return _customersLoaded;
}

// ─── Storage keys ────────────────────────────────────────────────────────────
export type CategoryType = 'office365' | 'azure';
const CUSTOMER_STORAGE_KEY = 'zensustech_active_customer_id';
const CATEGORY_STORAGE_KEY = 'zensustech_active_category';

// ─── Active customer helpers ──────────────────────────────────────────────────
export function getActiveCustomerId(): string {
  if (typeof window === 'undefined') return _dynamicCustomers[0]?.id || '';
  return sessionStorage.getItem(CUSTOMER_STORAGE_KEY) || _dynamicCustomers[0]?.id || '';
}

export function setActiveCustomerId(id: string): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CUSTOMER_STORAGE_KEY, id);
  const cust = _dynamicCustomers.find(c => c.id === id) || _dynamicCustomers[0];
  if (cust) {
    sessionStorage.setItem('azure_tenant_id', cust.tenantId);
    window.dispatchEvent(new CustomEvent('zensustech_customer_changed', { detail: cust }));
  }
}

export function getActiveCustomer(): CustomerData | null {
  const id = getActiveCustomerId();
  return _dynamicCustomers.find(c => c.id === id) || _dynamicCustomers[0] || null;
}

export function getActiveCategory(): CategoryType {
  if (typeof window === 'undefined') return 'office365';
  return (sessionStorage.getItem(CATEGORY_STORAGE_KEY) as CategoryType) || 'office365';
}

export function setActiveCategory(category: CategoryType): void {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(CATEGORY_STORAGE_KEY, category);
  window.dispatchEvent(new CustomEvent('zensustech_category_changed', { detail: category }));
}
