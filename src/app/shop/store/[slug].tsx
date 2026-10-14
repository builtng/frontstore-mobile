import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen, T } from '@/components/ui';
import { openStore } from '@/lib/storefront';

/**
 * Stores are shopped on the website, not in the app (no in-app checkout or
 * payments). This route stays so links and notifications that point here
 * still work: it opens the store in an in-app browser tab, then steps back.
 */
export default function StoreLauncher() {
  const { slug, path } = useLocalSearchParams<{ slug: string; path?: string }>();

  useEffect(() => {
    let done = false;
    (async () => {
      if (slug) await openStore(slug, path);
      if (done) return;
      if (router.canGoBack()) router.back();
      else router.replace('/shop');
    })();
    return () => {
      done = true;
    };
  }, [slug, path]);

  return (
    <Screen>
      <View className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator size="large" color="#0B6E4F" />
        <T className="text-sm text-muted">Opening the store…</T>
      </View>
    </Screen>
  );
}
