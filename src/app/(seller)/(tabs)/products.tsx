import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EllipsisVertical, Package, Search, X } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { EmptyState, LoadError, Screen, Skeleton, SkeletonRows, T, cx } from '@/components/ui';
import { formatNaira } from '@/lib/format';
import { Segmented, Toggle } from '@/features/seller/parts';
import { getProducts, restoreProduct, updateProduct } from '@/api/products';
import { ProductImage, productPhoto } from '@/features/products/ProductImage';
import { Product } from '@/api/types';

type Filter = 'all' | 'in' | 'low' | 'out';
const LOW = 3;

/** Stock pill text and colours (design: green in stock, amber low, grey sold out). */
function stockPill(p: Product) {
  if (p.status === 'preorder') return { label: 'Pre-order', bg: '#EEF2FF', fg: '#3730A3' };
  if (p.stock_count <= 0) return { label: 'Sold out', bg: '#F1F2F4', fg: '#4B5563' };
  if (p.stock_count <= LOW) return { label: `Only ${p.stock_count} left`, bg: '#FDF1E1', fg: '#8A4A06' };
  return { label: `${p.stock_count} in stock`, bg: '#E6F2EA', fg: '#1E5E3A' };
}

export default function Products() {
  const { deleted, deletedId } = useLocalSearchParams<{ deleted?: string; deletedId?: string }>();
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [toast, setToast] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: apiProducts, isLoading, isError, refetch } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
  });

  // Show / hide in store, straight from the list. The switch moves at once and rolls back if saving fails.
  const visibility = useMutation({
    mutationFn: ({ p, show }: { p: Product; show: boolean }) => updateProduct(p.id, { status: show ? 'live' : 'hidden' }),
    onMutate: async ({ p, show }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const before = queryClient.getQueryData<Product[]>(['products']);
      queryClient.setQueryData<Product[]>(['products'], (list) => list?.map((x) => (x.id === p.id ? { ...x, status: show ? 'live' : 'hidden' } : x)));
      return { before };
    },
    onError: (_e, _v, ctx) => { if (ctx?.before) queryClient.setQueryData(['products'], ctx.before); },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
  });

  useEffect(() => {
    if (!deleted) return;
    setToast(deleted);
    const t = setTimeout(() => {
      setToast(null);
      router.setParams({ deleted: undefined, deletedId: undefined });
    }, 5000);
    return () => clearTimeout(t);
  }, [deleted]);

  const undo = async () => {
    if (deletedId) {
      try {
        await restoreProduct(deletedId);
        queryClient.invalidateQueries({ queryKey: ['products'] });
      } catch (err) {
        console.warn('Restore failed', err);
      }
    }
    setToast(null);
    router.setParams({ deleted: undefined, deletedId: undefined });
  };

  const all = (apiProducts ?? []).filter((p) => !(toast && p.name === toast));
  const hiddenCount = all.filter((p) => p.status === 'hidden').length;
  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((p) => {
      if (q) return p.name.toLowerCase().includes(q);
      if (filter === 'in') return p.stock_count > LOW;
      if (filter === 'low') return p.stock_count > 0 && p.stock_count <= LOW;
      if (filter === 'out') return p.stock_count <= 0;
      return true;
    });
  }, [all, query, filter]);

  return (
    <Screen>
      <View className="flex-row items-end justify-between gap-3 px-5 pb-3 pt-1.5">
        <View className="min-w-0 flex-1 gap-0.5">
          {isLoading ? <Skeleton className="h-3.5 w-28" /> : (
            <T numberOfLines={1} className="text-sm text-muted">{all.length} {all.length === 1 ? 'product' : 'products'}{hiddenCount ? ` · ${hiddenCount} hidden` : ''}</T>
          )}
          <T accessibilityRole="header" className="font-display-x text-[30px] tracking-[-0.6px]">Products</T>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={searching ? 'Close search' : 'Search products'}
          onPress={() => { setSearching(!searching); setQuery(''); }}
          className="h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-surface"
        >
          {searching ? <X size={19} color="#0E1A15" strokeWidth={2} /> : <Search size={19} color="#0E1A15" strokeWidth={2} />}
        </Pressable>
      </View>
      <View className="px-5 pb-3">
        {searching ? (
          <View className="h-11 flex-row items-center gap-2 rounded-[14px] border-[1.5px] border-line bg-surface px-3">
            <Search size={16} color="#5F6B65" strokeWidth={2} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Search products"
              placeholderTextColor="#8A948F"
              accessibilityLabel="Search products"
              returnKeyType="search"
              className="h-full min-w-0 flex-1 font-sans text-base text-ink"
            />
          </View>
        ) : (
          <Segmented value={filter} onChange={setFilter} options={[['all', 'All'], ['in', 'In stock'], ['low', 'Low'], ['out', 'Sold out']] as const} />
        )}
      </View>

      <ScrollView contentContainerClassName="px-5 pb-28" showsVerticalScrollIndicator={false}>
        {visibility.error ? (
          <View className="mb-2.5 rounded-2xl bg-danger-bg p-3"><T className="text-sm text-danger">Couldn’t change that product. Check your connection and try again.</T></View>
        ) : null}
        {isLoading ? (
          <SkeletonRows count={5} />
        ) : items.length ? (
          <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
            {items.map((p, i) => {
              const pill = stockPill(p);
              const shown = p.status !== 'hidden';
              return (
                <View key={p.id} style={{ opacity: shown ? 1 : 0.5 }} className={cx('flex-row items-center gap-3 px-3.5 py-3', i > 0 && 'border-t border-line')}>
                  <ProductImage uri={productPhoto(p)} name={p.name} className="h-14 w-14 rounded-[14px]" />
                  <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${p.name}`} onPress={() => router.push(`/product/${p.id}/edit`)} className="min-w-0 flex-1 gap-[3px]">
                    <T numberOfLines={1} className="font-sans-bold text-[15px]">{p.name}</T>
                    <View className="flex-row flex-wrap items-center gap-2">
                      <T className="font-sans-bold text-sm">{formatNaira(p.price_kobo / 100)}</T>
                      <View style={{ backgroundColor: pill.bg }} className="rounded-full px-2 py-0.5">
                        <T style={{ color: pill.fg }} className="font-sans-bold text-[11px]">{pill.label}</T>
                      </View>
                    </View>
                  </Pressable>
                  <Toggle label={`Show ${p.name} in store`} value={shown} onChange={(v) => visibility.mutate({ p, show: v })} />
                  <Pressable accessibilityRole="button" accessibilityLabel={`More actions for ${p.name}`} onPress={() => router.push(`/product/${p.id}`)} className="h-[34px] w-[34px] items-center justify-center rounded-full">
                    <EllipsisVertical size={18} color="#5F6B65" strokeWidth={2.2} />
                  </Pressable>
                </View>
              );
            })}
          </View>
        ) : isError && !apiProducts ? (
          <LoadError what="your products" onRetry={() => refetch()} />
        ) : !all.length ? (
          <EmptyState
            icon={<Package size={22} color="#5F6B65" />}
            title="No products yet"
            sub="Snap a photo and your first product is ready to sell."
            action="Add a product"
            href="/add-product"
          />
        ) : query.trim() ? (
          <EmptyState title={`Nothing matches “${query.trim()}”`} sub="Try a different word." action="Clear search" onAction={() => setQuery('')} />
        ) : (
          <EmptyState
            title={filter === 'in' ? 'Nothing well stocked' : filter === 'low' ? 'Nothing running low' : 'Nothing is sold out'}
            sub={filter === 'in' ? 'Update your stock so buyers can order.' : filter === 'low' ? `Products with ${LOW} or fewer left show here.` : 'Products that run out will show here.'}
          />
        )}
      </ScrollView>

      {toast ? (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{ shadowColor: '#0E1A15', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}
          className="absolute bottom-5 left-4 right-4 flex-row items-center justify-between rounded-2xl bg-ink py-3.5 pl-[18px] pr-3.5"
        >
          <T numberOfLines={1} className="mr-2 flex-1 font-sans-semibold text-sm text-white">{toast} deleted</T>
          <Pressable accessibilityRole="button" onPress={undo} className="h-9 justify-center rounded-full bg-gold px-3.5">
            <T className="font-sans-bold text-[13px] text-[#2A1B05]">Undo</T>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}
