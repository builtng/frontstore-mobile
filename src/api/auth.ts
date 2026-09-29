import { apiGet, apiPost } from './client';
import { setToken, removeToken, setUserMode } from './authStore';
import { User, Store } from './types';

export interface AuthResponse {
  token?: string;
  user?: User;
  store?: Store | null;
  setup_token?: string;
  is_new_user?: boolean;
  message?: string;
}

/** Request an email OTP verification code */
export async function sendEmailOtp(email: string, name?: string): Promise<any> {
  return apiPost('/auth/send-email-otp', { email, name });
}

/** Request a WhatsApp OTP verification code */
export async function sendWhatsAppOtp(phoneNumber: string): Promise<any> {
  return apiPost('/auth/send-otp', { phone_number: phoneNumber });
}

/** Verify OTP code (email or phone) */
export async function verifyOtp(params: {
  email?: string;
  phone_number?: string;
  otp: string;
}): Promise<AuthResponse> {
  const endpoint = params.email ? '/auth/verify-email-otp' : '/auth/verify-otp';
  const data: AuthResponse = await apiPost(endpoint, params);

  if (data.token) {
    await setToken(data.token);
  }
  return data;
}

/** Password-based login */
export async function loginWithPassword(loginIdentifier: string, password: string): Promise<AuthResponse> {
  const data: AuthResponse = await apiPost('/auth/login', {
    login_identifier: loginIdentifier,
    password,
  });

  if (data.token) {
    await setToken(data.token);
  }
  return data;
}

/** Google OAuth login */
export async function loginWithGoogle(params: {
  email: string;
  name?: string;
  google_id?: string;
  avatar_url?: string;
  id_token?: string;
}): Promise<AuthResponse> {
  const data: AuthResponse = await apiPost('/auth/google', params);
  if (data.token) {
    await setToken(data.token);
  }
  return data;
}

/** Fetch authenticated user profile */
export async function getMe(): Promise<{ user: User; store: Store | null }> {
  return apiGet<{ user: User; store: Store | null }>('/auth/me');
}

/** Logout user */
export async function logout(): Promise<void> {
  try {
    await apiPost('/auth/logout');
  } catch (err) {
    console.warn('Logout endpoint error', err);
  } finally {
    await removeToken();
  }
}
