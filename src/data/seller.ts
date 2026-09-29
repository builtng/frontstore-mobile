/** Seller-side demo data taken from the AppProducts / AppInquiries / AppPayouts designs. */

export type StockState = 'in' | 'pre' | 'out';
export const stockStyle: Record<StockState, { label: string; bg: string; fg: string }> = {
  in: { label: 'In stock', bg: '#CFE8DC', fg: '#07261C' },
  pre: { label: 'Pre-order', bg: '#F3E3C7', fg: '#6B4210' },
  out: { label: 'Sold out', bg: '#ECE8DF', fg: '#4A524E' },
};

export type SellerProduct = {
  id: string;
  name: string;
  price: number;
  meta: string;
  color: string;
  stock: StockState;
  hidden?: boolean;
};

export const sellerProducts: SellerProduct[] = [
  { id: 'adire-two-piece', name: 'Àdìrẹ two-piece', price: 18500, meta: '24 orders · 3 colours', color: '#E9A23B', stock: 'in' },
  { id: 'bubu-gown', name: 'Bubu gown', price: 22000, meta: '15 orders · 4 prints', color: '#7A9E7E', stock: 'in' },
  { id: 'kids-set', name: 'Kids set', price: 9500, meta: '11 orders', color: '#B5838D', stock: 'in' },
  { id: 'mens-shirt', name: 'Men’s shirt', price: 15000, meta: '6 orders', color: '#5E4B8B', stock: 'pre' },
  { id: 'kaftan', name: 'Kaftan', price: 24000, meta: '5 orders', color: '#1F4E5F', stock: 'in' },
  { id: 'tote-bag', name: 'Tote bag', price: 6500, meta: '9 orders', color: '#6B7F3A', stock: 'out' },
];

export const findSellerProduct = (id?: string | string[]) =>
  sellerProducts.find((p) => p.id === (Array.isArray(id) ? id[0] : id)) ?? sellerProducts[0];

export type InboxOrder = { av: string; name: string; id: string; time: string; total: string; pay: string; items: string; next: string };
export type OrderTab = 'new' | 'conf' | 'done';

export const orderTabs: Array<[OrderTab, string]> = [
  ['new', 'To ship · 3'],
  ['conf', 'Shipped'],
  ['done', 'Delivered'],
];

export const inbox: Record<OrderTab, InboxOrder[]> = {
  new: [
    { av: '#E9A23B', name: 'Chioma Adeyemi', id: '#FS-10482', time: '12m', total: '₦40,000', pay: 'Paid · Card', items: 'Àdìrẹ two-piece (Saffron, M), Kids set x2 · Surulere', next: 'Mark shipped' },
    { av: '#1F4E5F', name: 'Tunde Bakare', id: '#FS-10481', time: '1h', total: '₦50,500', pay: 'Paid · Transfer', items: 'Kaftan (XL) x2 · Lekki', next: 'Mark shipped' },
    { av: '#B5838D', name: 'Ngozi Eze', id: '#FS-10480', time: '2h', total: '₦12,000', pay: 'Paid · USSD', items: 'Kids set (6 yrs) · Pick up in Yaba', next: 'Ready for pickup' },
  ],
  conf: [
    { av: '#8A5A12', name: 'Amaka Obi', id: '#FS-10479', time: '3h', total: '₦16,500', pay: 'Paid · Card', items: 'Kids set (4 yrs), Head wrap · Yaba', next: 'Mark delivered' },
    { av: '#7A9E7E', name: 'Seun Kolawole', id: '#FS-10476', time: 'Yesterday', total: '₦24,500', pay: 'Paid · Transfer', items: 'Bubu gown (Emerald) · Ikeja', next: 'Mark delivered' },
  ],
  done: [
    { av: '#7B3F61', name: 'Halima Yusuf', id: '#FS-10471', time: 'Mon', total: '₦40,500', pay: 'Paid · Card', items: 'Couple set · Abuja', next: 'Send receipt' },
  ],
};

type PayoutState = 'paid' | 'proc' | 'fail';
export const payoutStyle: Record<PayoutState, [string, string, string]> = {
  paid: ['Paid', '#CFE8DC', '#07261C'],
  proc: ['Processing', '#F3E3C7', '#6B4210'],
  fail: ['Failed - retrying', '#FBE7E2', '#A8321E'],
};
export const payoutHistory: Array<{ date: string; orders: string; amount: string; s: PayoutState }> = [
  { date: '26 Sep', orders: '6', amount: '₦148,200', s: 'proc' },
  { date: '19 Sep', orders: '9', amount: '₦212,600', s: 'paid' },
  { date: '12 Sep', orders: '5', amount: '₦96,300', s: 'paid' },
  { date: '05 Sep', orders: '8', amount: '₦162,900', s: 'paid' },
  { date: '29 Aug', orders: '4', amount: '₦58,000', s: 'fail' },
];
