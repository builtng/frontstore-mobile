import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'frontstore_auth_token';
const USER_MODE_KEY = 'frontstore_user_mode'; // 'seller' | 'buyer'

export async function getToken(): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(TOKEN_KEY) : null;
    }
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to get auth token', err);
    return null;
  }
}

export async function setToken(token: string): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(TOKEN_KEY, token);
      return;
    }
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    console.warn('Failed to set auth token', err);
  }
}

export async function removeToken(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.removeItem(TOKEN_KEY);
      return;
    }
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.warn('Failed to remove auth token', err);
  }
}

export async function getUserMode(): Promise<'seller' | 'buyer'> {
  try {
    let mode: string | null = null;
    if (Platform.OS === 'web') {
      mode = typeof localStorage !== 'undefined' ? localStorage.getItem(USER_MODE_KEY) : null;
    } else {
      mode = await SecureStore.getItemAsync(USER_MODE_KEY);
    }
    return (mode === 'buyer' ? 'buyer' : 'seller') as 'seller' | 'buyer';
  } catch {
    return 'seller';
  }
}

export async function setUserMode(mode: 'seller' | 'buyer'): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(USER_MODE_KEY, mode);
      return;
    }
    await SecureStore.setItemAsync(USER_MODE_KEY, mode);
  } catch (err) {
    console.warn('Failed to set user mode', err);
  }
}

const ONBOARDING_SEEN_KEY = 'frontstore_has_seen_onboarding';

export async function hasSeenOnboarding(): Promise<boolean> {
  try {
    if (Platform.OS === 'web') {
      return typeof localStorage !== 'undefined' ? localStorage.getItem(ONBOARDING_SEEN_KEY) === 'true' : false;
    }
    const val = await SecureStore.getItemAsync(ONBOARDING_SEEN_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setHasSeenOnboarding(seen: boolean = true): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof localStorage !== 'undefined') localStorage.setItem(ONBOARDING_SEEN_KEY, seen ? 'true' : 'false');
      return;
    }
    await SecureStore.setItemAsync(ONBOARDING_SEEN_KEY, seen ? 'true' : 'false');
  } catch (err) {
    console.warn('Failed to set onboarding seen', err);
  }
}

