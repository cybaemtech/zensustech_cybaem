import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  X
} from 'lucide-react';

export interface SignUpPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone?: string;
  organization?: string;
  customer?: string;
  vendorCode?: string;
}

export interface ZohoAuthCardProps {
  initialMode?: 'signin' | 'signup';
  onSignInSuccess: (email: string, password?: string) => void;
  onSignUp?: (payload: SignUpPayload) => void;
  onAzureSSO: () => void;
  isSubmitting?: boolean;
}

export type VendorCode = 'zensustech' | 'L&T' | 'Tata' | 'mahindra' | 'cybaemtech' | '';

const VENDOR_OPTIONS: { value: VendorCode; label: string }[] = [
  { value: 'zensustech', label: 'ZensusTech' },
  { value: 'L&T', label: 'L&T (Larsen & Toubro)' },
  { value: 'Tata', label: 'Tata Group' },
  { value: 'mahindra', label: 'Mahindra' },
  { value: 'cybaemtech', label: 'CybaemTech' },
];

export function ZohoAuthCard({
  initialMode = 'signin',
  onSignInSuccess,
  onSignUp,
  onAzureSSO,
  isSubmitting = false,
}: ZohoAuthCardProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  
  // Sign In state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);
  const [signInStep, setSignInStep] = useState<'email' | 'password'>('email');
  const [signInErrors, setSignInErrors] = useState<{ email?: string; password?: string }>({});

  // Sign Up state
  const [accountType, setAccountType] = useState<'END_CUSTOMER' | 'VENDOR'>('END_CUSTOMER');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [customer, setCustomer] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [vendorCode, setVendorCode] = useState<VendorCode>('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [signUpErrors, setSignUpErrors] = useState<Record<string, string>>({});
  const [signUpSuccessMessage, setSignUpSuccessMessage] = useState('');

  // Right side auto-swipe authentication slides
  const [activeSlide, setActiveSlide] = useState(0);
  const [showLearnMoreModal, setShowLearnMoreModal] = useState(false);
  const [showSmartSignInModal, setShowSmartSignInModal] = useState(false);

  // Sync mode with prop if changed
  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const slides = [
    {
      image: '/auth/auth-biometric-mfa.jpg',
      title: 'Biometric & Multi-Factor Access',
      subtitle:
        'Secure one-tap mobile authentication and Microsoft Entra ID biometric sign-in protecting enterprise cloud operations.',
      badge: 'Biometric MFA',
    },
    {
      image: '/auth/auth-identity-guard.jpg',
      title: 'Zero Trust Identity Defense',
      subtitle:
        'Continuous identity posture verification and role-based access controls safeguarding sensitive organizational assets.',
      badge: 'Identity Guard',
    },
    {
      image: '/auth/auth-passwordless-key.jpg',
      title: 'Passwordless Credential Security',
      subtitle:
        'Eliminate credential theft and phishing attacks with cryptographic FIDO2 keys and automated passwordless handshakes.',
      badge: 'Passwordless Key',
    },
  ];

  // Auto-rotate right carousel every 4.5s
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % slides.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [slides.length]);

  // Validation for Sign In
  const validateSignIn = () => {
    const errs: { email?: string; password?: string } = {};
    if (!signInEmail.trim()) {
      errs.email = 'Please enter your email or username';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signInEmail.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (signInStep === 'password' && !signInPassword) {
      errs.password = 'Please enter your password';
    }
    setSignInErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignInNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignIn()) return;

    if (signInStep === 'email') {
      setSignInStep('password');
    } else {
      onSignInSuccess(signInEmail.trim(), signInPassword);
    }
  };

  // Validation for Sign Up
  const validateSignUp = () => {
    const errs: Record<string, string> = {};
    if (!firstName.trim()) errs.firstName = 'First name is required';
    if (!lastName.trim()) errs.lastName = 'Last name is required';
    if (!signUpEmail.trim()) {
      errs.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!signUpPassword) {
      errs.password = 'Password is required';
    } else if (signUpPassword.length < 8) {
      errs.password = 'Password must be at least 8 characters';
    }
    if (!agreeTerms) {
      errs.terms = 'Please accept the Terms of Service';
    }
    setSignUpErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSignUpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateSignUp()) return;

    // If parent provided onSignUp handler, delegate entirely (real API flow)
    if (onSignUp) {
      onSignUp({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: signUpEmail.trim(),
        password: signUpPassword,
        role: accountType,
        phone: phone.trim() || undefined,
        organization: orgName.trim() || undefined,
        customer: customer.trim() || undefined,
        vendorCode: vendorCode || undefined,
      });
      return;
    }

    // Fallback: local-only registration (dev / no-backend mode)
    try {
      const newUser = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        organization: orgName.trim() || 'ZensusTech Cloud',
        customer: customer.trim() || 'ZensusTech Primary',
        email: signUpEmail.trim(),
        phone: phone.trim(),
        vendorCode,
        createdAt: new Date().toISOString(),
      };
      const existing = JSON.parse(localStorage.getItem('zt_registered_users') || '[]');
      existing.push(newUser);
      localStorage.setItem('zt_registered_users', JSON.stringify(existing));
    } catch {}

    setSignUpSuccessMessage(
      `Account created for ${firstName} ${lastName}! Please sign in with your email.`
    );

    setSignInEmail(signUpEmail.trim());
    setSignInStep('email');
    setTimeout(() => {
      setMode('signin');
      setSignUpSuccessMessage('');
    }, 2200);
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 sm:p-6 lg:p-8 overflow-x-hidden font-sans select-none bg-[#f8fafc]">
      {/* Zoho-style geometric faceted background pattern */}
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
      
      {/* Subtle faceted polygonal lines overlay */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-25" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="poly-grid" width="160" height="160" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 160 0 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <path d="M 0 160 L 160 160 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <path d="M 0 0 L 0 160 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <path d="M 160 0 L 160 160 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#poly-grid)" />
      </svg>

      {/* Main Floating Card Container (Zoho Layout) */}
      <div className="relative z-10 w-full max-w-[920px] max-h-[96vh] bg-white rounded-2xl shadow-[0_12px_45px_-8px_rgba(15,23,42,0.12),0_2px_8px_-2px_rgba(15,23,42,0.06)] border border-slate-200/90 overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: FORM SECTION (SIGN IN / SIGN UP)            */}
        {/* ========================================================= */}
        <div className="w-full md:w-[56%] p-5 sm:p-7 flex flex-col justify-between overflow-y-auto max-h-[96vh]">
          <div>
            {/* Top Bar: Official ZensusTech Brand Logo & "Try smart sign-in" Pill */}
            <div className="flex items-center justify-between gap-3 mb-4">
              {/* ZensusTech Brand Logo */}
              <div className="flex items-center gap-2.5">
                <img
                  src="/ZensusTech_Logo.PNG"
                  alt="ZensusTech"
                  className="h-8 w-auto max-w-[110px] object-contain rounded-md"
                />
                <div className="flex flex-col border-l border-slate-200 pl-2">
                  <span className="font-extrabold text-[13px] tracking-wider text-slate-800 leading-none">
                    ZENSUSTECH
                  </span>
                  <span className="text-[8.5px] font-medium tracking-widest text-slate-400 uppercase mt-0.5">
                    Cloud Operations
                  </span>
                </div>
              </div>

              {/* "Try smart sign-in" Pill Button */}
              <button
                type="button"
                onClick={() => setShowSmartSignInModal(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xs transition-all duration-200 cursor-pointer hover:shadow hover:scale-[1.02]"
              >
                <Sparkles className="w-3 h-3 text-amber-300" />
                <span>Try smart sign-in</span>
              </button>
            </div>

            {/* Success notification banner after sign-up */}
            {signUpSuccessMessage && (
              <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
                <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-900">Registration Complete!</p>
                  <p className="mt-0.5 text-emerald-700">{signUpSuccessMessage}</p>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* VIEW A: SIGN IN FORM                                  */}
            {/* ----------------------------------------------------- */}
            {mode === 'signin' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                    Sign in
                  </h1>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                    to access ZensusTech Home
                  </p>
                </div>

                <form onSubmit={handleSignInNext} noValidate className="space-y-3.5">
                  {/* Step 1: Email / Username */}
                  {signInStep === 'email' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Email address or mobile number
                      </label>
                      <input
                        type="email"
                        value={signInEmail}
                        onChange={(e) => {
                          setSignInEmail(e.target.value);
                          if (signInErrors.email) setSignInErrors({});
                        }}
                        placeholder="name@company.com"
                        className={`w-full px-3.5 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none transition-all duration-150 ${
                          signInErrors.email
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                            : 'border-slate-300 focus:border-[#008cff] focus:ring-4 focus:ring-[#008cff]/15'
                        }`}
                        autoFocus
                      />
                      {signInErrors.email && (
                        <p className="text-xs text-rose-500 mt-1 font-medium">
                          {signInErrors.email}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Step 2: Password (Zoho-style progressive step) */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <span className="font-medium text-slate-700 truncate max-w-[200px]">
                          {signInEmail}
                        </span>
                        <button
                          type="button"
                          onClick={() => setSignInStep('email')}
                          className="text-[#008cff] font-semibold hover:underline"
                        >
                          Change
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <label className="text-xs font-semibold text-slate-700">
                            Enter Password
                          </label>
                          <button
                            type="button"
                            onClick={() => alert('Please contact your administrator or use Microsoft Entra ID SSO.')}
                            className="text-xs text-[#008cff] font-medium hover:underline"
                          >
                            Forgot password?
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type={showSignInPassword ? 'text' : 'password'}
                            value={signInPassword}
                            onChange={(e) => {
                              setSignInPassword(e.target.value);
                              if (signInErrors.password) setSignInErrors({});
                            }}
                            placeholder="Enter your password"
                            className={`w-full pl-3.5 pr-10 py-2.5 rounded-lg border text-sm text-slate-900 placeholder:text-slate-400 bg-white focus:outline-none transition-all duration-150 ${
                              signInErrors.password
                                ? 'border-rose-400 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10'
                                : 'border-slate-300 focus:border-[#008cff] focus:ring-4 focus:ring-[#008cff]/15'
                            }`}
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => setShowSignInPassword(!showSignInPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                          >
                            {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                        {signInErrors.password && (
                          <p className="text-xs text-rose-500 mt-1 font-medium">
                            {signInErrors.password}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Vibrant Blue Next/Sign in Button */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2.5 px-4 rounded-lg bg-[#008cff] hover:bg-[#007be6] active:bg-[#006fd1] text-white font-semibold text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <span>{signInStep === 'email' ? 'Next' : 'Sign in'}</span>
                    )}
                  </button>
                </form>

                {/* Switch to Sign Up */}
                <div className="pt-3 text-xs text-slate-600">
                  <span>Don't have a ZensusTech account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setSignInErrors({});
                    }}
                    className="text-[#008cff] font-bold hover:underline cursor-pointer"
                  >
                    Sign up now
                  </button>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------- */}
            {/* VIEW B: SIGN UP FORM (Compact Static Grid Layout)     */}
            {/* ----------------------------------------------------- */}
            {mode === 'signup' && (
              <div className="space-y-2.5 animate-fadeIn">
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    Sign up
                  </h1>
                  <p className="text-slate-500 text-xs mt-0.5">
                    Start your enterprise cloud journey with ZensusTech
                  </p>
                </div>

                {/* Account Type Selector (End Customer vs Vendor) */}
                <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setAccountType('END_CUSTOMER')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      accountType === 'END_CUSTOMER'
                        ? 'bg-white text-[#008cff] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    End Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('VENDOR')}
                    className={`flex-1 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      accountType === 'VENDOR'
                        ? 'bg-white text-[#008cff] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Vendor
                  </button>
                </div>

                <form onSubmit={handleSignUpSubmit} noValidate className="space-y-2.5">
                  {/* Row 1: First Name * & Last Name * */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        First Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => {
                          setFirstName(e.target.value);
                          if (signUpErrors.firstName) setSignUpErrors((p) => ({ ...p, firstName: '' }));
                        }}
                        placeholder="John"
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs text-slate-900 bg-white focus:outline-none transition-all ${
                          signUpErrors.firstName
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]/20'
                        }`}
                      />
                      {signUpErrors.firstName && (
                        <p className="text-[10px] text-rose-500 mt-0.5 font-medium leading-none">
                          {signUpErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Last Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                          setLastName(e.target.value);
                          if (signUpErrors.lastName) setSignUpErrors((p) => ({ ...p, lastName: '' }));
                        }}
                        placeholder="Doe"
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs text-slate-900 bg-white focus:outline-none transition-all ${
                          signUpErrors.lastName
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]/20'
                        }`}
                      />
                      {signUpErrors.lastName && (
                        <p className="text-[10px] text-rose-500 mt-0.5 font-medium leading-none">
                          {signUpErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Organization Name & Customer */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        value={orgName}
                        onChange={(e) => setOrgName(e.target.value)}
                        placeholder="e.g. ZensusTech Ltd"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]/20 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Customer
                      </label>
                      <input
                        type="text"
                        value={customer}
                        onChange={(e) => setCustomer(e.target.value)}
                        placeholder="e.g. Primary / Client ID"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]/20 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  {/* Row 3: Email * & Vendor Code (DDL) */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={signUpEmail}
                        onChange={(e) => {
                          setSignUpEmail(e.target.value);
                          if (signUpErrors.email) setSignUpErrors((p) => ({ ...p, email: '' }));
                        }}
                        placeholder="name@company.com"
                        className={`w-full px-2.5 py-1.5 rounded-lg border text-xs text-slate-900 bg-white focus:outline-none transition-all ${
                          signUpErrors.email
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                            : 'border-slate-300 focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]/20'
                        }`}
                      />
                      {signUpErrors.email && (
                        <p className="text-[10px] text-rose-500 mt-0.5 font-medium leading-none">
                          {signUpErrors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Vendor Code
                      </label>
                      <div className="relative">
                        <select
                          value={vendorCode}
                          onChange={(e) => setVendorCode(e.target.value as VendorCode)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]/20 focus:outline-none appearance-none cursor-pointer transition-all"
                        >
                          <option value="">Select Vendor Code</option>
                          {VENDOR_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-[10px]">
                          ▼
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Row 4: Phone No. & Password * */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Phone No.
                      </label>
                      <input
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 9823101112"
                        className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]/20 focus:outline-none transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Password <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type={showSignUpPassword ? 'text' : 'password'}
                          value={signUpPassword}
                          onChange={(e) => {
                            setSignUpPassword(e.target.value);
                            if (signUpErrors.password) setSignUpErrors((p) => ({ ...p, password: '' }));
                          }}
                          placeholder="At least 8 characters"
                          className={`w-full pl-2.5 pr-8 py-1.5 rounded-lg border text-xs text-slate-900 bg-white focus:outline-none transition-all ${
                            signUpErrors.password
                              ? 'border-rose-400 focus:border-rose-500 focus:ring-1 focus:ring-rose-500/20'
                              : 'border-slate-300 focus:border-[#008cff] focus:ring-1 focus:ring-[#008cff]/20'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          {showSignUpPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      {signUpErrors.password && (
                        <p className="text-[10px] text-rose-500 mt-0.5 font-medium leading-none">
                          {signUpErrors.password}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Row 5: Terms Checkbox */}
                  <div className="pt-0.5">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] text-slate-600">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="rounded border-slate-300 text-[#008cff] focus:ring-[#008cff] w-3.5 h-3.5"
                      />
                      <span>
                        I agree to the <a href="#terms" className="text-[#008cff] hover:underline">Terms</a> and <a href="#privacy" className="text-[#008cff] hover:underline">Privacy Policy</a>.
                      </span>
                    </label>
                    {signUpErrors.terms && (
                      <p className="text-[10px] text-rose-500 mt-0.5 font-medium leading-none">
                        {signUpErrors.terms}
                      </p>
                    )}
                  </div>

                  {/* Row 6: Register Action Button (Fully Visible, No Scroll Required) */}
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-[#008cff] hover:bg-[#007be6] active:bg-[#006fd1] text-white font-semibold text-xs sm:text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer mt-1"
                  >
                    <span>Sign up for free</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Row 7: Back to Sign In */}
                <div className="pt-1 text-[11px] text-slate-600 text-center sm:text-left">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setSignUpErrors({});
                    }}
                    className="text-[#008cff] font-bold hover:underline cursor-pointer ml-0.5"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Security Assurance Note */}
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center gap-1.5 text-[10.5px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>256-bit encryption · Microsoft Entra ID enterprise security</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: AUTO-SWIPE AUTHENTICATION SHOWCASE          */}
        {/* ========================================================= */}
        <div className="w-full md:w-[44%] bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#eef2f6] border-t md:border-t-0 md:border-l border-slate-200/90 p-5 sm:p-6 lg:p-7 flex flex-col justify-between items-center text-center relative overflow-hidden">
          
          {/* Subtle background glow */}
          <div className="absolute top-1/4 -right-10 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Auto-Swiping Authentication Images Showcase (Suitable Proportional Size) */}
          <div className="w-full max-w-[290px] sm:max-w-[310px] my-auto pt-1 relative">
            
            {/* Auto-swiping images container without white box or border */}
            <div className="relative mx-auto w-full h-44 sm:h-52 flex items-center justify-center overflow-hidden">
              {slides.map((s, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 flex items-center justify-center transition-opacity duration-500 ease-in-out ${
                    activeSlide === idx
                      ? 'opacity-100 z-10'
                      : 'opacity-0 z-0 pointer-events-none'
                  }`}
                >
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-contain select-none mix-blend-multiply"
                    loading="eager"
                  />
                </div>
              ))}
            </div>

            {/* Slide Text Content */}
            <div className="mt-4 space-y-1">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                {slides[activeSlide].badge}
              </span>
              <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight transition-all duration-300">
                {slides[activeSlide].title}
              </h3>
              <p className="text-[11.5px] text-slate-500 leading-relaxed max-w-[320px] mx-auto min-h-[34px] transition-all duration-300">
                {slides[activeSlide].subtitle}
              </p>
            </div>

            {/* "Learn more" Pill Button */}
            <div className="mt-2.5">
              <button
                type="button"
                onClick={() => setShowLearnMoreModal(true)}
                className="inline-block px-3.5 py-1 rounded-full text-[11px] font-semibold text-[#008cff] bg-white border border-[#008cff]/40 hover:bg-[#008cff]/5 shadow-xs transition-colors cursor-pointer"
              >
                Learn more
              </button>
            </div>
          </div>

          {/* Interactive Carousel Pagination Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-3 pb-0.5">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeSlide === idx
                    ? 'w-4 bg-[#008cff]'
                    : 'w-1.5 bg-slate-300 hover:bg-slate-400'
                }`}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* POPUP MODAL: LEARN MORE ABOUT PASSWORDLESS SIGN-IN        */}
      {/* ========================================================= */}
      {showLearnMoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 relative">
            <button
              type="button"
              onClick={() => setShowLearnMoreModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 text-blue-600 mb-3">
              <ShieldCheck className="w-6 h-6" />
              <h4 className="text-base font-bold text-slate-900">Enterprise Passwordless Access</h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              ZensusTech supports FIDO2 security keys, Microsoft Authenticator, and Microsoft Entra ID passwordless sign-in. This eliminates phishing risks, reduces authentication friction, and fulfills Zero Trust security mandates.
            </p>
            <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>99.2% reduction in account takeover risk</span>
              </div>
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Direct Microsoft Entra ID & OneAuth SSO integration</span>
              </div>
              <div className="flex items-center gap-2 font-medium text-slate-800">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Encrypted session tokens & MFA enforcement</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowLearnMoreModal(false)}
              className="w-full py-2 bg-[#008cff] hover:bg-[#007be6] text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* POPUP MODAL: SMART SIGN-IN (AZURE SSO SPEED ACCESS)       */}
      {/* ========================================================= */}
      {showSmartSignInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-slate-200 relative text-center">
            <button
              type="button"
              onClick={() => setShowSmartSignInModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md">
              <Sparkles className="w-6 h-6 text-amber-300" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">Smart Enterprise Sign-in</h4>
            <p className="text-xs text-slate-500 mb-4">
              Authenticate instantly using your active Microsoft Entra corporate identity without typing manual passwords.
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => {
                  setShowSmartSignInModal(false);
                  onAzureSSO();
                }}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
              >
                <svg className="w-4 h-4" viewBox="0 0 23 23">
                  <rect x="1" y="1" width="10" height="10" fill="#f25022" />
                  <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
                  <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
                  <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
                </svg>
                <span>Continue with Microsoft Entra ID</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSmartSignInModal(false);
                  setSignInEmail('vinayak.salunkhe@zensustech.com');
                  setSignInStep('password');
                }}
                className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-all cursor-pointer"
              >
                Use ZensusTech Verified Admin Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
