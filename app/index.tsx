import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';

export default function Index() {
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();

  useEffect(() => {
    loadStoredAuth();
  }, []);

  if (isLoading) return null;

  // Merchants go straight to their dashboard
  if (isAuthenticated) return <Redirect href="/(merchant)" />;

  // Everyone else — customers and guests — opens the public marketplace
  return <Redirect href="/(public)" />;
}
