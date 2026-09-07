export interface Product {
  id: string | number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_price?: number;
  stock: number;
  track_stock: boolean;
  images: ProductImage[];
  category?: Category;
  type: 'physical' | 'digital' | 'service';
  status: 'active' | 'draft' | 'archived';
  is_featured: boolean;
  created_at: string;
}

export interface ProductImage {
  id: number;
  url: string;
  is_primary: boolean;
}

export interface Category {
  id: number | string;
  name: string;
  slug: string;
  icon?: string;
  products_count?: number;
}

export interface Order {
  id: string | number;
  reference: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: OrderStatus;
  payment_status: PaymentStatus;
  delivery_type: 'pickup' | 'delivery' | 'digital';
  delivery_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number | string;
  product: Product;
  quantity: number;
  price: number;
  total: number;
}

export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'cancelled'
  | 'refunded';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded' | 'in_escrow' | 'released';

export interface DashboardStats {
  today_revenue: number;
  today_orders: number;
  total_revenue: number;
  total_orders: number;
  total_products: number;
  total_customers: number;
  pending_orders: number;
  revenue_chart: ChartDataPoint[];
  top_products: TopProduct[];
  recent_orders: Order[];
  total_visitors?: number;
}

export interface ChartDataPoint {
  date: string;
  amount: number;
  orders: number;
}

export interface TopProduct {
  product: Product;
  total_sold: number;
  revenue: number;
}

export interface Wallet {
  balance: number;
  pending_balance: number;
  total_earned: number;
  total_withdrawn: number;
  currency: string;
  transactions: WalletTransaction[];
  trust_score: number;
  seller_level: number;
}

export interface WalletTransaction {
  id: number;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  reference: string;
  status: 'success' | 'pending' | 'failed';
  created_at: string;
}

export interface BookingSlot {
  id: number;
  service_name: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  capacity: number;
  booked_count: number;
  status: 'available' | 'full' | 'closed';
}

export interface Booking {
  id: number;
  booking_reference: string;
  slot: BookingSlot;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  notes?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
}

export interface Review {
  id: number;
  customer_name: string;
  rating: number;
  comment?: string;
  reply?: string;
  product?: Product;
  order_id: number;
  created_at: string;
}

export interface Broadcast {
  id: number;
  title: string;
  message: string;
  audience: 'all' | 'buyers' | 'recent';
  status: 'draft' | 'scheduled' | 'sent' | 'failed';
  sent_at?: string;
  recipient_count?: number;
  created_at: string;
}

export interface CreateProductPayload {
  name: string;
  description?: string;
  price: number;
  compare_price?: number;
  stock: number;
  track_stock: boolean;
  category_id?: number;
  type: 'physical' | 'digital' | 'service';
  status: 'active' | 'draft';
  images?: string[];
  sku?: string;
  variants?: any;
}

export interface ReferralCriteriaItem {
  title: string;
  description: string;
  fulfilled: boolean;
  current?: number;
  required?: number;
  days?: number;
  handles?: Record<string, string>;
  status?: string;
}

export interface ReferralCriteriaStatus {
  is_approved: boolean;
  is_pending: boolean;
  is_rejected: boolean;
  can_apply: boolean;
  criteria: {
    min_products: ReferralCriteriaItem;
    social_media: ReferralCriteriaItem;
    platform_age: ReferralCriteriaItem;
    background_check: ReferralCriteriaItem;
  };
  all_criteria_met: boolean;
  latest_application?: any;
}

export interface ReferredMerchantItem {
  id: number;
  status: string;
  referee_name: string;
  referee_email?: string;
  store_name: string;
  store_username: string;
  store_logo?: string;
  joined_at?: string;
  plan: string;
  subscription_status: string;
  first_product_status: 'none' | 'pending_verification' | 'verified' | 'rejected';
  first_product_name?: string;
  first_product_price?: number;
  first_product_image?: string;
  first_product_reward_paid: boolean;
  first_product_verified_at?: string;
  pro_reward_paid: boolean;
  pro_reward_paid_at?: string;
  legend_reward_paid: boolean;
  legend_reward_paid_at?: string;
  total_earned: number;
  lifetime_cap: number;
}

export interface ReferralEarningsLog {
  id: number;
  event_type: string;
  amount: number;
  referee: string;
  date: string;
}

export interface ReferralStatusData {
  criteria_status: ReferralCriteriaStatus;
  is_approved: boolean;
  referral_code: string;
  referral_link: string;
  stats: {
    total_earned: number;
    referrals_count: number;
    active_subscriptions_count: number;
    pending_verifications_count: number;
    is_withdrawal_unlocked?: boolean;
    minimum_withdrawal_threshold?: number;
    needed_for_withdrawal?: number;
    withdrawable_wallet_balance?: number;
  };
  referrals: ReferredMerchantItem[];
  earnings_history: ReferralEarningsLog[];
}

