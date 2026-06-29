import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { User, Store } from '@/types/auth';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  updateStore: (store: Partial<Store>) => void;
  logout: () => Promise<void>;
  loadStoredAuth: () => Promise<boolean>;
}

const TOKEN_KEY = 'frontstore_auth_token';
const USER_KEY = 'frontstore_user';

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: async (user, token) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    set({ user, token, isAuthenticated: true, isLoading: false });
  },

  updateUser: (partial) => {
    const current = get().user;
    if (!current) return;
    const updated = { ...current, ...partial };
    set({ user: updated });
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
  },

  updateStore: (storePartial) => {
    const current = get().user;
    if (!current) return;
    const updated = {
      ...current,
      store: current.store ? { ...current.store, ...storePartial } : undefined,
    };
    set({ user: updated });
    SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
  },

  logout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(USER_KEY);
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  loadStoredAuth: async () => {
    try {
      const [token, userJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (token && userJson) {
        const user: User = JSON.parse(userJson);
        set({ user, token, isAuthenticated: true, isLoading: false });
        return true;
      }
    } catch {
      // ignore
    }
    set({ isLoading: false });
    return false;
  },
}));
