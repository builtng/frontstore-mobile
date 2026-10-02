import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { Link, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Screen, T } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, Segmented } from '@/features/buyer/parts';
import { getBuyerOrders } from '@/api/buyer';
import { Order } from '@/api/types';

const STATUS = {
  out: { label: 'Out for delivery', bg: '#DCE7F3', fg: '#1F3F66' },
  done: { label: 'Delivered', bg: '#CFE8DC', fg: '#07261C' },
  paid: { label: 'Paid', bg: '#FEF3C7', fg: '#92400E' },
  refunded: { label: 'Refunded', bg: '#FEE2E2', fg: '#991B1B' },
} as const;

type Tab = 'active' | 'past';

function OrderCard({ o }: { o: any }) {
  const orderId = o.id;
  const storeName = o.store?.name ?? 'Store';
  const storeInitial = storeName[0] ?? 'S';
  const storeColor = o.store?.primary_color ?? '#0B6E4F';
  const totalAmount = o.total_amount;
  const statusKey = o.order_status === 'shipped'
    ? 'out'
    : o.order_status === 'delivered'
      ? 'done'
      : o.order_status === 'refunded'
        ? 'refunded'
        : 'paid';
  const st = STATUS[statusKey as keyof typeof STATUS] ?? STATUS.paid;
  const active = statusKey === 'out' || statusKey === 'paid';
  const itemsText = o.items?.map((i: any) => `${i.product_name || i.product?.name || 'Item'} (x${i.quantity})`).join(', ') || '1 item';
  const storeSlug = o.store?.slug;

  const second: { label: string; href?: Href } = active
    ? { label: 'Help' }
    : { label: 'Buy again', href: storeSlug ? `/shop/store/${storeSlug}` : '/shop' };

  const handleHelp = () => {
    const rawPhone = o.store?.whatsapp_phone || o.store?.phone || '2348000000000';
    const cleanPhone = rawPhone.replace(/\D/g, '');
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(`Hello, I need help with my Frontstore order #${orderId}`)}`;
    Linking.openURL(url).catch(() => {});
  };

  const secondBtn = (
    <Pressable
      accessibilityRole="button"
      onPress={active ? handleHelp : undefined}
      className="h-10 justify-center rounded-full border border-line-2 px-3.5"
    >
      <T className="font-sans-bold text-[13px]">{second.label}</T>
    </Pressable>
  );

  return (
    <View className="gap-3 rounded-[20px] border border-line bg-surface p-4">
      <View className="flex-row items-center gap-3">
        <Avatar initial={storeInitial} color={storeColor} size={44} radius={13} fontSize={16} />
        <View className="flex-1">
          <T className="font-sans-bold text-base">{storeName}</T>
          <T className="text-xs text-muted">#{orderId}</T>
        </View>
        <T className="font-sans-bold text-base">{naira(totalAmount)}</T>
      </View>
      <T className="text-sm text-[#33403A]">{itemsText}</T>
      <View className="flex-row items-center justify-between">
        <View style={{ backgroundColor: st.bg }} className="rounded-full px-2.5 py-[5px]">
          <T style={{ color: st.fg }} className="font-sans-bold text-xs">{st.label}</T>
        </View>
        <View className="flex-row gap-2">
          {second.href ? <Link href={second.href} asChild>{secondBtn}</Link> : secondBtn}
          <Link href={`/shop/track/${orderId}`} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`${active ? 'Track' : 'Details for'} order ${orderId}`} className="h-10 justify-center rounded-full bg-ink px-3.5">
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
  const { data: liveOrders = [] } = useQuery({ queryKey: ['buyer-orders'], queryFn: getBuyerOrders });

  const activeOrders = liveOrders.filter((o: any) => {
    const status = o.order_status;
    return status === 'paid' || status === 'shipped';
  });

  const pastOrders = liveOrders.filter((o: any) => {
    const status = o.order_status;
    return status === 'delivered' || status === 'refunded';
  });

  const list = tab === 'active' ? activeOrders : pastOrders;

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-3.5 px-4 pb-6 pt-3">
        <T className="font-display-x text-[30px] tracking-[-0.6px]">My orders</T>
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[{ key: 'active', label: `Active · ${activeOrders.length}` }, { key: 'past', label: `Past · ${pastOrders.length}` }]}
        />
        {list.length > 0 ? (
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
