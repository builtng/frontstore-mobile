import type { Order, OrderStatus } from '@/api/types';

/** The four lists on the Orders tab, in the order a sale moves through them. */
export type OrderList = 'new' | 'toship' | 'shipped' | 'done';

export const LIST_OF: Record<OrderStatus, OrderList | null> = {
  paid: 'new', packed: 'toship', shipped: 'shipped', delivered: 'done', refunded: null, cancelled: null,
};

/** Label and pill colours for an order's stage (design: New amber, To ship indigo, Shipped green, Done grey). */
export const STAGE: Record<OrderStatus, { label: string; bg: string; fg: string }> = {
  paid: { label: 'New', bg: '#FDF1E1', fg: '#8A4A06' },
  packed: { label: 'To ship', bg: '#EEF2FF', fg: '#3730A3' },
  shipped: { label: 'Shipped', bg: '#E6F2EA', fg: '#1E5E3A' },
  delivered: { label: 'Done', bg: '#F1F2F4', fg: '#374151' },
  refunded: { label: 'Refunded', bg: '#FDECE8', fg: '#9A2C14' },
  cancelled: { label: 'Cancelled', bg: '#F1F2F4', fg: '#4B5563' },
};

/** The one next step for an order, if there is one the list can take. */
export const NEXT: Partial<Record<OrderStatus, { to: OrderStatus; label: string }>> = {
  paid: { to: 'packed', label: 'Accept' },
  packed: { to: 'shipped', label: 'Mark shipped' },
  shipped: { to: 'delivered', label: 'Mark delivered' },
};

const TILE = ['#E9A23B', '#2F5D8A', '#7A9E7E', '#B5838D', '#C8553D', '#6B4E9B'];
/** A steady colour per customer, for the square beside the order when there's no photo. */
export function tileColor(seed: string) {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return TILE[Math.abs(h) % TILE.length];
}

/** "12 min", "3 h", "Yesterday", "4 days", then a date. */
export function ago(iso?: string | null) {
  if (!iso) return '';
  const t = new Date(iso).getTime();
  const mins = Math.max(0, Math.round((Date.now() - t) / 60000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return 'Yesterday';
  if (d < 7) return `${d} days`;
  return new Date(t).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' });
}

/** The same, as part of a sentence: "12 min ago", "yesterday", "on 3 Nov". */
export function agoPhrase(iso?: string | null) {
  const a = ago(iso);
  if (!a) return '';
  if (a === 'Just now') return 'just now';
  if (a === 'Yesterday') return 'yesterday';
  if (/^\d+ (min|h|days)$/.test(a)) return `${a} ago`;
  return `on ${a}`;
}

/** wa.me link for the customer's number (Nigerian local numbers get +234). */
export function customerWhatsApp(o: Pick<Order, 'customer_phone'>) {
  let d = String(o.customer_phone || '').replace(/\D/g, '');
  if (!d) return null;
  if (d.startsWith('0')) d = '234' + d.slice(1);
  return `https://wa.me/${d}`;
}

/** First item's photo, if the order carries one. */
export function orderPhoto(o: Order) {
  const it: any = o.items?.[0];
  return it?.image_url || it?.product?.image_url || it?.product?.thumbnail_url || it?.product?.images?.[0] || null;
}
