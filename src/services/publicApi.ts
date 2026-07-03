import api from './api';
import { CheckoutPayload } from '@/types/buyer';

const mapStoreToFrontend = (s: any) => {
  if (!s) return s;
  return {
    ...s,
    name: s.store_name ?? s.name,
    description: s.store_bio ?? s.description,
    whatsapp_number: s.whatsapp_phone ?? s.whatsapp_number,
    currency: s.currency_code ?? s.currency,
    location: s.location,
    address: s.address,
    since: s.since,
    working_hours: s.working_hours,
    instagram_handle: s.instagram_handle,
    tiktok_handle: s.tiktok_handle,
    twitter_handle: s.twitter_handle,
    // Enums come as objects with a .value in some serialisers
    business_persona: s.business_persona?.value ?? s.business_persona,
    store_template: s.store_template?.value ?? s.store_template,
    return_policy: s.return_policy,
    delivery_info: s.delivery_info,
    founder_name: s.founder_name,
    founder_role: s.founder_role,
    founder_bio: s.founder_bio,
    founder_avatar_url: s.founder_avatar_url,
    about_facts: s.about_facts,
  };
};

export const publicApi = {
  getPublicSettings: async () => {
    const { data } = await api.get('/public/settings');
    return data?.data ?? {};
  },

  getMarketplace: async (params?: { page?: number; category?: string; search?: string }) => {
    const { data } = await api.get('/public/marketplace', { params });
    if (data && data.featured) {
      data.featured = data.featured.map(mapStoreToFrontend);
    }
    return data;
  },

  getStores: async (params?: { page?: number; search?: string; business_type?: string }) => {
    const { data } = await api.get('/public/stores', { params });
    if (data && data.data) {
      data.data = data.data.map(mapStoreToFrontend);
    }
    return data;
  },

  getStore: async (username: string) => {
    const { data } = await api.get(`/public/store/${username}`);
    if (data && data.data && data.data.store) {
      data.data.store = mapStoreToFrontend(data.data.store);
    }
    return data;
  },

  getProduct: async (username: string, slug: string) => {
    const { data } = await api.get(`/public/store/${username}/products/${slug}`);
    if (data && data.data && data.data.store) {
      data.data.store = mapStoreToFrontend(data.data.store);
    }
    return data;
  },

  getStoreReviews: async (username: string) => {
    const { data } = await api.get(`/public/store/${username}/reviews`);
    return data;
  },

  getStoreFaqs: async (username: string) => {
    const { data } = await api.get(`/public/store/${username}/faqs`);
    return data;
  },

  getPublicSlots: async (username: string) => {
    const { data } = await api.get(`/public/store/${username}/slots`);
    return data;
  },

  createOrder: async (username: string, payload: CheckoutPayload) => {
    const { data } = await api.post(`/public/store/${username}/orders`, payload);
    return data;
  },

  trackOrder: async (orderId: number) => {
    const { data } = await api.get(`/public/orders/${orderId}`);
    return data;
  },

  initializePayment: async (orderId: number, provider: string) => {
    const { data } = await api.post(`/public/orders/${orderId}/initialize-payment`, { provider });
    return data;
  },

  verifyPayment: async (orderId: number, reference: string) => {
    const { data } = await api.post(`/public/orders/${orderId}/verify-payment`, { reference });
    return data;
  },

  confirmDelivery: async (orderId: number) => {
    const { data } = await api.post(`/public/orders/${orderId}/confirm-delivery`);
    return data;
  },
};
