import { ApiError, apiGet, apiPost, apiPostRaw } from './client';
import { getToken, setToken, removeToken, setUserMode } from './authStore';
import { User, Store } from './types';
import { registerForPush, unregisterPush } from '@/lib/push';

export interface AuthResponse {
  token?: string;
  user?: User;
  store?: Store | null;
  setup_token?: string;
  is_new_user?: boolean;
  message?: string;
}

/**
 * POST to an endpoint that may issue a Sanctum token. Laravel returns
 * `{ token, is_new_user, setup_token, data: { user, store } }`, so flatten it,
 * save the token and set the mode to match the account.
 */
async function authPost(url: string, body?: any): Promise<AuthResponse> {
  const json = await apiPostRaw<any>(url, body);
  const res: AuthResponse = { ...json, ...(json?.data ?? {}) };
  res.token = json?.token ?? json?.data?.token;

  if (res.token) {
    await setToken(res.token);
    if (res.user) await setUserMode(res.store ? 'seller' : 'buyer');
    registerForPush();
  }
  return res;
}

/** Request an email OTP verification code */
export async function sendEmailOtp(email: string, name?: string): Promise<any> {
  return apiPost('/auth/send-email-otp', { email, name });
}

export interface PhoneOtpResponse {
  /** No email on file for this number; ask for one and call again with it. */
  needs_email?: boolean;
  is_new_user?: boolean;
  /** Where the code was emailed. */
  email?: string;
  message?: string;
}

/**
 * Request a login code for a phone number. The backend emails the code to the
 * address on that account, or to `email` when the account has none yet.
 */
export async function sendPhoneOtp(phoneNumber: string, email?: string): Promise<PhoneOtpResponse> {
  return apiPost('/auth/send-otp', { phone_number: phoneNumber, email });
}

/** Verify OTP code (email or phone) */
export async function verifyOtp(params: {
  email?: string;
  phone_number?: string;
  otp: string;
}): Promise<AuthResponse> {
  const endpoint = params.email ? '/auth/verify-email-otp' : '/auth/verify-otp';
  return authPost(endpoint, params);
}

/** Complete setup for a buyer / shopper */
export async function completeBuyerSetup(params: {
  setup_token: string;
  name?: string;
}): Promise<AuthResponse> {
  return authPost('/auth/complete-buyer-setup', params);
}

/** Password-based login */
export async function loginWithPassword(loginIdentifier: string, password: string): Promise<AuthResponse> {
  return authPost('/auth/login', {
    login_identifier: loginIdentifier,
    password,
  });
}

/** Google OAuth login */
export async function loginWithGoogle(params: {
  email: string;
  name?: string;
  google_id?: string;
  avatar_url?: string;
  id_token?: string;
}): Promise<AuthResponse> {
  return authPost('/auth/google', params);
}

/** Apple OAuth login */
export async function loginWithApple(params: {
  email?: string;
  name?: string;
  apple_id?: string;
  identity_token?: string;
}): Promise<AuthResponse> {
  return authPost('/auth/apple', params);
}

/** Fetch authenticated user profile */
export async function getMe(): Promise<{ user: User; store: Store | null } | null> {
  const token = await getToken();
  if (!token) return null;
  try {
    return await apiGet<{ user: User; store: Store | null }>('/auth/me', undefined, { skipAuthRedirect: true });
  } catch {
    return null;
  }
}

/**
 * Check the saved token with the server. A rejected token is removed; if the
 * server can't be reached the token is kept so the app still opens offline.
 */
export async function checkSession(): Promise<'valid' | 'invalid' | 'offline'> {
  const token = await getToken();
  if (!token) return 'invalid';
  try {
    await apiGet('/auth/me', undefined, { skipAuthRedirect: true, timeout: 10000 });
    return 'valid';
  } catch (err) {
    if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
      await removeToken();
      return 'invalid';
    }
    return 'offline';
  }
}

/** Logout user */
export async function logout(): Promise<void> {
  try {
    await unregisterPush();
    await apiPost('/auth/logout');
  } catch (err) {
    console.warn('Logout endpoint error', err);
  } finally {
    await removeToken();
  }
}

export interface DeleteAccountPreview {
  can_delete: boolean;
  blockers: string[];
  /** Paid orders are kept as records; the store is hidden and personal details wiped. */
  keeps_orders: boolean;
  paid_orders: number;
  stores: { id: string; name: string; username: string }[];
}

/** What deleting this account would do, and anything to settle first */
export async function getDeleteAccountPreview(): Promise<DeleteAccountPreview> {
  return apiGet<DeleteAccountPreview>('/user/delete-account');
}

/** Permanently delete this account, then sign out locally */
export async function deleteAccount(): Promise<void> {
  await apiPost('/user/delete-account', { confirm: 'DELETE' });
  await removeToken();
}

/** Everything Frontstore holds about this account, as JSON */
export async function exportMyData(): Promise<Record<string, unknown>> {
  return apiPost('/user/export-data');
}
