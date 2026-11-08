import { useEffect, useState } from 'react';
import { BackHandler, Pressable, ScrollView, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, RefreshCw, Search, Star } from 'lucide-react-native';
import { EmptyState, LoadError, Screen, Skeleton, T, cx } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, ChipRow, HeartToggle, useTileWidth } from '@/features/buyer/parts';
import { ProductImage, productPhoto } from '@/features/products/ProductImage';
import { getMe } from '@/api/auth';
import { getMarketplaceStores, getBuyerOrders, getSavedProducts, searchMarketplace, toggleSaveProduct } from '@/api/buyer';

const CATS = ['For you', 'Fashion', 'Food', 'Beauty', 'Gadgets'];
const CARD_SHADOW = { shadowColor: '#0E1A15', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 };

export default function BuyerHome() {
  const [cat, setCat] = useState('For you');
  const tile = useTileWidth();
  const { from_onboarding, setup_token } = useLocalSearchParams<{ from_onboarding?: string; setup_token?: string }>();
  const isFromOnboarding = from_onboarding === '1' || !!setup_token;

  useEffect(() => {
    if (!isFromOnboarding) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      router.replace({
        pathname: '/choose-mode',
        params: { setup_token: setup_token || '', initial_mode: 'shop' },
      });
      return true;
    });
    return () => sub.remove();
  }, [isFromOnboarding, setup_token]);

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: liveStores = [], isLoading: storesLoading, isError: storesError, refetch: refetchStores } = useQuery({
    queryKey: ['marketplace-stores', cat],
    queryFn: () => getMarketplaceStores({ category: cat === 'For you' ? undefined : cat }),
  });
  const { data: orders = [] } = useQuery({ queryKey: ['buyer-orders'], queryFn: getBuyerOrders });
  // Newest products across Frontstore (the marketplace feed with no search term).
  const { data: feed } = useQuery({ queryKey: ['marketplace-feed'], queryFn: () => searchMarketplace('') });
  const fresh = (feed?.products ?? []).slice(0, 8);
  const { data: savedList = [] } = useQuery({ queryKey: ['saved-products'], queryFn: getSavedProducts, enabled: !!me?.user });
  const savedIds = new Set(savedList.map((p) => String(p.id)));
  const qc = useQueryClient();
  const save = useMutation({ mutationFn: (id: number | string) => toggleSaveProduct(id), onSettled: () => qc.invalidateQueries({ queryKey: ['saved-products'] }) });

  const activeOrder = orders.find((o) => o.order_status === 'paid' || o.order_status === 'shipped' || o.order_status === 'confirmed' || o.order_status === 'processing');

  const user = me?.user;
  const userName = user?.name ? user.name.split(' ')[0] : 'Shopper';
  const userInitials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'FS';

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-3.5 px-4 pb-6 pt-3" showsVerticalScrollIndicator={false}>
        {isFromOnboarding ? (
          <View className="flex-row items-center justify-between rounded-2xl border border-sand-dark bg-surface px-3.5 py-2.5">
            <View className="flex-1 pr-2">
              <T className="font-sans-bold text-xs text-muted-2">Mode: Shopping</T>
              <T className="text-xs text-muted">First time onboarding</T>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => router.replace({ pathname: '/choose-mode', params: { setup_token: setup_token || '', initial_mode: 'shop' } })}
              className="flex-row items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1.5"
            >
              <RefreshCw size={12} color="#1E5E3A" />
              <T className="font-sans-bold text-xs text-green">Change to Selling</T>
            </Pressable>
          </View>
        ) : null}

        <View className="flex-row items-center justify-between">
          <View>
            <T className="text-[13px] text-muted">Delivering to Nigeria</T>
            <T className="font-display-x text-[26px] tracking-[-0.5px]">Hi {userName}</T>
          </View>
          {user ? (
            <Link href="/switch?from=shop" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Switch account" className="h-11 flex-row items-center gap-1.5 rounded-full border border-line bg-surface pl-1 pr-1.5">
                <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-ink">
                  <T className="font-sans-bold text-xs text-white">{userInitials}</T>
                </View>
                <ChevronDown size={14} color="#4A524E" strokeWidth={2} />
              </Pressable>
            </Link>
          ) : (
            <Link href="/login" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Sign in" className="h-10 items-center justify-center rounded-full bg-ink px-4">
                <T className="font-sans-bold text-xs text-white">Sign in</T>
              </Pressable>
            </Link>
          )}
        </View>

        <Link href="/shop/search" asChild>
          <Pressable accessibilityRole="search" className="h-[50px] flex-row items-center gap-2.5 rounded-2xl border border-line bg-surface px-4">
            <Search size={18} color="#5F6B65" strokeWidth={2} />
            <T className="text-[15px] text-muted">Search stores and products</T>
          </Pressable>
        </Link>

        {activeOrder ? (
          <Link href={`/shop/track/${activeOrder.id}`} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`Track order ${activeOrder.id}`} className="flex-row items-center gap-3 rounded-[20px] bg-ink p-3.5">
              <Avatar initial={(activeOrder.store?.name || activeOrder.store?.store_name)?.[0] ?? 'S'} color={activeOrder.store?.primary_color ?? '#8E4A5E'} size={44} radius={12} fontSize={16} />
              <View className="flex-1 gap-1.5">
                <T className="text-sm text-bg">
                  <T className="font-sans-bold text-sm text-bg">{activeOrder.order_status === 'shipped' ? 'Out for delivery' : 'Processing'}</T> · {activeOrder.store?.name || activeOrder.store?.store_name || 'Store'}
                </T>
                <View className="flex-row gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} className={cx('h-1 flex-1 rounded-full', i < (activeOrder.order_status === 'shipped' ? 3 : 1) ? 'bg-leaf' : 'bg-[#33504A]')} />
                  ))}
                </View>
              </View>
              <T className="font-sans-bold text-[13px] text-gold">Track</T>
            </Pressable>
          </Link>
        ) : null}

        <ChipRow options={CATS} value={cat} onChange={setCat} />

        <View className="flex-row items-baseline justify-between">
          <T className="font-display text-lg">Stores on Frontstore</T>
          <Link href={{ pathname: '/shop/search', params: { filter: 'Stores' } }} asChild>
            <Pressable accessibilityRole="link" hitSlop={12}>
              <T className="font-sans-bold text-[13px] text-green">See all</T>
            </Pressable>
          </Link>
        </View>

        {storesLoading ? (
          <View className="flex-row gap-3">
            <Skeleton className="h-36 w-36 rounded-[18px]" />
            <Skeleton className="h-36 w-36 rounded-[18px]" />
            <Skeleton className="h-36 w-36 rounded-[18px]" />
          </View>
        ) : storesError ? (
          <LoadError what="stores" onRetry={() => refetchStores()} />
        ) : liveStores.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="-mx-4 grow-0" contentContainerClassName="gap-3 px-4 pb-1">
            {liveStores.map((s) => {
              const displayName = s.name || s.store_name || 'Store';
              const displaySlug = s.slug || s.username || String(s.id);
              const color = s.primary_color || s.store_color || '#1E5E3A';
              const meta = [s.category_label || s.category, s.location || s.city].filter(Boolean).join(' · ');
              const rating = Number((s as any).rating ?? (s as any).reviews_avg_rating ?? 0);
              return (
                <Link key={displaySlug} href={`/shop/store/${displaySlug}`} asChild>
                  <Pressable accessibilityRole="link" accessibilityLabel={displayName} style={CARD_SHADOW} className="w-[150px] overflow-hidden rounded-[20px] bg-surface">
                    <View style={{ backgroundColor: color }} className="h-16" />
                    <View className="gap-[3px] px-3 pb-3">
                      <View className="-mt-5 mb-1">
                        <Avatar initial={displayName[0] || 'S'} color="#0E1A15" uri={s.logo_url || undefined} size={40} radius={12} fontSize={16} className="border-[3px] border-white" />
                      </View>
                      <T numberOfLines={1} className="font-sans-bold text-sm">{displayName}</T>
                      {meta ? <T numberOfLines={1} className="text-xs text-muted">{meta}</T> : null}
                      {rating > 0 ? (
                        <View className="flex-row items-center gap-1">
                          <Star size={12} color="#E9A23B" fill="#E9A23B" />
                          <T className="font-sans-bold text-xs">{rating.toFixed(1)}</T>
                        </View>
                      ) : null}
                    </View>
                  </Pressable>
                </Link>
              );
            })}
          </ScrollView>
        ) : (
          <EmptyState title={`No ${cat.toLowerCase()} stores yet`} sub="Try another category. New stores join every day." />
        )}

        {fresh.length ? (
          <>
            <T className="pt-1 font-display text-lg">Fresh on Frontstore</T>
            <View className="flex-row flex-wrap gap-x-3 gap-y-3.5">
              {fresh.map((p) => {
                const slug = p.store?.username || p.store?.slug;
                const saved = savedIds.has(String(p.id));
                const price = naira(Number((p as any).price ?? p.price_kobo / 100));
                return (
                  <Pressable
                    key={p.id}
                    accessibilityRole="link"
                    accessibilityLabel={`${p.name}, ${price}`}
                    disabled={!slug}
                    onPress={() => slug && router.push(`/shop/store/${slug}`)}
                    style={[CARD_SHADOW, { width: tile }]}
                    className="gap-2.5 rounded-[22px] bg-surface p-2 pb-3"
                  >
                    <View>
                      <ProductImage uri={productPhoto(p)} name={p.name} className="h-[142px] w-full rounded-2xl" />
                      <View className="absolute right-2 top-2">
                        <HeartToggle on={saved} label={p.name} onToggle={() => (me?.user ? save.mutate(p.id) : router.push('/login'))} />
                      </View>
                    </View>
                    <View className="gap-0.5 px-0.5">
                      {p.store?.store_name ? <T numberOfLines={1} className="text-xs text-muted">{p.store.store_name}</T> : null}
                      <T numberOfLines={1} className="font-sans-bold text-sm">{p.name}</T>
                      <T className="font-sans-bold text-[15px]">{price}</T>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <Link href="/switch?from=shop" asChild>
          <Pressable accessibilityRole="button" className="mt-2 flex-row items-center gap-3 rounded-[20px] bg-mint p-4">
            <View className="flex-1">
              <T className="font-sans-bold text-[15px]">Got something to sell?</T>
              <T className="text-[13px] text-muted">Open your own Frontstore in minutes.</T>
            </View>
            <T className="font-sans-bold text-[13px] text-green">Start selling</T>
          </Pressable>
        </Link>
      </ScrollView>
    </Screen>
  );
}
