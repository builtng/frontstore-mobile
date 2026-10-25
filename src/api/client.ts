import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { getToken, removeToken } from './authStore';
import { router } from 'expo-router';

// Default API Base URL. Uses process.env.EXPO_PUBLIC_API_BASE_URL or process.env.EXPO_PUBLIC_API_URL or defaults to production FrontStore API.
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  process.env.EXPO_PUBLIC_API_URL ||
  'https://frontstore.app/api/v1'
).replace(/\/+$/, '');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Attach Bearer token to outgoing requests
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for 401 Unauthenticated handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<any>) => {
    if (error.response?.status === 401) {
      const url = error.config?.url || '';
      const isPublicOrVerification =
        url.includes('/payments/resolve-account') ||
        url.includes('/auth/complete-setup') ||
        url.includes('/auth/login') ||
        url.includes('/auth/signup') ||
        url.includes('/auth/verify') ||
        url.includes('/auth/me') ||
        url.includes('/meta/') ||
        url.includes('/public/');

      const shouldSkip = (error.config as any)?.skipAuthRedirect || isPublicOrVerification;
      const sentToken = String(error.config?.headers?.Authorization ?? '').replace(/^Bearer /, '');

      // One endpoint saying 401 isn't proof the session is gone; only sign out
      // if the server rejects this token on /auth/me as well
      if (!shouldSkip && sentToken && (await sessionRejected(sentToken))) {
        // Skip if the user signed in again while this request was in flight
        if ((await getToken()) === sentToken) {
          await removeToken();
          try {
            router.replace('/login');
          } catch (navErr) {
            console.warn('Redirect to login failed', navErr);
          }
        }
      }
    }
    return Promise.reject(error);
  }
);

// Several screens can get a 401 at once; check each token with the server only once
const sessionChecks = new Map<string, Promise<boolean>>();

function sessionRejected(token: string): Promise<boolean> {
  let check = sessionChecks.get(token);
  if (!check) {
    check = axios
      .get(`${API_BASE_URL}/auth/me`, {
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
        timeout: 10000,
      })
      .then(() => false)
      // Offline or a server error: keep the user signed in
      .catch((err: AxiosError) => err.response?.status === 401)
      .finally(() => {
        const t: any = setTimeout(() => sessionChecks.delete(token), 30000);
        t?.unref?.(); // don't hold Jest (or Node) open
      });
    sessionChecks.set(token, check);
  }
  return check;
}

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/** Turn an axios failure (or a `status: "error"` body) into an ApiError. */
function toApiError(err: any): ApiError {
  if (err instanceof ApiError) return err;
  // Laravel validation errors: show the first field message, not just "The given data was invalid."
  const firstFieldError = Object.values(err.response?.data?.errors ?? {}).flat()[0];
  const message = (typeof firstFieldError === 'string' && firstFieldError) || err.response?.data?.message || err.message || 'Network request failed';
  return new ApiError(message, err.response?.status || 500, err.response?.data);
}

/** Run a request and unwrap the body; `raw` keeps the whole body instead of just `data`. */
async function send<T>(request: Promise<{ data: any; status: number }>, raw = false): Promise<T> {
  try {
    const res = await request;
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return raw ? json : json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    throw toApiError(err);
  }
}

/** Wrapper helper methods matching expected API call patterns */
export function apiGet<T = any>(url: string, params?: Record<string, any>, config?: any): Promise<T> {
  return send(apiClient.get(url, { params, ...config }));
}

export function apiPost<T = any>(url: string, body?: any, config?: any): Promise<T> {
  return send(apiClient.post(url, body, config));
}

/** POST that returns the whole response body. Auth endpoints put `token` beside `data`, which apiPost would drop. */
export function apiPostRaw<T = any>(url: string, body?: any, config?: any): Promise<T> {
  return send(apiClient.post(url, body, config), true);
}

/** PUT that returns the whole response body (for top-level flags beside `data`). */
export function apiPutRaw<T = any>(url: string, body?: any): Promise<T> {
  return send(apiClient.put(url, body), true);
}

export function apiPut<T = any>(url: string, body?: any): Promise<T> {
  return send(apiClient.put(url, body));
}

export function apiPatch<T = any>(url: string, body?: any): Promise<T> {
  return send(apiClient.patch(url, body));
}

export function apiDelete<T = any>(url: string, body?: any): Promise<T> {
  return send(apiClient.delete(url, body ? { data: body } : undefined));
}

/**
 * GET every page of a Laravel paginator (`data: { data: [...], current_page, last_page }`).
 * `maxPages` stops a runaway loop on a huge store.
 */
export async function apiGetAllPages<T = any>(url: string, params: Record<string, any> = {}, maxPages = 20): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await apiGet<any>(url, { limit: 100, ...params, page });
    if (Array.isArray(data)) return [...items, ...data];
    items.push(...(Array.isArray(data?.data) ? data.data : []));
    if (!data?.last_page || page >= data.last_page) break;
  }
  return items;
}
