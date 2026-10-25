import { apiGet, apiPost, apiPostRaw, apiPut, apiPutRaw } from './client';
import { imageMime } from './products';
import { Store, Bank, Country, Currency, StoreNotification } from './types';
import { setToken, setUserMode } from './authStore';
import { registerForPush } from '@/lib/push';

/**
 * Is a store username free? true / false, or null when we couldn't tell
 * (offline, server error): the server checks again when the store is created.
 */
export async function checkSubdomainAvailable(username: string): Promise<boolean | null> {
  if (!username || username.trim().length < 3) return false;
  try {
    const slug = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const store = await apiGet(`/public/store/${slug}`);
    // If store exists (200), domain is taken
    return !store;
  } catch (err: any) {
    // 404 means no store has it
    if (err.status === 404) return true;
    return null;
  }
}

/** Get list of supported countries */
export async function getCountries(): Promise<Country[]> {
  return apiGet<Country[]>('/meta/countries');
}

/** Get list of supported currencies */
export async function getCurrencies(): Promise<Currency[]> {
  return apiGet<Currency[]>('/meta/currencies');
}

/** Detect requester's country and default currency via IP */
export async function detectLocation(): Promise<{ country_code: string; currency_code: string }> {
  return apiGet('/meta/detect-location');
}

/** Get list of supported Nigerian banks */
export async function getBanks(): Promise<Bank[]> {
  return apiGet<Bank[]>('/payments/banks');
}

/** Resolve bank account number to account name */
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<{ account_name: string; account_number: string }> {
  return apiPost(
    '/payments/resolve-account',
    {
      account_number: accountNumber,
      bank_code: bankCode,
    },
    { skipAuthRedirect: true }
  );
}

/** Complete merchant store setup */
export async function completeStoreSetup(params: {
  setup_token?: string;
  name?: string;
  store_name: string;
  username: string;
  bank_code?: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  store_color?: string;
  primary_color?: string;
  category?: string;
  country_code?: string;
  currency_code?: string;
  location?: string;
  phone_number?: string;
}): Promise<{ store: Store; token?: string }> {
  // Raw body: the token sits beside `data`, which apiPost would drop
  const res = await apiPostRaw<{ store?: Store; token?: string; data?: { store?: Store; user?: any } }>(
    '/auth/complete-setup',
    params
  );

  const token = res.token;
  if (token) {
    await setToken(token);
    await setUserMode('seller');
    registerForPush();
  }

  const store = res.store || res.data?.store;
  return { store: store as Store, token };
}

/** Fetch active seller store details */
export async function getStore(): Promise<Store> {
  return apiGet<Store>('/store');
}


export interface PlanGroup {
  key: string;
  name: string;
  tagline?: string | null;
  tier_rank: number;
  benefits: string[];
  plans: { key: string; billing_label: string; price: number }[];
}

/** Merchant plans as the admin has set them up */
export async function getPlans(): Promise<PlanGroup[]> {
  const data = await apiGet<any>('/public/plans');
  return Array.isArray(data) ? data : [];
}

/** Paid orders, payout results and reviews from the last 30 days */
export async function getNotifications(): Promise<{ items: StoreNotification[]; unread: number }> {
  const data = await apiGet<any>('/store/notifications');
  return { items: Array.isArray(data?.items) ? data.items : [], unread: Number(data?.unread ?? 0) };
}

/** Mark the feed read up to now */
export async function markNotificationsRead(): Promise<void> {
  await apiPost('/store/notifications/read');
}

/** Upload the store logo (store must exist) */
export async function uploadStoreLogo(fileUri: string): Promise<{ url: string }> {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'logo.jpg';
  formData.append('logo', { uri: fileUri, name: filename, type: imageMime(filename) } as any);
  return apiPost<{ url: string }>('/store/upload-logo', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

/** Update store profile (name, bio, brand colour) */
export async function updateStore(payload: {
  store_name?: string;
  store_bio?: string | null;
  primary_color?: string;
  shipping_type?: Store['shipping_type'];
  /** Naira */
  shipping_flat_fee?: number;
  nina_enabled?: boolean;
}): Promise<Store> {
  return apiPut<Store>('/store', payload);
}

/**
 * Save the payout bank account on an existing store. Once a verified account
 * is on file the backend doesn't apply a change straight away: it goes to an
 * admin for approval (`pending` is then true).
 */
export async function updatePayoutAccount(account: {
  bank_name: string;
  bank_code: string;
  account_number: string;
  account_name: string;
}): Promise<{ pending: boolean; message?: string }> {
  const res = await apiPutRaw<any>('/store', {
    bank_name: account.bank_name,
    paystack_bank_code: account.bank_code,
    bank_account_number: account.account_number,
    bank_account_name: account.account_name,
  });
  return { pending: !!res?.pending_payout_account_change, message: res?.message };
}

/** Text a code to a new WhatsApp number before it replaces the store's one. */
export async function sendWhatsappPhoneOtp(phone: string): Promise<void> {
  await apiPost('/store/whatsapp-phone/send-otp', { whatsapp_phone: phone });
}

/** Confirm the code and make that number the store's WhatsApp number. */
export async function verifyWhatsappPhoneOtp(phone: string, otp: string): Promise<void> {
  await apiPost('/store/whatsapp-phone/verify-otp', { whatsapp_phone: phone, otp });
}
