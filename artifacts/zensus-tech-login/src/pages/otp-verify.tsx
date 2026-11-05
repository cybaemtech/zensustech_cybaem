import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'wouter';
import { ShieldCheck, RefreshCw, ArrowLeft, Check } from 'lucide-react';
import { verifyOtp, resendOtp } from '@/lib/auth-api';

export function OtpVerifyPage() {
  const [, setLocation] = useLocation();
  const email = sessionStorage.getItem('pending_verification_email') || '';
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [resendCooldown, setResendCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) {
      setLocation('/');
    }
  }, [email, setLocation]);

  // OTP expiry countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const t = setInterval(() => setTimeLeft((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [timeLeft]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown((p) => p - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setError('');
    if (digit && idx < 5) {
      inputRefs.current[idx + 1]?.focus();
    }
    // Auto-submit when all 6 filled
    if (digit && idx === 5 && next.every((d) => d !== '')) {
      handleVerify(next.join(''));
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(''));
      handleVerify(pasted);
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code ?? otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter all 6 digits.');
      return;
    }
    if (timeLeft <= 0) {
      setError('OTP has expired. Please request a new one.');
      return;
    }
    setIsVerifying(true);
    setError('');
    try {
      const res = await verifyOtp(email, otpCode);
      setSuccess('Email verified! Redirecting...');
      sessionStorage.removeItem('pending_verification_email');
      if (res.user) {
        sessionStorage.setItem('auth_user', JSON.stringify(res.user));
        sessionStorage.setItem('is_authenticated', 'true');
      }
      setTimeout(() => {
        setLocation(res.redirect || (res.has_tenant ? '/dashboard' : '/connect-tenant'));
      }, 1200);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError('');
    try {
      await resendOtp(email);
      setTimeLeft(300);
      setResendCooldown(60);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-[#f8fafc] font-sans">
      {/* Background pattern */}
      <svg className="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-20" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="poly-grid-otp" width="160" height="160" patternUnits="userSpaceOnUse">
            <path d="M 0 0 L 160 0 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <path d="M 0 160 L 160 160 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <path d="M 0 0 L 0 160 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
            <path d="M 160 0 L 160 160 L 80 80 Z" fill="none" stroke="#94a3b8" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#poly-grid-otp)" />
      </svg>

      <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-[0_12px_45px_-8px_rgba(15,23,42,0.12)] border border-slate-200/90 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#008cff] to-indigo-600 p-6 text-white text-center">
          <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-bold">Verify Your Email</h1>
          <p className="text-blue-100 text-sm mt-2">
            Enter the 6-digit verification code sent to your email address.
          </p>
        </div>

        <div className="p-6">
          {/* Success message */}
          {success && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          {/* Timer */}
          <div className="text-center mb-5">
            {timeLeft > 0 ? (
              <span className={`text-sm font-semibold ${timeLeft < 60 ? 'text-rose-500' : 'text-slate-600'}`}>
                Code expires in: <span className="tabular-nums">{formatTime(timeLeft)}</span>
              </span>
            ) : (
              <span className="text-sm font-semibold text-rose-500">Code expired. Please resend.</span>
            )}
          </div>

          {/* 6-digit OTP input boxes */}
          <div className="flex gap-2.5 justify-center mb-5" onPaste={handlePaste}>
            {otp.map((digit, idx) => (
              <input
                key={idx}
                ref={(el) => { inputRefs.current[idx] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                className={`w-11 h-13 text-center text-xl font-bold rounded-xl border-2 transition-all focus:outline-none
                  ${digit ? 'border-[#008cff] bg-blue-50 text-[#008cff]' : 'border-slate-300 bg-white text-slate-900'}
                  ${error ? 'border-rose-400' : ''}
                  focus:border-[#008cff] focus:ring-2 focus:ring-[#008cff]/20`}
                style={{ height: '52px' }}
                autoFocus={idx === 0}
              />
            ))}
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium text-center">
              {error}
            </div>
          )}

          {/* Verify button */}
          <button
            type="button"
            onClick={() => handleVerify()}
            disabled={isVerifying || otp.some((d) => !d) || timeLeft <= 0}
            className="w-full py-2.5 px-4 rounded-xl bg-[#008cff] hover:bg-[#007be6] text-white font-semibold text-sm shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isVerifying ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Verifying...</span>
              </>
            ) : (
              <span>Verify & Continue</span>
            )}
          </button>

          {/* Resend */}
          <div className="mt-4 text-center">
            <span className="text-xs text-slate-500">Didn't receive the code? </span>
            <button
              type="button"
              onClick={handleResend}
              disabled={isResending || resendCooldown > 0}
              className="text-xs font-semibold text-[#008cff] hover:underline disabled:text-slate-400 disabled:no-underline inline-flex items-center gap-1"
            >
              {isResending ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : resendCooldown > 0 ? (
                `Resend in ${resendCooldown}s`
              ) : (
                'Resend OTP'
              )}
            </button>
          </div>

          {/* Back to sign in */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setLocation('/')}
              className="text-xs text-slate-400 hover:text-slate-600 inline-flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3 h-3" />
              Back to Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OtpVerifyPage;
