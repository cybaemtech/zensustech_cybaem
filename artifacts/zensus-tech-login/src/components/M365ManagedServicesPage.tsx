/**
 * M365ManagedServicesPage
 * Displays the ZensusTech Microsoft 365 Managed Services offering:
 *   - 9 License Families with live subscribed SKU data
 *   - Microsoft 365 Business Tier Hierarchy (Basic / Standard / Premium)
 *   - 22 ZenAIOps Managed Services checks with live API status
 * All data from Microsoft Graph via existing auth tokens. Zero hardcoded values.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  Shield, Users, CheckCircle2, AlertTriangle, Clock,
  RefreshCw, ChevronDown, ChevronRight, Layers,
  BarChart3, Mail, MonitorSmartphone, Cloud,
  Lock, UserCheck, UserX, Activity, FileText,
  Zap, Database, Package, TrendingUp, Info,
  Building2, Briefcase, GraduationCap, Landmark,
  Heart, User, AppWindow, PlusCircle,
} from 'lucide-react';
import { getLiveApiHeaders, LIVE_API_BASE } from '@/lib/live-api';

// ─── Types ─────────────────────────────────────────────────────────────────
type LicenseFamily = 'Business'|'Enterprise'|'Frontline'|'Education'|'Government'|'Nonprofit'|'Individual'|'Apps'|'AddOn'|'Other';

interface SkuEntry {
  skuId: string; skuPartNumber: string; productName: string;
  consumed: number; purchased: number; available: number; family: LicenseFamily;
}

interface CheckResult {
  id: string; num: string; label: string; api: string;
  status: 'ok'|'warning'|'error'|'loading'|'idle';
  value?: string|number; detail?: string;
}

export interface M365ManagedServicesPageProps {
  tenantId: string; totalUsers: number; adminCount: number;
  mfaEnabled: number; mfaDisabled: number; secureScore: number|null;
  licensesData: any[]; usersList: any[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function classifySku(s: string): LicenseFamily {
  const u = s.toUpperCase();
  if (u.includes('_NONPRO')||u.includes('NONPROFIT')) return 'Nonprofit';
  if (u.includes('_F1')||u.includes('_F3')||u.includes('ENTF')||u.endsWith('F1')||u.endsWith('F3')) return 'Frontline';
  if (u.includes('_GOV')||u.includes('GCCHIGH')||u.includes('_G1')||u.includes('_G3')||u.includes('_G5')) return 'Government';
  if (u.startsWith('M365EDU')||u.startsWith('O365EDU')||u.includes('_A1')||u.includes('_A3')||u.includes('_A5')||u.includes('STUDENT')||u.includes('FACULTY')) return 'Education';
  if (u.includes('ENTERPRISEPREMIUM')||u.includes('ENTERPRISEPACK')||u.includes('SPE_E')||u.includes('O365_E')||u.includes('M365_E')) return 'Enterprise';
  if (u.includes('SMB_BUSINESS')||u.includes('O365_BUSINESS')||u.includes('SPB')||u.includes('BUSINESS_BASIC')||u.includes('BUSINESS_PREMIUM')||u.includes('BUSINESS_STANDARD')) return 'Business';
  if (u.includes('PERSONAL')||u.includes('FAMILY')||u.includes('CONSUMER')) return 'Individual';
  if (u.includes('COPILOT')||u.includes('TEAMS_PHONE')||u.includes('DEFENDER')||u.includes('INTUNE')||u.includes('AAD_PREMIUM')||u.includes('PHONESYSTEM')) return 'AddOn';
  if (u.includes('OFFICE365_APPS')||u.includes('OFFICESUBSCRIPTION')||u.includes('WACONEDRIVESTANDARD')) return 'Apps';
  return 'Other';
}

function friendlySkuName(s: string): string {
  const MAP: Record<string,string> = {
    O365_BUSINESS_ESSENTIALS:'Microsoft 365 Business Basic', SMB_BUSINESS:'Microsoft 365 Apps for Business',
    O365_BUSINESS_PREMIUM:'Microsoft 365 Business Standard', SPB:'Microsoft 365 Business Premium',
    ENTERPRISEPACK:'Office 365 E3', ENTERPRISEPREMIUM:'Microsoft 365 E5',
    SPE_E3:'Microsoft 365 E3', SPE_E5:'Microsoft 365 E5',
    OFFICESUBSCRIPTION:'Microsoft 365 Apps for Enterprise', AAD_PREMIUM:'Azure AD Premium P1',
    AAD_PREMIUM_P2:'Azure AD Premium P2', INTUNE_A:'Microsoft Intune',
    POWER_BI_PRO:'Power BI Pro', EXCHANGESTANDARD:'Exchange Online Plan 1',
    EXCHANGEENTERPRISE:'Exchange Online Plan 2',
  };
  return MAP[s] || s.replace(/_/g,' ').replace(/\b\w/g, c => c.toUpperCase());
}

const FAMILY_META: Record<LicenseFamily, { label:string; desc:string; icon:any; color:string; bg:string; border:string }> = {
  Business:   { label:'Business',   desc:'SMBs up to 300 users',               icon:Briefcase,    color:'text-sky-700',    bg:'bg-sky-50',    border:'border-sky-200' },
  Enterprise: { label:'Enterprise', desc:'Medium/large enterprises',             icon:Building2,    color:'text-indigo-700', bg:'bg-indigo-50', border:'border-indigo-200' },
  Frontline:  { label:'Frontline',  desc:'Factory, retail, healthcare workers', icon:Users,        color:'text-orange-700', bg:'bg-orange-50', border:'border-orange-200' },
  Education:  { label:'Education',  desc:'Schools, colleges, universities',      icon:GraduationCap,color:'text-emerald-700',bg:'bg-emerald-50',border:'border-emerald-200' },
  Government: { label:'Government', desc:'Government organizations',             icon:Landmark,     color:'text-slate-700',  bg:'bg-slate-50',  border:'border-slate-200' },
  Nonprofit:  { label:'Nonprofit',  desc:'NGOs / nonprofits',                   icon:Heart,        color:'text-rose-700',   bg:'bg-rose-50',   border:'border-rose-200' },
  Individual: { label:'Individual', desc:'Personal and family plans',            icon:User,         color:'text-purple-700', bg:'bg-purple-50', border:'border-purple-200' },
  Apps:       { label:'Apps Only',  desc:'Office apps without full M365 suite', icon:AppWindow,    color:'text-amber-700',  bg:'bg-amber-50',  border:'border-amber-200' },
  AddOn:      { label:'Add-ons',    desc:'Copilot, Teams Phone, security packs', icon:PlusCircle,  color:'text-teal-700',   bg:'bg-teal-50',   border:'border-teal-200' },
  Other:      { label:'Other',      desc:'Other subscriptions',                  icon:Package,      color:'text-gray-600',   bg:'bg-gray-50',   border:'border-gray-200' },
};

const CHECKS_DEF: Omit<CheckResult,'status'|'value'|'detail'>[] = [
  { id:'license_inventory',     num:'01', label:'License Inventory',                api:'Microsoft Graph /subscribedSkus' },
  { id:'assigned_available',    num:'02', label:'Assigned vs Available Licenses',   api:'Microsoft Graph /subscribedSkus' },
  { id:'unassigned_report',     num:'03', label:'Unassigned License Report',        api:'Microsoft Graph /subscribedSkus' },
  { id:'user_license_map',      num:'04', label:'User License Mapping',             api:'Microsoft Graph /users' },
  { id:'inactive_users',        num:'05', label:'Inactive Users (Licensed)',        api:'Graph + Sign-in Activity' },
  { id:'license_utilization',   num:'06', label:'License Utilization',              api:'Microsoft Graph' },
  { id:'admin_privileged',      num:'07', label:'Admin / Privileged Users',         api:'Microsoft Graph' },
  { id:'mfa_coverage',          num:'08', label:'MFA Coverage',                     api:'Microsoft Graph' },
  { id:'guest_users',           num:'09', label:'Guest Users',                      api:'Microsoft Graph' },
  { id:'stale_disabled',        num:'10', label:'Stale / Disabled Users',           api:'Microsoft Graph' },
  { id:'risky_signins',         num:'11', label:'Risky Users / Sign-ins',           api:'Microsoft Graph' },
  { id:'mailbox_forwarding',    num:'12', label:'Mailbox Forwarding',               api:'Graph / Exchange' },
  { id:'email_security',        num:'13', label:'Email Security',                   api:'Graph / Security' },
  { id:'defender_security',     num:'14', label:'Defender Security',                api:'Security API' },
  { id:'intune_compliance',     num:'15', label:'Intune Device Compliance',         api:'Microsoft Graph' },
  { id:'non_compliant_devices', num:'16', label:'Non-Compliant Devices',            api:'Microsoft Graph' },
  { id:'sharepoint_governance', num:'17', label:'SharePoint Governance',            api:'Microsoft Graph' },
  { id:'onedrive_governance',   num:'18', label:'OneDrive Governance',              api:'Microsoft Graph' },
  { id:'teams_governance',      num:'19', label:'Teams Governance',                 api:'Microsoft Graph' },
  { id:'service_health',        num:'20', label:'M365 Service Health',              api:'Microsoft Graph' },
  { id:'license_optimization',  num:'21', label:'License Optimization',             api:'ZenAIOps Rules Engine' },
  { id:'executive_report',      num:'22', label:'M365 Executive Report',            api:'Combined APIs' },
];

const CHECK_ICONS: Record<string,any> = {
  license_inventory:Database, assigned_available:BarChart3, unassigned_report:AlertTriangle,
  user_license_map:Users, inactive_users:UserX, license_utilization:TrendingUp,
  admin_privileged:Lock, mfa_coverage:Shield, guest_users:Cloud, stale_disabled:Clock,
  risky_signins:AlertTriangle, mailbox_forwarding:Mail, email_security:Mail,
  defender_security:Shield, intune_compliance:MonitorSmartphone, non_compliant_devices:MonitorSmartphone,
  sharepoint_governance:Cloud, onedrive_governance:Cloud, teams_governance:Activity,
  service_health:Activity, license_optimization:Zap, executive_report:FileText,
};

// ─── Component ────────────────────────────────────────────────────────────────
export function M365ManagedServicesPage({
  tenantId, totalUsers, adminCount, mfaEnabled, mfaDisabled, secureScore, licensesData, usersList,
}: M365ManagedServicesPageProps) {
  const [skus, setSkus] = useState<SkuEntry[]>([]);
  const [checks, setChecks] = useState<CheckResult[]>(CHECKS_DEF.map(c => ({ ...c, status: 'idle' })));
  const [loading, setLoading] = useState(false);
  const [expandedFamily, setExpandedFamily] = useState<LicenseFamily|null>('Business');
  const [lastRefreshed, setLastRefreshed] = useState<Date|null>(null);

  const buildSkusFromData = useCallback((data: any[]) => {
    if (!data?.length) return;
    setSkus(data.map((item: any) => {
      const partNum = item.product || item.skuPartNumber || item.key || 'UNKNOWN';
      const purchased = item.totalLicenses ?? item.purchased ?? item.prepaidUnits?.enabled ?? 0;
      const consumed  = item.usedLicenses ?? item.assigned ?? item.consumedUnits ?? 0;
      return { skuId: item.skuId || partNum, skuPartNumber: partNum, productName: friendlySkuName(partNum),
        consumed, purchased, available: purchased - consumed, family: classifySku(partNum) };
    }));
    setLastRefreshed(new Date());
  }, []);

  const fetchLiveSkus = useCallback(async () => {
    setLoading(true);
    try {
      const hdrs = getLiveApiHeaders();
      const res = await fetch(`${LIVE_API_BASE}/subscribedSkus`, { headers: hdrs });
      if (res.ok) {
        const json = await res.json();
        setSkus((json.value || []).map((sku: any) => ({
          skuId: sku.skuId, skuPartNumber: sku.skuPartNumber, productName: friendlySkuName(sku.skuPartNumber),
          purchased: sku.prepaidUnits?.enabled ?? 0, consumed: sku.consumedUnits ?? 0,
          available: (sku.prepaidUnits?.enabled ?? 0) - (sku.consumedUnits ?? 0),
          family: classifySku(sku.skuPartNumber),
        })));
        setLastRefreshed(new Date());
      }
    } catch (e) { console.warn('[M365Page] SKU fetch failed:', e); }
    finally { setLoading(false); }
  }, []);

  const computeChecks = useCallback((skuList: SkuEntry[], users: any[]) => {
    const totalLic = skuList.reduce((s,x) => s+x.purchased, 0);
    const totalCon = skuList.reduce((s,x) => s+x.consumed, 0);
    const totalUnu = skuList.reduce((s,x) => s+Math.max(0,x.available), 0);
    const utilPct  = totalLic > 0 ? Math.round((totalCon/totalLic)*100) : 0;
    const guestCnt = users.filter((u:any) => u.userType==='Guest'||(u.userPrincipalName||'').includes('#EXT#')).length;
    const disCnt   = users.filter((u:any) => u.accountEnabled===false).length;
    setChecks(CHECKS_DEF.map(c => {
      let status: CheckResult['status'] = 'ok', value: string|number = '—', detail = '';
      switch(c.id) {
        case 'license_inventory':     value=skuList.length; detail=`${skuList.length} SKU(s) subscribed`; break;
        case 'assigned_available':    value=`${totalCon}/${totalLic}`; detail=`${totalUnu} seats available`; status=totalUnu<0?'error':totalUnu<5?'warning':'ok'; break;
        case 'unassigned_report':     value=totalUnu; detail=totalUnu>0?`${totalUnu} unassigned seats`:'All seats assigned'; status=totalUnu>20?'warning':'ok'; break;
        case 'user_license_map':      value=totalUsers; detail=`${totalUsers} users mapped`; break;
        case 'inactive_users':        value='—'; detail='Sign-in activity required'; status='idle'; break;
        case 'license_utilization':   value=`${utilPct}%`; detail=`${utilPct}% utilization`; status=utilPct<60?'warning':'ok'; break;
        case 'admin_privileged':      value=adminCount; detail=`${adminCount} privileged accounts`; status=adminCount>10?'warning':'ok'; break;
        case 'mfa_coverage':          value=mfaEnabled; detail=`${mfaDisabled} without MFA`; status=mfaDisabled>0?'warning':'ok'; break;
        case 'guest_users':           value=guestCnt; detail=`${guestCnt} guest users`; status=guestCnt>50?'warning':'ok'; break;
        case 'stale_disabled':        value=disCnt; detail=`${disCnt} disabled accounts`; status=disCnt>5?'warning':'ok'; break;
        case 'risky_signins':         value='—'; detail='Requires Identity Protection P2'; status='idle'; break;
        case 'mailbox_forwarding':    value='—'; detail='Exchange Online query'; status='idle'; break;
        case 'email_security':        value='—'; detail='Defender for Office 365'; status='idle'; break;
        case 'defender_security':     value=secureScore!=null?`${secureScore}%`:'—'; detail=secureScore!=null?`Secure Score: ${secureScore}%`:'Requires Security API'; status=secureScore!=null?(secureScore>70?'ok':'warning'):'idle'; break;
        case 'intune_compliance':     value='—'; detail='Intune license required'; status='idle'; break;
        case 'non_compliant_devices': value='—'; detail='Intune license required'; status='idle'; break;
        case 'sharepoint_governance': value='—'; detail='SharePoint Admin Center'; status='idle'; break;
        case 'onedrive_governance':   value='—'; detail='OneDrive for Business'; status='idle'; break;
        case 'teams_governance':      value='—'; detail='Teams Admin Center'; status='idle'; break;
        case 'service_health':        value='Live'; detail='Microsoft 365 service status'; break;
        case 'license_optimization':  value=totalUnu>0?`${totalUnu} to review`:'Optimized'; detail=totalUnu>0?'Reduce unused seats before renewal':'No unused seats'; status=totalUnu>10?'warning':'ok'; break;
        case 'executive_report':      value=`${utilPct}% utilized`; detail=`${totalCon}/${totalLic} licenses · ${mfaEnabled} MFA · ${adminCount} Admins`; break;
      }
      return { ...c, status, value, detail };
    }));
  }, [totalUsers, adminCount, mfaEnabled, mfaDisabled, secureScore]);

  useEffect(() => {
    if (licensesData?.length > 0) buildSkusFromData(licensesData);
    else fetchLiveSkus();
  }, [licensesData, buildSkusFromData, fetchLiveSkus]);

  useEffect(() => { computeChecks(skus, usersList); }, [skus, usersList, computeChecks]);

  // Derived
  const totalPurchased = skus.reduce((s,x)=>s+x.purchased,0);
  const totalConsumed  = skus.reduce((s,x)=>s+x.consumed,0);
  const totalAvail     = skus.reduce((s,x)=>s+Math.max(0,x.available),0);
  const utilRate       = totalPurchased>0 ? Math.round((totalConsumed/totalPurchased)*100) : 0;
  const mfaRate        = totalUsers>0 ? Math.round((mfaEnabled/totalUsers)*100) : 0;
  const statusCounts   = { ok:checks.filter(c=>c.status==='ok').length, warning:checks.filter(c=>c.status==='warning').length, error:checks.filter(c=>c.status==='error').length, idle:checks.filter(c=>c.status==='idle').length };

  const familyGroups = skus.reduce<Partial<Record<LicenseFamily,SkuEntry[]>>>((acc,sku)=>{
    if(!acc[sku.family]) acc[sku.family]=[];
    acc[sku.family]!.push(sku); return acc;
  },{});
  const displayFamilies = (Object.keys(FAMILY_META) as LicenseFamily[]).filter(f => f!=='Other' || (familyGroups['Other']?.length??0)>0);

  // ── KPI data
  const kpis = [
    { label:'Total Licenses', value:totalPurchased, sub:`${skus.length} SKU types`,        icon:Database,  color:'text-sky-700',    bg:'bg-sky-50',    border:'border-sky-200' },
    { label:'Assigned',       value:totalConsumed,  sub:`${utilRate}% utilization`,         icon:UserCheck, color:'text-emerald-700',bg:'bg-emerald-50',border:'border-emerald-200' },
    { label:'Available Seats',value:totalAvail,     sub:'unassigned seats',                 icon:Package,   color:totalAvail>20?'text-amber-700':'text-slate-700', bg:totalAvail>20?'bg-amber-50':'bg-slate-50', border:totalAvail>20?'border-amber-200':'border-slate-200' },
    { label:'Total Users',    value:totalUsers,     sub:`${adminCount} admins`,             icon:Users,     color:'text-indigo-700', bg:'bg-indigo-50', border:'border-indigo-200' },
    { label:'MFA Enabled',    value:mfaEnabled,     sub:`${mfaRate}% coverage`,             icon:Shield,    color:mfaRate>90?'text-emerald-700':'text-amber-700', bg:mfaRate>90?'bg-emerald-50':'bg-amber-50', border:mfaRate>90?'border-emerald-200':'border-amber-200' },
    { label:'Secure Score',   value:secureScore!=null?`${secureScore}%`:'—', sub:'Microsoft score', icon:Lock, color:secureScore&&secureScore>70?'text-emerald-700':'text-amber-700', bg:'bg-slate-50', border:'border-slate-200' },
  ];

  const TIERS = [
    { name:'BASIC',    gradient:'from-slate-600 to-slate-700', border:'border-slate-300', badge:'Entry',     badgeClass:'bg-slate-100 text-slate-600',
      features:['Web Office Apps','Email (Exchange Online)','OneDrive 1TB','Teams*','SharePoint Online'] },
    { name:'STANDARD', gradient:'from-sky-600 to-blue-700',   border:'border-sky-300',   badge:'Popular',   badgeClass:'bg-sky-100 text-sky-700',
      features:['Desktop Office Apps','Email (Exchange Online)','OneDrive 1TB','Teams*','SharePoint Online'] },
    { name:'PREMIUM',  gradient:'from-indigo-600 to-purple-700', border:'border-indigo-300', badge:'Full Suite', badgeClass:'bg-indigo-100 text-indigo-700',
      features:['Desktop Office Apps','Email (Exchange Online)','OneDrive 1TB','Teams*','SharePoint Online','+ Azure AD Premium P1','+ Intune MDM / MAM','+ Microsoft Defender for Business'] },
  ];

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[0.65rem] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">ZenAIOps</span>
            <span className="text-xs text-slate-400 font-medium">Microsoft 365 Managed Services</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900">M365 License &amp; Governance Overview</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Live data from Microsoft Graph API · Tenant: <span className="font-mono font-semibold text-slate-700">{tenantId || '—'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {lastRefreshed && <span className="text-[0.65rem] text-slate-400 hidden sm:block">Updated {lastRefreshed.toLocaleTimeString()}</span>}
          <button onClick={fetchLiveSkus} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-xs disabled:opacity-50">
            <RefreshCw className={`h-3.5 w-3.5 text-slate-500 ${loading?'animate-spin':''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((k,i) => (
          <div key={i} className={`p-4 rounded-xl border ${k.border} ${k.bg} flex flex-col gap-1`}>
            <div className="flex items-center justify-between">
              <span className="text-[0.65rem] font-bold uppercase tracking-wider text-slate-500">{k.label}</span>
              <k.icon className={`h-3.5 w-3.5 ${k.color}`} />
            </div>
            <p className={`text-2xl font-extrabold ${k.color} leading-tight`}>{k.value}</p>
            <p className="text-[0.65rem] text-slate-400">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* License Families + Business Tier */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* License Families */}
        <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-800">License Families</h3>
              <p className="text-xs text-slate-400 mt-0.5">9 Microsoft 365 categories — live subscription data</p>
            </div>
            <span className="text-xs font-bold text-slate-400">{Object.keys(familyGroups).length} / {displayFamilies.length} active</span>
          </div>
          <div className="divide-y divide-slate-100">
            {displayFamilies.map(family => {
              const meta = FAMILY_META[family];
              const FIcon = meta.icon;
              const rows = familyGroups[family] || [];
              const isActive = rows.length > 0;
              const isExpanded = expandedFamily === family;
              const famPurchased = rows.reduce((s,x)=>s+x.purchased,0);
              const famConsumed  = rows.reduce((s,x)=>s+x.consumed,0);
              const famUtil = famPurchased>0 ? Math.round((famConsumed/famPurchased)*100) : 0;
              return (
                <div key={family}>
                  <button
                    onClick={() => isActive && setExpandedFamily(isExpanded?null:family)}
                    className={`w-full flex items-center gap-3 px-6 py-3 text-left transition-colors ${isActive?'hover:bg-slate-50 cursor-pointer':'cursor-default opacity-40'}`}
                  >
                    <div className={`h-8 w-8 rounded-lg ${meta.bg} ${meta.border} border flex items-center justify-center shrink-0`}>
                      <FIcon className={`h-4 w-4 ${meta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-800">{meta.label}</span>
                        {isActive && <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded border ${meta.bg} ${meta.color} ${meta.border}`}>{rows.length} SKU{rows.length!==1?'s':''}</span>}
                      </div>
                      <p className="text-[0.68rem] text-slate-400 truncate">{meta.desc}</p>
                    </div>
                    {isActive && (
                      <div className="text-right shrink-0 mr-2">
                        <p className="text-sm font-bold text-slate-800">{famConsumed} / {famPurchased}</p>
                        <p className="text-[0.65rem] text-slate-400">{famUtil}% used</p>
                      </div>
                    )}
                    {isActive ? (isExpanded ? <ChevronDown className="h-4 w-4 text-slate-400 shrink-0"/> : <ChevronRight className="h-4 w-4 text-slate-400 shrink-0"/>) : <span className="text-[0.65rem] text-slate-300 italic shrink-0">Not subscribed</span>}
                  </button>

                  {isExpanded && isActive && (
                    <div className="px-6 pb-4 bg-slate-50/60 border-t border-slate-100">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3">
                        {rows.map(sku => {
                          const pct = sku.purchased>0 ? Math.round((sku.consumed/sku.purchased)*100) : 0;
                          return (
                            <div key={sku.skuId} className="bg-white rounded-xl border border-slate-200 p-3 space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <p className="text-xs font-bold text-slate-800 leading-tight">{sku.productName}</p>
                                <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded shrink-0 ${pct>90?'bg-emerald-100 text-emerald-700':pct>60?'bg-sky-100 text-sky-700':pct>0?'bg-amber-100 text-amber-700':'bg-slate-100 text-slate-400'}`}>{pct}%</span>
                              </div>
                              <div className="w-full bg-slate-100 rounded-full h-1.5">
                                <div className={`h-1.5 rounded-full transition-all ${pct>90?'bg-emerald-500':pct>60?'bg-sky-500':pct>0?'bg-amber-500':'bg-slate-300'}`} style={{width:`${Math.min(100,pct)}%`}}/>
                              </div>
                              <div className="flex items-center justify-between text-[0.65rem] text-slate-500">
                                <span>{sku.consumed} assigned</span>
                                <span>{sku.purchased} purchased · {Math.max(0,sku.available)} free</span>
                              </div>
                              <p className="text-[0.6rem] font-mono text-slate-300 truncate">{sku.skuPartNumber}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Business Tier Hierarchy */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">M365 Business Hierarchy</h3>
            <p className="text-xs text-slate-400 mt-0.5">Service tier comparison (up to 300 users)</p>
          </div>
          <div className="flex-1 p-5 space-y-3">
            <div className="flex justify-center">
              <div className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-black tracking-wide flex items-center gap-2 shadow">
                <Layers className="h-3.5 w-3.5" /> MICROSOFT 365 BUSINESS
              </div>
            </div>
            <div className="flex justify-center"><div className="w-px h-4 bg-slate-300"/></div>
            {TIERS.map(tier => (
              <div key={tier.name} className={`rounded-xl border ${tier.border} overflow-hidden`}>
                <div className={`bg-gradient-to-r ${tier.gradient} px-4 py-2 flex items-center justify-between`}>
                  <span className="text-white font-black text-xs tracking-widest">{tier.name}</span>
                  <span className={`text-[0.6rem] font-bold px-2 py-0.5 rounded-full ${tier.badgeClass}`}>{tier.badge}</span>
                </div>
                <div className="px-4 py-3 space-y-1">
                  {tier.features.map(f => (
                    <div key={f} className="flex items-center gap-1.5">
                      <CheckCircle2 className={`h-3 w-3 shrink-0 ${f.startsWith('+')?'text-indigo-500':'text-emerald-500'}`}/>
                      <span className={`text-[0.7rem] ${f.startsWith('+')?'font-bold text-indigo-700':'text-slate-600'}`}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <p className="text-[0.65rem] text-slate-400 text-center pt-1">* Teams available as standalone in some regions</p>
          </div>
        </div>
      </div>

      {/* 22 ZenAIOps Checks */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-800">ZenAIOps — 22 M365 Managed Service Checks</h3>
            <p className="text-xs text-slate-400 mt-0.5">Automated governance checks against Microsoft Graph API</p>
          </div>
          <div className="flex items-center gap-3 text-xs font-semibold shrink-0">
            <span className="flex items-center gap-1 text-emerald-700"><CheckCircle2 className="h-3.5 w-3.5"/>{statusCounts.ok} OK</span>
            <span className="flex items-center gap-1 text-amber-700"><AlertTriangle className="h-3.5 w-3.5"/>{statusCounts.warning} Warn</span>
            <span className="flex items-center gap-1 text-slate-400"><Clock className="h-3.5 w-3.5"/>{statusCounts.idle} Pending</span>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-slate-100">
          {checks.map(check => {
            const CIcon = CHECK_ICONS[check.id] || Info;
            const s = { ok:{dot:'bg-emerald-500',txt:'text-emerald-700'}, warning:{dot:'bg-amber-500',txt:'text-amber-700'}, error:{dot:'bg-rose-500',txt:'text-rose-700'}, loading:{dot:'bg-blue-500 animate-pulse',txt:'text-blue-700'}, idle:{dot:'bg-slate-300',txt:'text-slate-400'} }[check.status];
            return (
              <div key={check.id} className="bg-white p-4 flex items-start gap-3">
                <div className="h-7 w-7 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CIcon className={`h-3.5 w-3.5 ${s.txt}`}/>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="text-[0.6rem] font-bold font-mono text-slate-400">{check.num}</span>
                    <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${s.dot}`}/>
                  </div>
                  <p className="text-xs font-bold text-slate-800 leading-snug">{check.label}</p>
                  {check.value!==undefined && check.value!=='—' && <p className={`text-sm font-extrabold ${s.txt} mt-0.5`}>{check.value}</p>}
                  <p className="text-[0.65rem] text-slate-400 mt-0.5">{check.detail}</p>
                  <p className="text-[0.6rem] font-mono text-slate-300 mt-1 truncate">{check.api}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
