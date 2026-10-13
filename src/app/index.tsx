import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { getUserMode, hasSeenOnboarding } from '@/api/authStore';
import { checkSession } from '@/api/auth';
import { loadDraft } from '@/features/setup/draft';

type Dest = '/home' | '/shop' | '/choose-mode' | '/login' | '/welcome';

export default function Index() {
  const [dest, setDest] = useState<Dest | null>(null);

  useEffect(() => {
    async function route() {
      try {
        // Ask the server rather than trusting whatever token is saved
        const session = await checkSession();
        if (session !== 'invalid') {
          setDest((await getUserMode()) === 'buyer' ? '/shop' : '/home');
          return;
        }
        // Verified their email but closed the app before finishing setup
        if (await loadDraft()) {
          setDest('/choose-mode');
          return;
        }
        setDest((await hasSeenOnboarding()) ? '/login' : '/welcome');
      } catch {
        setDest('/welcome');
      }
    }
    route();
  }, []);

  if (!dest) {
    return (
      <View className="flex-1 items-center justify-center bg-bg">
        <ActivityIndicator size="large" color="#0B6E4F" />
      </View>
    );
  }

  return <Redirect href={dest} />;
}
