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
      .finally(() => setTimeout(() => sessionChecks.delete(token), 30000));
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

/** Wrapper helper methods matching expected API call patterns */
export async function apiGet<T = any>(url: string, params?: Record<string, any>, config?: any): Promise<T> {
  try {
    const res = await apiClient.get(url, { params, ...config });
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}

export async function apiPost<T = any>(url: string, body?: any, config?: any): Promise<T> {
  try {
    const res = await apiClient.post(url, body, config);
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}

/** POST that returns the whole response body. Auth endpoints put `token` beside `data`, which apiPost would drop. */
export async function apiPostRaw<T = any>(url: string, body?: any, config?: any): Promise<T> {
  try {
    const res = await apiClient.post(url, body, config);
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}

export async function apiPut<T = any>(url: string, body?: any): Promise<T> {
  try {
    const res = await apiClient.put(url, body);
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}

export async function apiPatch<T = any>(url: string, body?: any): Promise<T> {
  try {
    const res = await apiClient.patch(url, body);
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}

export async function apiDelete<T = any>(url: string, body?: any): Promise<T> {
  try {
    const res = await apiClient.delete(url, body ? { data: body } : undefined);
    const json = res.data;
    if (json?.status === 'error') {
      throw new ApiError(json.message || 'Request failed', res.status, json);
    }
    return json?.data !== undefined ? json.data : json;
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    const message = err.response?.data?.message || err.message || 'Network request failed';
    throw new ApiError(message, err.response?.status || 500, err.response?.data);
  }
}
