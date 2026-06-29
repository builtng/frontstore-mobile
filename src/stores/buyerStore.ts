import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { BuyerUser } from '@/types/buyer';

interface BuyerStore {
  buyer: BuyerUser | null;
  buyerToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setBuyerAuth: (buyer: BuyerUser, token: string) => Promise<void>;
  buyerLogout: () => Promise<void>;
  loadStoredBuyerAuth: () => Promise<boolean>;
}

const TOKEN_KEY = 'frontstore_buyer_token';
const BUYER_KEY = 'frontstore_buyer_user';

export const useBuyerStore = create<BuyerStore>((set) => ({
  buyer: null,
  buyerToken: null,
  isAuthenticated: false,
  isLoading: false,

  setBuyerAuth: async (buyer, token) => {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
    await SecureStore.setItemAsync(BUYER_KEY, JSON.stringify(buyer));
    set({ buyer, buyerToken: token, isAuthenticated: true });
  },

  buyerLogout: async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(BUYER_KEY);
    set({ buyer: null, buyerToken: null, isAuthenticated: false });
  },

  loadStoredBuyerAuth: async () => {
    try {
      const [token, buyerJson] = await Promise.all([
        SecureStore.getItemAsync(TOKEN_KEY),
        SecureStore.getItemAsync(BUYER_KEY),
      ]);
      if (token && buyerJson) {
        const buyer: BuyerUser = JSON.parse(buyerJson);
        set({ buyer, buyerToken: token, isAuthenticated: true });
        return true;
      }
    } catch {}
    return false;
  },
}));
