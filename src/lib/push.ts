import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { apiDelete, apiPost } from '@/api/client';

const PUSH_TOKEN_KEY = 'frontstore_push_token';

// Show notifications while the app is open too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/**
 * Ask for permission, get this phone's Expo push token and register it with
 * the backend for the signed-in account. Safe to call repeatedly; does
 * nothing on simulators, on web, or if the user says no.
 */
export async function registerForPush(): Promise<void> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Orders and updates',
        importance: Notifications.AndroidImportance.HIGH,
        lightColor: '#0B6E4F',
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await apiPost('/user/push-tokens', { token, device_type: Platform.OS });
    await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
  } catch (err) {
    // e.g. Android without Firebase set up yet; the app works without push.
    console.warn('Push registration skipped', err);
  }
}

/** Stop sending pushes for this account to this phone (call before signing out). */
export async function unregisterPush(): Promise<void> {
  try {
    const token = await SecureStore.getItemAsync(PUSH_TOKEN_KEY);
    if (!token) return;
    await apiDelete('/user/push-tokens', { token });
    await SecureStore.deleteItemAsync(PUSH_TOKEN_KEY);
  } catch (err) {
    console.warn('Push unregister failed', err);
  }
}
