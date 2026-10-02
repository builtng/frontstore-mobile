import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Switch, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Bell, CheckCircle, Package, Share, Sparkles, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useQuery } from '@tanstack/react-query';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomSheet } from '@/features/buyer/account';
import { getMe } from '@/api/auth';
import { getSellerOrders, getWalletBalance } from '@/api/orders';
import { formatNaira } from '@/lib/format';

function Stat({ label, value, delta, dark }: { label: string; value: string; delta: string; dark?: boolean }) {
  return (
    <View className={cx('flex-1 gap-0.5 rounded-[20px] p-4', dark ? 'bg-green' : 'border border-line bg-surface')}>
      <T className={cx('text-xs', dark ? 'text-[#D7EAE1]' : 'text-muted')}>{label}</T>
      <T className={cx('font-display text-[28px]', dark && 'text-bg')}>{value}</T>
      <T className={cx('font-sans-bold text-xs', dark ? 'text-[#F3D9A8]' : 'text-green')}>{delta}</T>
    </View>
  );
}

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [ninaOpen, setNinaOpen] = useState(false);
  const [ninaActive, setNinaActive] = useState(true);

  const { data: authData, isLoading: authLoading } = useQuery({
    queryKey: ['me'],
    queryFn: getMe,
  });

  const { data: walletData } = useQuery({
    queryKey: ['wallet'],
    queryFn: getWalletBalance,
  });

  const { data: ordersData } = useQuery({
    queryKey: ['seller-orders'],
    queryFn: () => getSellerOrders(),
  });

  const user = authData?.user;
  const store = authData?.store;
  const storeName = store?.store_name || store?.name || 'My Store';
  const username = store?.username || store?.slug || 'mystore';
  const link = `${username}.frontstore.app`;
  const ownerName = user?.name ? user.name.split(' ')[0] : 'Merchant';

  const toShipOrders = ordersData ? ordersData.filter((o) => o.status === 'paid' || o.status === 'packed') : [];
  const balanceKobo = walletData?.available_balance_kobo ?? 0;

  const copy = async () => {
    await Clipboard.setStringAsync(`https://${link}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-[18px] px-5 pb-8 pt-3">
        <View className="flex-row items-center justify-between">
          <View className="gap-0.5">
            <T className="text-sm text-muted">Good morning</T>
            <T className="font-display text-[28px] tracking-[-0.5px]">{ownerName}</T>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={() => setNotificationsOpen(true)}
              className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface"
            >
              <Bell size={20} color="#0E1A15" strokeWidth={2} />
              <View className="absolute right-[10px] top-[9px] h-2 w-2 rounded-full bg-[#C8553D]" />
            </Pressable>
            <Link href="/switch" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Switch account" className="h-11 w-11 items-center justify-center rounded-full bg-[#C8553D]">
                <T className="font-sans-bold text-white">{ownerName.slice(0, 2).toUpperCase()}</T>
              </Pressable>
            </Link>
          </View>
        </View>

        <View className="gap-4 rounded-[24px] bg-deep p-5">
          <View className="gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <View className="h-[7px] w-[7px] rounded-full bg-leaf" />
              <T className="text-[13px] text-on-dark-2">Store is live</T>
            </View>
            <T className="font-sans-bold text-[17px] text-bg">{link}</T>
          </View>
          <View className="flex-row gap-2">
            <Link href="/share" asChild>
              <Pressable accessibilityRole="button" className="h-11 flex-1 flex-row items-center justify-center gap-1.5 rounded-full bg-saffron">
                <Share size={16} color="#07261C" strokeWidth={2.2} />
                <T className="font-sans-bold text-sm text-deep">Share store</T>
              </Pressable>
            </Link>
            <Pressable accessibilityRole="button" onPress={copy} className="h-11 justify-center rounded-full border border-[rgba(246,243,236,0.25)] px-4">
              <T className="font-sans-semibold text-sm text-bg">{copied ? 'Copied' : 'Copy'}</T>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/shop/store/[slug]', params: { slug: username } })} className="h-11 justify-center rounded-full border border-[rgba(246,243,236,0.25)] px-4">
              <T className="font-sans-semibold text-sm text-bg">Preview</T>
            </Pressable>
          </View>
        </View>

        <View className="flex-row gap-3">
          <Stat label="Total Orders" value={String(ordersData?.length ?? 0)} delta={`${ordersData?.length ?? 0} total`} />
          <Stat label="To Ship" value={String(toShipOrders.length)} delta={`${toShipOrders.length} pending`} dark />
          <Stat label="Available" value={formatNaira(balanceKobo / 100)} delta="Paystack" />
        </View>

        {/* Nina AI Status Banner */}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open Nina AI Agent settings"
          onPress={() => setNinaOpen(true)}
          className="flex-row items-center justify-between rounded-[20px] border border-teal/30 bg-[#0A192F] p-4"
        >
          <View className="flex-1 gap-1">
            <View className="flex-row items-center gap-2">
              <View className={cx('h-2 w-2 rounded-full', ninaActive ? 'bg-[#64FFDA]' : 'bg-muted')} />
              <T className="font-sans-bold text-xs tracking-wider text-[#64FFDA] uppercase">
                {ninaActive ? 'Frontstore Nina AI Active' : 'Frontstore Nina AI Paused'}
              </T>
            </View>
            <T className="font-sans-bold text-sm text-white">
              {ninaActive ? 'Monitoring WhatsApp negotiations 24/7' : 'Nina AI is currently paused'}
            </T>
            <T className="text-xs text-on-dark-2">
              {ninaActive ? 'Auto-closing deals and answering product questions' : 'Tap to enable automatic order taking'}
            </T>
          </View>
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-teal/10">
            <T className="text-lg">⚡</T>
          </View>
        </Pressable>

        <View className="flex-row items-baseline justify-between">
          <T className="font-sans-bold text-lg">To ship</T>
          <Link href="/orders" asChild>
            <Pressable accessibilityRole="link" hitSlop={12}>
              <T className="font-sans-semibold text-sm text-green">See all</T>
            </Pressable>
          </Link>
        </View>
        <View className="gap-2.5">
          {toShipOrders.length > 0 ? (
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
            <View className="rounded-[18px] border border-line bg-surface p-4 items-center">
              <T className="font-sans-medium text-sm text-muted">No pending orders to ship right now.</T>
            </View>
          )}
        </View>

        <Link href="/payouts" asChild>
          <Pressable accessibilityRole="button" className="flex-row items-center justify-between rounded-[20px] bg-ink px-[18px] py-4">
            <View className="gap-0.5">
              <T className="text-xs text-on-dark-2">Frontstore Pay Balance</T>
              <T className="font-display-x text-[22px] text-bg">{formatNaira(balanceKobo / 100)}</T>
            </View>
            <T className="font-sans-bold text-sm text-gold">Payouts →</T>
          </Pressable>
        </Link>
      </ScrollView>

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
            <View className="flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-3.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-mint">
                <Package size={18} color="#0B6E4F" />
              </View>
              <View className="flex-1 gap-0.5">
                <T className="font-sans-bold text-sm">Store is Live & Active</T>
                <T className="text-xs text-muted-2">Your storefront {link} is accepting orders and connected to WhatsApp.</T>
                <T className="text-[11px] text-muted">Just now</T>
              </View>
            </View>

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
            ) : null}

            <View className="flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-3.5">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-[#DCE7F3]">
                <Sparkles size={18} color="#1F3F66" />
              </View>
              <View className="flex-1 gap-0.5">
                <T className="font-sans-bold text-sm">Nina AI Assistant Active</T>
                <T className="text-xs text-muted-2">Answering buyer inquiries and closing transactions on WhatsApp 24/7.</T>
                <T className="text-[11px] text-muted">Yesterday</T>
              </View>
            </View>
          </View>
          <Button title="Close" className="mt-2 h-11" onPress={() => setNotificationsOpen(false)} />
        </View>
      </BottomSheet>

      {/* Nina AI Controls BottomSheet */}
      <BottomSheet visible={ninaOpen} onClose={() => setNinaOpen(false)}>
        <View className="gap-3 py-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Sparkles size={20} color="#0B6E4F" />
              <T className="font-display text-xl">Nina AI Assistant</T>
            </View>
            <Pressable accessibilityRole="button" hitSlop={8} onPress={() => setNinaOpen(false)}>
              <X size={20} color="#0E1A15" />
            </Pressable>
          </View>
          <T className="text-sm leading-[21px] text-muted-2">
            Nina handles WhatsApp chats, checks product stock, answers customer questions, and closes orders automatically.
          </T>

          <View className="flex-row items-center justify-between rounded-2xl border border-line bg-surface p-4">
            <View className="flex-1 pr-3">
              <T className="font-sans-bold text-[15px]">Automated Sales Agent</T>
              <T className="text-xs text-muted-2">Allow Nina to negotiate deals and send payment links</T>
            </View>
            <Switch
              value={ninaActive}
              onValueChange={setNinaActive}
              trackColor={{ false: '#D9D9D9', true: '#22A35A' }}
            />
          </View>

          <View className="rounded-2xl border border-line bg-surface p-4 gap-2">
            <T className="font-sans-bold text-[13px] text-muted uppercase">Capabilities Active</T>
            <T className="text-xs text-deep">✓ 24/7 WhatsApp customer reply</T>
            <T className="text-xs text-deep">✓ Real-time inventory queries</T>
            <T className="text-xs text-deep">✓ Instant order generation &amp; bank transfer instructions</T>
          </View>

          <Button
            title="Save & Done"
            className="mt-1 h-[50px]"
            onPress={() => setNinaOpen(false)}
          />
        </View>
      </BottomSheet>
    </Screen>
  );
}
