import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { ZohoAuthCard } from '@/components/ZohoAuthCard';

export function LoginPage({ initialMode: propMode }: { initialMode?: 'signin' | 'signup' } = {}) {
  const [location, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Determine initial mode based on current URL or props
  const initialMode = propMode || (location === '/signup' ? 'signup' : 'signin');

  const handleSignInSuccess = (userEmail: string, userPassword?: string) => {
    setIsSubmitting(true);
    sessionStorage.setItem('auth_email', userEmail);
    if (userPassword && userPassword !== 'google-oauth') {
      sessionStorage.setItem('has_session_pass', 'true');
    }
    
    // Direct smoothly to Azure Tenant verification page
    setTimeout(() => {
      setIsSubmitting(false);
      setLocation('/tent');
    }, 400);
  };

  const handleAzureSSO = () => {
    setLocation('/tent');
  };

  return (
    <ZohoAuthCard
      initialMode={initialMode}
      isSubmitting={isSubmitting}
      onSignInSuccess={handleSignInSuccess}
      onAzureSSO={handleAzureSSO}
    />
  );
}

export default LoginPage;
