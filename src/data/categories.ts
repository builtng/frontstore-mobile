export interface ProductCategory {
  id: string;
  name: string;
  icon?: string;
  description?: string;
}

export const STORE_CATEGORIES: ProductCategory[] = [
  { id: 'Fashion', name: 'Fashion & Apparel', description: 'Clothing, shoes, fabrics & wear' },
  { id: 'Beauty', name: 'Beauty & Skincare', description: 'Cosmetics, hair, perfumes & personal care' },
  { id: 'Food', name: 'Food & Groceries', description: 'Fresh food, drinks, snacks & restaurants' },
  { id: 'Gadgets', name: 'Gadgets & Electronics', description: 'Phones, laptops, accessories & smart tech' },
  { id: 'Home', name: 'Home & Living', description: 'Furniture, kitchenware, decor & appliances' },
  { id: 'Jewelry', name: 'Jewelry & Watches', description: 'Rings, beads, necklaces & luxury items' },
  { id: 'Health', name: 'Health & Wellness', description: 'Supplements, fitness & wellness items' },
  { id: 'Kids', name: 'Kids & Baby', description: 'Toys, baby care, kids clothing & essentials' },
  { id: 'Art', name: 'Art & Crafts', description: 'Paintings, handcrafted items & gifts' },
  { id: 'Services', name: 'Services & Digital', description: 'Digital products, consulting & creative services' },
  { id: 'Other', name: 'Other', description: 'General merchandise & unique products' },
];
