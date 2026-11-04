import React, { useState, useEffect } from 'react';
import {
  Eye,
  EyeOff,
  ShieldCheck,
  Check,
  ArrowRight,
  Sparkles,
  Lock,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export interface ZohoAuthCardProps {
  initialMode?: 'signin' | 'signup';
  onSignInSuccess: (email: string, password?: string) => void;
  onAzureSSO: () => void;
  isSubmitting?: boolean;
}

export type VendorCode = 'zensustech' | 'L&T' | 'Tata' | 'mahindra' | 'cybaemtech';

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
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [customer, setCustomer] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [vendorCode, setVendorCode] = useState<VendorCode>('zensustech');
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

    try {
      const newUser = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        organization: orgName.trim() || 'ZensusTech Cloud',
        customer: customer.trim() || 'ZensusTech Primary',
        email: signUpEmail.trim(),
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
      <div className="relative z-10 w-full max-w-[940px] bg-white rounded-2xl shadow-[0_12px_45px_-8px_rgba(15,23,42,0.12),0_2px_8px_-2px_rgba(15,23,42,0.06)] border border-slate-200/90 overflow-hidden flex flex-col md:flex-row transition-all duration-300">
        
        {/* ========================================================= */}
        {/* LEFT COLUMN: FORM SECTION (SIGN IN / SIGN UP)            */}
        {/* ========================================================= */}
        <div className="w-full md:w-[58%] p-6 sm:p-10 lg:p-12 flex flex-col justify-between">
          <div>
            {/* Top Bar: Official ZensusTech Brand Logo & "Try smart sign-in" Pill */}
            <div className="flex items-center justify-between gap-3 mb-6">
              {/* ZensusTech Brand Logo (Removed Zoho colorful boxes) */}
              <div className="flex items-center gap-2.5">
                <img
                  src="/ZensusTech_Logo.PNG"
                  alt="ZensusTech"
                  className="h-9 w-auto max-w-[120px] object-contain rounded-md"
                />
                <div className="flex flex-col border-l border-slate-200 pl-2.5">
                  <span className="font-extrabold text-[14px] tracking-wider text-slate-800 leading-none">
                    ZENSUSTECH
                  </span>
                  <span className="text-[9px] font-medium tracking-widest text-slate-400 uppercase mt-0.5">
                    Cloud Operations
                  </span>
                </div>
              </div>

              {/* "Try smart sign-in" Pill Button */}
              <button
                type="button"
                onClick={() => setShowSmartSignInModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-sm transition-all duration-200 cursor-pointer hover:shadow hover:scale-[1.02]"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Try smart sign-in</span>
              </button>
            </div>

            {/* Success notification banner after sign-up */}
            {signUpSuccessMessage && (
              <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 animate-fadeIn">
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
              <div className="space-y-5 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                    Sign in
                  </h1>
                  <p className="text-slate-500 text-sm mt-1">
                    to access ZensusTech Home
                  </p>
                </div>

                <form onSubmit={handleSignInNext} noValidate className="space-y-4">
                  {/* Step 1: Email / Username */}
                  {signInStep === 'email' ? (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1.5">
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
                        <p className="text-xs text-rose-500 mt-1.5 font-medium">
                          {signInErrors.email}
                        </p>
                      )}
                    </div>
                  ) : (
                    /* Step 2: Password (Zoho-style progressive step) */
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
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
                        <div className="flex items-center justify-between mb-1.5">
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
                          <p className="text-xs text-rose-500 mt-1.5 font-medium">
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

                {/* Social / SSO Row */}
                <div className="pt-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-3 text-center sm:text-left">
                    SIGN IN USING
                  </p>
                  <div className="flex items-center gap-2.5 justify-center sm:justify-start flex-wrap">
                    {/* Google */}
                    <button
                      type="button"
                      title="Sign in with Google"
                      onClick={() => alert('Google Sign-in: Please use Microsoft Entra ID SSO for your enterprise workspace.')}
                      className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs transition-transform active:scale-95"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                      </svg>
                    </button>

                    {/* LinkedIn */}
                    <button
                      type="button"
                      title="Sign in with LinkedIn"
                      onClick={() => alert('LinkedIn authentication: Enterprise single sign-on is enabled via Microsoft Entra ID.')}
                      className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs transition-transform active:scale-95 text-[#0077b5]"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/>
                      </svg>
                    </button>

                    {/* Microsoft Entra ID / 365 (Highlighted Live SSO) */}
                    <button
                      type="button"
                      title="Sign in with Microsoft Entra ID"
                      onClick={onAzureSSO}
                      className="w-10 h-10 rounded-lg border-2 border-sky-400 bg-sky-50/60 hover:bg-sky-100/80 flex items-center justify-center shadow-xs transition-transform active:scale-95 relative group cursor-pointer"
                    >
                      <svg className="w-4 h-4" viewBox="0 0 23 23">
                        <rect x="1" y="1" width="10" height="10" fill="#f25022" />
                        <rect x="12" y="1" width="10" height="10" fill="#7fba00" />
                        <rect x="1" y="12" width="10" height="10" fill="#00a4ef" />
                        <rect x="12" y="12" width="10" height="10" fill="#ffb900" />
                      </svg>
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white animate-pulse" />
                    </button>

                    {/* Apple */}
                    <button
                      type="button"
                      title="Sign in with Apple"
                      onClick={() => alert('Apple ID sign-in is available for enterprise mobile users.')}
                      className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs transition-transform active:scale-95 text-slate-800"
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.75 1.04-1.8 1.01-2.84-.96.04-2.11.64-2.77 1.41-.57.66-.99 1.73-.86 2.76.99.08 2.06-.57 2.62-1.33z" />
                      </svg>
                    </button>

                    {/* More / Dots */}
                    <button
                      type="button"
                      title="Other sign-in options"
                      onClick={() => setShowSmartSignInModal(true)}
                      className="w-10 h-10 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 flex items-center justify-center shadow-xs transition-transform active:scale-95 text-slate-400"
                    >
                      <span className="font-bold tracking-widest text-xs">•••</span>
                    </button>
                  </div>
                </div>

                {/* Switch to Sign Up */}
                <div className="pt-2 text-xs text-slate-600">
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
            {/* VIEW B: SIGN UP FORM (As per user's exact fields)     */}
            {/* ----------------------------------------------------- */}
            {mode === 'signup' && (
              <div className="space-y-4 animate-fadeIn">
                <div>
                  <h1 className="text-2xl sm:text-[28px] font-bold text-slate-900 tracking-tight">
                    Sign up
                  </h1>
                  <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                    Start your enterprise cloud journey with ZensusTech
                  </p>
                </div>

                <form onSubmit={handleSignUpSubmit} noValidate className="space-y-3">
                  {/* Field 1 & 2: First Name * & Last Name * */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                        className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 bg-white focus:outline-none transition-all ${
                          signUpErrors.firstName
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                            : 'border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-[#008cff]/15'
                        }`}
                      />
                      {signUpErrors.firstName && (
                        <p className="text-[11px] text-rose-500 mt-0.5 font-medium">
                          {signUpErrors.firstName}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                        className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 bg-white focus:outline-none transition-all ${
                          signUpErrors.lastName
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                            : 'border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-[#008cff]/15'
                        }`}
                      />
                      {signUpErrors.lastName && (
                        <p className="text-[11px] text-rose-500 mt-0.5 font-medium">
                          {signUpErrors.lastName}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Field 3: Organization Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Organization Name
                    </label>
                    <input
                      type="text"
                      value={orgName}
                      onChange={(e) => setOrgName(e.target.value)}
                      placeholder="e.g. Zensus Technologies Pvt Ltd"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:border-[#008cff] focus:ring-2 focus:ring-[#008cff]/15 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Field 4: Customer */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Customer
                    </label>
                    <input
                      type="text"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      placeholder="e.g. ZensusTech Primary / Client ID"
                      className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:border-[#008cff] focus:ring-2 focus:ring-[#008cff]/15 focus:outline-none transition-all"
                    />
                  </div>

                  {/* Field 5: Email * */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => {
                        setSignUpEmail(e.target.value);
                        if (signUpErrors.email) setSignUpErrors((p) => ({ ...p, email: '' }));
                      }}
                      placeholder="john.doe@company.com"
                      className={`w-full px-3 py-2 rounded-lg border text-xs text-slate-900 bg-white focus:outline-none transition-all ${
                        signUpErrors.email
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                          : 'border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-[#008cff]/15'
                      }`}
                    />
                    {signUpErrors.email && (
                      <p className="text-[11px] text-rose-500 mt-0.5 font-medium">
                        {signUpErrors.email}
                      </p>
                    )}
                  </div>

                  {/* Field 6: Vendor Code (DDL with MNCs: zensustech, L&T, Tata, mahindra, cybaemtech) */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Vendor Code <span className="text-slate-400 font-normal">(select partner MNC)</span>
                    </label>
                    <div className="relative">
                      <select
                        value={vendorCode}
                        onChange={(e) => setVendorCode(e.target.value as VendorCode)}
                        className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs text-slate-900 bg-white focus:border-[#008cff] focus:ring-2 focus:ring-[#008cff]/15 focus:outline-none appearance-none cursor-pointer transition-all"
                      >
                        {VENDOR_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} ({opt.value})
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400 text-xs">
                        ▼
                      </div>
                    </div>
                  </div>

                  {/* Field 7: Password * */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
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
                        className={`w-full pl-3 pr-10 py-2 rounded-lg border text-xs text-slate-900 bg-white focus:outline-none transition-all ${
                          signUpErrors.password
                            ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/15'
                            : 'border-slate-300 focus:border-[#008cff] focus:ring-2 focus:ring-[#008cff]/15'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {signUpErrors.password && (
                      <p className="text-[11px] text-rose-500 mt-0.5 font-medium">
                        {signUpErrors.password}
                      </p>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer text-[11px] text-slate-600">
                      <input
                        type="checkbox"
                        checked={agreeTerms}
                        onChange={(e) => setAgreeTerms(e.target.checked)}
                        className="mt-0.5 rounded border-slate-300 text-[#008cff] focus:ring-[#008cff]"
                      />
                      <span>
                        I agree to the <a href="#terms" className="text-[#008cff] hover:underline">Terms of Service</a> and <a href="#privacy" className="text-[#008cff] hover:underline">Privacy Policy</a>.
                      </span>
                    </label>
                    {signUpErrors.terms && (
                      <p className="text-[11px] text-rose-500 mt-0.5 font-medium">
                        {signUpErrors.terms}
                      </p>
                    )}
                  </div>

                  {/* Sign Up Submit Button */}
                  <button
                    type="submit"
                    className="w-full py-2.5 px-4 rounded-lg bg-[#008cff] hover:bg-[#007be6] active:bg-[#006fd1] text-white font-semibold text-sm shadow-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer mt-2"
                  >
                    <span>Sign up for free</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Back to Sign In */}
                <div className="pt-2 text-xs text-slate-600">
                  <span>Already have an account? </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setSignUpErrors({});
                    }}
                    className="text-[#008cff] font-bold hover:underline cursor-pointer"
                  >
                    Sign in
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Security Assurance Note */}
          <div className="pt-6 mt-6 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            <span>256-bit encryption · Microsoft Entra ID enterprise security</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: AUTO-SWIPE AUTHENTICATION SHOWCASE          */}
        {/* ========================================================= */}
        <div className="w-full md:w-[42%] bg-gradient-to-b from-[#f8fafc] via-[#f1f5f9] to-[#eef2f6] border-t md:border-t-0 md:border-l border-slate-200/90 p-6 sm:p-8 flex flex-col justify-between items-center text-center relative overflow-hidden">
          
          {/* Subtle background glow */}
          <div className="absolute top-1/4 -right-10 w-48 h-48 bg-blue-400/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-indigo-400/10 rounded-full blur-2xl pointer-events-none" />

          {/* Auto-Swiping Authentication Images Showcase */}
          <div className="w-full max-w-[280px] my-auto pt-2 relative">
            
            {/* Auto-swiping images container with smooth transition */}
            <div className="relative mx-auto w-full h-52 flex items-center justify-center overflow-hidden rounded-xl bg-white/70 p-2 border border-slate-200/80 shadow-xs">
              {slides.map((s, idx) => (
                <div
                  key={idx}
                  className={`absolute inset-0 p-3 flex items-center justify-center transition-all duration-700 ease-in-out ${
                    activeSlide === idx
                      ? 'opacity-100 scale-100 translate-x-0'
                      : activeSlide > idx
                      ? 'opacity-0 scale-95 -translate-x-full pointer-events-none'
                      : 'opacity-0 scale-95 translate-x-full pointer-events-none'
                  }`}
                >
                  <img
                    src={s.image}
                    alt={s.title}
                    className="w-full h-full object-contain drop-shadow-sm select-none"
                    loading="eager"
                  />
                </div>
              ))}

              {/* Prev / Next micro-buttons on hover */}
              <button
                type="button"
                onClick={() => setActiveSlide((prev) => (prev - 1 + slides.length) % slides.length)}
                className="absolute left-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 hover:bg-white text-slate-600 flex items-center justify-center shadow-xs transition-opacity cursor-pointer opacity-40 hover:opacity-100"
                aria-label="Previous slide"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setActiveSlide((prev) => (prev + 1) % slides.length)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white/80 hover:bg-white text-slate-600 flex items-center justify-center shadow-xs transition-opacity cursor-pointer opacity-40 hover:opacity-100"
                aria-label="Next slide"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Slide Text Content */}
            <div className="mt-4 space-y-1.5">
              <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                {slides[activeSlide].badge}
              </span>
              <h3 className="text-base font-bold text-slate-800 tracking-tight transition-all duration-300">
                {slides[activeSlide].title}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed max-w-[270px] mx-auto min-h-[38px] transition-all duration-300">
                {slides[activeSlide].subtitle}
              </p>
            </div>

            {/* "Learn more" Pill Button */}
            <div className="mt-3">
              <button
                type="button"
                onClick={() => setShowLearnMoreModal(true)}
                className="inline-block px-4 py-1.5 rounded-full text-xs font-semibold text-[#008cff] bg-white border border-[#008cff]/40 hover:bg-[#008cff]/5 shadow-xs transition-colors cursor-pointer"
              >
                Learn more
              </button>
            </div>
          </div>

          {/* Interactive Carousel Pagination Dots */}
          <div className="flex items-center justify-center gap-2 pt-4 pb-1">
            {slides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  activeSlide === idx
                    ? 'w-5 bg-[#008cff]'
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
