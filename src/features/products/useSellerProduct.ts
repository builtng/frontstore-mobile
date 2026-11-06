import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getProduct } from '@/api/products';
import type { Product } from '@/api/types';

/** One product. Starts from the product list when it's there, so its screens open filled in. */
export function useSellerProduct(id?: string) {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
    initialData: () => queryClient.getQueryData<Product[]>(['products'])?.find((p) => String(p.id) === String(id)),
    initialDataUpdatedAt: () => queryClient.getQueryState(['products'])?.dataUpdatedAt,
  });
}
