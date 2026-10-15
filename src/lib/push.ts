import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import { apiDelete, apiPost } from '@/api/client';

const PUSH_TOKEN_KEY = 'frontstore_push_token';
const HANDLED_KEY = 'frontstore_handled_notification';

// Show notifications while the app is open too.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowAlert: true, shouldPlaySound: true, shouldSetBadge: false }),
});

/**
 * Ask for permission, get this phone's Expo push token and register it with
 * the backend for the signed-in account. Safe to call repeatedly; does
 * nothing on simulators or if the user says no.
 *
 * Android delivery goes through Firebase, so Android builds need
 * google-services.json (see app.config.js); without it getting the token
 * fails and the app carries on without push.
 */
let registering = false;

export async function registerForPush(): Promise<void> {
  if (registering) return;
  registering = true;
  try {
    if (!Device.isDevice) return;

    if (Platform.OS === 'android') {
      // Must exist before asking permission on Android 13+; matches defaultChannel in app.json
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Orders and payouts',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#0B6E4F',
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') ({ status } = await Notifications.requestPermissionsAsync());
    if (status !== 'granted') return;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

    await saveToken(token);
  } catch (err) {
    // The app works without push.
    console.warn('Push registration skipped', err);
  } finally {
    registering = false;
  }
}

async function saveToken(token: string) {
  // Still sent when unchanged: the backend ties the token to whoever is signed in now
  await apiPost('/user/push-tokens', { token, device_type: Platform.OS });
  await SecureStore.setItemAsync(PUSH_TOKEN_KEY, token);
}

/**
 * Firebase can rotate a phone's token; re-register when it does so pushes
 * keep arriving. Returns the unsubscribe function.
 */
export function watchPushToken(): () => void {
  // Fetching a token can itself fire this event; `registering` stops that looping
  const sub = Notifications.addPushTokenListener(() => {
    registerForPush();
  });
  return () => sub.remove();
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

/** The app screen a notification points at (data.url), if it's one of ours. */
export function notificationUrl(res: Notifications.NotificationResponse | null): string | null {
  const url = res?.notification.request.content.data?.url;
  // In-app paths only (e.g. /order/123, /shop/track/123), never another site
  return typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') ? url : null;
}

/**
 * A notification tapped while the app was closed. Held until the start-up
 * screen has checked the session, then opened from there.
 */
let pendingUrl: string | null = null;
let launchId: string | null = null;

/** True for the notification that launched the app (app/index opens that one). */
export function isLaunchNotification(res: Notifications.NotificationResponse): boolean {
  return !!launchId && res.notification.request.identifier === launchId;
}

let launchCheck: Promise<void> | null = null;

/** Look up the launch notification once; later calls get the same promise. */
export function holdLaunchNotification(): Promise<void> {
  launchCheck ??= readLaunchNotification();
  return launchCheck;
}

async function readLaunchNotification(): Promise<void> {
  const res = await Notifications.getLastNotificationResponseAsync().catch(() => null);
  const url = notificationUrl(res);
  if (!res || !url) return;
  // The last response is kept between launches; only act on each one once
  const id = res.notification.request.identifier;
  launchId = id;
  const handled = await SecureStore.getItemAsync(HANDLED_KEY).catch(() => null);
  if (handled === id) return;
  await SecureStore.setItemAsync(HANDLED_KEY, id).catch(() => {});
  pendingUrl = url;
}

/** Take (and clear) the screen a launch notification asked for. */
export function takeLaunchNotificationUrl(): string | null {
  const url = pendingUrl;
  pendingUrl = null;
  return url;
}
