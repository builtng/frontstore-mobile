import '../global.css';
import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts, InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold } from '@expo-google-fonts/instrument-sans';
import { PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { UpdateNotification } from '../components/UpdateNotification';
import { getToken } from '@/api/authStore';
import { isLaunchNotification, notificationUrl, registerForPush, watchPushToken } from '@/lib/push';
import { queryClient } from '@/lib/queryClient';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded] = useFonts({
    InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold,
    PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold,
  });
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  // Keep this phone's push token registered
  useEffect(() => {
    getToken().then((t) => {
      if (t) registerForPush();
    });
    return watchPushToken();
  }, []);

  // A notification tapped while the app is running opens its screen
  // (data.url, e.g. /order/123 or /shop/track/123). Waits for the navigator,
  // which only mounts once fonts are loaded; launch taps go through app/index.
  useEffect(() => {
    if (!loaded) return;
    const sub = Notifications.addNotificationResponseReceivedListener((res) => {
      const url = notificationUrl(res);
      if (url && !isLaunchNotification(res)) router.push(url as any);
    });
    return () => sub.remove();
  }, [loaded]);
  if (!loaded) return null;
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#F6F3EC' } }}>
        <Stack.Screen name="(seller)/product/[id]/index" options={{ presentation: 'transparentModal', animation: 'fade' }} />
        <Stack.Screen name="switch" options={{ presentation: 'transparentModal', animation: 'fade' }} />
      </Stack>
      <UpdateNotification />
    </QueryClientProvider>
  );
}

