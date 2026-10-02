import { useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight, Sparkles, X, Check, Truck } from 'lucide-react-native';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomSheet, SheetField } from '@/features/buyer/account';
import { naira } from '@/lib/format';
import { getMe } from '@/api/auth';
import { getStore } from '@/api/store';
import { getWalletBalance } from '@/api/orders';

export default function Settings() {
  const [planOpen, setPlanOpen] = useState(false);
  const [suiteDetail, setSuiteDetail] = useState<{ title: string; desc: string; tag?: string } | null>(null);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [flatFee, setFlatFee] = useState('2500');

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: store } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });
  const { data: wallet } = useQuery({ queryKey: ['seller-wallet'], queryFn: getWalletBalance });

  const storeName = store?.name || me?.user?.store?.name || 'My Store';
  const storeSlug = store?.slug || me?.user?.store?.slug || 'my-store';
  const storeInitial = storeName[0] || 'S';
  const storeColor = store?.primary_color || '#0F172A';
  const productsCount = store?.products_count ?? 0;

  const walletBalance = wallet ? naira(wallet.balance) : '₦0';
  const userName = me?.user?.name || 'Seller';
  const userPhone = me?.user?.phone || 'Not set';

  const suiteRows: Array<{ label: string; value: string; tag?: string; href?: Href; detail?: string }> = [
    { label: 'Frontstore Nina AI Agent', value: 'Active', tag: 'AI 24/7', detail: 'Automates customer responses, inventory questions, and sales order closing 24 hours a day on your WhatsApp business line.' },
    { label: 'Frontstore Flow (Chat Store)', value: 'WhatsApp Connected', detail: 'Turns your WhatsApp catalog into an interactive conversational checkout where customers can browse and pay.' },
    { label: 'Frontstore Pay (Escrow)', value: walletBalance, href: '/payouts' },
    { label: 'Frontstore Reach (Broadcasts)', value: 'Active', detail: 'Broadcast announcements, new drop alerts, and promo codes directly to opted-in WhatsApp buyers.' },
    { label: 'Frontstore Pulse (Analytics)', value: 'Weekly Ready', detail: 'Real-time sales velocity, top customer retention rates, and WhatsApp traffic metrics.' },
  ];

  const generalRows: Array<{ label: string; value: string; href?: Href; onPress?: () => void }> = [
    { label: 'Switch to Buyer view', value: userName, href: '/switch' },
    { label: 'WhatsApp Business Number', value: userPhone },
    { label: 'Delivery & Shipping Zones', value: 'Default Zone', onPress: () => setDeliveryOpen(true) },
    { label: 'Store Theme & Branding', value: storeColor, href: '/store-style' },
    { label: 'Share Store & QR Code', value: '', href: '/share' },
  ];

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-4 px-5 pb-8 pt-3">
        <T className="font-display text-[32px] tracking-[-0.6px]">Store</T>

        <View className="flex-row items-center gap-3.5 rounded-[22px] border border-line bg-surface p-4">
          <View style={{ backgroundColor: storeColor }} className="h-14 w-14 items-center justify-center rounded-2xl">
            <T className="font-display text-[22px] text-white">{storeInitial}</T>
          </View>
          <View className="flex-1 gap-0.5">
            <T className="font-sans-bold text-[17px]">{storeName}</T>
            <T className="text-[13px] text-muted">{storeSlug}.frontstore.app</T>
          </View>
          <Pressable accessibilityRole="button" accessibilityLabel="Edit store" hitSlop={4} onPress={() => router.push('/store-style')} className="h-10 justify-center rounded-full border border-line-2 px-3.5">
            <T className="font-sans-bold text-[13px]">Edit</T>
          </Pressable>
        </View>

        <View className="flex-row items-center justify-between rounded-[22px] bg-deep p-4">
          <View className="gap-0.5">
            <T className="font-sans-bold text-bg">Starter plan</T>
            <T className="text-[13px] text-on-dark">{productsCount} products created</T>
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
                } else {
                  setSuiteDetail({ title: r.label, desc: r.detail || '', tag: r.tag });
                }
              }}
              className={cx('min-h-[52px] flex-row items-center gap-3.5 px-4', i < suiteRows.length - 1 && 'border-b border-[#F0ECE3]')}
            >
              <T className="flex-1 font-sans-semibold text-[15px]">{r.label}</T>
              {r.tag ? (
                <View className="rounded-full bg-teal/15 px-2 py-0.5">
                  <T className="font-sans-bold text-[11px] text-green">{r.tag}</T>
                </View>
              ) : null}
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

        <View className="rounded-[22px] border border-line bg-surface">
          <Pressable
            accessibilityRole="link"
            onPress={() => Linking.openURL('https://wa.me/')}
            className="min-h-[52px] flex-row items-center justify-between border-b border-[#F0ECE3] px-4"
          >
            <T className="font-sans-semibold text-[15px]">Help on WhatsApp</T>
            <ChevronRight size={16} color="#8A918D" strokeWidth={2} />
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => router.replace('/welcome')} className="min-h-[52px] justify-center px-4">
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
            <View className="rounded-2xl border border-line bg-surface p-4 gap-1">
              <View className="flex-row items-center justify-between">
                <T className="font-sans-bold text-base">Starter (Active)</T>
                <T className="font-sans-bold text-sm text-muted">Free</T>
              </View>
              <T className="text-xs text-muted-2">Up to 15 products · 1 WhatsApp line · Standard payouts</T>
            </View>

            <View className="rounded-2xl border border-green bg-mint p-4 gap-2">
              <View className="flex-row items-center justify-between">
                <T className="font-sans-bold text-base text-deep">Growth Plan</T>
                <T className="font-sans-bold text-sm text-green">₦4,500/mo</T>
              </View>
              <T className="text-xs text-deep">Unlimited products · 24/7 Nina AI sales assistant · Next-day escrow payouts · Custom domain</T>
              <Button title="Upgrade to Growth" className="h-10 mt-1" onPress={() => setPlanOpen(false)} />
            </View>

            <View className="rounded-2xl border border-line bg-surface p-4 gap-1">
              <View className="flex-row items-center justify-between">
                <T className="font-sans-bold text-base">Scale Plan</T>
                <T className="font-sans-bold text-sm text-ink">₦12,000/mo</T>
              </View>
              <T className="text-xs text-muted-2">Multiple team logins · Broadcast campaigns · Dedicated account manager</T>
            </View>
          </View>
        </View>
      </BottomSheet>

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
            <View className="rounded-2xl bg-surface p-4 border border-line">
              <T className="font-sans-bold text-sm text-green">Status: Live &amp; Configured</T>
              <T className="text-xs text-muted-2 mt-0.5">Automations run in the background for your storefront.</T>
            </View>
            <Button title="Done" className="h-11" onPress={() => setSuiteDetail(null)} />
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
          <T className="text-sm text-muted-2">Set your standard delivery fee charged to buyers at checkout.</T>
          <SheetField
            label="Standard Flat Rate (₦)"
            keyboardType="numeric"
            value={flatFee}
            onChangeText={setFlatFee}
            placeholder="2500"
          />
          <View className="rounded-2xl border border-line bg-surface p-3.5 gap-1">
            <T className="font-sans-bold text-xs text-muted uppercase">Active Zones</T>
            <T className="text-xs text-deep">Lagos Mainland &amp; Island: {naira(Number(flatFee) || 2500)}</T>
            <T className="text-xs text-deep">Interstate Dispatch: Standard Logistics Rider</T>
          </View>
          <Button title="Save Delivery Fees" className="h-[50px]" onPress={() => setDeliveryOpen(false)} />
        </View>
      </BottomSheet>
    </Screen>
  );
}
