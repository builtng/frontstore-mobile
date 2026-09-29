/** Demo data used across the UI until the API is wired up. */
export const store = {
  name: 'Mama V',
  slug: 'mamav',
  initial: 'M',
  color: '#C8553D',
  owner: 'Charles Aloaye',
  city: 'Lagos',
  tagline: 'Àdìrẹ and ready-to-wear, made in Lagos',
  rating: 4.8,
  reviews: 126,
};

export type Product = {
  id: string;
  name: string;
  price: number;
  was?: number;
  color: string; // placeholder photo colour
  category: string;
  stock: number;
  sizes?: string[];
  status: 'live' | 'preorder' | 'hidden';
};

export const products: Product[] = [
  { id: 'adire-two-piece', name: 'Àdìrẹ two-piece', price: 18500, color: '#E9A23B', category: 'Two-piece', stock: 14, sizes: ['S', 'M', 'L', 'XL'], status: 'live' },
  { id: 'bubu-gown', name: 'Bubu gown', price: 19800, was: 24000, color: '#7A9E7E', category: 'Gowns', stock: 6, sizes: ['M', 'L', 'XL'], status: 'live' },
  { id: 'wrap-skirt', name: 'Wrap skirt', price: 12000, color: '#2F5D8A', category: 'Skirts', stock: 9, sizes: ['S', 'M', 'L'], status: 'live' },
  { id: 'kids-set', name: 'Kids set', price: 11000, color: '#B5838D', category: 'Kids', stock: 0, sizes: ['2-3y', '4-5y'], status: 'live' },
  { id: 'kaftan', name: 'Men’s kaftan', price: 19800, color: '#5A4632', category: 'Men', stock: 4, sizes: ['L', 'XL'], status: 'live' },
  { id: 'adire-kimono', name: 'Àdìrẹ kimono', price: 22000, color: '#C9A227', category: 'Outerwear', stock: 3, sizes: ['One size'], status: 'preorder' },
];

export type OrderStatus = 'paid' | 'shipped' | 'delivered' | 'refunded';
export type Order = {
  id: string;
  customer: string;
  phone: string;
  items: string;
  total: number;
  status: OrderStatus;
  date: string;
  method: 'Card' | 'Transfer' | 'USSD';
  city: string;
};

export const orders: Order[] = [
  { id: 'FS-10482', customer: 'Chioma Adeyemi', phone: '0803 000 1122', items: 'Àdìrẹ two-piece (M), Kids set x2', total: 40000, status: 'paid', date: 'Today, 10:42', method: 'Card', city: 'Lekki' },
  { id: 'FS-10481', customer: 'Tunde Bakare', phone: '0812 000 3344', items: 'Men’s kaftan (XL) x2', total: 39600, status: 'shipped', date: 'Today, 08:15', method: 'Transfer', city: 'Yaba' },
  { id: 'FS-10480', customer: 'Amaka Obi', phone: '0706 000 5566', items: 'Kids set (4-5y)', total: 13500, status: 'delivered', date: 'Yesterday', method: 'USSD', city: 'Ikeja' },
  { id: 'FS-10479', customer: 'Bisi Lawal', phone: '0809 000 7788', items: 'Bubu gown (L)', total: 22300, status: 'delivered', date: '24 Sep', method: 'Card', city: 'Surulere' },
  { id: 'FS-10478', customer: 'Kemi Adebayo', phone: '0802 000 9900', items: 'Wrap skirt (M)', total: 14500, status: 'refunded', date: '23 Sep', method: 'Card', city: 'Ajah' },
];

export const orderStatus: Record<OrderStatus, { label: string; bg: string; fg: string }> = {
  paid: { label: 'Paid', bg: '#CFE8DC', fg: '#07261C' },
  shipped: { label: 'Shipped', bg: '#F3E3C7', fg: '#3D2608' },
  delivered: { label: 'Delivered', bg: '#ECE8DF', fg: '#33403A' },
  refunded: { label: 'Refunded', bg: '#F6D9D2', fg: '#7A2414' },
};

export const customers = [
  { name: 'Chioma Adeyemi', phone: '0803 000 1122', orders: 6, spent: 142000, last: 'Today', city: 'Lekki', initials: 'CA' },
  { name: 'Tunde Bakare', phone: '0812 000 3344', orders: 3, spent: 79200, last: 'Today', city: 'Yaba', initials: 'TB' },
  { name: 'Amaka Obi', phone: '0706 000 5566', orders: 2, spent: 24500, last: 'Yesterday', city: 'Ikeja', initials: 'AO' },
  { name: 'Bisi Lawal', phone: '0809 000 7788', orders: 4, spent: 88300, last: '24 Sep', city: 'Surulere', initials: 'BL' },
];

/** Other stores shown in the directory / buyer screens. */
export const stores = [
  { initial: 'M', color: '#C8553D', name: 'Mama V', slug: 'mamav', cat: 'Fashion', city: 'Lagos', rating: '4.8', photos: ['#E9A23B', '#7A9E7E', '#B5838D'] },
  { initial: 'M', color: '#8A5A12', name: 'Mama Tee’s Kitchen', slug: 'mamatees', cat: 'Food', city: 'Ikeja', rating: '4.9', photos: ['#D98F3A', '#A33B20', '#E3C07A'] },
  { initial: 'G', color: '#8E4A5E', name: 'Glow by Zara', slug: 'glowbyzara', cat: 'Beauty', city: 'Abuja', rating: '4.7', photos: ['#E8C4C4', '#C9A27E', '#F1DCC9'] },
  { initial: 'G', color: '#1F4E5F', name: 'Gadget Plug PH', slug: 'gadgetplugph', cat: 'Gadgets', city: 'Port Harcourt', rating: '4.6', photos: ['#9AA5AB', '#2F5D8A', '#C7CED3'] },
  { initial: 'A', color: '#3E6B5A', name: 'Adunni Beads', slug: 'adunnibeads', cat: 'Fashion', city: 'Ibadan', rating: '4.9', photos: ['#3E6B5A', '#C9A227', '#8E4A5E'] },
  { initial: 'K', color: '#6B4E9B', name: 'Kiddies Corner', slug: 'kiddiescorner', cat: 'Kids', city: 'Lekki', rating: '4.8', photos: ['#F0B861', '#9CC7B2', '#E8C4C4'] },
];
