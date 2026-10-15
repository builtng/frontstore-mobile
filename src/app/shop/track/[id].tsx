import { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Star } from 'lucide-react-native';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomSheet } from '@/features/buyer/account';
import { naira } from '@/lib/format';
import { trackOrder, confirmOrderDelivery, submitOrderReview } from '@/api/buyer';
import { BUYER_STAGE_LABEL, buyerStage, type BuyerStage } from '@/api/orders';

// How far along the four steps each stage is
const DONE_STEPS: Record<BuyerStage, number> = {
  awaiting_payment: 0, paid: 1, packed: 2, shipped: 3, delivered: 4, refunded: 1, cancelled: 0,
};

const HEADLINE: Record<BuyerStage, [string, string]> = {
  awaiting_payment: ['Not paid yet', 'Waiting for payment'],
  paid: ['Order confirmed', 'The store is preparing it'],
  packed: ['Packed', 'Ready to be sent out'],
  shipped: ['On its way', 'Out for delivery'],
  delivered: ['Delivered', 'Enjoy your order!'],
  refunded: ['Refunded', 'Your money was returned'],
  cancelled: ['Cancelled', 'This order was not completed'],
};

/** A tracking value that is really a rider's phone number. */
const looksLikePhone = (v?: string | null) => !!v && /^\+?[\d\s()-]{10,16}$/.test(v.trim());

