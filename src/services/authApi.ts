import api from './api';
import { AuthResponse } from '@/types/auth';

export const authApi = {
  // ── Email OTP, identified by phone (primary auth flow) ──────────────────
  sendOtp: async (payload: {
    phone_number: string;
    country_dial_code?: string;
    email?: string;
  }): Promise<{
    is_new_user: boolean;
    phone: string;
    message: string;
    needs_email: boolean;
    email?: string;
  }> => {
    const { data } = await api.post('/auth/send-otp', payload);
    return data;
  },

  sendEmailOtp: async (payload: {
    email: string;
    store_name?: string;
    username?: string;
  }): Promise<{
    is_new_user: boolean;
    email: string;
    message: string;
  }> => {
    const { data } = await api.post('/auth/send-email-otp', payload);
    return data;
  },

  verifyEmailOtp: async (payload: {
    email: string;
    otp: string;
    store_name?: string;
    username?: string;
  }): Promise<{
    is_new_user: boolean;
    token?: string;
    setup_token?: string;
    email?: string;
    data?: { user: any; store: any };
  }> => {
    const { data } = await api.post('/auth/verify-email-otp', payload);
    return data;
  },

  verifyOtp: async (payload: {
    phone_number: string;
    otp: string;
    country_dial_code?: string;
  }): Promise<{
    is_new_user: boolean;
    token?: string;
    setup_token?: string;
    phone_number?: string;
    data?: { user: any; store: any };
  }> => {
    const { data } = await api.post('/auth/verify-otp', payload);
    return data;
  },

  completeSetup: async (payload: {
    setup_token: string;
    name: string;
    store_name: string;
    username: string;
    business_persona?: string;
  }): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/complete-setup', payload);
    return data;
  },

  // ── Legacy email/password (kept for admin access) ───────────────────────
  login: async (payload: { email: string; password: string }): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', payload);
    return data;
  },

  register: async (payload: any): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/signup', payload);
    return data;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  me: async () => {
    const { data } = await api.get('/auth/me');
    return data;
  },

  changePassword: async (payload: {
    current_password: string;
    password: string;
    password_confirmation: string;
  }) => {
    const { data } = await api.post('/auth/change-password', payload);
    return data;
  },
};
