import { useMemo, useState } from 'react';
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { CheckCircle, MessageCircle, Search, ShoppingBag, X } from 'lucide-react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, LoadError, Screen, SkeletonRows, T, cx } from '@/components/ui';
import { Segmented } from '@/features/seller/parts';
import { getSellerOrders, updateOrderStatus } from '@/api/orders';
import type { Order, OrderStatus } from '@/api/types';
import { LIST_OF, NEXT, STAGE, ago, customerWhatsApp, orderPhoto, tileColor, type OrderList } from '@/features/seller/orderMeta';
import { summarise } from '@/features/seller/salesStats';
import { formatNaira } from '@/lib/format';
import { C } from '@/lib/theme';

/** No orders at all yet: the design's "first order is one share away". */
function FirstOrder() {
  return (
    <View className="flex-1 items-center justify-center gap-3.5 px-7 pb-10">
      <View className="relative h-[170px] w-[200px]" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <View style={{ transform: [{ rotate: '-6deg' }] }} className="absolute left-5 top-5 h-[120px] w-[150px] rounded-3xl border border-line bg-surface" />
        <View className="absolute left-[34px] top-[34px] h-[120px] w-[150px] items-center justify-center rounded-3xl bg-mint">
          <ShoppingBag size={48} color={C.accent} strokeWidth={1.6} />
        </View>
        <View className="absolute right-0 top-0 rounded-full bg-gold px-2.5 py-1.5">
          <T className="font-sans-bold text-xs text-[#2A1B05]">Soon!</T>
        </View>
      </View>
      <T accessibilityRole="header" className="text-center font-display text-2xl leading-[29px]">Your first order is one share away</T>
      <T className="text-center text-[15px] leading-[22px] text-muted">Post your store link on WhatsApp Status and Instagram. Paid orders show up here instantly.</T>
      <View className="w-full gap-2.5 pt-2">
        <Button title="Share my store" href="/share" />
        <Button title="Add another product" kind="outline" href="/add-product" />
      </View>
    </View>
  );
}

