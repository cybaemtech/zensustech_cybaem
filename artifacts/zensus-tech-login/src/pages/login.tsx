import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ZohoAuthCard } from '@/components/ZohoAuthCard';
import { login, signup } from '@/lib/auth-api';

export function LoginPage({ initialMode: propMode }: { initialMode?: 'signin' | 'signup' } = {}) {
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const initialMode = propMode || (location === '/signup' ? 'signup' : 'signin');

  /**
   * Called by ZohoAuthCard when "Sign in" is submitted (email + password).
   */
  const handleSignInSuccess = async (userEmail: string, userPassword?: string) => {
    setIsSubmitting(true);
    try {
      const res = await login(userEmail, userPassword || '');

      // Store basic user info for ProtectedRoute checks
      if (res.user) {
        sessionStorage.setItem('auth_user', JSON.stringify(res.user));
        sessionStorage.setItem('is_authenticated', 'true');
      }

      if (res.needs_verification) {
        // Email not yet verified — go to OTP screen
        sessionStorage.setItem('pending_verification_email', userEmail);
        if (res.dev_otp) {
          sessionStorage.setItem('pending_dev_otp', res.dev_otp);
        }
        setLocation('/otp-verify');
      } else if (res.has_tenant) {
        // Returning user with active tenant → straight to dashboard
        setLocation('/dashboard');
      } else {
        // Verified but no tenant yet
        setLocation('/connect-tenant');
      }
    } catch (err: unknown) {
      // Surface the error back to ZohoAuthCard via thrown error
      // The card itself handles global errors via alert for now
      const msg = err instanceof Error ? err.message : 'Sign-in failed. Please check your credentials.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Called by ZohoAuthCard when the Sign Up form is submitted.
   */
  const handleSignUp = async (payload: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    role?: string;
    phone?: string;
    organization?: string;
    customer?: string;
    vendorCode?: string;
  }) => {
    setIsSubmitting(true);
    try {
      const res = await signup({
        first_name: payload.firstName,
        last_name: payload.lastName,
        email: payload.email,
        password: payload.password,
        phone: payload.phone,
        organization: payload.organization,
        customer: payload.customer,
        vendor_code: payload.vendorCode,
        role: payload.role || 'END_CUSTOMER',
      });
      // Redirect to OTP verification
      sessionStorage.setItem('pending_verification_email', payload.email);
      if (res.dev_otp) {
        sessionStorage.setItem('pending_dev_otp', res.dev_otp);
      }
      setLocation('/otp-verify');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAzureSSO = () => {
    setLocation('/tent');
  };

  return (
    <ZohoAuthCard
      initialMode={initialMode}
      isSubmitting={isSubmitting}
      onSignInSuccess={handleSignInSuccess}
      onSignUp={handleSignUp}
      onAzureSSO={handleAzureSSO}
    />
  );
}

export default LoginPage;
