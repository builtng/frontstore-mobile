export interface Product {
  id: number;
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
  id: number;
  name: string;
  slug: string;
  icon?: string;
  products_count?: number;
}

export interface Order {
  id: number;
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
  id: number;
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
}