function OrderCard({ o, onAct, busy }: { o: Order; onAct: (o: Order, to: OrderStatus) => void; busy: boolean }) {
  const stage = STAGE[o.status];
  const next = NEXT[o.status];
  const photo = orderPhoto(o);
  const wa = customerWhatsApp(o);
  return (
    <View className="gap-3 rounded-[20px] border border-line bg-surface p-3.5">
      <Link href={`/order/${o.id}`} asChild>
        <Pressable accessibilityRole="button" accessibilityLabel={`Order ${o.order_number} from ${o.customer_name}, ${formatNaira(o.total_kobo / 100)}`} className="flex-row items-center gap-3">
          {photo ? (
            <Image source={{ uri: photo }} className="h-[50px] w-[50px] rounded-[14px]" />
          ) : (
            <View style={{ backgroundColor: tileColor(o.customer_name || String(o.id)) }} className="h-[50px] w-[50px] items-center justify-center rounded-[14px]">
              <T className="font-display text-lg text-white">{(o.customer_name || 'C')[0].toUpperCase()}</T>
            </View>
          )}
          <View className="min-w-0 flex-1 gap-0.5">
            <View className="flex-row justify-between gap-2">
              <T numberOfLines={1} className="shrink font-sans-bold text-[15px]">{o.customer_name || 'Customer'}</T>
              <T className="font-sans-bold text-[15px]">{formatNaira(o.total_kobo / 100)}</T>
            </View>
            <T numberOfLines={1} className="text-[13px] text-muted">{o.items_summary || 'Order items'}</T>
            <T className="text-xs text-placeholder">#{o.order_number} · {ago(o.paid_at || o.created_at)}</T>
          </View>
        </Pressable>
      </Link>
      <View className="flex-row items-center gap-2">
        <View style={{ backgroundColor: stage.bg }} className="rounded-full px-2.5 py-[5px]">
          <T style={{ color: stage.fg }} className="font-sans-bold text-xs">{stage.label}</T>
        </View>
        <View className="flex-1" />
        {wa ? (
          <Pressable accessibilityRole="button" accessibilityLabel={`WhatsApp ${o.customer_name}`} onPress={() => Linking.openURL(wa)} className="h-[38px] w-[38px] items-center justify-center rounded-full border border-line">
            <MessageCircle size={17} color={C.ink} strokeWidth={2} />
          </Pressable>
        ) : null}
        {next ? (
          <Pressable accessibilityRole="button" disabled={busy} onPress={() => onAct(o, next.to)} className="h-[38px] flex-row items-center justify-center gap-1.5 rounded-full bg-green px-3.5">
            {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
            <T className="font-sans-bold text-[13px] text-white">{next.label}</T>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

export default function Orders() {
  const { empty } = useLocalSearchParams<{ empty?: string }>();
  const [list, setList] = useState<OrderList>('new');
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState('');
  const qc = useQueryClient();

  const { data: orders, isLoading, isError, refetch } = useQuery({ queryKey: ['seller-orders'], queryFn: () => getSellerOrders() });

  const move = useMutation({
    mutationFn: ({ o, to }: { o: Order; to: OrderStatus }) => updateOrderStatus(o.id, to),
    onSuccess: (_d, { o }) => {
      qc.invalidateQueries({ queryKey: ['seller-orders'] });
      qc.invalidateQueries({ queryKey: ['seller-sales-orders'] });
      qc.invalidateQueries({ queryKey: ['order', String(o.id)] });
    },
  });

  // Shipping needs the courier's name, so that step opens the order with the shipping sheet up.
  const act = (o: Order, to: OrderStatus) => {
    if (to === 'shipped') router.push({ pathname: '/order/[id]', params: { id: String(o.id), ship: '1' } });
    else move.mutate({ o, to });
  };

  const counts = useMemo(() => {
    const c: Record<OrderList, number> = { new: 0, toship: 0, shipped: 0, done: 0 };
    for (const o of orders ?? []) { const l = LIST_OF[o.status]; if (l) c[l] += 1; }
    return c;
  }, [orders]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (orders ?? []).filter((o) => {
      // Searching looks across every list; otherwise show the chosen one.
      if (q) return `${o.customer_name} ${o.order_number} ${o.items_summary || ''}`.toLowerCase().includes(q);
      return LIST_OF[o.status] === list;
    });
  }, [orders, list, query]);

  const today = summarise(orders ?? [], 'today');

  if (empty === '1' || (!isLoading && orders && orders.length === 0)) {
    return (
      <Screen>
        <View className="gap-0.5 px-5 pb-3 pt-1.5">
          <T className="text-sm text-muted">No orders yet</T>
          <T accessibilityRole="header" className="font-display-x text-[30px] tracking-[-0.6px]">Orders</T>
        </View>
        <FirstOrder />
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-end justify-between gap-3 px-5 pb-3 pt-1.5">
        <View className="min-w-0 flex-1 gap-0.5">
          <T numberOfLines={1} className="text-sm text-muted">Today · {formatNaira(today.salesKobo / 100)} paid</T>
          <T accessibilityRole="header" className="font-display-x text-[30px] tracking-[-0.6px]">Orders</T>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={searching ? 'Close search' : 'Search orders'}
          onPress={() => { setSearching(!searching); setQuery(''); }}
          className="h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-surface"
        >
          {searching ? <X size={19} color={C.ink} strokeWidth={2} /> : <Search size={19} color={C.ink} strokeWidth={2} />}
        </Pressable>
      </View>

      <View className="px-5 pb-3">
        {searching ? (
          <View className="h-11 flex-row items-center gap-2 rounded-[14px] border-[1.5px] border-line bg-surface px-3">
            <Search size={16} color={C.muted} strokeWidth={2} />
            <TextInput
              autoFocus
              value={query}
              onChangeText={setQuery}
              placeholder="Name, order number or item"
              placeholderTextColor={C.placeholder}
              accessibilityLabel="Search orders"
              returnKeyType="search"
              className="h-full min-w-0 flex-1 font-sans text-base text-ink"
            />
          </View>
        ) : (
          <Segmented
            value={list}
            onChange={setList}
            options={[['new', `New ${counts.new}`], ['toship', `To ship ${counts.toship}`], ['shipped', 'Shipped'], ['done', 'Done']] as const}
          />
        )}
      </View>

      <ScrollView contentContainerClassName="gap-2.5 px-5 pb-8" showsVerticalScrollIndicator={false}>
        {move.error ? (
          <View className="rounded-2xl bg-danger-bg p-3"><T className="text-sm text-danger">{(move.error as Error).message || 'Couldn’t update that order. Try again.'}</T></View>
        ) : null}
        {isLoading ? (
          <SkeletonRows count={4} />
        ) : isError && !orders ? (
          <LoadError what="your orders" onRetry={() => refetch()} />
        ) : shown.length ? (
          shown.map((o) => <OrderCard key={o.id} o={o} onAct={act} busy={move.isPending && move.variables?.o.id === o.id} />)
        ) : (
          <View className="items-center gap-1.5 px-5 py-10">
            <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-mint">
              <CheckCircle size={24} color={C.accent} strokeWidth={2} />
            </View>
            <T className="text-center font-sans-bold text-base">{query.trim() ? `Nothing matches “${query.trim()}”` : 'All caught up'}</T>
            <T className="text-center text-sm text-muted">{query.trim() ? 'Try a name or order number.' : 'Nothing in this list right now.'}</T>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