export default function BuyerTrack() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [rateOpen, setRateOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data: order, isLoading, isError, refetch } = useQuery({
    queryKey: ['order-track', id],
    queryFn: () => trackOrder(id!),
    enabled: !!id,
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ['order-track', id] });
    queryClient.invalidateQueries({ queryKey: ['buyer-orders'] });
    queryClient.invalidateQueries({ queryKey: ['buyer-reviews'] });
  };

  const confirmMutation = useMutation({ mutationFn: () => confirmOrderDelivery(id!), onSuccess: refresh });

  const reviewMutation = useMutation({
    mutationFn: () => submitOrderReview(id!, rating, comment),
    onSuccess: () => {
      refresh();
      setRateOpen(false);
    },
  });

  const back = () => (router.canGoBack() ? router.back() : router.replace('/shop/orders'));

  if (!order) {
    return (
      <Screen>
        <View className="flex-row items-center px-2 pb-1">
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} className="h-11 w-11 items-center justify-center">
            <ChevronLeft size={24} color="#0E1A15" strokeWidth={2} />
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center gap-3 px-8">
          {isLoading ? (
            <ActivityIndicator color="#0B6E4F" />
          ) : (
            <>
              <T className="text-center text-muted-2">{isError ? 'Couldn’t load this order.' : 'Order not found.'}</T>
              {isError ? <Button title="Try again" kind="dark" className="h-11" onPress={() => refetch()} /> : null}
            </>
          )}
        </View>
      </Screen>
    );
  }

  const stage = buyerStage(order);
  const [eyebrow, headline] = HEADLINE[stage];
  const doneStep = DONE_STEPS[stage];
  const storeName = order.store?.name || order.store?.store_name || 'Store';
  const storePhone = order.store?.whatsapp_phone?.replace(/\D/g, '');
  const orderRef = order.order_number || id;
  const reviewed = (order.reviews?.length ?? 0) > 0;
  const canConfirm = stage === 'paid' || stage === 'packed' || stage === 'shipped';
  const canRate = stage === 'delivered' && !reviewed;

  const steps: [string, string][] = [
    ['Paid', stage === 'awaiting_payment' ? 'Waiting for payment' : 'Confirmed'],
    [`Packed by ${storeName}`, doneStep >= 2 ? 'Ready' : 'Not yet'],
    ['Out for delivery', order.courier_name || (doneStep >= 3 ? 'On its way' : 'Not yet')],
    ['Delivered', doneStep >= 4 ? 'Delivered' : 'Not yet'],
  ];

  const getHelp = () => {
    if (!storePhone) return;
    const text = encodeURIComponent(`Hello, I need help with my Frontstore order #${orderRef}`);
    Linking.openURL(`https://wa.me/${storePhone}?text=${text}`).catch(() => {});
  };

  const confirmReceived = () =>
    Alert.alert(
      'Got everything?',
      `Only confirm once you have your items. This tells ${storeName} the order is complete and releases their payment.`,
      [
        { text: 'Not yet', style: 'cancel' },
        { text: 'Yes, I have it', onPress: () => confirmMutation.mutate() },
      ],
    );

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-2 pb-1">
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} className="h-11 w-11 items-center justify-center">
          <ChevronLeft size={24} color="#0E1A15" strokeWidth={2} />
        </Pressable>
        <View className="items-center">
          <T className="font-sans-bold text-base">#{orderRef}</T>
          <T className="text-xs text-muted">{storeName}</T>
        </View>
        <View className="w-11" />
      </View>

      <ScrollView contentContainerClassName="gap-3 px-4 pb-6 pt-2">
        <View className="gap-1.5 rounded-[22px] bg-ink p-5" accessibilityLiveRegion="polite">
          <T className="text-[13px] text-on-dark-2">{eyebrow}</T>
          <T className="font-display text-[26px] text-bg">{headline}</T>
          {order.delivery_address ? <T className="text-sm text-on-dark">{order.delivery_address}</T> : null}
        </View>

        {stage !== 'refunded' && stage !== 'cancelled' ? (
          <View className="rounded-[20px] border border-line bg-surface p-[18px]" accessibilityRole="list">
            {steps.map(([title, sub], i) => {
              const on = i < doneStep;
              const last = i === steps.length - 1;
              return (
                <View key={title} className="flex-row gap-3.5" accessibilityLabel={`${title}, ${sub}${on ? ', done' : ''}`}>
                  <View className="items-center">
                    <View className={cx('h-[22px] w-[22px] rounded-full', on ? 'bg-green' : 'border-2 border-[#B9B1A0] bg-surface')} />
                    <View className={cx('min-h-6 w-0.5 flex-1', last ? 'bg-transparent' : i < doneStep - 1 ? 'bg-green' : 'bg-line')} />
                  </View>
                  <View className={cx('flex-1 gap-0.5', !last && 'pb-4')}>
                    <T className={cx('font-sans-bold text-[15px]', on ? 'text-ink' : 'text-[#8A918D]')}>{title}</T>
                    <T className="text-[13px] text-muted">{sub}</T>
                  </View>
                </View>
              );
            })}
          </View>
        ) : null}

        {order.courier_name || order.tracking_number ? (
          <View className="flex-row items-center gap-3 rounded-[20px] border border-line bg-surface px-4 py-3.5">
            <View className="h-10 w-10 items-center justify-center rounded-full bg-cream">
              <T className="font-sans-bold text-base">{(order.courier_name || 'R')[0].toUpperCase()}</T>
            </View>
            <View className="flex-1">
              <T className="font-sans-bold text-sm">{order.courier_name || 'Courier'}</T>
              {order.tracking_number ? <T selectable className="text-xs text-muted">{order.tracking_number}</T> : null}
            </View>
            {looksLikePhone(order.tracking_number) ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Call rider"
                onPress={() => Linking.openURL(`tel:${order.tracking_number!.replace(/[^\d+]/g, '')}`).catch(() => {})}
                className="h-10 justify-center rounded-full border border-line-2 px-3.5"
              >
                <T className="font-sans-bold text-[13px]">Call</T>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View className="gap-2 rounded-[20px] border border-line bg-surface px-4 py-3.5">
          {order.items && order.items.length > 0 ? (
            order.items.map((i) => (
              <View key={i.id} className="flex-row justify-between gap-3">
                <T className="flex-1 text-sm">{i.product_name || i.product?.name || 'Item'} (x{i.quantity})</T>
                <T className="font-sans-bold text-sm">{naira(Number(i.product_price ?? 0) * i.quantity)}</T>
              </View>
            ))
          ) : (
            <T className="py-2 text-sm text-muted">No line item details available.</T>
          )}
          <View className="flex-row justify-between border-t border-dashed border-line-2 pt-2">
            <T className="font-sans-bold text-sm">{stage === 'awaiting_payment' ? 'Total' : 'Total paid'}</T>
            <T className="font-sans-bold text-sm">{naira(Number(order.total_amount ?? 0))}</T>
          </View>
        </View>

        {confirmMutation.error ? <T className="text-sm text-danger">{(confirmMutation.error as Error).message}</T> : null}
        {reviewed ? <T className="text-center text-sm text-muted">Thanks, you’ve reviewed this order.</T> : null}
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="flex-row gap-2.5 border-t border-line bg-bg px-4 pt-3">
        {storePhone ? (
          <Pressable accessibilityRole="button" accessibilityHint={`Messages ${storeName} on WhatsApp`} onPress={getHelp} className="h-[54px] justify-center rounded-full border border-line-2 px-[18px]">
            <T className="font-sans-bold text-[15px]">Get help</T>
          </Pressable>
        ) : null}
        {canRate ? (
          <Pressable accessibilityRole="button" onPress={() => setRateOpen(true)} className="h-[54px] flex-1 items-center justify-center rounded-full bg-ink">
            <T className="font-sans-bold text-base text-white">Rate your order</T>
          </Pressable>
        ) : canConfirm ? (
          <Pressable
            accessibilityRole="button"
            onPress={confirmReceived}
            disabled={confirmMutation.isPending}
            className="h-[54px] flex-1 flex-row items-center justify-center gap-2 rounded-full bg-deep"
          >
            {confirmMutation.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <T className="font-sans-bold text-base text-white">I&apos;ve received it</T>
          </Pressable>
        ) : (
          <View className="h-[54px] flex-1 items-center justify-center">
            <T className="font-sans-semibold text-sm text-muted">{BUYER_STAGE_LABEL[stage]}</T>
          </View>
        )}
      </View>

      <BottomSheet visible={rateOpen} onClose={() => setRateOpen(false)}>
        <View className="gap-3 py-1">
          <T className="font-display text-xl">How was your order from {storeName}?</T>
          <View accessibilityRole="radiogroup" className="flex-row gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <Pressable
                key={n}
                accessibilityRole="radio"
                accessibilityLabel={`${n} star${n > 1 ? 's' : ''}`}
                accessibilityState={{ checked: rating === n }}
                onPress={() => setRating(n)}
                hitSlop={4}
              >
                <Star size={34} color={n <= rating ? '#E9A23B' : '#D8D2C4'} fill={n <= rating ? '#E9A23B' : 'none'} strokeWidth={1.6} />
              </Pressable>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            multiline
            maxLength={1000}
            textAlignVertical="top"
            placeholder="Tell other shoppers about it (optional)"
            placeholderTextColor="#8A928E"
            accessibilityLabel="Your review"
            className="min-h-[96px] rounded-xl border border-line-2 bg-surface px-3 py-2.5 font-sans text-[15px] text-ink"
          />
          {reviewMutation.error ? <T className="text-sm text-danger">{(reviewMutation.error as Error).message}</T> : null}
          <Button
            title={reviewMutation.isPending ? 'Sending…' : 'Post review'}
            className="h-[50px]"
            disabled={!rating || reviewMutation.isPending}
            onPress={() => reviewMutation.mutate()}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}
