import { useState } from 'react';
import { Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ChevronRight, Sparkles, X, Truck } from 'lucide-react-native';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomSheet, SheetField } from '@/features/buyer/account';
import { naira } from '@/lib/format';
import { storeLink } from '@/lib/storefront';
import { getMe, logout } from '@/api/auth';
import { PrivacyActions } from '@/features/account/PrivacyActions';
import { PasswordLogin } from '@/features/account/PasswordLogin';
import { NINA_LABEL, NinaSheet, ninaState } from '@/features/seller/NinaSheet';
import { getPlans, getStore, updateStore } from '@/api/store';
import { getProducts } from '@/api/products';
import { getWalletBalance } from '@/api/orders';

export default function Settings() {
  const [planOpen, setPlanOpen] = useState(false);
  const [suiteDetail, setSuiteDetail] = useState<{ title: string; desc: string } | null>(null);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [ninaOpen, setNinaOpen] = useState(false);
  const [flatFee, setFlatFee] = useState('');
  const [deliveryError, setDeliveryError] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: store } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });
  const { data: wallet } = useQuery({ queryKey: ['seller-wallet'], queryFn: getWalletBalance });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });
  const { data: planGroups = [] } = useQuery({ queryKey: ['plans'], queryFn: getPlans, staleTime: 1000 * 60 * 60 });

  const saveDelivery = useMutation({
    mutationFn: (fee: number) => updateStore({ shipping_type: fee > 0 ? 'flat_rate' : 'free', shipping_flat_fee: fee }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seller-store'] });
      setDeliveryOpen(false);
    },
    onError: (err: any) => setDeliveryError(err.message || 'Could not save your delivery fee.'),
  });

  const storeName = store?.store_name || store?.name || me?.store?.store_name || 'My Store';
  const storeSlug = store?.username || store?.slug || me?.store?.username || '';
  const storeInitial = storeName[0] || 'S';
  const storeColor = store?.primary_color || '#0F172A';
  const productsCount = products?.length;

  const walletBalance = wallet ? naira(wallet.available_balance_kobo / 100) : '';
  const userName = me?.user?.name || '';
  const userPhone = store?.whatsapp_phone || me?.user?.phone_number || 'Not set';

  // The account's plan key (e.g. "pro_monthly") belongs to one admin-defined plan group
  const planKey = me?.user?.plan;
  const currentGroup = planGroups.find((g) => g.plans.some((p) => p.key === planKey));
  const planName = currentGroup?.name ?? 'Free';

  const savedFee = Number(store?.shipping_flat_fee ?? 0);
  const deliveryValue =
    store?.shipping_type === 'flat_rate' ? naira(savedFee)
    : store?.shipping_type === 'free' ? 'Free'
    : store?.shipping_type ? 'Set on web'
    : 'Not set';
  const openDelivery = () => {
    setFlatFee(store?.shipping_type === 'flat_rate' && savedFee ? String(savedFee) : '');
    setDeliveryError(null);
    setDeliveryOpen(true);
  };

  // What each tool does; their settings live on the web dashboard
  const nina = ninaState(store);
  const suiteRows: Array<{ label: string; value: string; href?: Href; detail?: string; onPress?: () => void }> = [
    { label: 'Frontstore Nina AI Agent', value: nina ? NINA_LABEL[nina] : '', onPress: () => setNinaOpen(true) },
    { label: 'Frontstore Flow (Chat Store)', value: '', detail: 'Turns your WhatsApp catalog into a conversational checkout where customers can browse and pay.' },
    { label: 'Frontstore Pay (Escrow)', value: walletBalance, href: '/payouts' },
    { label: 'Frontstore Reach (Broadcasts)', value: '', detail: 'Send announcements, new drop alerts and promo codes to opted-in WhatsApp buyers.' },
    { label: 'Frontstore Pulse (Analytics)', value: '', detail: 'Sales, repeat customers and traffic for your store.' },
  ];

  const generalRows: Array<{ label: string; value: string; href?: Href; onPress?: () => void }> = [
    { label: 'Switch to Buyer view', value: userName, href: '/switch' },
    { label: 'WhatsApp Business Number', value: userPhone },
    { label: 'Delivery fee', value: deliveryValue, onPress: openDelivery },
    { label: 'Store Theme & Branding', value: storeColor, href: '/store-edit' },
    { label: 'Share Store & QR Code', value: '', href: '/share' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-3">
        <T className="font-display text-[32px] tracking-[-0.6px]">Store</T>

        <View className="flex-row items-center gap-3.5 rounded-[22px] border border-line bg-surface p-4">
          <View style={{ backgroundColor: storeColor }} className="h-14 w-14 items-center justify-center overflow-hidden rounded-2xl">
            {store?.logo_url ? (
              <Image source={{ uri: store.logo_url }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <T className="font-display text-[22px] text-white">{storeInitial}</T>
            )}
          </View>
          <View className="flex-1 gap-0.5">
            <T className="font-sans-bold text-[17px]">{storeName}</T>
            {storeSlug ? <T className="text-[13px] text-muted">{storeLink(storeSlug)}</T> : null}
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit store" hitSlop={4} onPress={() => router.push('/store-edit')} className="h-10 justify-center rounded-full border border-line-2 px-3.5">
            <T className="font-sans-bold text-[13px]">Edit</T>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between rounded-[22px] bg-deep p-4">
          <View className="gap-0.5">
            <T className="font-sans-bold text-bg">{planName} plan</T>
            {productsCount !== undefined ? (
              <T className="text-[13px] text-on-dark">
                {productsCount} {productsCount === 1 ? 'product' : 'products'}
              </T>
            ) : null}
          </View>
          <Pressable accessibilityRole="button" hitSlop={4} onPress={() => setPlanOpen(true)} className="h-10 justify-center rounded-full bg-saffron px-3.5">
            <T className="font-sans-bold text-[13px] text-deep">Change Plan</T>
          </Pressable>
        </View>

        <T className="font-sans-bold text-xs tracking-wider text-muted uppercase">Frontstore Suite</T>
        <View className="rounded-[22px] border border-line bg-surface">
          {suiteRows.map((r, i) => (
            <Pressable
              key={r.label}
              accessibilityRole="button"
              onPress={() => {
                if (r.href) {
                  router.push(r.href as Href);
                } else if (r.onPress) {
                  r.onPress();
                } else {
                  setSuiteDetail({ title: r.label, desc: r.detail || '' });
                }
              }}
              className={cx('min-h-[52px] flex-row items-center gap-3.5 px-4', i < suiteRows.length - 1 && 'border-b border-[#F0ECE3]')}
            >
              <T className="flex-1 font-sans-semibold text-[15px]">{r.label}</T>
              {r.value ? <T className="text-sm text-muted">{r.value}</T> : null}
              <ChevronRight size={16} color="#8A918D" strokeWidth={2} />
            </Pressable>
          ))}
        </View>

        <T className="font-sans-bold text-xs tracking-wider text-muted uppercase">General & Preferences</T>
        <View className="rounded-[22px] border border-line bg-surface">
          {generalRows.map((r, i) => (
            <Pressable
              key={r.label}
              accessibilityRole="button"
              onPress={() => {
                if (r.href) {
                  router.push(r.href as Href);
                } else if (r.onPress) {
                  r.onPress();
                }
              }}
              className={cx('min-h-[52px] flex-row items-center gap-3.5 px-4', i < generalRows.length - 1 && 'border-b border-[#F0ECE3]')}
            >
              <T className="flex-1 font-sans-semibold text-[15px]">{r.label}</T>
              {r.value ? <T className="text-sm text-muted">{r.value}</T> : null}
              <ChevronRight size={16} color="#8A918D" strokeWidth={2} />
            </Pressable>
          ))}
        </View>

        <T className="font-sans-bold text-xs tracking-wider text-muted uppercase">Login & security</T>
        <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
          <PasswordLogin />
        </View>

        <T className="font-sans-bold text-xs tracking-wider text-muted uppercase">Privacy</T>
        <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
          <PrivacyActions />
        </View>

        <View className="rounded-[22px] border border-line bg-surface">
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL('mailto:hello@frontstore.ng?subject=Help%20with%20my%20store')}
            className="min-h-[52px] flex-row items-center justify-between border-b border-[#F0ECE3] px-4"
          >
            <T className="font-sans-semibold text-[15px]">Email support</T>
            <ChevronRight size={16} color="#8A918D" strokeWidth={2} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={async () => { await logout(); router.replace('/login'); }} className="min-h-[52px] justify-center px-4">
            <T className="font-sans-bold text-[15px] text-danger">Log out</T>
          </Pressable>
        </View>
      </ScrollView>

      {/* Plan Upgrade BottomSheet */}
      <BottomSheet visible={planOpen} onClose={() => setPlanOpen(false)}>
        <View className="gap-3 py-1">
          <View className="flex-row items-center justify-between">
            <T className="font-display text-xl">Merchant Plans</T>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setPlanOpen(false)}>
              <X size={20} color="#0E1A15" />
            </Pressable>
          </View>
          <View className="gap-2.5">
            {planGroups.length > 0 ? (
              planGroups.map((g) => {
                const current = g.key === currentGroup?.key || (!currentGroup && g.plans.every((p) => !p.price));
                const cheapest = g.plans.reduce<{ price: number; billing_label: string } | null>(
                  (min, p) => (min === null || p.price < min.price ? p : min),
                  null,
                );
                return (
                  <View key={g.key} className={cx('gap-1 rounded-2xl border p-4', current ? 'border-green bg-mint' : 'border-line bg-surface')}>
                    <View className="flex-row items-center justify-between">
                      <T className="font-sans-bold text-base">{g.name}{current ? ' (current)' : ''}</T>
                      {cheapest ? (
                        <T className="font-sans-bold text-sm text-green">
                          {cheapest.price ? `${naira(cheapest.price)} ${cheapest.billing_label}` : 'Free'}
                        </T>
                      ) : null}
                    </View>
                    {g.benefits.length ? <T className="text-xs text-muted-2">{g.benefits.join(' · ')}</T> : null}
                  </View>
                );
              })
            ) : (
              <T className="text-sm text-muted-2">Plans couldn’t be loaded. See them on frontstore.app.</T>
            )}
            <Button
              title="Change plan on the web"
              className="mt-1 h-11"
              onPress={() => {
                setPlanOpen(false);
                Linking.openURL('https://frontstore.app/pricing');
              }}
            />
          </View>
        </View>
      </BottomSheet>

      <NinaSheet store={store} visible={ninaOpen} onClose={() => setNinaOpen(false)} />

      {/* Suite Detail BottomSheet */}
      <BottomSheet visible={!!suiteDetail} onClose={() => setSuiteDetail(null)}>
        {suiteDetail ? (
          <View className="gap-3 py-1">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Sparkles size={20} color="#0B6E4F" />
                <T className="font-display text-xl">{suiteDetail.title}</T>
              </View>
              <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setSuiteDetail(null)}>
                <X size={20} color="#0E1A15" />
              </Pressable>
            </View>
            <T className="text-[15px] leading-[22px] text-muted-2">{suiteDetail.desc}</T>
            <T className="text-sm text-muted-2">Set this up and check its status in your dashboard on frontstore.app.</T>
            <Button
              title="Open dashboard"
              className="h-11"
              onPress={() => {
                setSuiteDetail(null);
                Linking.openURL('https://frontstore.app/dashboard');
              }}
            />
          </View>
        ) : null}
      </BottomSheet>

      {/* Delivery Zones BottomSheet */}
      <BottomSheet visible={deliveryOpen} onClose={() => setDeliveryOpen(false)}>
        <View className="gap-3 py-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Truck size={20} color="#0B6E4F" />
              <T className="font-display text-xl">Delivery &amp; Shipping</T>
            </View>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setDeliveryOpen(false)}>
              <X size={20} color="#0E1A15" />
            </Pressable>
          </View>
          <T className="text-sm text-muted-2">
            One delivery fee added to every order at checkout. Leave it at 0 for free delivery. Zones and other rules are set on the web dashboard.
          </T>
          {deliveryError ? <T className="text-sm text-danger">{deliveryError}</T> : null}
          <SheetField
            label="Delivery fee (₦)"
            keyboardType="numeric"
            value={flatFee}
            onChangeText={setFlatFee}
            placeholder="0"
          />
          <Button
            title={saveDelivery.isPending ? 'Saving...' : 'Save delivery fee'}
            className="h-[50px]"
            disabled={saveDelivery.isPending}
            onPress={() => {
              setDeliveryError(null);
              saveDelivery.mutate(Math.max(0, Number(flatFee.replace(/[^\d.]/g, '')) || 0));
            }}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}
