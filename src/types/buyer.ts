export interface BuyerUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

export interface BuyerAuthResponse {
  buyer: BuyerUser;
  token: string;
  message: string;
}

export interface PublicStore {
  id: number;
  name: string;
  username: string;
  description?: string;
  logo_url?: string;
  banner_url?: string;
  template?: string;
  business_type?: string;
  is_verified: boolean;
  currency: string;
  whatsapp_number?: string;
  rating?: number;
  review_count?: number;
  product_count?: number;
}

export interface PublicProduct {
  id: number;
  name: string;
  slug: string;
  description?: string;
  price: number;
  compare_price?: number;
  images: { url: string; is_primary: boolean }[];
  category?: { id: number; name: string };
  type: 'physical' | 'digital' | 'service';
  stock?: number;
  track_stock: boolean;
  store: PublicStore;
}

export interface CartItem {
  productId: number;
  storeUsername: string;
  storeName: string;
  storeLogo?: string;
  productName: string;
  productSlug: string;
  productImage?: string;
  price: number;
  quantity: number;
  type: 'physical' | 'digital' | 'service';
}

export interface CheckoutPayload {
  customer_name: string;
  customer_email?: string;
  customer_phone: string;
  items: { product_id: number; quantity: number; price: number }[];
  delivery_type: 'pickup' | 'delivery' | 'digital';
  delivery_address?: string;
  notes?: string;
}

export interface PublicOrder {
  id: number;
  reference: string;
  customer_name: string;
  customer_phone: string;
  customer_email?: string;
  items: {
    product: { name: string; images: { url: string }[] };
    quantity: number;
    price: number;
    total: number;
  }[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  status: string;
  payment_status: string;
  delivery_type: string;
  delivery_address?: string;
  store: PublicStore;
  created_at: string;
}
