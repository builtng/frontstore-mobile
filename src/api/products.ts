import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Product, ProductCategory, ProductVariant, AiProductDraftResult } from './types';

/** Fill the app's kobo / stock_count / status / images fields from the backend's. */
function normalizeProduct(p: any): Product {
  const status = p.is_draft ? 'hidden' : p.stock_status === 'preorder' ? 'preorder' : 'live';
  const stock = p.track_inventory ? Number(p.inventory_quantity ?? 0) : p.stock_status === 'out_of_stock' ? 0 : Number(p.inventory_quantity ?? 1) || 1;
  return {
    ...p,
    price_kobo: p.price_kobo ?? Math.round(Number(p.price ?? 0) * 100),
    compare_at_price_kobo: p.compare_at_price_kobo ?? (p.compare_at_price != null ? Math.round(Number(p.compare_at_price) * 100) : null),
    stock_count: p.stock_count ?? stock,
    status: p.status ?? status,
    images: p.images ?? p.image_urls ?? [],
    category: typeof p.category === 'object' ? p.category?.name ?? null : p.category ?? null,
    sizes: p.sizes ?? (p.variants ?? []).filter((v: any) => v.size && !v.color).map((v: any) => v.size),
  };
}

/** Admin-managed product categories */
export async function getCategories(): Promise<ProductCategory[]> {
  const data = await apiGet<any>('/categories');
  return Array.isArray(data) ? data : [];
}

/** Split a stock count across sizes, earlier sizes taking the remainder. */
function splitStock(total: number, parts: number): number[] {
  const base = Math.floor(total / parts);
  return Array.from({ length: parts }, (_, i) => base + (i < total % parts ? 1 : 0));
}

/** Fetch seller's products */
export async function getProducts(params?: { status?: string; search?: string }): Promise<Product[]> {
  const data = await apiGet<any>('/products', params);
  const list = Array.isArray(data) ? data : Array.isArray(data?.data) ? data.data : [];
  return list.map(normalizeProduct);
}

/** Fetch product by ID */
export async function getProduct(id: string | number): Promise<Product> {
  return normalizeProduct(await apiGet<any>(`/products/${id}`));
}

/**
 * The app works in kobo with images/stock_count/status; the backend takes
 * price in naira, image_urls, inventory_quantity, is_draft and stock_status.
 * Sizes become size variants (stock split across them), reusing existing
 * variant ids. Products with colour variants (set on the web) keep their
 * variants untouched, since the app can't show those.
 */
function toBackendProduct(p: Partial<Product>, existing: ProductVariant[] = []): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (p.name !== undefined) out.name = p.name;
  if (p.price_kobo !== undefined) out.price = p.price_kobo / 100;
  if (p.compare_at_price_kobo !== undefined) out.compare_at_price = p.compare_at_price_kobo == null ? null : p.compare_at_price_kobo / 100;
  if (p.description !== undefined) out.description = p.description;
  if (p.images !== undefined) out.image_urls = p.images.slice(0, 3);
  if (p.stock_count !== undefined) {
    out.track_inventory = true;
    out.inventory_quantity = p.stock_count;
  }
  if (p.status !== undefined) {
    out.is_draft = p.status === 'hidden';
    if (p.status === 'preorder') out.stock_status = 'preorder';
  }
  if (p.category_id !== undefined) out.category_id = p.category_id;
  if (p.sizes?.length && !existing.some((v) => v.color)) {
    const sizes = p.sizes;
    const kept = sizes.map((size) => existing.find((v) => v.size === size));
    const keptTotal = kept.reduce((sum, v) => sum + (v?.inventory_quantity ?? 0), 0);
    // Same sizes and same total: keep each size's own count instead of re-splitting.
    const stock = kept.every(Boolean) && kept.length === existing.length && keptTotal === (p.stock_count ?? 0)
      ? kept.map((v) => v!.inventory_quantity)
      : splitStock(p.stock_count ?? 0, sizes.length);
    out.variants = sizes.map((size, i) => ({
      id: existing.find((v) => v.size === size)?.id,
      size,
      inventory_quantity: stock[i],
    }));
  }
  return out;
}

/** Create new product */
export async function createProduct(payload: Partial<Product>): Promise<Product> {
  return apiPost<Product>('/products', toBackendProduct(payload));
}

/** Update product */
export async function updateProduct(id: string | number, payload: Partial<Product>, existingVariants: ProductVariant[] = []): Promise<Product> {
  return apiPut<Product>(`/products/${id}`, toBackendProduct(payload, existingVariants));
}

/** Soft delete product */
export async function deleteProduct(id: string | number): Promise<void> {
  return apiDelete(`/products/${id}`);
}

/** Restore soft-deleted product */
export async function restoreProduct(id: string | number): Promise<Product> {
  return apiPost<Product>(`/products/${id}/restore`);
}

/** Upload product image */
export async function uploadProductImage(fileUri: string): Promise<{ url: string }> {
  const formData = new FormData();
  const filename = fileUri.split('/').pop() || 'photo.jpg';
  const match = /\.(\w+)$/.exec(filename);
  const type = match ? `image/${match[1]}` : 'image/jpeg';

  formData.append('image', {
    uri: fileUri,
    name: filename,
    type,
  } as any);

  return apiPost<{ url: string }>('/products/upload-image', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
}

/** Submit photo-first AI draft job */
export async function createAiProductDraft(imageUrls: string[]): Promise<{ job_id: string }> {
  return apiPost<{ job_id: string }>('/products/ai-draft', { images: imageUrls });
}

/** Poll status of photo-first AI draft job */
export async function getAiProductDraftStatus(jobId: string): Promise<AiProductDraftResult> {
  return apiGet<AiProductDraftResult>(`/products/ai-draft/${jobId}`);
}
