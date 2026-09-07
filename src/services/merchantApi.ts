import api from './api';
import { CreateProductPayload, Order, OrderStatus, Product, DashboardStats, ChartDataPoint, ReferralStatusData } from '@/types/merchant';

export const mapStoreToFrontend = (s: any) => {
  if (!s) return s;
  return {
    ...s,
    name: s.store_name ?? s.name,
    description: (s.store_bio ?? s.description) ? (s.store_bio ?? s.description).slice(0, 306) : (s.store_bio ?? s.description),
    whatsapp_number: s.whatsapp_phone ?? s.whatsapp_number,
    currency: s.currency_code ?? s.currency ?? 'NGN',
  };
};

export const mapStoreToBackend = (s: any) => {
  if (!s) return s;
  const payload: any = { ...s };
  if ('name' in s) {
    payload.store_name = s.name;
    delete payload.name;
  }
  if ('description' in s) {
    payload.store_bio = s.description ? s.description.slice(0, 306) : s.description;
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

export const mapProductToFrontend = (p: any): Product => {
  if (!p) return p;

  const rawImages: string[] = Array.isArray(p.image_urls)
    ? p.image_urls
    : p.image_url
    ? [p.image_url]
    : [];

  const images = rawImages.map((url: string, index: number) => ({
    id: index + 1,
    url,
    is_primary: index === 0,
  }));

  const isOutOfStock = p.stock_status === 'out_of_stock';
  const stock = typeof p.inventory_quantity === 'number'
    ? p.inventory_quantity
    : typeof p.stock === 'number'
    ? p.stock
    : isOutOfStock
    ? 0
    : 10;

  return {
    ...p,
    id: p.id,
    name: p.name ?? 'Untitled Product',
    slug: p.slug ?? '',
    description: p.description ?? '',
    price: Number(p.price) || 0,
    compare_price: p.compare_at_price ? Number(p.compare_at_price) : (p.compare_price ? Number(p.compare_price) : undefined),
    stock,
    track_stock: Boolean(p.track_inventory ?? p.track_stock),
    images,
    image_url: p.image_url || rawImages[0] || '',
    category: p.category,
    type: p.is_digital ? 'digital' : p.type === 'service' ? 'service' : 'physical',
    status: p.is_draft ? 'draft' : 'active',
    is_featured: Boolean(p.is_sponsored),
    created_at: p.created_at ?? new Date().toISOString(),
  };
};

export const mapProductToBackend = (payload: any) => {
  const typeMap: Record<string, string> = {
    physical: 'product',
    digital: 'product',
    service: 'service',
  };
  const type = typeMap[payload.type] || payload.type || 'product';

  const imageUrls = Array.isArray(payload.images)
    ? payload.images.map((img: any) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
    : Array.isArray(payload.image_urls)
    ? payload.image_urls
    : [];

  const stockVal = Number(payload.stock ?? payload.inventory_quantity ?? 0);
  const trackStock = Boolean(payload.track_stock ?? payload.track_inventory);

  return {
    name: payload.name,
    type,
    price: Number(payload.price) || 0,
    compare_at_price: payload.compare_price ? Number(payload.compare_price) : (payload.compare_at_price ? Number(payload.compare_at_price) : null),
    description: payload.description || null,
    category_id: payload.category_id || null,
    image_urls: imageUrls,
    image_url: imageUrls[0] || payload.image_url || null,
    track_inventory: trackStock,
    inventory_quantity: trackStock ? stockVal : null,
    stock_status: stockVal > 0 ? 'in_stock' : 'out_of_stock',
    is_draft: payload.status === 'draft',
    is_digital: payload.type === 'digital',
    variants: payload.variants,
  };
};

export const mapOrderToFrontend = (o: any): Order => {
  if (!o) return o;

  const rawStatus = o.order_status || o.status || 'pending';
  const status: OrderStatus = rawStatus === 'completed' ? 'delivered' : rawStatus;

  const total = Number(o.display_amount ?? o.total_amount ?? o.total ?? 0);
  const deliveryFee = Number(o.delivery_fee ?? 0);
  const subtotal = Number(o.subtotal ?? Math.max(0, total - deliveryFee));

  const items = (o.items || []).map((item: any) => ({
    id: item.id,
    product: {
      id: item.product_id,
      name: item.product_name || item.product?.name || 'Product',
      price: Number(item.price || item.unit_price || 0),
      images: item.image_url ? [{ id: 1, url: item.image_url, is_primary: true }] : [],
    },
    quantity: Number(item.quantity || 1),
    price: Number(item.price || item.unit_price || 0),
    total: Number(item.total || (Number(item.price || item.unit_price || 0) * Number(item.quantity || 1))),
  }));

  return {
    ...o,
    id: o.id,
    reference: o.order_number || o.reference || `#${String(o.id).slice(0, 8)}`,
    customer_name: o.customer_name || 'Customer',
    customer_email: o.customer_email || undefined,
    customer_phone: o.customer_phone || undefined,
    status,
    payment_status: o.payment_status || 'unpaid',
    subtotal,
    delivery_fee: deliveryFee,
    total,
    delivery_type: o.delivery_type || (o.delivery_address || o.shipping_address ? 'delivery' : 'pickup'),
    delivery_address: o.delivery_address || o.shipping_address || undefined,
    notes: o.customer_notes || o.notes || undefined,
    items,
    created_at: o.created_at ?? new Date().toISOString(),
    updated_at: o.updated_at ?? new Date().toISOString(),
  };
};

export const mapDashboardStatsToFrontend = (resData: any): DashboardStats => {
  const d = resData?.data ?? resData ?? {};
  const counts = d.counts ?? {};
  const metrics = d.metrics ?? {};
  const revenue = Number(d.revenue ?? 0);
  const totalOrders = Number(counts.total ?? 0);
  const pendingOrders = Number(counts.pending ?? 0);

  // Generate chart data from the backend's real daily breakdown
  const dailyBreakdown = metrics.daily_breakdown ?? [];
  const chartData: ChartDataPoint[] = dailyBreakdown.length > 0
    ? dailyBreakdown.map((item: any) => ({
        date: item.day || item.date,
        amount: item.views ? Math.round(revenue / Math.max(1, dailyBreakdown.length)) : 0,
        orders: Number(item.wa ?? item.orders ?? 0),
      }))
    : [
        { date: 'Mon', amount: 0, orders: 0 },
        { date: 'Tue', amount: 0, orders: 0 },
        { date: 'Wed', amount: 0, orders: 0 },
        { date: 'Thu', amount: 0, orders: 0 },
        { date: 'Fri', amount: 0, orders: 0 },
        { date: 'Sat', amount: 0, orders: 0 },
        { date: 'Sun', amount: revenue, orders: totalOrders },
      ];

  const topProducts = (d.top_products ?? []).map((tp: any) => ({
    product: {
      name: tp.product_name || 'Product',
      price: 0,
      images: [],
    },
    total_sold: Number(tp.total_sold ?? 0),
    revenue: 0,
  }));

  return {
    today_revenue: revenue,
    today_orders: counts.pending ?? 0,
    total_revenue: revenue,
    total_orders: totalOrders,
    total_products: 0,
    total_customers: totalOrders,
    pending_orders: pendingOrders,
    revenue_chart: chartData,
    top_products: topProducts,
    recent_orders: [],
    total_visitors: Number(metrics.total_views ?? 0),
  };
};

export const mapWalletToFrontend = (d: any) => {
  const withdrawals = d.withdrawals ?? [];
  const completedWithdrawn = withdrawals
    .filter((w: any) => ['completed', 'success', 'paid'].includes(w.status))
    .reduce((sum: number, w: any) => sum + Number(w.amount || 0), 0);

  const withdrawable = Number(d.withdrawable_balance ?? 0);
  const pending = Number(d.pending_balance ?? 0);

  const transactions = withdrawals.map((w: any) => ({
    id: w.id,
    type: 'debit',
    amount: Number(w.amount || 0),
    description: `Payout to ${w.bank_name || d.bank_name || 'Bank'} (${(w.bank_account_number || d.bank_account_number || '').slice(-4)})`,
    reference: w.reference || `PAY-${w.id}`,
    bank_name: w.bank_name || d.bank_name,
    bank_account_number: w.bank_account_number || d.bank_account_number,
    bank_account_name: w.bank_account_name || d.bank_account_name,
    status: ['completed', 'paid', 'success'].includes(w.status) ? 'success' : w.status === 'failed' ? 'failed' : 'pending',
    created_at: w.created_at,
  }));

  return {
    ...d,
    balance: withdrawable,
    withdrawable_balance: withdrawable,
    pending_balance: pending,
    total_earned: withdrawable + pending + completedWithdrawn,
    total_withdrawn: completedWithdrawn,
    bank_name: d.bank_name || '',
    bank_account_number: d.bank_account_number || '',
    bank_account_name: d.bank_account_name || '',
    bank_account_verified: !!d.bank_account_verified,
    payout_status: d.payout_status || { state: 'paid', next_payout_at: null },
    transactions,
    withdrawals,
  };
};

export const mapCouponToFrontend = (c: any) => ({
  ...c,
  id: c.id,
  code: c.code,
  type: (c.discount_type || c.type || 'percentage') as 'percentage' | 'fixed',
  value: Number(c.discount_value ?? c.value ?? 0),
  min_order_amount: c.min_order_amount ? Number(c.min_order_amount) : undefined,
  max_uses: c.max_uses ? Number(c.max_uses) : undefined,
  used_count: Number(c.used_count ?? 0),
  uses_count: Number(c.used_count ?? c.uses_count ?? 0),
  is_active: Boolean(c.is_active),
  expires_at: c.expires_at,
});

export const merchantApi = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    const { data } = await api.get('/orders/stats');
    return mapDashboardStatsToFrontend(data);
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
  getProducts: async (params?: { page?: number; search?: string; status?: string; limit?: number }) => {
    const backendParams: any = {};
    if (params?.limit) backendParams.limit = params.limit;
    if (params?.page) backendParams.page = params.page;
    if (params?.search) backendParams.q = params.search;
    if (params?.status && params.status !== 'all') {
      if (params.status === 'active') backendParams.is_draft = 0;
      if (params.status === 'draft') backendParams.is_draft = 1;
    }

    const { data } = await api.get('/products', { params: backendParams });
    const paginator = data?.data ?? data;
    const items = paginator?.data ?? (Array.isArray(paginator) ? paginator : []);
    const mappedItems = Array.isArray(items) ? items.map(mapProductToFrontend) : [];

    return {
      status: data?.status || 'success',
      data: mappedItems,
      total: paginator?.total ?? mappedItems.length,
      current_page: paginator?.current_page ?? 1,
      last_page: paginator?.last_page ?? 1,
      meta: {
        total: paginator?.total ?? mappedItems.length,
        current_page: paginator?.current_page ?? 1,
      },
    };
  },

  getProduct: async (id: string | number) => {
    const { data } = await api.get(`/products/${id}`);
    const product = data?.data ?? data;
    return {
      status: data?.status || 'success',
      data: mapProductToFrontend(product),
    };
  },

  createProduct: async (payload: CreateProductPayload | any) => {
    const backendPayload = mapProductToBackend(payload);
    const { data } = await api.post('/products', backendPayload);
    const product = data?.data ?? data;
    return {
      status: data?.status || 'success',
      data: mapProductToFrontend(product),
    };
  },

  updateProduct: async (id: string | number, payload: Partial<CreateProductPayload> | any) => {
    const backendPayload = mapProductToBackend(payload);
    const { data } = await api.put(`/products/${id}`, backendPayload);
    const product = data?.data ?? data;
    return {
      status: data?.status || 'success',
      data: mapProductToFrontend(product),
    };
  },

  deleteProduct: async (id: string | number) => {
    const { data } = await api.delete(`/products/${id}`);
    return data;
  },

  uploadProductImage: async (formData: FormData) => {
    const { data } = await api.post('/products/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  generateAIDescription: async (name: string, categoryHint?: string) => {
    const { data } = await api.post('/ai/generate-description', {
      product_name: name,
      category_hint: categoryHint,
    });
    return data?.data ?? data;
  },

  analyzeProductImage: async (imageBase64: string, imageMime: string = 'image/jpeg') => {
    const { data } = await api.post('/ai/generate-description', {
      image_base64: imageBase64,
      image_mime: imageMime,
    });
    return data?.data ?? data;
  },

  // Categories
  getCategories: async () => {
    const { data } = await api.get('/categories');
    return data;
  },

  // Orders
  getOrders: async (params?: { page?: number; status?: OrderStatus | 'all'; search?: string; limit?: number }) => {
    const backendParams: any = {};
    if (params?.limit) backendParams.limit = params.limit;
    if (params?.page) backendParams.page = params.page;
    if (params?.search) backendParams.q = params.search;
    if (params?.status && params.status !== 'all') {
      backendParams.order_status = params.status === 'delivered' ? 'completed' : params.status;
    }

    const { data } = await api.get('/orders', { params: backendParams });
    const paginator = data?.data ?? data;
    const items = paginator?.data ?? (Array.isArray(paginator) ? paginator : []);
    const mappedItems = Array.isArray(items) ? items.map(mapOrderToFrontend) : [];

    return {
      status: data?.status || 'success',
      data: mappedItems,
      total: paginator?.total ?? mappedItems.length,
      current_page: paginator?.current_page ?? 1,
      last_page: paginator?.last_page ?? 1,
      meta: {
        total: paginator?.total ?? mappedItems.length,
        current_page: paginator?.current_page ?? 1,
      },
    };
  },

  getOrder: async (id: string | number) => {
    const { data } = await api.get(`/orders/${id}`);
    const order = data?.data ?? data;
    return {
      status: data?.status || 'success',
      data: mapOrderToFrontend(order),
    };
  },

  updateOrderStatus: async (id: string | number, status: OrderStatus | string) => {
    const backendStatus = status === 'delivered' ? 'completed' : status;
    const { data } = await api.patch(`/orders/${id}/status`, { order_status: backendStatus });
    return data;
  },

  sendReceipt: async (id: string | number) => {
    const { data } = await api.post(`/orders/${id}/send-receipt`);
    return data;
  },

  // Wallet
  getWallet: async () => {
    const { data } = await api.get('/store/wallet');
    const raw = data?.data ?? data;
    return {
      status: data?.status || 'success',
      data: mapWalletToFrontend(raw),
    };
  },

  withdraw: async (payload: { amount: number; bank_code?: string; account_number?: string; otp?: string; otp_code?: string }) => {
    const { data } = await api.post('/store/withdraw', {
      amount: payload.amount,
      otp_code: payload.otp_code || payload.otp,
    });
    return data;
  },

  sendWithdrawalOtp: async () => {
    const { data } = await api.post('/store/withdraw/send-otp');
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

  replyToReview: async (id: string | number, reply: string) => {
    const { data } = await api.post(`/store/reviews/${id}/reply`, { reply });
    return data;
  },

  // Customers
  getCustomers: async (params?: { search?: string; page?: number }) => {
    try {
      const { data } = await api.get('/customers', { params });
      const paginator = data?.data ?? data;
      const items = paginator?.data ?? (Array.isArray(paginator) ? paginator : []);
      return {
        status: 'success',
        data: items,
        total: paginator?.total ?? items.length,
      };
    } catch (err: any) {
      // If customer CRM is 403 (Free store), extract unique customers from orders!
      if (err?.response?.status === 403) {
        const { data: ordersRes } = await api.get('/orders', { params: { limit: 100 } });
        const ordersPaginator = ordersRes?.data ?? ordersRes;
        const ordersList = ordersPaginator?.data ?? (Array.isArray(ordersPaginator) ? ordersPaginator : []);

        const map = new Map<string, any>();
        ordersList.forEach((o: any) => {
          const key = o.customer_phone || o.customer_email || o.customer_name;
          if (!key) return;
          if (!map.has(key)) {
            map.set(key, {
              id: key,
              name: o.customer_name || 'Customer',
              phone: o.customer_phone,
              email: o.customer_email,
              purchase_count: 1,
              lifetime_value: Number(o.total_amount || 0),
            });
          } else {
            const existing = map.get(key);
            existing.purchase_count += 1;
            existing.lifetime_value += Number(o.total_amount || 0);
          }
        });

        const derivedCustomers = Array.from(map.values());
        return {
          status: 'success',
          data: derivedCustomers,
          total: derivedCustomers.length,
        };
      }
      throw err;
    }
  },

  getCustomer: async (id: string | number) => {
    try {
      const { data } = await api.get(`/customers/${id}`);
      return data;
    } catch {
      // Fallback to searching order history
      const { data: ordersRes } = await api.get('/orders', { params: { q: id, limit: 20 } });
      const ordersPaginator = ordersRes?.data ?? ordersRes;
      const ordersList = (ordersPaginator?.data ?? (Array.isArray(ordersPaginator) ? ordersPaginator : [])).map(mapOrderToFrontend);
      const first = ordersList[0];

      return {
        status: 'success',
        data: {
          customer: {
            id,
            name: first?.customer_name ?? 'Customer',
            phone: first?.customer_phone ?? String(id),
            email: first?.customer_email,
            orders_count: ordersList.length,
            total_spent: ordersList.filter((o: any) => o.payment_status === 'paid').reduce((s: number, o: any) => s + o.total, 0),
          },
          orders: ordersList,
        },
      };
    }
  },

  // Discounts / Coupons
  getDiscounts: async () => {
    const { data } = await api.get('/store-coupons');
    const items = data?.data ?? (Array.isArray(data) ? data : []);
    const mapped = Array.isArray(items) ? items.map(mapCouponToFrontend) : [];
    return {
      status: 'success',
      data: mapped,
    };
  },

  createDiscount: async (payload: {
    code: string;
    type: 'percentage' | 'fixed';
    value: number;
    min_order_amount?: number;
    max_uses?: number;
    expires_at?: string;
  }) => {
    const backendPayload = {
      code: payload.code,
      discount_type: payload.type,
      discount_value: payload.value,
      min_order_amount: payload.min_order_amount,
      max_uses: payload.max_uses,
      expires_at: payload.expires_at,
    };
    const { data } = await api.post('/store-coupons', backendPayload);
    return {
      status: 'success',
      data: mapCouponToFrontend(data?.data ?? data),
    };
  },

  toggleDiscount: async (id: string | number) => {
    const { data } = await api.patch(`/store-coupons/${id}/toggle-status`);
    return data;
  },

  deleteDiscount: async (id: string | number) => {
    const { data } = await api.delete(`/store-coupons/${id}`);
    return data;
  },

  // Analytics
  getAnalytics: async (params?: { period?: string }) => {
    try {
      const { data } = await api.get('/analytics/pro', { params });
      return data;
    } catch {
      // Fallback to orders/stats for non-Pro stores
      const { data } = await api.get('/orders/stats');
      return {
        status: 'success',
        data: mapDashboardStatsToFrontend(data),
      };
    }
  },

  // Notifications
  getNotifications: async () => {
    try {
      const { data } = await api.get('/notifications');
      return data;
    } catch {
      // Derive notifications from recent orders
      const { data: ordersRes } = await api.get('/orders', { params: { limit: 10 } });
      const paginator = ordersRes?.data ?? ordersRes;
      const orders = paginator?.data ?? (Array.isArray(paginator) ? paginator : []);

      const notifications = orders.map((o: any, idx: number) => ({
        id: o.id || idx,
        type: 'order',
        title: `Order #${o.order_number || o.id}`,
        message: `${o.customer_name || 'A customer'} placed an order (${o.order_status || 'pending'})`,
        created_at: o.created_at,
        is_read: idx > 1,
      }));

      return {
        status: 'success',
        data: notifications,
      };
    }
  },

  markNotificationRead: async (id: string | number) => {
    try {
      const { data } = await api.patch(`/notifications/${id}/read`);
      return data;
    } catch {
      return { status: 'success' };
    }
  },

  markAllNotificationsRead: async () => {
    try {
      const { data } = await api.post('/notifications/read-all');
      return data;
    } catch {
      return { status: 'success' };
    }
  },

  // Merchant In-House Referrals
  getReferralStatus: async (): Promise<{ status: string; data: ReferralStatusData }> => {
    const { data } = await api.get('/merchant-referrals/status');
    return data;
  },

  applyForReferral: async (payload: {
    instagram_handle?: string;
    twitter_handle?: string;
    tiktok_handle?: string;
    facebook_handle?: string;
    linkedin_handle?: string;
  }) => {
    const { data } = await api.post('/merchant-referrals/apply', payload);
    return data;
  },
};

