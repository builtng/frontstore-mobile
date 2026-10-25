import { useState } from 'react';
import { ActivityIndicator, Linking, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { openStore } from '@/lib/storefront';
import { useQuery } from '@tanstack/react-query';
import { Screen, T } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, Segmented } from '@/features/buyer/parts';
import { getBuyerOrders } from '@/api/buyer';
import { BUYER_STAGE_LABEL, buyerStage, type BuyerStage } from '@/api/orders';

const STAGE_COLORS: Record<BuyerStage, { bg: string; fg: string }> = {
  awaiting_payment: { bg: '#ECE8DF', fg: '#4A524E' },
  paid: { bg: '#FEF3C7', fg: '#92400E' },
  packed: { bg: '#FEF3C7', fg: '#92400E' },
  shipped: { bg: '#DCE7F3', fg: '#1F3F66' },
  delivered: { bg: '#CFE8DC', fg: '#07261C' },
  refunded: { bg: '#FEE2E2', fg: '#991B1B' },
  cancelled: { bg: '#ECE8DF', fg: '#4A524E' },
};
const ACTIVE: BuyerStage[] = ['awaiting_payment', 'paid', 'packed', 'shipped'];

type Tab = 'active' | 'past';

function OrderCard({ o }: { o: any }) {
  const orderId = o.id;
  const storeName = o.store?.name || o.store?.store_name || 'Store';
  const storeInitial = storeName[0] ?? 'S';
  const storeColor = o.store?.primary_color || o.store?.store_color || '#0B6E4F';
  const totalAmount = Number(o.total_amount ?? 0);
  const stage = buyerStage(o);
  const st = { label: BUYER_STAGE_LABEL[stage], ...STAGE_COLORS[stage] };
  const active = ACTIVE.includes(stage);
  const orderRef = o.order_number || orderId;
  const itemsText = o.items?.map((i: any) => `${i.product_name || i.product?.name || i.name || 'Item'} (x${i.quantity})`).join(', ') || '1 item';
  const storeSlug = o.store?.slug || o.store?.username;

  const storePhone = o.store?.whatsapp_phone || o.store?.phone;
  const second: { label: string; onPress: () => void } | null = active
    ? storePhone ? { label: 'Help', onPress: () => handleHelp() } : null
    : storeSlug ? { label: 'Buy again', onPress: () => openStore(storeSlug) } : null;

  const handleHelp = () => {
    if (!storePhone) return;
    const cleanPhone = storePhone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello, I need help with my Frontstore order #${orderRef}`)}`;
    Linking.openURL(url).catch(() => {});
  };

  const secondBtn = (
    <Pressable
      accessibilityRole="button"
      onPress={second?.onPress}
      className="h-10 justify-center rounded-full border border-line-2 px-3.5"
    >
      <T className="font-sans-bold text-[13px]">{second?.label}</T>
    </Pressable>
  );

  return (
    <View className="gap-3 rounded-[20px] border border-line bg-surface p-4">
      <View className="flex-row items-center gap-3">
        <Avatar initial={storeInitial} color={storeColor} size={44} radius={13} fontSize={16} />
        <View className="flex-1">
          <T className="font-sans-bold text-base">{storeName}</T>
          <T className="text-xs text-muted">#{orderRef}</T>
        </View>
        <T className="font-sans-bold text-base">{naira(totalAmount)}</T>
      </View>
      <T className="text-sm text-[#33403A]">{itemsText}</T>
      <View className="flex-row items-center justify-between">
        <View style={{ backgroundColor: st.bg }} className="rounded-full px-2.5 py-[5px]">
          <T style={{ color: st.fg }} className="font-sans-bold text-xs">{st.label}</T>
        </View>
        <View className="flex-row gap-2">
          {second ? secondBtn : null}
          <Link href={`/shop/track/${orderId}`} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`${active ? 'Track' : 'Details for'} order ${orderRef}`} className="h-10 justify-center rounded-full bg-ink px-3.5">
              <T className="font-sans-bold text-[13px] text-white">{active ? 'Track' : 'Details'}</T>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}

export default function BuyerOrders() {
  const [tab, setTab] = useState<Tab>('active');
  const { data: liveOrders = [], isLoading, isError, isRefetching, refetch } = useQuery({ queryKey: ['buyer-orders'], queryFn: getBuyerOrders });

  // Every order is either active or past (expired ones count as cancelled)
  const activeOrders = liveOrders.filter((o: any) => ACTIVE.includes(buyerStage(o)));
  const pastOrders = liveOrders.filter((o: any) => !ACTIVE.includes(buyerStage(o)));

  const list = tab === 'active' ? activeOrders : pastOrders;

  return (
    <Screen>
      <ScrollView
        contentContainerClassName="gap-3.5 px-4 pb-6 pt-3"
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#0B6E4F" />}
      >
        <T className="font-display-x text-[30px] tracking-[-0.6px]">My orders</T>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[{ key: 'active', label: `Active · ${activeOrders.length}` }, { key: 'past', label: `Past · ${pastOrders.length}` }]}
        />
        {isError ? (
          <Pressable accessibilityRole="button" onPress={() => refetch()} className="rounded-2xl border border-line bg-surface p-4">
            <T className="text-sm text-danger">Couldn’t load your orders. Tap to try again.</T>
          </Pressable>
        ) : isLoading ? (
          <View className="items-center py-12">
            <ActivityIndicator size="small" color="#0B6E4F" />
            <T className="mt-2 text-xs text-muted">Loading your orders...</T>
          </View>
        ) : list.length > 0 ? (
          list.map((o: any) => <OrderCard key={o.id} o={o} />)
        ) : (
          <View className="items-center py-10">
            <T className="text-sm text-muted">No {tab} orders found.</T>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
