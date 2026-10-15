import { useEffect, useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Alert, Image, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, T } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, HeartToggle, Segmented, useTileWidth } from '@/features/buyer/parts';
import { getSavedProducts, getFollowedStores, toggleSaveProduct } from '@/api/buyer';
import { openStore } from '@/lib/storefront';
import { FollowButton } from '@/features/buyer/FollowButton';

type Tab = 'prod' | 'stores';
export default function BuyerSaved() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [tab, setTab] = useState<Tab>(params.tab === 'stores' ? 'stores' : 'prod');
  useEffect(() => {
    if (params.tab === 'stores' || params.tab === 'prod') setTab(params.tab);
  }, [params.tab]);
  const tile = useTileWidth();
  const queryClient = useQueryClient();

  const { data: liveSavedProducts = [], isError: productsError, isLoading: loadingProducts, isRefetching: refetchingProducts, refetch: refetchProducts } = useQuery({ queryKey: ['saved-products'], queryFn: getSavedProducts });
  const { data: liveFollowedStores = [], isError: storesError, isLoading: loadingStores, isRefetching: refetchingStores, refetch: refetchStores } = useQuery({ queryKey: ['followed-stores'], queryFn: getFollowedStores });

  const toggleSaveMutation = useMutation({
    mutationFn: (productId: number | string) => toggleSaveProduct(productId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-products'] });
    },
    onError: (err: any) => Alert.alert('Couldn’t update saved items', err.message),
  });
  const loadError = tab === 'prod' ? productsError : storesError;

  const productsCount = liveSavedProducts.length;
  const storesCount = liveFollowedStores.length;
  const isRefreshing = refetchingProducts || refetchingStores;

  const handleRefresh = () => {
    refetchProducts();
    refetchStores();
  };

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-3.5 px-4 pb-6 pt-3"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#0B6E4F" />}
      >
        <T className="font-display-x text-[30px] tracking-[-0.6px]">Saved</T>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[{ key: 'prod', label: `Products · ${productsCount}` }, { key: 'stores', label: `Stores · ${storesCount}` }]}
        />

        {loadError ? (
          <Pressable accessibilityRole="button" onPress={handleRefresh} className="rounded-2xl border border-line bg-surface p-4">
            <T className="text-sm text-danger">Couldn’t load your saved items. Tap to try again.</T>
          </Pressable>
        ) : tab === 'prod' ? (
          loadingProducts ? (
            <View className="items-center py-12">
              <ActivityIndicator size="small" color="#0B6E4F" />
              <T className="mt-2 text-xs text-muted">Loading saved products...</T>
            </View>
          ) : liveSavedProducts.length === 0 ? (
            <T className="py-8 text-center text-sm text-muted">No saved products yet.</T>
          ) : (
            <View className="flex-row flex-wrap gap-x-3 gap-y-4">
              {liveSavedProducts.map((p) => {
                const storeSlug = p.store?.slug || p.store?.username || '';
                const storeName = p.store?.name || p.store?.store_name || 'Store';
                return (
                    <Pressable
                      key={p.id}
                      accessibilityRole="link"
                      accessibilityLabel={`${p.name}, ${storeName}, ${naira(Number(p.price ?? 0))}`}
                      accessibilityHint="Opens the product on the store’s website"
                      onPress={() => storeSlug && openStore(storeSlug, p.slug)}
                      style={{ width: tile }}
                      className="gap-1"
                    >
                      <View style={{ backgroundColor: p.primary_color || '#B5838D' }} className="h-[150px] rounded-2xl overflow-hidden relative">
                        {p.image_url || p.images?.[0] ? (
                          <Image source={{ uri: (p.image_url || p.images?.[0])! }} className="h-full w-full" resizeMode="cover" />
                        ) : null}
                        <HeartToggle on={true} label={p.name} onToggle={() => toggleSaveMutation.mutate(p.id)} />
                      </View>
                      <T numberOfLines={1} className="font-sans-bold text-sm">{p.name}</T>
                      <T numberOfLines={1} className="text-[13px] text-muted">{storeName} · {naira(Number(p.price ?? 0))}</T>
                    </Pressable>
                );
              })}
            </View>
          )
        ) : (
          loadingStores ? (
            <View className="items-center py-12">
              <ActivityIndicator size="small" color="#0B6E4F" />
              <T className="mt-2 text-xs text-muted">Loading followed stores...</T>
            </View>
          ) : liveFollowedStores.length === 0 ? (
            <T className="py-8 text-center text-sm text-muted">No followed stores yet.</T>
          ) : (
            <View className="gap-2.5">
              {liveFollowedStores.map((s) => {
                const storeName = s.name || s.store_name || 'Store';
                const storeSlug = s.slug || s.username || String(s.id);
                const storeColor = s.primary_color || s.store_color || '#0B6E4F';
                return (
                  <Pressable
                    key={storeSlug}
                    accessibilityRole="link"
                    accessibilityLabel={storeName}
                    accessibilityHint="Opens the store’s website"
                    onPress={() => openStore(storeSlug)}
                    className="flex-row items-center gap-3 rounded-[18px] border border-line bg-surface p-3"
                  >
                    <Avatar initial={storeName[0] || 'S'} color={storeColor} />
                    <View className="flex-1">
                      <T className="font-sans-bold text-base">{storeName}</T>
                      {s.location ? <T className="text-[13px] text-muted">{s.location}</T> : null}
                    </View>
                    <FollowButton storeId={s.id} storeName={storeName} />
                  </Pressable>
                );
              })}
            </View>
          )
        )}
      </ScrollView>
    </Screen>
  );
}
