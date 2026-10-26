import { useState, useEffect } from 'react';
import {
  Building2,
  Globe,
  ChevronDown,
  Check,
  Copy,
  ArrowRight,
} from 'lucide-react';
import {
  getDynamicCustomers,
  loadCustomersFromAPI,
  getActiveCustomer,
  setActiveCustomerId,
  getActiveCategory,
  setActiveCategory,
  type CustomerData,
  type CategoryType
} from '@/lib/customer-store';

interface CustomerCategorySwitcherProps {
  onCategorySelect?: (category: CategoryType) => void;
  onCustomerSelect?: (customer: CustomerData) => void;
}

export function CustomerCategorySwitcher({
  onCategorySelect,
  onCustomerSelect
}: CustomerCategorySwitcherProps) {
  const [customers, setCustomers] = useState<CustomerData[]>(getDynamicCustomers);
  const [currentCustomer, setCurrentCustomer] = useState<CustomerData | null>(getActiveCustomer);
  const [currentCategory, setCurrentCategory] = useState<CategoryType>(getActiveCategory);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copiedTenant, setCopiedTenant] = useState(false);

  useEffect(() => {
    loadCustomersFromAPI().then(list => {
      setCustomers(list);
      const active = getActiveCustomer();
      if (active) setCurrentCustomer(active);
    });

    const handleCustChange = (e: any) => { if (e.detail) setCurrentCustomer(e.detail); };
    const handleCatChange = (e: any) => { setCurrentCategory(e.detail); };
    const handleCustomersLoaded = (e: any) => {
      setCustomers(e.detail || []);
      const active = getActiveCustomer();
      if (active) setCurrentCustomer(active);
    };

    window.addEventListener('zensustech_customer_changed', handleCustChange);
    window.addEventListener('zensustech_category_changed', handleCatChange);
    window.addEventListener('zensustech_customers_loaded', handleCustomersLoaded);
    return () => {
      window.removeEventListener('zensustech_customer_changed', handleCustChange);
      window.removeEventListener('zensustech_category_changed', handleCatChange);
      window.removeEventListener('zensustech_customers_loaded', handleCustomersLoaded);
    };
  }, []);

  const handleSelectCustomer = (cust: CustomerData) => {
    setActiveCustomerId(cust.id);
    setCurrentCustomer(cust);
    setDropdownOpen(false);
    if (onCustomerSelect) onCustomerSelect(cust);
  };

  const handleSelectCategory = (cat: CategoryType) => {
    setActiveCategory(cat);
    setCurrentCategory(cat);
    if (onCategorySelect) onCategorySelect(cat);
  };

  const handleCopyTenant = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCustomer) return;
    navigator.clipboard.writeText(currentCustomer.tenantId);
    setCopiedTenant(true);
    setTimeout(() => setCopiedTenant(false), 2000);
  };

  if (!currentCustomer) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 bg-white border-b border-slate-200/90 px-4 sm:px-6 py-2.5 shadow-xs">
      {/* Left: Customer switcher + Domain -> Tenant badge */}
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-300/80 bg-slate-50 hover:bg-slate-100/90 text-slate-800 text-xs font-semibold transition-all shadow-2xs hover:border-slate-400"
          >
            <Building2 className="h-3.5 w-3.5 text-sky-600" />
            <span className="font-bold text-slate-900">{currentCustomer.name}</span>
            <ChevronDown className={`h-3 w-3 text-slate-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />
              <div className="absolute left-0 mt-1.5 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2.5 py-1.5 border-b border-slate-100 mb-1">
                  <p className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-400">
                    Switch Customer (Multi-Tenant)
                  </p>
                </div>
                <div className="space-y-1">
                  {customers.filter(Boolean).map((cust) => {
                    const isSelected = currentCustomer ? cust.id === currentCustomer.id : false;
                    return (
                      <button
                        key={cust.id}
                        onClick={() => handleSelectCustomer(cust)}
                        className={`w-full text-left p-2.5 rounded-lg text-xs transition-all flex items-start justify-between ${
                          isSelected
                            ? 'bg-sky-50/80 border border-sky-200 text-sky-950 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-bold text-slate-800">{cust.name}</p>
                          <div className="flex items-center gap-2 text-[0.68rem] text-slate-500 mt-0.5">
                            <span className="flex items-center gap-1 font-mono text-sky-600">
                              <Globe className="h-2.5 w-2.5" />
                              {cust.domainId}
                            </span>
                            <span>•</span>
                            <span className="font-mono truncate max-w-[110px]" title={cust.tenantId}>
                              {cust.tenantId.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="h-4 w-4 text-sky-600 mt-0.5 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Domain -> Tenant ID badge */}
        <div className="hidden sm:flex items-center gap-1.5 text-xs bg-slate-100/90 px-2.5 py-1 rounded-lg border border-slate-200/80 text-slate-600">
          <span className="font-medium text-slate-500">Domain:</span>
          <span className="font-mono font-bold text-slate-800">{currentCustomer.domainId}</span>
          <ArrowRight className="h-3 w-3 text-slate-400" />
          <span className="font-medium text-slate-500">Tenant ID:</span>
          <span className="font-mono font-semibold text-slate-700 truncate max-w-[90px] md:max-w-[130px]">
            {currentCustomer.tenantId}
          </span>
          <button
            onClick={handleCopyTenant}
            className="p-0.5 hover:text-slate-900 text-slate-400 transition-colors"
            title="Copy Tenant ID"
          >
            {copiedTenant ? (
              <Check className="h-3 w-3 text-emerald-600" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </button>
        </div>
      </div>

    </div>
  );
}
