import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { getToken, getUserMode } from '@/api/authStore';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [mode, setMode] = useState<'seller' | 'buyer'>('seller');

  useEffect(() => {
    async function checkAuth() {
      try {
        const token = await getToken();
        const userMode = await getUserMode();
        setMode(userMode);
        setAuthenticated(!!token);
      } catch {
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="#0B6E4F" />
      </View>
    );
  }

  if (authenticated) {
    return <Redirect href={mode === 'buyer' ? '/shop' : '/home'} />;
  }

  return <Redirect href="/welcome" />;
}
