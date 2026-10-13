import { useSyncExternalStore } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type PayoutDraft = {
  bank: string;
  bankCode: string;
  account: string;
  accountName: string;
};

/** In-memory store-setup draft shared by the (setup) screens. */
export type SetupDraft = {
  name: string;
  city: string;
  country_code?: string;
  country_name?: string;
  currency_code?: string;
  color: string;
  category: string;
  payout?: PayoutDraft;
  setup_token?: string;
  owner_name?: string;
  email?: string;
  phone_number?: string;
  /** Local logo image; uploaded once setup has created the store. */
  logo_uri?: string;
  /** Store username the server created, once setup has finished. */
  username?: string;
  /** When setup_token was issued; the server forgets it after an hour. */
  setup_token_at?: number;
};

const STORAGE_KEY = 'frontstore_setup_draft';
/** Server keeps setup tokens for 60 minutes; stop offering to resume a little before that. */
const SETUP_TOKEN_TTL_MS = 55 * 60 * 1000;

let draft: SetupDraft = {
  name: '',
  city: 'Nigeria',
  country_code: 'NG',
  country_name: 'Nigeria',
  currency_code: 'NGN',
  color: '#0B6E4F',
  category: 'Fashion',
};
const listeners = new Set<() => void>();

export function updateDraft(patch: Partial<SetupDraft>) {
  if (patch.setup_token && patch.setup_token !== draft.setup_token) {
    patch = { ...patch, setup_token_at: Date.now() };
  }
  draft = { ...draft, ...patch };
  listeners.forEach((l) => l());
  // Keep in-progress setup across app restarts, while its token is still valid
  if (draft.setup_token) {
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(draft)).catch(() => {});
  }
}

/** Restore an in-progress setup saved before the app was closed. Returns true if one can be resumed. */
export async function loadDraft(): Promise<boolean> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (!saved) return false;
    const restored: SetupDraft = JSON.parse(saved);
    if (!restored.setup_token || Date.now() - (restored.setup_token_at ?? 0) > SETUP_TOKEN_TTL_MS) {
      await AsyncStorage.removeItem(STORAGE_KEY);
      return false;
    }
    draft = { ...draft, ...restored };
    listeners.forEach((l) => l());
    return true;
  } catch {
    return false;
  }
}

/** Setup is done: the token is spent, so forget it (other fields stay for the "live" screen). */
export function finishDraft(patch: Partial<SetupDraft> = {}) {
  draft = { ...draft, ...patch, setup_token: undefined, setup_token_at: undefined };
  listeners.forEach((l) => l());
  AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
}

export function useDraft(): SetupDraft {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => { listeners.delete(l); }; },
    () => draft,
  );
}

/** "Mama V" -> "mamav" (strip accents, keep a-z0-9, max 30). */
export function toSlug(name: string) {
  return (
    name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30) || 'yourstore'
  );
}

/** First letter for the logo tile, keeping accents ("Mama V" -> "M"). */
export function initialOf(name: string) {
  const first = Array.from(name.trim().normalize('NFC'))[0];
  return (first ?? 'F').toUpperCase();
}
