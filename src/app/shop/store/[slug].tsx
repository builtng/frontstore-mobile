import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProductImage, productPhoto } from '@/features/products/ProductImage';
import { getMe } from '@/api/auth';
import { ChevronLeft, Share as ShareIcon, Star, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { Button, EmptyState, LoadError, Screen, Skeleton, T, cx } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, ChipRow, useTileWidth } from '@/features/buyer/parts';
import { BottomSheet, SheetField } from '@/features/buyer/account';
import { getPublicStore, toggleFollowStore, createStoreOrder, initOrderPayment } from '@/api/buyer';
import { C } from '@/lib/theme';

export default function BuyerStore() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const tile = useTileWidth();
  const queryClient = useQueryClient();

  const { data: liveData, isLoading: storeLoading, isError: storeError, refetch: refetchStore } = useQuery({
    queryKey: ['public-store', slug],
    queryFn: () => getPublicStore(slug!),
    enabled: !!slug,
  });

  const storeObj = liveData?.store;
  // Sellers can look at their own store but can't buy from it.
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const ownStore = !!me?.store && (String(me.store.id) === String(storeObj?.id) || me.store.username === slug);
  // App Store rule 3.1.1: digital goods bought inside an iOS app must use Apple's in-app purchase.
  // So on iPhone/iPad the shop only sells physical goods, services and event tickets.
  const isDigitalItem = (p: any) => !!(p?.is_digital || p?.digital_files?.length || p?.type === 'subscription');
  const liveProducts = (liveData?.products || []).filter((p: any) => Platform.OS !== 'ios' || !isDigitalItem(p));

  const storeName = storeObj?.name || '';
  const storeInitial = storeName[0] || 'S';
  const storeColor = storeObj?.primary_color || '#0F172A';
  const storeBio = storeObj?.store_bio || '';
  const storeLocation = storeObj?.location || '';
  const storeId = storeObj?.id;

  const [following, setFollowing] = useState(false);
  const [cat, setCat] = useState('All');
  const [cart, setCart] = useState<Record<string, number>>({});

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reviewsOpen, setReviewsOpen] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'transfer'>('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any>(null);
  const [orderError, setOrderError] = useState<string | null>(null);

  const reviewsList = liveData?.reviews || [];

  const handlePlaceOrder = async () => {
    if (!customerName.trim() || !customerPhone.trim() || !customerAddress.trim()) {
      setOrderError('Please provide your name, phone and delivery address.');
      return;
    }
    setIsSubmitting(true);
    setOrderError(null);

    try {
      const itemsPayload = Object.entries(cart)
        .filter(([_, qty]) => qty > 0)
        .map(([id, quantity]) => ({
          product_id: id,
          quantity,
        }));

      const res = await createStoreOrder(slug!, {
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        delivery_method: 'delivery',
        delivery_address: customerAddress.trim(),
        payment_method: paymentMethod,
        items: itemsPayload,
      });

      const orderData = res?.order || res?.data?.order || res?.data;
      const whatsappUrl = res?.whatsapp_url || res?.data?.whatsapp_url;
      const orderId = orderData?.order_number || orderData?.id || 'FS-CONFIRMED';

      // The backend decides how each store is paid (usually a dedicated
      // bank account, confirmed automatically); show that to the buyer.
      let payment: Awaited<ReturnType<typeof initOrderPayment>> | null = null;
      let paymentError: string | null = null;
      if (orderData?.id) {
        try {
          payment = await initOrderPayment(orderData.id);
          if (payment?.authorization_url) Linking.openURL(payment.authorization_url).catch(() => {});
        } catch (e: any) {
          paymentError = e.message || 'Could not load payment details. Contact the seller on WhatsApp.';
        }
      }

      setOrderSuccess({ orderId, whatsappUrl, payment, paymentError });
      setCart({});
      queryClient.invalidateQueries({ queryKey: ['buyer-orders'] });
    } catch (err: any) {
      setOrderError(err.message || 'Could not place order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const followMutation = useMutation({
    mutationFn: () => toggleFollowStore(storeId!),
    onSuccess: (res) => {
      setFollowing(res.followed);
      queryClient.invalidateQueries({ queryKey: ['followed-stores'] });
    },
  });

  const handleToggleFollow = () => {
    if (storeId) {
      followMutation.mutate();
    } else {
      setFollowing((f) => !f);
    }
  };

  const itemsList = liveProducts.map((p) => ({
    id: String(p.id),
    name: p.name,
    price: p.price,
    color: p.primary_color || '#B5838D',
    photo: productPhoto(p as any),
    cat: p.category || 'General',
  }));

  const cats = ['All', ...Array.from(new Set(itemsList.map((i) => i.cat)))];
  const shown = itemsList.filter((i) => cat === 'All' || i.cat === cat);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = itemsList.reduce((sum, i) => sum + (i.price ?? 0) * (cart[i.id] ?? 0), 0);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/shop'));
  const share = () => Share.share({ message: `${storeName} on Frontstore: https://frontstore.ng/${slug}` }).catch(() => {});
  const meta = storeLocation;

  if (storeLoading || (storeError && !liveData)) {
    return (
      <Screen className="bg-bg">
        <View className="flex-row items-center px-2 pb-1">
          <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} className="h-11 w-11 items-center justify-center">
            <ChevronLeft size={24} color={C.ink} strokeWidth={2} />
          </Pressable>
        </View>
        {storeLoading ? (
          <View className="gap-4 px-4">
            <View className="flex-row items-center gap-3.5">
              <Skeleton className="h-16 w-16 rounded-[20px]" />
              <View className="flex-1 gap-2">
                <Skeleton className="h-5 w-3/5" />
                <Skeleton className="h-3.5 w-2/5" />
              </View>
            </View>
            <Skeleton className="h-11 rounded-full" />
            <View className="flex-row flex-wrap gap-3">
              {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[180px] w-[47%] rounded-2xl" />)}
            </View>
          </View>
        ) : (
          <View className="px-4"><LoadError what="this store" onRetry={() => refetchStore()} /></View>
        )}
      </Screen>
    );
  }

  return (
    <Screen edges={[]} className="bg-bg">
      <ScrollView contentContainerClassName="pb-6" showsVerticalScrollIndicator={false}>
        {/* Cover in the store's colour, with the back / share buttons floating on it. */}
        <View style={{ backgroundColor: storeColor, paddingTop: insets.top }} className="h-[150px]">
          <View style={{ top: insets.top + 6 }} className="absolute left-4 right-4 flex-row justify-between">
            <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} className="h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-white/90">
              <ChevronLeft size={20} color={C.ink} strokeWidth={2} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Share store" onPress={share} className="h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-white/90">
              <ShareIcon size={18} color={C.ink} strokeWidth={2} />
            </Pressable>
          </View>
        </View>
        <View className="gap-2.5 px-5">
          <View className="-mt-[38px] flex-row items-end justify-between">
            <View className="rounded-[24px] border-4 border-bg">
              <Avatar initial={storeInitial} color="#0E1A15" uri={storeObj?.logo_url} size={72} radius={20} fontSize={28} />
            </View>
            {!ownStore ? (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: following }}
                accessibilityLabel={following ? `Following ${storeName}, tap to unfollow` : `Follow ${storeName}`}
                onPress={handleToggleFollow}
                className={cx('mb-1 h-10 items-center justify-center rounded-full border-[1.5px] px-[18px]', following ? 'border-line bg-surface' : 'border-ink bg-panel')}
              >
                <T className={cx('font-sans-bold text-sm', following ? 'text-ink' : 'text-white')}>{following ? 'Following' : 'Follow'}</T>
              </Pressable>
            ) : null}
          </View>
          <T numberOfLines={2} className="font-display text-[22px] leading-[27px]">{storeName}</T>
          {meta ? <T className="text-sm text-muted">{meta}</T> : null}
          {storeBio ? <T className="text-sm leading-[21px] text-muted">{storeBio}</T> : null}
          {ownStore ? (
            <View className="rounded-2xl bg-mint px-4 py-3">
              <T className="font-sans-bold text-sm text-accent">This is a preview of your store</T>
              <T className="text-[13px] text-accent">It’s what buyers see. You can’t buy from your own store.</T>
            </View>
          ) : null}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`View reviews for ${storeName}`}
            onPress={() => setReviewsOpen(true)}
            className="h-10 flex-row items-center gap-1.5 self-start rounded-full border border-line bg-surface px-3.5"
          >
            <Star size={14} color="#E9A23B" fill="#E9A23B" />
            <T className="font-sans-bold text-sm">{reviewsList.length ? `Reviews (${reviewsList.length})` : 'No reviews yet'}</T>
          </Pressable>
        </View>

        <ChipRow options={cats} value={cat} onChange={setCat} bordered="border-line-2" className="pt-4" contentPadding />

        {shown.length === 0 ? (
          <View className="px-4 pt-3.5">
            <EmptyState title={liveProducts.length ? 'Nothing in this category' : 'No products yet'} sub={liveProducts.length ? 'Try another category.' : 'This store hasn’t added any products. Check back soon.'} />
          </View>
        ) : null}
        <View className="flex-row flex-wrap gap-x-3 gap-y-4 px-4 pt-3.5">
          {shown.map((p) => {
            const q = cart[p.id] ?? 0;
            return (
              <View key={p.id} style={{ width: tile, shadowColor: '#0E1A15', shadowOpacity: 0.06, shadowRadius: 2, shadowOffset: { width: 0, height: 1 }, elevation: 1 }} className="gap-2 rounded-[22px] bg-surface p-2 pb-2.5">
                <ProductImage uri={p.photo} name={p.name} className="h-[142px] w-full rounded-2xl" textClassName="text-3xl" />
                <T numberOfLines={2} className="min-h-[36px] px-0.5 font-sans-bold text-sm">{p.name}</T>
                <View className="flex-row items-center justify-between gap-1 px-0.5">
                  <T className="font-sans-bold text-[15px]">{naira(p.price)}</T>
                  {!ownStore ? (
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={q ? `Add another ${p.name}, ${q} in cart` : `Add ${p.name}`}
                      onPress={() => setCart((c) => ({ ...c, [p.id]: q + 1 }))}
                      style={q ? { backgroundColor: storeColor } : undefined}
                      className={cx('h-9 min-w-[44px] items-center justify-center rounded-full px-2.5', !q && 'bg-panel')}
                    >
                      <T className="font-sans-bold text-[13px] text-white">{q ? `${q} in cart` : '+ Add'}</T>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {count > 0 ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="px-3 pt-2">
          <View className="flex-row items-center justify-between rounded-[20px] bg-panel py-2.5 pl-[18px] pr-2.5">
            <View>
              <T className="text-xs text-on-dark-2">{count} items</T>
              <T className="font-sans-bold text-base text-white">{naira(total)}</T>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Checkout, ${count} items, ${naira(total)}`}
              onPress={() => {
                setOrderSuccess(null);
                setOrderError(null);
                setCheckoutOpen(true);
              }}
              className="h-[46px] justify-center rounded-2xl bg-gold px-5"
            >
              <T className="font-sans-bold text-[15px] text-[#2A1B05]">Checkout</T>
            </Pressable>
          </View>
        </View>
      ) : null}

      {/* Checkout BottomSheet */}
      <BottomSheet visible={checkoutOpen} onClose={() => setCheckoutOpen(false)}>
        {orderSuccess ? (
          <View className="gap-3 py-2">
            <T className="font-display text-2xl text-accent">Order Received!</T>
            <T className="font-sans-bold text-base text-ink">Order #{orderSuccess.orderId}</T>
            {orderSuccess.payment?.bank_account_number ? (
              <View className="gap-1.5 rounded-2xl border border-line bg-surface p-4">
                <T className="font-sans-bold text-sm">
                  Transfer {orderSuccess.payment.amount != null ? naira(Number(orderSuccess.payment.amount)) : 'the total'} to:
                </T>
                <T className="text-sm text-muted-2">{orderSuccess.payment.bank_name}</T>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Copy account number ${orderSuccess.payment.bank_account_number}`}
                  onPress={() => Clipboard.setStringAsync(orderSuccess.payment.bank_account_number)}
                  className="flex-row items-center justify-between"
                >
                  <T className="font-display text-2xl tracking-[1px]">{orderSuccess.payment.bank_account_number}</T>
                  <T className="font-sans-bold text-sm text-accent">Copy</T>
                </Pressable>
                <T className="text-sm text-muted-2">{orderSuccess.payment.bank_account_name}</T>
                <T className="text-xs text-muted">
                  {orderSuccess.payment.payment_instructions || 'Your payment is confirmed automatically once it arrives.'}
                </T>
              </View>
            ) : orderSuccess.paymentError ? (
              <T className="text-sm text-danger">{orderSuccess.paymentError}</T>
            ) : (
              <T className="text-sm text-muted-2">
                Your order has been logged with {storeName}. You can chat with the seller on WhatsApp to confirm delivery details or track updates.
              </T>
            )}
            {orderSuccess.whatsappUrl ? (
              <Button
                title="Chat on WhatsApp"
                className="h-[52px] bg-[#25D366]"
                onPress={() => {
                  Linking.openURL(orderSuccess.whatsappUrl).catch(() => {});
                  setCheckoutOpen(false);
                  router.push('/shop/orders');
                }}
              />
            ) : null}
            <Button
              title="View My Orders"
              className="h-[52px]"
              onPress={() => {
                setCheckoutOpen(false);
                router.push('/shop/orders');
              }}
            />
          </View>
        ) : (
          <View className="gap-3 py-1">
            <View className="flex-row items-center justify-between">
              <T className="font-display text-xl">Checkout ({count} items)</T>
              <T className="font-sans-bold text-lg text-accent">{naira(total)}</T>
            </View>

            {orderError ? (
              <View className="rounded-xl bg-danger/10 p-2.5">
                <T className="text-xs font-bold text-danger">{orderError}</T>
              </View>
            ) : null}

            <SheetField
              label="Your Full Name"
              placeholder="Your name"
              value={customerName}
              onChangeText={setCustomerName}
            />
            <SheetField
              label="Phone Number"
              placeholder="e.g. 08012345678"
              keyboardType="phone-pad"
              value={customerPhone}
              onChangeText={setCustomerPhone}
            />
            <SheetField
              label="Delivery Address"
              placeholder="House number, street, area, city"
              value={customerAddress}
              onChangeText={setCustomerAddress}
            />

            <View className="gap-1.5 pt-1">
              <T className="font-sans-bold text-[13px]">Payment Method</T>
              <View className="flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPaymentMethod('card')}
                  className={cx(
                    'h-11 flex-1 items-center justify-center rounded-xl border',
                    paymentMethod === 'card' ? 'border-green bg-mint' : 'border-line bg-surface'
                  )}
                >
                  <T className={cx('font-sans-bold text-xs', paymentMethod === 'card' ? 'text-accent' : 'text-ink')}>
                    Card / Transfer (Paystack)
                  </T>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setPaymentMethod('transfer')}
                  className={cx(
                    'h-11 flex-1 items-center justify-center rounded-xl border',
                    paymentMethod === 'transfer' ? 'border-green bg-mint' : 'border-line bg-surface'
                  )}
                >
                  <T className={cx('font-sans-bold text-xs', paymentMethod === 'transfer' ? 'text-accent' : 'text-ink')}>
                    Bank Transfer / WhatsApp
                  </T>
                </Pressable>
              </View>
            </View>

            {isSubmitting ? (
              <View className="h-[54px] items-center justify-center rounded-2xl bg-deep">
                <ActivityIndicator color="#fff" />
              </View>
            ) : (
              <Button
                title={`Place Order · ${naira(total)}`}
                className="h-[52px]"
                onPress={handlePlaceOrder}
              />
            )}
          </View>
        )}
      </BottomSheet>

      {/* Reviews BottomSheet */}
      <BottomSheet visible={reviewsOpen} onClose={() => setReviewsOpen(false)}>
        <View className="gap-3 py-1">
          <View className="flex-row items-center justify-between">
            <T className="font-display text-xl">Store Reviews ({reviewsList.length})</T>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setReviewsOpen(false)}>
              <X size={20} color={C.ink} />
            </Pressable>
          </View>
          <ScrollView className="max-h-[360px]" showsVerticalScrollIndicator={false}>
            {reviewsList.length > 0 ? (
              reviewsList.map((r, idx) => (
                <View key={r.id || idx} className="gap-1 border-b border-line-2 py-3">
                  <View className="flex-row items-center justify-between">
                    <T className="font-sans-bold text-sm">{r.customer_name || r.buyer_name || 'Buyer'}</T>
                    <View className="flex-row items-center gap-0.5">
                      <Star size={14} color="#E9A23B" fill="#E9A23B" />
                      <T className="font-sans-bold text-xs">{r.rating ?? '–'}</T>
                    </View>
                  </View>
                  <T className="text-[13px] text-muted-2">{r.comment || ''}</T>
                  {r.created_at ? (
                    <T className="text-[11px] text-muted">{new Date(r.created_at).toLocaleDateString()}</T>
                  ) : null}
                </View>
              ))
            ) : (
              <View className="py-6 items-center gap-2">
                <T className="font-sans-medium text-sm text-muted">No customer reviews yet for this store.</T>
                <T className="text-xs text-muted-2">Be the first to order and leave a review!</T>
              </View>
            )}
          </ScrollView>
        </View>
      </BottomSheet>
    </Screen>
  );
}
