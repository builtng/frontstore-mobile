import { ActivityIndicator, Linking, Pressable, ScrollView, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Truck } from 'lucide-react-native';
import { LoadError, Screen, SkeletonRows, T, cx } from '@/components/ui';
import { BackHeader } from '@/features/seller/parts';
import { WhatsAppIcon } from '@/features/setup/parts';
import { naira } from '@/lib/format';
import { confirmOrderDelivery, trackOrder } from '@/api/buyer';
import { orderStage } from '@/api/orders';
import { apiGet } from '@/api/client';

const time = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
const dayOnly = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' }) : '');

/** Buyer's order tracking: only what the store has actually recorded, nothing made up. */
export default function BuyerTrack() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: o, isLoading, isError, refetch } = useQuery({ queryKey: ['order-track', id], queryFn: () => trackOrder(id!), enabled: !!id });

  // No store WhatsApp: fall back to Frontstore support.
  const { data: platform } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => apiGet<{ support_email?: string; support_whatsapp?: string }>('/public/settings'),
    staleTime: 1000 * 60 * 60,
  });

  const confirm = useMutation({
    mutationFn: () => confirmOrderDelivery(id!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-track', id] });
      qc.invalidateQueries({ queryKey: ['buyer-orders'] });
    },
  });

  if (isLoading || !o) {
    return (
      <Screen>
        <BackHeader title="Track order" fallback="/shop/orders" />
        <View className="px-5 pt-2">{isLoading ? <SkeletonRows count={3} /> : isError ? <LoadError what="this order" onRetry={() => refetch()} /> : null}</View>
      </Screen>
    );
  }

  const raw: any = o;
  const stage = orderStage(raw);
  const store = raw.store ?? {};
  const storeName = store.store_name || store.name || 'the store';
  const storeWa = String(store.whatsapp_phone || '').replace(/\D/g, '').replace(/^0/, '234');
  const cancelled = stage === 'cancelled' || stage === 'refunded';
  const idx = { paid: 0, packed: 1, shipped: 2, delivered: 3, refunded: -1, cancelled: -1 }[stage];
  const steps: Array<[string, string]> = [
    ['Paid', time(raw.paid_at || raw.created_at)],
    [`Packed by ${storeName}`, idx >= 1 ? 'Ready to send' : 'Waiting for the store'],
    [raw.courier_name ? `With ${raw.courier_name}` : 'On the way', idx >= 2 ? (raw.tracking_number ? `Tracking ${raw.tracking_number}` : 'Sent out') : ''],
    ['Delivered', idx >= 3 ? time(raw.delivery_confirmed_at || raw.updated_at) : raw.expected_delivery_date ? `Expected ${dayOnly(raw.expected_delivery_date)}` : ''],
  ];
  const items = (raw.items ?? []).filter((i: any) => !i.bundle_parent_id);
  const total = Number(raw.display_amount ?? raw.total_amount ?? 0);
  const headline = cancelled ? (stage === 'refunded' ? 'Refunded' : 'Cancelled')
    : stage === 'delivered' ? 'Delivered'
    : stage === 'shipped' ? 'On its way'
    : stage === 'packed' ? 'Packed and ready'
    : 'Order placed';
  const sub = cancelled ? 'This order won’t be delivered.'
    : stage === 'delivered' ? 'Enjoy your order!'
    : raw.expected_delivery_date ? `Expected ${dayOnly(raw.expected_delivery_date)}`
    : raw.delivery_address || '';

  return (
    <Screen>
      <BackHeader title="Track order" sub={`#${raw.order_number || id}`} fallback="/shop/orders" />
      <ScrollView contentContainerClassName="gap-3 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-1 rounded-[24px] bg-green p-5">
          <View className="flex-row items-center gap-2">
            <Truck size={16} color="#CFE5D7" strokeWidth={2} />
            <T className="text-[13px] text-mint-2">{storeName}</T>
          </View>
          <T className="font-display text-[26px] text-white">{headline}</T>
          {sub ? <T numberOfLines={2} className="text-sm text-mint-2">{sub}</T> : null}
        </View>

        {raw.courier_name ? (
          <View className="flex-row items-center gap-3 rounded-[20px] border border-line bg-surface p-3.5">
            <View className="h-11 w-11 items-center justify-center rounded-full bg-[#0E7490]">
              <T className="font-sans-bold text-base text-white">{raw.courier_name[0].toUpperCase()}</T>
            </View>
            <View className="min-w-0 flex-1">
              <T numberOfLines={1} className="font-sans-bold text-[15px]">{raw.courier_name}</T>
              <T numberOfLines={1} className="text-[13px] text-muted">{raw.tracking_number ? `Tracking ${raw.tracking_number}` : storeName}</T>
            </View>
          </View>
        ) : null}

        {!cancelled ? (
          <View className="rounded-[20px] border border-line bg-surface p-4">
            {steps.map(([label, when], i) => {
              const done = i <= idx;
              const last = i === steps.length - 1;
              return (
                <View key={i} className="flex-row gap-3">
                  <View className="items-center">
                    <View className={cx('h-6 w-6 items-center justify-center rounded-full', done ? 'bg-green' : 'border-2 border-line-2 bg-surface')}>
                      {done ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
                    </View>
                    {!last ? <View className={cx('w-0.5 flex-1', i < idx ? 'bg-green' : 'bg-line')} style={{ minHeight: 26 }} /> : null}
                  </View>
                  <View className={cx('min-w-0 flex-1', !last && 'pb-4')}>
                    <T className={cx('font-sans-bold text-[15px]', !done && 'text-muted')}>{label}</T>
                    {when ? <T className="text-[13px] text-muted">{when}</T> : null}
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        <View className="rounded-[20px] border border-line bg-surface px-4 py-1.5">
          {items.length ? items.map((it: any, i: number) => (
            <View key={it.id ?? i} className="flex-row justify-between gap-3 border-b border-line py-2.5">
              <T numberOfLines={2} className="min-w-0 flex-1 text-sm">{Number(it.quantity ?? 1)}× {it.product_name || it.product?.name || 'Item'}</T>
              {it.product_price ? <T className="font-sans-bold text-sm">{naira(Number(it.product_price) * Number(it.quantity ?? 1))}</T> : null}
            </View>
          )) : null}
          <View className="flex-row justify-between py-2.5">
            <T className="font-sans-bold text-[15px]">Total paid</T>
            <T className="font-sans-bold text-[15px]">{naira(total)}</T>
          </View>
        </View>
        {confirm.error ? <T className="text-center text-[13px] text-danger">{(confirm.error as Error).message || 'Couldn’t confirm. Try again.'}</T> : null}
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="gap-2.5 px-5 pt-3">
        {stage === 'shipped' ? (
          <Pressable accessibilityRole="button" disabled={confirm.isPending} onPress={() => confirm.mutate()} className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-green">
            {confirm.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <T className="font-sans-bold text-base text-white">I’ve received it</T>
          </Pressable>
        ) : null}
        {storeWa ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => Linking.openURL(`https://wa.me/${storeWa}?text=${encodeURIComponent(`Hi ${storeName}, about my order #${raw.order_number || id}`)}`)}
            className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line bg-surface"
          >
            <WhatsAppIcon size={18} color="#128C4B" />
            <T className="font-sans-bold text-[15px]">Message the store</T>
          </Pressable>
        ) : (
          <Pressable accessibilityRole="button" onPress={() => {
              const wa = (platform?.support_whatsapp || '').replace(/\D/g, '');
              Linking.openURL(wa ? `https://wa.me/${wa}` : `mailto:${platform?.support_email || 'hello@frontstore.ng'}?subject=${encodeURIComponent(`Order #${raw.order_number || id}`)}`);
            }} className="h-[54px] items-center justify-center rounded-2xl border-[1.5px] border-line bg-surface">
            <T className="font-sans-bold text-[15px]">Get help</T>
          </Pressable>
        )}
      </View>
    </Screen>
  );
}
