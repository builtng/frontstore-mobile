export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: 'merchant' | 'admin';
  plan: 'free' | 'pro_monthly' | 'pro_yearly';
  store?: Store;
  created_at: string;
}

export interface Store {
  id: number;
  name: string;
  username: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  template?: string;
  business_type?: string;
  is_active: boolean;
  is_verified: boolean;
  custom_domain?: string;
  currency: string;
  whatsapp_number?: string;
  url: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
}

export interface OTPPayload {
  email: string;
  otp: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  message: string;
  data?: {
    user: User;
    store: Store;
  };
}
