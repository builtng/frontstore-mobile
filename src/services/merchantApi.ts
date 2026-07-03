import api from './api';
import { CreateProductPayload, Order, OrderStatus } from '@/types/merchant';

const mapStoreToFrontend = (s: any) => {
  if (!s) return s;
  return {
    ...s,
    name: s.store_name ?? s.name,
    description: s.store_bio ?? s.description,
    whatsapp_number: s.whatsapp_phone ?? s.whatsapp_number,
    currency: s.currency_code ?? s.currency,
  };
};

const mapStoreToBackend = (s: any) => {
  if (!s) return s;
  const payload: any = { ...s };
  if ('name' in s) {
    payload.store_name = s.name;
    delete payload.name;
  }
  if ('description' in s) {
    payload.store_bio = s.description;
    delete payload.description;
  }
  if ('whatsapp_number' in s) {
    payload.whatsapp_phone = s.whatsapp_number;
    delete payload.whatsapp_number;
  }
  if ('currency' in s) {
    payload.currency_code = s.currency;
    delete payload.currency;
  }
  return payload;
};

export const merchantApi = {
  // Dashboard
  getDashboardStats: async () => {
    const { data } = await api.get('/orders/stats');
    return data;
  },

  // Store
  getStore: async () => {
    const { data } = await api.get('/store');
    if (data && data.data) {
      data.data = mapStoreToFrontend(data.data);
    }
    return data;
  },

  updateStore: async (payload: FormData | Record<string, unknown>) => {
    const isFormData = payload instanceof FormData;
    let mappedPayload = payload;
    if (!isFormData) {
      mappedPayload = mapStoreToBackend(payload);
    }
    const { data } = await api.put('/store', mappedPayload, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    if (data && data.data) {
      data.data = mapStoreToFrontend(data.data);
    }
    return data;
  },

  uploadLogo: async (formData: FormData) => {
    const { data } = await api.post('/store/upload-logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  uploadBanner: async (formData: FormData) => {
    const { data } = await api.post('/store/upload-banner', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  activateTemplate: async (template: string) => {
    const { data } = await api.patch('/store/template', { template });
    return data;
  },

  // Products
  getProducts: async (params?: { page?: number; search?: string; status?: string }) => {
    const { data } = await api.get('/products', { params });
    return data;
  },

  getProduct: async (id: number) => {
    const { data } = await api.get(`/products/${id}`);
    return data;
  },

  createProduct: async (payload: CreateProductPayload) => {
    const { data } = await api.post('/products', payload);
    return data;
  },

  updateProduct: async (id: number, payload: Partial<CreateProductPayload>) => {
    const { data } = await api.put(`/products/${id}`, payload);
    return data;
  },

  deleteProduct: async (id: number) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  uploadProductImage: async (formData: FormData) => {
    const { data } = await api.post('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  generateAIDescription: async (name: string) => {
    const { data } = await api.post('/ai/generate-description', { name });
    return data;
  },

  // Categories
  getCategories: async () => {
    const { data } = await api.get('/categories');
    return data;
  },

  // Orders
  getOrders: async (params?: { page?: number; status?: OrderStatus; search?: string }) => {
    const { data } = await api.get('/orders', { params });
    return data;
  },

  getOrder: async (id: number) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },

  updateOrderStatus: async (id: number, status: OrderStatus) => {
    const { data } = await api.patch(`/orders/${id}/status`, { status });
    return data;
  },

  sendReceipt: async (id: number) => {
    const { data } = await api.post(`/orders/${id}/send-receipt`);
    return data;
  },

  // Wallet
  getWallet: async () => {
    const { data } = await api.get('/store/wallet');
    return data;
  },

  withdraw: async (payload: { amount: number; bank_code: string; account_number: string; otp: string }) => {
    const { data } = await api.post('/store/withdraw', payload);
    return data;
  },

  sendWithdrawalOtp: async () => {
    const { data } = await api.post('/store/withdraw/send-otp');
    return data;
  },

  // Bookings
  getSlots: async () => {
    const { data } = await api.get('/slots');
    return data;
  },

  getBookings: async (params?: { status?: string }) => {
    const { data } = await api.get('/bookings', { params });
    return data;
  },

  updateBookingStatus: async (id: number, status: string) => {
    const { data } = await api.patch(`/bookings/${id}/status`, { status });
    return data;
  },

  // Identity Verification
  submitVerification: async (payload: {
    document_type: 'national_id' | 'intl_passport' | 'drivers_license' | 'business_registration';
    document_url?: string;
    id_number?: string;
  }) => {
    const { data } = await api.post('/store/verify-request', payload);
    return data;
  },

  getVerificationStatus: async () => {
    const { data } = await api.get('/store');
    const store = data?.data;
    return {
      is_verified: store?.is_verified ?? false,
      verification_status: store?.verification_status ?? 'unverified',
      verification_document_type: store?.verification_document_type ?? null,
    };
  },

  // Reviews
  getReviews: async () => {
    const { data } = await api.get('/store/reviews');
    return data;
  },

  replyToReview: async (id: number, reply: string) => {
    const { data } = await api.post(`/store/reviews/${id}/reply`, { reply });
    return data;
  },

  // Broadcasts
  getBroadcasts: async () => {
    const { data } = await api.get('/broadcasts');
    return data;
  },

  createBroadcast: async (payload: { title: string; message: string; audience: string }) => {
    const { data } = await api.post('/broadcasts', payload);
    return data;
  },

  // Customers
  getCustomers: async (params?: { search?: string; page?: number }) => {
    const { data } = await api.get('/customers', { params });
    return data;
  },

  getCustomer: async (id: string | number) => {
    const { data } = await api.get(`/customers/${id}`);
    return data;
  },

  // Discounts / Coupons
  getDiscounts: async () => {
    const { data } = await api.get('/discounts');
    return data;
  },

  createDiscount: async (payload: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount?: number;
    max_uses?: number;
    expires_at?: string;
  }) => {
    const { data } = await api.post('/discounts', payload);
    return data;
  },

  toggleDiscount: async (id: number) => {
    const { data } = await api.patch(`/discounts/${id}/toggle`);
    return data;
  },

  deleteDiscount: async (id: number) => {
    const { data } = await api.delete(`/discounts/${id}`);
    return data;
  },

  // Analytics
  getAnalytics: async (params?: { period?: string }) => {
    const { data } = await api.get('/analytics', { params });
    return data;
  },

  // Notifications
  getNotifications: async () => {
    const { data } = await api.get('/notifications');
    return data;
  },

  markNotificationRead: async (id: number) => {
    const { data } = await api.patch(`/notifications/${id}/read`);
    return data;
  },

  markAllNotificationsRead: async () => {
    const { data } = await api.post('/notifications/read-all');
    return data;
  },
};
