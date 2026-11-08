import { useState } from 'react';
import { ActivityIndicator, Linking, Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Check, ChevronDown, MoreHorizontal, Phone } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, SkeletonRows, T, cx } from '@/components/ui';
import { BackHeader, Grip } from '@/features/seller/parts';
import { WhatsAppIcon } from '@/features/setup/parts';
import { STAGE, agoPhrase, customerWhatsApp, tileColor } from '@/features/seller/orderMeta';
import { getOrder, updateOrderStatus, refundOrder } from '@/api/orders';
import { OrderStatus } from '@/api/types';
import { formatNaira } from '@/lib/format';
import { SearchableSelectModal } from '@/components/SearchableSelectModal';
import { C } from '@/lib/theme';

const STEPS: OrderStatus[] = ['paid', 'packed', 'shipped', 'delivered'];
const STEP_LABELS = ['Paid', 'Packed', 'Shipped', 'Delivered'];
const NEXT_LABELS: Record<string, string> = {
  paid: 'Accept and pack',
  packed: 'Mark shipped',
  shipped: 'Mark delivered',
};
const REASONS = ['Out of stock', 'Customer changed mind', 'Damaged or wrong item'];

export default function OrderDetail() {
  const { id, ship } = useLocalSearchParams<{ id: string; ship?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const [refundOpen, setRefundOpen] = useState(false);
  const [reason, setReason] = useState(REASONS[0]);
  const [reasonOpen, setReasonOpen] = useState(false);
  const [courierName, setCourierName] = useState('');
  const [trackingNumber, setTrackingNumber] = useState('');
  // From the Orders list's "Mark shipped": open straight on the courier sheet.
  const [shipModalOpen, setShipModalOpen] = useState(ship === '1');

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (args: { status: OrderStatus; courier_name?: string; tracking_number?: string }) =>
      updateOrderStatus(id!, args.status, { courier_name: args.courier_name, tracking_number: args.tracking_number }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-sales-orders'] });
    },
  });

  const refundMutation = useMutation({
    mutationFn: (args: { reason: string }) => refundOrder(id!, args.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['seller-orders'] });
      queryClient.invalidateQueries({ queryKey: ['seller-sales-orders'] });
      setRefundOpen(false);
    },
  });

  const currentStatus = order?.status || 'paid';
  const isRefunded = currentStatus === 'refunded';
  const stepIdx = STEPS.indexOf(currentStatus as OrderStatus) !== -1 ? STEPS.indexOf(currentStatus as OrderStatus) : 0;

  const advanceStatus = () => {
    if (currentStatus === 'packed') {
      setShipModalOpen(true);
      return;
    }
    const nextIdx = Math.min(stepIdx + 1, STEPS.length - 1);
    const nextStatus = STEPS[nextIdx];
    statusMutation.mutate({ status: nextStatus });
  };

  const confirmShipment = () => {
    setShipModalOpen(false);
    statusMutation.mutate({
      status: 'shipped',
      courier_name: courierName,
      tracking_number: trackingNumber,
    });
  };

  const handleRefund = () => refundMutation.mutate({ reason });

  const customerPhone = order?.customer_phone || '';
  const customerName = order?.customer_name || 'Customer';
  const address: string = order?.delivery_address || order?.shipping_address || '';
  const totalAmountKobo = order?.total_kobo ?? 0;
  const netKobo = order?.merchant_net_amount != null ? Math.round(Number(order.merchant_net_amount) * 100) : totalAmountKobo;
  const isPaid = order?.payment_status === 'paid' || isRefunded;
  const actionError = (statusMutation.error || refundMutation.error) as Error | null;

  if (isLoading || !order) {
    return (
      <Screen>
        <BackHeader title="Order" fallback="/orders" />
        <View className="flex-1 px-5 pt-2">
          {isLoading ? <SkeletonRows count={3} /> : <T className="text-center text-muted">Order not found.</T>}
        </View>
      </Screen>
    );
  }

  const stage = isRefunded ? STAGE.refunded : STAGE[currentStatus] ?? STAGE.paid;
  const items = (order.items ?? []).filter((i: any) => !i.bundle_parent_id);
  const shippingFee = Number((order as any).shipping_fee ?? 0);
  const zone = (order as any).delivery_zone_name || order.city || '';
  const initials = customerName.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const wa = customerWhatsApp(order);

  return (
    <Screen>
      <BackHeader
        title={`#${order.order_number || id}`}
        fallback="/orders"
        right={
          isRefunded || !isPaid ? undefined : (
            <Pressable accessibilityRole="button" accessibilityLabel="Refund this order" onPress={() => setRefundOpen(true)} hitSlop={6} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
              <MoreHorizontal size={20} color={C.ink} strokeWidth={2} />
            </Pressable>
          )
        }
      />

      <ScrollView contentContainerClassName="gap-3 px-5 pb-6 pt-1" showsVerticalScrollIndicator={false}>
        <View className="gap-3.5 rounded-[22px] border border-line bg-surface p-4">
          <View className="flex-row items-center justify-between gap-3">
            <View className="min-w-0 flex-1">
              <T numberOfLines={1} className="text-xs text-muted">
                {isPaid ? `Paid ${agoPhrase(order.paid_at || order.created_at)}${order.payment_method ? ` · ${order.payment_method.toLowerCase()}` : ''}` : 'Awaiting payment'}
              </T>
              <T className="font-display text-[26px]">{formatNaira(totalAmountKobo / 100)}</T>
            </View>
            <View style={{ backgroundColor: stage.bg }} className="rounded-full px-3 py-1.5">
              <T style={{ color: stage.fg }} className="font-sans-bold text-xs">{stage.label}</T>
            </View>
          </View>
          <View className="flex-row gap-1" accessibilityLabel={`Progress: ${STEP_LABELS[stepIdx]}`}>
            {STEPS.map((step, i) => (
              <View key={step} className="flex-1 gap-1.5">
                <View style={{ backgroundColor: i <= stepIdx && !isRefunded ? C.green : C.line }} className="h-[5px] rounded-full" />
                <T style={{ color: i <= stepIdx && !isRefunded ? C.accent : C.placeholder }} className="font-sans-bold text-[11px]">{STEP_LABELS[i]}</T>
              </View>
            ))}
          </View>
          {order.courier_name ? (
            <View className="rounded-xl bg-mint px-3 py-2">
              <T className="text-[13px] text-accent">Sent with {order.courier_name}{order.tracking_number ? ` · ${order.tracking_number}` : ''}</T>
            </View>
          ) : null}
        </View>

        <View className="flex-row items-center gap-3 rounded-[22px] border border-line bg-surface px-4 py-3.5">
          <View style={{ backgroundColor: tileColor(customerName) }} className="h-11 w-11 items-center justify-center rounded-full">
            <T className="font-sans-bold text-base text-white">{initials || 'C'}</T>
          </View>
          <View className="min-w-0 flex-1">
            <T numberOfLines={1} className="font-sans-bold text-[15px]">{customerName}</T>
            {address ? <T numberOfLines={2} className="text-[13px] text-muted">{address}</T> : null}
          </View>
          {customerPhone ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`Call ${customerName}`} onPress={() => Linking.openURL(`tel:${customerPhone}`)} className="h-10 w-10 items-center justify-center rounded-full bg-mint">
              <Phone size={17} color={C.accent} strokeWidth={2} />
            </Pressable>
          ) : null}
          {wa ? (
            <Pressable accessibilityRole="button" accessibilityLabel={`WhatsApp ${customerName}`} onPress={() => Linking.openURL(wa)} className="h-10 w-10 items-center justify-center rounded-full bg-[#DCF5E5]">
              <WhatsAppIcon size={18} color="#128C4B" />
            </Pressable>
          ) : null}
        </View>
        {address ? (
          <Pressable accessibilityRole="link" onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(address)}`)} className="-mt-1 min-h-9 justify-center self-start px-1">
            <T className="font-sans-bold text-[13px] text-accent">Open address in Maps</T>
          </Pressable>
        ) : null}

        <View className="rounded-[22px] border border-line bg-surface px-4 py-1.5">
          {items.length ? items.map((it: any, i: number) => {
            const qty = Number(it.quantity ?? 1);
            const unit = Number(it.product_price ?? it.price ?? 0);
            const opts = [it.size || it.selected_size, it.color || it.selected_color].filter(Boolean).join(' · ');
            return (
              <View key={it.id ?? i} className="flex-row items-center gap-3 border-b border-line py-2.5">
                <View style={{ backgroundColor: tileColor(it.product_name || String(i)) }} className="h-[46px] w-[46px] rounded-xl" />
                <View className="min-w-0 flex-1">
                  <T numberOfLines={1} className="font-sans-bold text-sm">{it.product_name || 'Item'}</T>
                  <T className="text-xs text-muted">{opts ? `${opts} · ` : ''}x{qty}</T>
                </View>
                {unit > 0 ? <T className="font-sans-bold text-sm">{formatNaira(unit * qty)}</T> : null}
              </View>
            );
          }) : (
            <View className="border-b border-line py-2.5"><T className="font-sans-bold text-sm">{order.items_summary || 'Order items'}</T></View>
          )}
          <View className="gap-1.5 py-2.5">
            {shippingFee > 0 ? (
              <View className="flex-row justify-between">
                <T className="text-sm text-muted">Delivery{zone ? ` · ${zone}` : ''}</T>
                <T className="font-sans-bold text-sm">{formatNaira(shippingFee)}</T>
              </View>
            ) : null}
            <View className="flex-row justify-between">
              <T className="font-sans-bold text-[15px]">You receive</T>
              <T className="font-sans-bold text-[15px]">{formatNaira(netKobo / 100)}</T>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="gap-2 px-5 pt-3">
        {actionError ? <T accessibilityLiveRegion="polite" className="text-center text-sm text-danger">{actionError.message}</T> : null}
        {stepIdx === 3 || isRefunded || currentStatus === 'cancelled' ? (
          <View accessibilityLiveRegion="polite" className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-mint">
            {stepIdx === 3 && !isRefunded ? <Check size={18} color={C.accent} strokeWidth={2.4} /> : null}
            <T className="font-sans-bold text-[15px] text-accent">{isRefunded ? `Refunded ${formatNaira(totalAmountKobo / 100)}` : currentStatus === 'cancelled' ? 'Cancelled' : 'Delivered. Nice work!'}</T>
          </View>
        ) : (
          <Pressable accessibilityRole="button" onPress={advanceStatus} disabled={statusMutation.isPending} className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-green">
            {statusMutation.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <T className="font-sans-bold text-base text-white">{NEXT_LABELS[currentStatus] || 'Update status'}</T>
          </Pressable>
        )}
      </View>

      {/* Courier & Tracking Modal */}
      <Modal visible={shipModalOpen} transparent animationType="fade" onRequestClose={() => setShipModalOpen(false)}>
        <View className="flex-1 justify-end">
          <Pressable onPress={() => setShipModalOpen(false)} className="absolute inset-0 bg-[rgba(14,26,21,0.5)]" />
          <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }} className="gap-4 rounded-t-[28px] bg-surface px-5 pt-3">
            <Grip />
            <T className="font-display-x text-[22px]">Mark as shipped</T>
            <T className="-mt-2 text-sm text-muted">The customer gets the courier name and tracking number.</T>
            <View className="gap-1.5">
              <T className="font-sans-bold text-[13px] text-muted">Courier</T>
              <TextInput autoFocus value={courierName} onChangeText={setCourierName} placeholder="GIG Logistics, Fez, a dispatch rider…" placeholderTextColor={C.placeholder} className="h-14 rounded-2xl border-[1.5px] border-line bg-surface px-4 font-sans-semibold text-[17px] text-ink" />
            </View>
            <View className="gap-1.5">
              <T className="font-sans-bold text-[13px] text-muted">Tracking number (optional)</T>
              <TextInput value={trackingNumber} onChangeText={setTrackingNumber} placeholder="GIG-44810273" placeholderTextColor={C.placeholder} className="h-14 rounded-2xl border-[1.5px] border-line bg-surface px-4 font-sans-semibold text-[17px] text-ink" />
            </View>
            <Pressable accessibilityRole="button" onPress={confirmShipment} disabled={!courierName.trim()} className={cx('h-[54px] items-center justify-center rounded-2xl bg-green', !courierName.trim() && 'opacity-40')}>
              <T className="font-sans-bold text-base text-white">Confirm shipped</T>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Refund Modal */}
      <Modal visible={refundOpen} transparent animationType="fade" onRequestClose={() => setRefundOpen(false)}>
        <View className="flex-1 justify-end">
          <Pressable accessibilityLabel="Keep order" onPress={() => setRefundOpen(false)} className="absolute inset-0 bg-[rgba(14,26,21,0.5)]" />
          <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 16 }} className="gap-4 rounded-t-[28px] bg-surface px-5 pt-3">
            <Grip />
            <T className="font-display-x text-[22px]">Refund this order?</T>
            <T className="text-sm leading-[21px] text-muted-2">{formatNaira(totalAmountKobo / 100)} goes back to {customerName}'s card/account.</T>
            <View className="gap-1.5">
              <T className="font-sans-bold text-[13px]">Reason</T>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Reason, ${reason}`}
                onPress={() => setReasonOpen(true)}
                className="h-14 flex-row items-center justify-between rounded-2xl border-[1.5px] border-line bg-surface px-4"
              >
                <T className="text-base">{reason}</T>
                <ChevronDown size={16} color={C.muted} strokeWidth={2} />
              </Pressable>

              <SearchableSelectModal
                visible={reasonOpen}
                onClose={() => setReasonOpen(false)}
                title="Why are you refunding?"
                placeholder="Search reason..."
                items={REASONS.map((r) => ({ id: r, title: r }))}
                selectedId={reason}
                onSelect={(item) => setReason(item.id)}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={handleRefund}
              disabled={refundMutation.isPending}
              className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-danger"
            >
              {refundMutation.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
              <T className="font-sans-bold text-base text-white">Refund {formatNaira(totalAmountKobo / 100)}</T>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setRefundOpen(false)} className="h-[54px] items-center justify-center rounded-2xl border-[1.5px] border-line bg-surface">
              <T className="font-sans-bold text-base">Keep order</T>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}
