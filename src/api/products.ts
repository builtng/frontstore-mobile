import { apiGet, apiPost, apiPut, apiDelete } from './client';
import { Product, AiProductDraftResult } from './types';

/** Fetch seller's products */
export async function getProducts(params?: { status?: string; search?: string }): Promise<Product[]> {
  const data = await apiGet<any>('/products', params);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.data)) return data.data;
  return [];
}

/** Fetch product by ID */
export async function getProduct(id: string | number): Promise<Product> {
  return apiGet<Product>(`/products/${id}`);
}

/** Create new product */
export async function createProduct(payload: Partial<Product>): Promise<Product> {
  return apiPost<Product>('/products', payload);
}

/** Update product */
export async function updateProduct(id: string | number, payload: Partial<Product>): Promise<Product> {
  return apiPut<Product>(`/products/${id}`, payload);
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
