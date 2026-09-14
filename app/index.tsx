import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  if (isLoading) {
    return null;
  }

  // Authenticated merchants go straight to their dashboard
  if (isAuthenticated) {
    return <Redirect href="/(merchant)" />;
  }

  // Unauthenticated users land on the onboarding / welcome flow
  return <Redirect href="/(auth)/welcome" />;
}

