import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { Link, router } from 'expo-router';
import { Bell, CheckCircle, Package, Plus, Share, Sparkles, X } from 'lucide-react-native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, EmptyState, LoadError, Screen, Skeleton, SkeletonRows, T, cx } from '@/components/ui';
import { BottomSheet } from '@/features/buyer/account';
import { getMe } from '@/api/auth';
import { getSellerOrders, getWalletBalance } from '@/api/orders';
import { getStore } from '@/api/store';
import { getProducts } from '@/api/products';
import { ContactEditSheet } from '@/features/account/ContactEditSheet';
import { ProductImage, productPhoto } from '@/features/products/ProductImage';
import { compactNaira, formatNaira } from '@/lib/format';
import { WhatsAppIcon } from '@/features/setup/parts';

function Stat({ label, value, delta, dark, loading }: { label: string; value: string; delta: string; dark?: boolean; loading?: boolean }) {
  return (
    <View className={cx('flex-1 gap-0.5 rounded-[20px] p-3.5', dark ? 'bg-green' : 'border border-line bg-surface')}>
      <T className={cx('text-xs', dark ? 'text-[#D7EAE1]' : 'text-muted')}>{label}</T>
      {loading ? (
        <View className="gap-2 pt-1.5">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3 w-16" />
        </View>
      ) : (
        <>
          <T numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.5} className={cx('font-display text-[24px]', dark && 'text-bg')}>{value}</T>
          <T numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} className={cx('font-sans-bold text-[11px]', dark ? 'text-[#F3D9A8]' : 'text-green')}>{delta}</T>
        </>
      )}
    </View>
  );
}

