import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, T } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, HeartToggle, Segmented, useTileWidth } from '@/features/buyer/parts';
import { getSavedProducts, getFollowedStores, toggleSaveProduct } from '@/api/buyer';

type Tab = 'prod' | 'stores';
export default function BuyerSaved() {
  const [tab, setTab] = useState<Tab>('prod');
  const tile = useTileWidth();
  const queryClient = useQueryClient();

  const { data: liveSavedProducts = [] } = useQuery({ queryKey: ['saved-products'], queryFn: getSavedProducts });
  const { data: liveFollowedStores = [] } = useQuery({ queryKey: ['followed-stores'], queryFn: getFollowedStores });

  const toggleSaveMutation = useMutation({
    mutationFn: (productId: number | string) => toggleSaveProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-products'] });
    },
  });

  const productsCount = liveSavedProducts.length;
  const storesCount = liveFollowedStores.length;

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-3.5 px-4 pb-6 pt-3">
        <T className="font-display-x text-[30px] tracking-[-0.6px]">Saved</T>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[{ key: 'prod', label: `Products · ${productsCount}` }, { key: 'stores', label: `Stores · ${storesCount}` }]}
        />

        {tab === 'prod' ? (
          liveSavedProducts.length === 0 ? (
            <T className="py-8 text-center text-sm text-muted">No saved products yet.</T>
          ) : (
            <View className="flex-row flex-wrap gap-x-3 gap-y-4">
              {liveSavedProducts.map((p) => (
                <Link key={p.id} href={`/shop/store/${p.store?.slug || ''}`} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={`${p.name}, ${p.store?.name || 'Store'}, ${naira(p.price)}`} style={{ width: tile }} className="gap-1">
                    <View style={{ backgroundColor: p.primary_color || '#B5838D' }} className="h-[150px] rounded-2xl">
                      <HeartToggle on={true} label={p.name} onToggle={() => toggleSaveMutation.mutate(p.id)} />
                    </View>
                    <T className="font-sans-bold text-sm">{p.name}</T>
                    <T className="text-[13px] text-muted">{p.store?.name || 'Store'} · {naira(p.price)}</T>
                  </Pressable>
                </Link>
              ))}
            </View>
          )
        ) : (
          liveFollowedStores.length === 0 ? (
            <T className="py-8 text-center text-sm text-muted">No followed stores yet.</T>
          ) : (
            <View className="gap-2.5">
              {liveFollowedStores.map((s) => (
                <Link key={s.slug || s.id} href={`/shop/store/${s.slug}`} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={s.store_name || s.name || 'Store'} className="flex-row items-center gap-3 rounded-[18px] border border-line bg-surface p-3">
                    <Avatar initial={(s.store_name || s.name || 'S')[0]} color={s.primary_color || s.store_color || '#0B6E4F'} />
                    <View className="flex-1">
                      <T className="font-sans-bold text-base">{s.store_name || s.name}</T>
                      <T className="text-[13px] text-muted">{s.location || 'Nigeria'}</T>
                    </View>
                  </Pressable>
                </Link>
              ))}
            </View>
          )
        )}
      </ScrollView>
    </Screen>
  );
}
