/** Demo data for buyer mode (Discover, Search, Store, Orders, Saved, Track). */
import { products as ifeProducts } from './mock';

export type BuyerItem = { id: string; name: string; price: number; color: string; cat: string; tags?: string };

export type BuyerStore = {
  slug: string;
  name: string;
  short: string; // label under the round avatar on Discover
  initial: string;
  color: string;
  rating: string;
  reviews: number;
  city: string;
  inLagos: boolean;
  cat: 'Fashion' | 'Food' | 'Beauty' | 'Gadgets' | 'Kids';
  blurb: string; // shown in search results: "★ 4.8 · <blurb> · <city>"
  extra?: string; // e.g. "Same-day"
  about: string;
  items: BuyerItem[];
};

export const buyerStores: BuyerStore[] = [
  {
    slug: 'mamatees', name: 'Mama Tee’s Kitchen', short: 'Mama Tee’s', initial: 'M', color: '#8A5A12', rating: '4.9', reviews: 212,
    city: 'Ikeja', inLagos: true, cat: 'Food', blurb: 'Small chops & party trays', extra: 'Same-day',
    about: 'Small chops, party trays and jollof coolers. Order by 12pm for same-day delivery on the Mainland.',
    items: [
      { id: 'small-chops', name: 'Small chops tray (50)', price: 35000, color: '#D98F3A', cat: 'Party trays', tags: 'puff samosa spring roll' },
      { id: 'jollof-cooler', name: 'Jollof cooler', price: 28000, color: '#A33B20', cat: 'Coolers', tags: 'rice party' },
      { id: 'puff-puff', name: 'Puff-puff (100)', price: 12000, color: '#E3C07A', cat: 'Party trays', tags: 'small chops' },
      { id: 'zobo', name: 'Zobo, 5 litres', price: 7500, color: '#7B3F61', cat: 'Drinks', tags: 'hibiscus' },
    ],
  },
  {
    slug: 'mamav', name: 'Mama V', short: 'Mama V', initial: 'M', color: '#C8553D', rating: '4.8', reviews: 126,
    city: 'Yaba', inLagos: true, cat: 'Fashion', blurb: 'Àdìrẹ & ready-to-wear',
    about: 'Àdìrẹ and ready-to-wear fashion, made in Lagos. Delivery across Lagos.',
    items: ifeProducts
      .filter((p) => p.status !== 'hidden')
      .map((p) => ({ id: p.id, name: p.name, price: p.price, color: p.color, cat: p.category, tags: 'ankara adire fashion' })),
  },
  {
    slug: 'glowbyzara', name: 'Glow by Zara', short: 'Glow by Zara', initial: 'G', color: '#8E4A5E', rating: '4.7', reviews: 98,
    city: 'Abuja', inLagos: false, cat: 'Beauty', blurb: 'Natural skincare',
    about: 'Handmade shea butters, black soap and body oils. Ships nationwide in 2 - 4 days.',
    items: [
      { id: 'shea-butter', name: 'Shea glow butter', price: 8500, color: '#E8C4C4', cat: 'Body', tags: 'skincare' },
      { id: 'black-soap', name: 'Black soap', price: 2000, color: '#C9A27E', cat: 'Body', tags: 'dudu osun skincare' },
      { id: 'body-oil', name: 'Glow body oil', price: 6500, color: '#F1DCC9', cat: 'Oils', tags: 'skincare' },
    ],
  },
  {
    slug: 'gadgetplugph', name: 'Gadget Plug PH', short: 'Gadget Plug', initial: 'G', color: '#1F4E5F', rating: '4.6', reviews: 74,
    city: 'Port Harcourt', inLagos: false, cat: 'Gadgets', blurb: 'Phones & accessories',
    about: 'Chargers, cables, earbuds and power banks. 7-day swap on anything faulty.',
    items: [
      { id: 'fast-charger', name: 'Fast charger', price: 9500, color: '#9AA5AB', cat: 'Chargers', tags: 'phone' },
      { id: 'usb-c', name: 'USB-C cable', price: 4500, color: '#2F5D8A', cat: 'Cables', tags: 'phone' },
      { id: 'power-bank', name: 'Power bank 20,000mAh', price: 24000, color: '#C7CED3', cat: 'Chargers', tags: 'phone battery' },
    ],
  },
  {
    slug: 'adunnibeads', name: 'Adunni Beads', short: 'Adunni Beads', initial: 'A', color: '#3E6B5A', rating: '5.0', reviews: 41,
    city: 'Ibadan', inLagos: false, cat: 'Fashion', blurb: 'Beadwork & bags',
    about: 'Handmade beaded bags, jewellery and aso-oke accessories.',
    items: [
      { id: 'beaded-clutch', name: 'Beaded clutch', price: 16000, color: '#3E6B5A', cat: 'Bags', tags: 'owambe' },
      { id: 'coral-set', name: 'Coral bead set', price: 21000, color: '#C9A227', cat: 'Jewellery', tags: 'wedding' },
    ],
  },
  {
    slug: 'ankarahubaba', name: 'Ankara Hub Aba', short: 'Ankara Hub', initial: 'A', color: '#5E4B8B', rating: '4.6', reviews: 57,
    city: 'Aba', inLagos: false, cat: 'Fashion', blurb: 'Fabric by the yard',
    about: 'Ankara, lace and George fabric by the yard, straight from Aba.',
    items: [
      { id: 'ankara-6', name: 'Ankara, 6 yards', price: 14000, color: '#A0522D', cat: 'Fabric', tags: 'print wax' },
      { id: 'lace-5', name: 'Lace, 5 yards', price: 32000, color: '#D8C3A5', cat: 'Fabric', tags: 'aso ebi' },
    ],
  },
  {
    slug: 'kiddiescorner', name: 'Kiddies Corner', short: 'Kiddies', initial: 'K', color: '#6B4E9B', rating: '4.8', reviews: 63,
    city: 'Lekki', inLagos: true, cat: 'Kids', blurb: 'Kids clothes & toys',
    about: 'Everyday clothes, party outfits and toys for ages 0 - 8.',
    items: [
      { id: 'party-dress', name: 'Girls party dress', price: 13500, color: '#F0B861', cat: 'Clothes', tags: 'ankara' },
      { id: 'toy-set', name: 'Wooden toy set', price: 9000, color: '#9CC7B2', cat: 'Toys' },
    ],
  },
];

