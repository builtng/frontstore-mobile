import { apiGet, apiPost } from './client';
import { Store, Bank } from './types';

/** Check if a store username / subdomain is available */
export async function checkSubdomainAvailable(username: string): Promise<boolean> {
  if (!username || username.trim().length < 3) return false;
  try {
    const slug = username.toLowerCase().replace(/[^a-z0-9-]/g, '');
    const store = await apiGet(`/public/store/${slug}`);
    // If store exists (200), domain is taken
    return !store;
  } catch (err: any) {
    if (err.status === 404) {
      // 404 means store does not exist -> username is available!
      return true;
    }
    return false;
  }
}

/** Get list of supported Nigerian banks */
export async function getBanks(): Promise<Bank[]> {
  return apiGet<Bank[]>('/payments/banks');
}

/** Resolve bank account number to account name */
export async function resolveAccount(accountNumber: string, bankCode: string): Promise<{ account_name: string; account_number: string }> {
  return apiPost('/payments/resolve-account', {
    account_number: accountNumber,
    bank_code: bankCode,
  });
}

/** Complete merchant store setup */
export async function completeStoreSetup(params: {
  setup_token?: string;
  name?: string;
  store_name: string;
  username: string;
  bank_code?: string;
  account_number?: string;
  account_name?: string;
  store_color?: string;
  category?: string;
}): Promise<{ store: Store }> {
  return apiPost('/auth/complete-setup', params);
}

/** Fetch active seller store details */
export async function getStore(): Promise<Store> {
  return apiGet<Store>('/store');
}
