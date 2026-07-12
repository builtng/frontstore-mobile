import api from './api';
import * as SecureStore from 'expo-secure-store';
import { BuyerAuthResponse } from '@/types/buyer';

const withBuyerToken = async (config: Record<string, any>) => {
  const token = await SecureStore.getItemAsync('frontstore_buyer_token');
  return {
    ...config,
    headers: { ...config.headers, Authorization: `Bearer ${token}` },
  };
};

export const buyerApi = {
  // ── Email OTP, identified by phone (primary auth) ─────────────────────────
  sendOtp: async (payload: {
    phone_number: string;
    country_dial_code?: string;
    email?: string;
  }): Promise<{ phone: string; is_new_user: boolean; needs_email: boolean; email?: string }> => {
    const { data } = await api.post('/auth/send-otp', payload);
    return data;
  },

  verifyOtp: async (payload: {
    phone_number: string;
    otp: string;
    country_dial_code?: string;
  }): Promise<{ buyer: BuyerUser; token: string }> => {
    const { data } = await api.post('/auth/verify-otp', payload);
    return data;
  },

  // ── Legacy (kept for backward compat, not exposed in UI) ─────────────────
  register: async (payload: {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
  }): Promise<BuyerAuthResponse> => {
    const { data } = await api.post('/buyer/register', payload);
    return data;
  },

  login: async (payload: { email: string; password: string }): Promise<BuyerAuthResponse> => {
    const { data } = await api.post('/buyer/login', payload);
    return data;
  },

  logout: async () => {
    const cfg = await withBuyerToken({});
    await api.post('/buyer/logout', {}, cfg);
  },

  getProfile: async () => {
    const cfg = await withBuyerToken({});
    const { data } = await api.get('/buyer/me', cfg);
    return data;
  },

  getOrders: async () => {
    const cfg = await withBuyerToken({});
    const { data } = await api.get('/buyer/orders', cfg);
    return data;
  },

  getOrder: async (id: number) => {
    const cfg = await withBuyerToken({});
    const { data } = await api.get(`/buyer/orders/${id}`, cfg);
    return data;
  },
};
