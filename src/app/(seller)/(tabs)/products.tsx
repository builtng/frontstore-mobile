import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { EllipsisVertical, Search } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Screen, T } from '@/components/ui';
import { formatNaira } from '@/lib/format';
import { Chip } from '@/features/seller/parts';
import { getProducts, restoreProduct } from '@/api/products';
import { Product } from '@/api/types';

type Filter = 'all' | 'in' | 'out' | 'hidden';

export default function Products() {
  const { deleted, deletedId } = useLocalSearchParams<{ deleted?: string; deletedId?: string }>();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [toast, setToast] = useState<string | null>(null);

  const queryClient = useQueryClient();

  const { data: apiProducts, isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => getProducts(),
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

  const items = useMemo(() => {
    if (!apiProducts) return [];
    const q = query.trim().toLowerCase();
    return apiProducts.filter((p) => {
      if (toast && p.name === toast) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      if (filter === 'in') return p.stock_count > 0 && p.status !== 'hidden';
      if (filter === 'out') return p.stock_count === 0 && p.status !== 'hidden';
      if (filter === 'hidden') return p.status === 'hidden';
      return true;
    });
  }, [apiProducts, query, filter, toast]);

  const open = (p: Product) => router.push(`/product/${p.id}`);

  return (
    <Screen>
      <View className="gap-4 px-5 pt-3">
        <View className="flex-row items-center justify-between">
          <T className="font-display text-[32px] tracking-[-0.6px]">Products</T>
          <T className="text-sm text-muted">{items.length} products</T>
        </View>
        <View className="h-12 flex-row items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5">
          <Search size={18} color="#5B6660" strokeWidth={2} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search products"
            placeholderTextColor="#5B6660"
            accessibilityLabel="Search products"
            returnKeyType="search"
            className="h-full flex-1 font-sans text-base text-ink"
          />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
          <Chip label="All" on={filter === 'all'} onPress={() => setFilter('all')} />
          <Chip label="In stock" on={filter === 'in'} onPress={() => setFilter('in')} />
          <Chip label="Sold out" on={filter === 'out'} onPress={() => setFilter('out')} />
          <Chip label="Hidden" on={filter === 'hidden'} onPress={() => setFilter('hidden')} />
        </ScrollView>
      </View>

      <ScrollView contentContainerClassName="gap-2.5 px-5 pb-28 pt-4">
        {isLoading ? (
          <View className="py-12 items-center">
            <ActivityIndicator size="large" color="#0B6E4F" />
          </View>
        ) : items.map((p) => {
          const inStock = p.stock_count > 0;
          const bg = inStock ? '#CFE8DC' : '#ECE8DF';
          const fg = inStock ? '#07261C' : '#4A524E';
          const label = p.status === 'preorder' ? 'Pre-order' : inStock ? 'In stock' : 'Sold out';

          return (
            <Pressable
              key={p.id}
              onLongPress={() => open(p)}
              accessibilityHint="Long press for product options"
              className="flex-row items-center gap-3 rounded-[18px] border border-line bg-surface p-3"
            >
              <View className="h-14 w-14 rounded-xl bg-[#E9A23B] items-center justify-center">
                <T className="font-sans-bold text-white text-lg">{p.name[0]}</T>
              </View>
              <View className="min-w-0 flex-1 gap-[3px]">
                <T className="font-sans-bold" numberOfLines={1}>{p.name}</T>
                <T className="font-sans-bold text-sm text-green">{formatNaira(p.price_kobo / 100)}</T>
                <T className="text-xs text-muted">{p.stock_count} units left</T>
              </View>
              <View style={{ backgroundColor: bg }} className="rounded-full px-2.5 py-[5px]">
                <T style={{ color: fg }} className="font-sans-bold text-xs">{label}</T>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`More options for ${p.name}`}
                onPress={() => open(p)}
                className="h-11 w-9 items-center justify-center"
              >
                <EllipsisVertical size={18} color="#5B6660" strokeWidth={2.4} />
              </Pressable>
            </Pressable>
          );
        })}
        {!isLoading && items.length === 0 ? <T className="py-10 text-center text-muted">No products match.</T> : null}
      </ScrollView>

      {toast ? (
        <View
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
          style={{ shadowColor: '#0E1A15', shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}
          className="absolute bottom-5 left-4 right-4 flex-row items-center justify-between rounded-2xl bg-ink py-3.5 pl-[18px] pr-3.5"
        >
          <T className="text-[15px] text-bg">Product deleted</T>
          <Pressable accessibilityRole="button" onPress={undo} className="h-11 justify-center rounded-full px-3.5">
            <T className="font-sans-bold text-[15px] text-gold">Undo</T>
          </Pressable>
        </View>
      ) : null}
    </Screen>
  );
}