export const getBuyerStore = (slug?: string) => buyerStores.find((s) => s.slug === slug) ?? buyerStores[0];

/** Stores the demo buyer follows (Discover row, Saved > Stores). */
export const followedSlugs = ['mamatees', 'glowbyzara', 'gadgetplugph', 'adunnibeads'];

// ---- Orders ---------------------------------------------------------------

export type BuyerOrder = {
  id: string;
  slug: string;
  date: string;
  items: string;
  lines: { label: string; amount: number }[];
  delivery: number;
  deliveryTo: string;
  total: number;
  status: 'out' | 'done';
  paidAt: string;
  packedAt: string;
  outAt: string;
  deliveredAt: string;
  rider: { initial: string; name: string; tracking: string };
};

export const buyerOrders: BuyerOrder[] = [
  {
    id: 'FS-20931', slug: 'glowbyzara', date: 'Today', items: 'Shea glow butter x2, Black soap',
    lines: [{ label: 'Shea glow butter x2', amount: 17000 }, { label: 'Black soap', amount: 2000 }], delivery: 2500, deliveryTo: 'Yaba', total: 21500,
    status: 'out', paidAt: 'Today, 9:12 · Card ••••2210', packedAt: 'Today, 11:40', outAt: 'Today, 1:05pm · GIG Logistics', deliveredAt: 'Expected today, 3 - 5pm',
    rider: { initial: 'K', name: 'Kunle · GIG rider', tracking: 'Tracking GIG-44810273' },
  },
  {
    id: 'FS-20877', slug: 'mamatees', date: '20 Sep', items: 'Small chops tray (50)',
    lines: [{ label: 'Small chops tray (50)', amount: 35000 }], delivery: 2500, deliveryTo: 'Yaba', total: 37500,
    status: 'done', paidAt: '19 Sep, 4:20pm · Card ••••2210', packedAt: '20 Sep, 9:30', outAt: '20 Sep, 10:15 · Mama Tee’s rider', deliveredAt: '20 Sep, 11:02',
    rider: { initial: 'S', name: 'Sola · Store rider', tracking: 'Delivered by the store' },
  },
  {
    id: 'FS-20712', slug: 'gadgetplugph', date: '8 Sep', items: 'Fast charger, USB-C cable',
    lines: [{ label: 'Fast charger', amount: 9500 }, { label: 'USB-C cable', amount: 4500 }], delivery: 0, deliveryTo: 'Yaba', total: 14000,
    status: 'done', paidAt: '5 Sep, 8:02pm · Transfer', packedAt: '6 Sep, 10:10', outAt: '6 Sep, 2:30pm · GIG Logistics', deliveredAt: '8 Sep, 12:48',
    rider: { initial: 'E', name: 'Emeka · GIG rider', tracking: 'Tracking GIG-44790115' },
  },
];

/** Track screen data; unknown ids (e.g. the demo route FS-10482) fall back to the active order. */
export const getBuyerOrder = (id?: string) => buyerOrders.find((o) => o.id === id) ?? buyerOrders[0];