export default function Home() {
  const narrow = useWindowDimensions().width < 360;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);
  const qc = useQueryClient();

  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const { data: walletData, isLoading: walletLoading } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWalletBalance,
  });

  const { data: ordersData, isLoading: ordersLoading, isError: ordersError, refetch: refetchOrders } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => getSellerOrders(),
  });

  // The store's real assistant setting (same switch as the web dashboard). It answers buyers only on Pro and above.
  const { data: sellerStore, isLoading: sellerStoreLoading } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });

  const { data: products, isLoading: productsLoading, isError: productsError, refetch: refetchProducts } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });
  const latestProducts = (products ?? []).slice(0, 5);
  const needsWhatsapp = !!sellerStore && !sellerStore.whatsapp_phone;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const user = authData?.user;
  const store = authData?.store;
  const storeName = store?.store_name || store?.name || 'My Store';
  const username = store?.username || store?.slug || 'mystore';
  const link = `frontstore.app/${username}`;
  const initials = storeName.split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();

  const toShipOrders = ordersData ? ordersData.filter((o) => o.status === 'paid' || o.status === 'packed') : [];
  const balanceKobo = walletData?.available_balance_kobo ?? 0;


  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-[18px] px-5 pb-8 pt-3">
        <View className="flex-row items-center justify-between">
          <View className="min-w-0 flex-1 gap-0.5 pr-3">
            <T className="text-sm text-muted">{greeting}</T>
            {authLoading ? (
              <Skeleton className="mt-1.5 h-6 w-44" />
            ) : (
              <T numberOfLines={2} className="font-display text-[26px] leading-[31px] tracking-[-0.5px]">{storeName}</T>
            )}
          </View>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => setNotificationsOpen(true)}
              className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface"
            >
              <Bell size={20} color="#0E1A15" strokeWidth={2} />
              {toShipOrders.length > 0 ? <View className="absolute right-[10px] top-[9px] h-2 w-2 rounded-full bg-[#C8553D]" /> : null}
            </Pressable>
            <Link href="/switch" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Switch account" className="h-11 w-11 items-center justify-center rounded-full bg-[#C8553D]">
                <T className="font-sans-bold text-white">{authLoading ? '' : initials}</T>
              </Pressable>
            </Link>
          </View>
        </View>

        {needsWhatsapp ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setWhatsappOpen(true)}
            className="flex-row items-center gap-3 rounded-[20px] border border-[#F3E3C7] bg-[#FDF1E1] p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-white">
              <WhatsAppIcon size={22} />
            </View>
            <View className="min-w-0 flex-1 gap-0.5">
              <T className="font-sans-bold text-[#6B4210]">Add your WhatsApp number</T>
              <T className="text-[13px] text-[#6B4210]">Get order alerts there, and let buyers message you.</T>
            </View>
            <T className="font-sans-bold text-sm text-[#6B4210]">Add</T>
          </Pressable>
        ) : null}

        <View className="gap-4 rounded-[24px] bg-deep p-5">
          <View className="gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <View className="h-[7px] w-[7px] rounded-full bg-leaf" />
              <T className="text-[13px] text-on-dark-2">Store is live</T>
            </View>
            {authLoading ? <Skeleton className="mt-1 h-4 w-40 bg-white/15" /> : <T className="font-sans-bold text-[17px] text-bg">{link}</T>}
          </View>
          <View className="flex-row gap-2">
            <Link href="/share" asChild>
              <Pressable accessibilityRole="button" className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-saffron">
                {narrow ? null : <Share size={16} color="#07261C" strokeWidth={2.2} />}
                <T numberOfLines={1} className="font-sans-bold text-sm text-deep">{narrow ? 'Share' : 'Share store'}</T>
              </Pressable>
            </Link>
            <Link href="/payouts" asChild>
              <Pressable accessibilityRole="button" className="h-11 justify-center rounded-full border border-[rgba(246,243,236,0.25)] px-3.5">
                <T className="font-sans-semibold text-sm text-bg">Payout</T>
              </Pressable>
            </Link>
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/shop/store/[slug]', params: { slug: username } })} className="h-11 justify-center rounded-full border border-[rgba(246,243,236,0.25)] px-3.5">
              <T className="font-sans-semibold text-sm text-bg">Preview</T>
            </Pressable>
          </View>
        </View>

        <View className="flex-row gap-3">
          <Stat loading={ordersLoading} label="Total Orders" value={String(ordersData?.length ?? 0)} delta={`${ordersData?.length ?? 0} total`} />
          <Stat loading={ordersLoading} label="To Ship" value={String(toShipOrders.length)} delta={`${toShipOrders.length} pending`} dark />
          {narrow ? null : (
            <Stat loading={walletLoading} label="Available" value={compactNaira(balanceKobo / 100)} delta="To withdraw" />
          )}
        </View>
        {narrow ? (
          <View className="flex-row">
            <Stat loading={walletLoading} label="Available" value={compactNaira(balanceKobo / 100)} delta="To withdraw" />
          </View>
        ) : null}

        <View className="flex-row items-baseline justify-between">
          <T className="font-sans-bold text-lg">To ship</T>
          <Link href="/orders" asChild>
            <Pressable accessibilityRole="link" hitSlop={12}>
              <T className="font-sans-semibold text-sm text-green">See all</T>
            </Pressable>
          </Link>
        </View>
        <View className="gap-2.5">
          {ordersLoading ? (
            <SkeletonRows count={2} />
          ) : ordersError && !ordersData ? (
            <LoadError what="your orders" onRetry={() => refetchOrders()} />
          ) : toShipOrders.length > 0 ? (
            toShipOrders.map((o) => (
              <Link key={o.id} href={`/order/${o.id}`} asChild>
                <Pressable accessibilityRole="button" className="flex-row items-center gap-3 rounded-[18px] border border-line bg-surface p-3.5">
                  <View className="h-12 w-12 items-center justify-center rounded-xl bg-[#E9A23B]">
                    <T className="font-sans-bold text-white text-base">{o.customer_name ? o.customer_name[0] : 'C'}</T>
                  </View>
                  <View className="flex-1 gap-0.5">
                    <T className="font-sans-bold">{o.customer_name}</T>
                    <T className="text-[13px] text-muted">#{o.order_number} · Paid · {o.payment_method}</T>
                  </View>
                  <T className="font-sans-bold">{formatNaira(o.total_kobo / 100)}</T>
                </Pressable>
              </Link>
            ))
          ) : (
            <EmptyState
              icon={<CheckCircle size={22} color="#5B6660" />}
              title="You’re all caught up"
              sub="Paid orders waiting to be packed will show here."
            />
          )}
        </View>

        <View className="flex-row items-baseline justify-between">
          <T className="font-sans-bold text-lg">Latest products</T>
          {latestProducts.length ? (
            <Link href="/products" asChild>
              <Pressable accessibilityRole="link" hitSlop={12}>
                <T className="font-sans-semibold text-sm text-green">See all</T>
              </Pressable>
            </Link>
          ) : null}
        </View>
        <View className="gap-2.5">
          {productsLoading ? (
            <SkeletonRows count={3} />
          ) : productsError && !products ? (
            <LoadError what="your products" onRetry={() => refetchProducts()} />
          ) : latestProducts.length ? (
            latestProducts.map((p) => (
              <Link key={p.id} href={`/product/${p.id}`} asChild>
                <Pressable accessibilityRole="button" className="flex-row items-center gap-3 rounded-[18px] border border-line bg-surface p-3">
                  <ProductImage uri={productPhoto(p)} name={p.name} className="h-12 w-12 rounded-xl" textClassName="text-base" />
                  <View className="min-w-0 flex-1 gap-0.5">
                    <T numberOfLines={1} className="font-sans-bold">{p.name}</T>
                    <T className="text-[13px] text-muted">{p.stock_count > 0 ? `${p.stock_count} in stock` : 'Sold out'}{p.status === 'hidden' ? ' · Hidden' : ''}</T>
                  </View>
                  <T className="font-sans-bold text-green">{formatNaira(p.price_kobo / 100)}</T>
                </Pressable>
              </Link>
            ))
          ) : (
            <EmptyState
              icon={<Package size={22} color="#5B6660" />}
              title="No products yet"
              sub="Snap a photo and your first product is ready to sell."
              action="Add a product"
              href="/add-product"
            />
          )}
        </View>

      </ScrollView>

      <ContactEditSheet kind={whatsappOpen ? 'whatsapp' : null} onClose={() => setWhatsappOpen(false)} />

      {/* Notifications BottomSheet */}
      <BottomSheet visible={notificationsOpen} onClose={() => setNotificationsOpen(false)}>
        <View className="gap-3 py-1">
          <View className="flex-row items-center justify-between">
            <T className="font-display text-xl">Notifications</T>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setNotificationsOpen(false)}>
              <X size={20} color="#0E1A15" />
            </Pressable>
          </View>
          <View className="gap-2.5 pt-1">
            {toShipOrders.length > 0 ? (
              <View className="flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-3.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#F3E3C7]">
                  <CheckCircle size={18} color="#6B4210" />
                </View>
                <View className="flex-1 gap-0.5">
                  <T className="font-sans-bold text-sm">{toShipOrders.length} Orders Ready to Ship</T>
                  <T className="text-xs text-muted-2">Orders need courier dispatch or fulfillment packaging.</T>
                  <T className="text-[11px] text-muted">Today</T>
                </View>
              </View>
            ) : (
              <View className="items-center rounded-2xl border border-line bg-surface p-4">
                <T className="text-sm text-muted">You're all caught up.</T>
              </View>
            )}
          </View>
          <Button title="Close" className="mt-2 h-11" onPress={() => setNotificationsOpen(false)} />
        </View>
      </BottomSheet>

    </Screen>
  );
}
