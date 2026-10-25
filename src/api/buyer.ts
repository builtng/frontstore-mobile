import { apiGet, apiPost, apiPut, apiDelete, apiPatch } from './client';
import { Store, Product, Order, Address, Review, NotificationPreferences } from './types';
import { getToken } from './authStore';

export function normalizeStore(s: any): Store {
  if (!s) return s;
  return {
    ...s,
    id: s.id,
    store_name: s.store_name || s.name || 'Store',
    name: s.store_name || s.name || 'Store',
    username: s.username || s.slug || '',
    slug: s.username || s.slug || '',
    primary_color: s.primary_color || s.store_color || '#0B6E4F',
    store_color: s.store_color || s.primary_color || '#0B6E4F',
    store_bio: s.store_bio || s.bio || '',
    category_label: s.category_label || s.category || '',
    category: s.category_label || s.category || '',
    location: s.location || 'Nigeria',
    logo_url: s.logo_url || null,
    whatsapp_phone: s.whatsapp_phone || s.phone || null,
    is_active: s.is_active ?? true,
  };
}

export function normalizeOrder(o: any): Order {
  if (!o) return o;
  return {
    ...o,
    store: o.store ? normalizeStore(o.store) : o.store,
  };
}

export function normalizeProduct(p: any): Product {
  if (!p) return p;
  return {
    ...p,
    store: p.store ? normalizeStore(p.store) : p.store,
  };
}

export interface PaginatedStoresResponse {
  stores: Store[];
  currentPage: number;
  lastPage: number;
  hasMore: boolean;
  total: number;
}

/** Discover public marketplace stores */
export async function getMarketplaceStores(params?: { category?: string; search?: string; filter?: string; page?: number; per_page?: number }): Promise<Store[]> {
  const data = await apiGet<any>('/public/stores', params);
  let rawList: any[] = [];
  if (Array.isArray(data)) rawList = data;
  else if (data && Array.isArray(data.data)) rawList = data.data;
  else if (data && Array.isArray(data.items)) rawList = data.items;
  return rawList.map(normalizeStore);
}

/** Paginated store list for infinite scrolling */
export async function getMarketplaceStoresPaginated(params?: { category?: string; search?: string; filter?: string; page?: number; per_page?: number }): Promise<PaginatedStoresResponse> {
  const data = await apiGet<any>('/public/stores', { per_page: 15, ...params });
  let rawList: any[] = [];
  if (Array.isArray(data)) {
    rawList = data;
    return {
      stores: rawList.map(normalizeStore),
      currentPage: params?.page || 1,
      lastPage: 1,
      hasMore: false,
      total: rawList.length,
    };
  }

  if (data && Array.isArray(data.data)) {
    rawList = data.data;
  }

  return {
    stores: rawList.map(normalizeStore),
    currentPage: data?.current_page || params?.page || 1,
    lastPage: data?.last_page || 1,
    hasMore: Boolean(data?.has_more),
    total: data?.total ?? rawList.length,
  };
}

/** Search products and stores */
export async function searchMarketplace(query: string): Promise<{ stores: Store[]; products: Product[] }> {
  const res = await apiGet<any>('/public/marketplace', { q: query });
  const payload = res?.data || res || {};
  return {
    stores: (payload.stores || []).map(normalizeStore),
    products: (payload.products || []).map(normalizeProduct),
  };
}

/** Fetch buyer's orders */
export async function getBuyerOrders(): Promise<Order[]> {
  const token = await getToken();
  if (!token) return [];
  // Errors reach the screen so it can say "couldn't load" instead of "no orders"
  const data = await apiGet<any>('/buyer/auth/orders', undefined, { skipAuthRedirect: true });
  const ordersList: any[] = Array.isArray(data) ? data
    : Array.isArray(data?.orders) ? data.orders
    : Array.isArray(data?.data) ? data.data
    : [];
  return ordersList.map(normalizeOrder);
}

/** Track order by ID */
export async function trackOrder(orderId: string | number): Promise<Order & { reviews?: Review[] }> {
  return normalizeOrder(await apiGet<any>(`/public/orders/${orderId}`));
}

/** Confirm delivery of an order */
export async function confirmOrderDelivery(orderId: string | number): Promise<Order> {
  return apiPost<Order>(`/public/orders/${orderId}/confirm-delivery`);
}

/** Fetch buyer addresses */
export async function getAddresses(): Promise<Address[]> {
  const token = await getToken();
  if (!token) return [];
  const data = await apiGet<any>('/buyer/addresses', undefined, { skipAuthRedirect: true });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Add delivery address (backend fields: street, area, state, phone, landmark) */
export async function addAddress(payload: Omit<Address, 'id'>): Promise<Address> {
  return apiPost<Address>('/buyer/addresses', payload);
}

/** Update delivery address */
export async function updateAddress(id: number | string, payload: Partial<Address>): Promise<Address> {
  return apiPut<Address>(`/buyer/addresses/${id}`, payload);
}

/** Delete delivery address */
export async function deleteAddress(id: number | string): Promise<void> {
  return apiDelete(`/buyer/addresses/${id}`);
}

/** Set default address */
export async function setDefaultAddress(id: number | string): Promise<void> {
  return apiPatch(`/buyer/addresses/${id}/default`);
}

/** Follow / unfollow store */
export async function toggleFollowStore(storeId: number | string): Promise<{ followed: boolean }> {
  return apiPost<{ followed: boolean }>(`/buyer/follows/${storeId}`);
}

/** Fetch followed stores */
export async function getFollowedStores(): Promise<Store[]> {
  const token = await getToken();
  if (!token) return [];
  const data = await apiGet<any>('/buyer/follows', undefined, { skipAuthRedirect: true });
  const rawList: any[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return rawList.map(normalizeStore);
}

/** Save / unsave product */
export async function toggleSaveProduct(productId: number | string): Promise<{ saved: boolean }> {
  return apiPost<{ saved: boolean }>(`/buyer/saved-products/${productId}`);
}

/** Fetch saved products */
export async function getSavedProducts(): Promise<Product[]> {
  const token = await getToken();
  if (!token) return [];
  const data = await apiGet<any>('/buyer/saved-products', undefined, { skipAuthRedirect: true });
  const rawList: any[] = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return rawList.map(normalizeProduct);
}

/** Fetch buyer reviews */
export async function getBuyerReviews(): Promise<Review[]> {
  const token = await getToken();
  if (!token) return [];
  const data = await apiGet<any>('/buyer/reviews', undefined, { skipAuthRedirect: true });
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Review a paid order. No product_id means a review of the order / store as a whole. */
export async function submitOrderReview(orderId: number | string, rating: number, comment: string, productId?: string | number | null): Promise<Review[]> {
  return apiPost<Review[]>(`/public/orders/${orderId}/reviews`, {
    reviews: [{ product_id: productId ?? null, rating, comment: comment.trim() || null }],
  });
}

/**
 * Fetch buyer notification preferences. Errors are thrown rather than
 * replaced with all-off defaults, which a later toggle would then save.
 */
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  return apiGet<NotificationPreferences>('/buyer/notification-preferences', undefined, { skipAuthRedirect: true });
}

/** Update buyer notification preferences */
export async function updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<NotificationPreferences> {
  return apiPut<NotificationPreferences>('/buyer/notification-preferences', preferences);
}
