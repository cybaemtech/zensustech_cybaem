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
        // Email not yet verified – go to OTP screen
        sessionStorage.setItem('pending_verification_email', userEmail);
        setLocation('/otp-verify');
      } else if (res.has_tenant && res.tenant) {
        // Returning user with existing tenant – 2nd attempt:
        // No need to enter tenant ID, client ID, client secret!
        // Directly pre-load credentials and redirect to /dashboard
        sessionStorage.setItem('auth_email', userEmail);
        sessionStorage.setItem('azure_tenant_id', res.tenant.tenant_id);
        if (res.tenant.client_id) {
          sessionStorage.setItem('azure_client_id', res.tenant.client_id);
        }
        if (res.tokens?.mgmt_token) {
          sessionStorage.setItem('mgmt_token', res.tokens.mgmt_token);
        }
        if (res.tokens?.graph_token) {
          sessionStorage.setItem('graph_token', res.tokens.graph_token);
        }
        if (res.tenant.tenant_name) {
          sessionStorage.setItem(
            'azure_org_details',
            JSON.stringify({ displayName: res.tenant.tenant_name })
          );
        }
        setLocation('/dashboard');
      } else {
        // First-time user (no tenant yet) – go to /tent to connect Azure
        sessionStorage.setItem('auth_email', userEmail);
        setLocation('/tent');
      }
    } catch (err: unknown) {
      // Re-throw so ZohoAuthCard can display the error inline (no alert popup)
      throw err;
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
      await signup({
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
      // Store user session email and redirect directly to /tent as requested
      sessionStorage.setItem('auth_email', payload.email);
      sessionStorage.setItem('pending_verification_email', payload.email);
      sessionStorage.setItem('is_authenticated', 'true');
      setLocation('/tent');
    } catch (err: unknown) {
      // Re-throw so ZohoAuthCard can display inline error (not alert)
      throw err;
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
