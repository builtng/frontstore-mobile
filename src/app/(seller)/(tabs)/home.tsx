import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Bell, CheckCircle, Package, Share, Sparkles, Star, Wallet, X } from 'lucide-react-native';
import * as Clipboard from 'expo-clipboard';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomSheet } from '@/features/buyer/account';
import { getMe } from '@/api/auth';
import { getSellerOrders, getWalletBalance } from '@/api/orders';
import { getNotifications, getStore, markNotificationsRead } from '@/api/store';
import type { StoreNotification } from '@/api/types';
import { NINA_LABEL, NinaSheet, ninaState } from '@/features/seller/NinaSheet';
import { formatNaira } from '@/lib/format';
import { openStore, storeLink, storeUrl } from '@/lib/storefront';

function Stat({ label, value, delta, dark }: { label: string; value: string; delta: string; dark?: boolean }) {
  return (
    <View className={cx('flex-1 gap-0.5 rounded-[20px] p-4', dark ? 'bg-green' : 'border border-line bg-surface')}>
      <T className={cx('text-xs', dark ? 'text-[#D7EAE1]' : 'text-muted')}>{label}</T>
      <T className={cx('font-display text-[28px]', dark && 'text-bg')}>{value}</T>
      <T className={cx('font-sans-bold text-xs', dark ? 'text-[#F3D9A8]' : 'text-green')}>{delta}</T>
    </View>
  );
}

function greeting(hour = new Date().getHours()) {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function timeAgo(iso: string | null) {
  if (!iso) return '';
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

const NOTICE_ICON = {
  order: { Icon: CheckCircle, bg: 'bg-[#F3E3C7]', color: '#6B4210' },
  payout: { Icon: Wallet, bg: 'bg-mint', color: '#0B6E4F' },
  review: { Icon: Star, bg: 'bg-[#DCE7F3]', color: '#1F3F66' },
} as const;

export default function Home() {
  const [copied, setCopied] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [ninaOpen, setNinaOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: sellerStore } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });
  const { data: feed } = useQuery({ queryKey: ['notifications'], queryFn: getNotifications });
  const markRead = useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { data: authData } = useQuery({
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
  const username = store?.username || store?.slug || '';
  const link = username ? storeLink(username) : '';
  const ownerName = user?.name ? user.name.split(' ')[0] : '';
  const live = store?.is_active !== false;

  const toShipOrders = ordersData ? ordersData.filter((o) => o.status === 'paid' || o.status === 'packed') : [];
  const balanceKobo = walletData?.available_balance_kobo ?? 0;

  const notices: StoreNotification[] = feed?.items ?? [];
  const unread = feed?.unread ?? 0;
  const needsBank = !!walletData && !walletData.account_number;
  const nina = ninaState(sellerStore);

  const openNotifications = () => {
    setNotificationsOpen(true);
    if (unread > 0) markRead.mutate();
  };
  const openNotice = (n: StoreNotification) => {
    if (!n.url) return;
    setNotificationsOpen(false);
    router.push(n.url as any);
  };

  const copy = async () => {
    await Clipboard.setStringAsync(storeUrl(username));
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-[18px] px-5 pb-8 pt-3">
        <View className="flex-row items-center justify-between">
          <View className="gap-0.5">
            <T className="text-sm text-muted">{greeting()}</T>
            <T className="font-display text-[28px] tracking-[-0.5px]">{ownerName || ' '}</T>
          </View>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Notifications"
              onPress={openNotifications}
              className="h-11 w-11 items-center justify-center rounded-full border border-line bg-surface"
            >
              <Bell size={20} color="#0E1A15" strokeWidth={2} />
              {unread > 0 || needsBank ? <View className="absolute right-[10px] top-[9px] h-2 w-2 rounded-full bg-[#C8553D]" /> : null}
            </Pressable>
            <Link href="/switch" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Switch account" className="h-11 w-11 items-center justify-center rounded-full bg-[#C8553D]">
                <T className="font-sans-bold text-white">{(ownerName || storeName).slice(0, 2).toUpperCase()}</T>
              </Pressable>
            </Link>
          </View>
        </View>

        <View className="gap-4 rounded-[24px] bg-deep p-5">
          <View className="gap-0.5">
            <View className="flex-row items-center gap-1.5">
              <View className={cx('h-[7px] w-[7px] rounded-full', live ? 'bg-leaf' : 'bg-muted')} />
              <T className="text-[13px] text-on-dark-2">{live ? 'Store is live' : 'Store is offline'}</T>
            </View>
            <T className="font-sans-bold text-[17px] text-bg">{link || storeName}</T>
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
            {username ? (
              <Pressable accessibilityRole="button" onPress={() => openStore(username)} className="h-11 justify-center rounded-full border border-[rgba(246,243,236,0.25)] px-4">
                <T className="font-sans-semibold text-sm text-bg">Preview</T>
              </Pressable>
            ) : null}
          </View>
        </View>

        <View className="flex-row gap-3">
          <Stat label="Total Orders" value={String(ordersData?.length ?? 0)} delta={`${ordersData?.length ?? 0} total`} />
          <Stat label="To Ship" value={String(toShipOrders.length)} delta={`${toShipOrders.length} pending`} dark />
          <Stat label="Available" value={formatNaira(balanceKobo / 100)} delta="Paystack" />
        </View>

        {nina ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Nina AI, ${NINA_LABEL[nina]}`}
            onPress={() => setNinaOpen(true)}
            className="flex-row items-center gap-3 rounded-[20px] border border-line bg-surface p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-mint">
              <Sparkles size={20} color="#0B6E4F" />
            </View>
            <View className="flex-1 gap-0.5">
              <T className="font-sans-bold text-[15px]">Nina AI · {NINA_LABEL[nina]}</T>
              <T className="text-xs text-muted-2">
                {nina === 'on'
                  ? 'Answering customers on your WhatsApp'
                  : nina === 'off'
                    ? 'Customers get your catalog link instead'
                    : 'Not included in your current plan'}
              </T>
            </View>
          </Pressable>
        ) : null}

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
            {needsBank ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  setNotificationsOpen(false);
                  router.push('/payout');
                }}
                className="flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-3.5"
              >
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-mint">
                  <Wallet size={18} color="#0B6E4F" />
                </View>
                <View className="flex-1 gap-0.5">
                  <T className="font-sans-bold text-sm">Add a payout account</T>
                  <T className="text-xs text-muted-2">Add your bank account so you can withdraw your sales.</T>
                </View>
              </Pressable>
            ) : null}
            {notices.map((n) => {
              const { Icon, bg, color } = NOTICE_ICON[n.type] ?? NOTICE_ICON.order;
              return (
                <Pressable
                  key={n.id}
                  accessibilityRole={n.url ? 'button' : undefined}
                  disabled={!n.url}
                  onPress={() => openNotice(n)}
                  className="flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-3.5"
                >
                  <View className={cx('h-9 w-9 items-center justify-center rounded-xl', bg)}>
                    <Icon size={18} color={color} />
                  </View>
                  <View className="flex-1 gap-0.5">
                    <T className="font-sans-bold text-sm">{n.title}</T>
                    <T className="text-xs text-muted-2">{n.body}</T>
                    <T className="text-[11px] text-muted">{timeAgo(n.created_at)}</T>
                  </View>
                </Pressable>
              );
            })}
            {!needsBank && notices.length === 0 ? (
              <View className="flex-row items-start gap-3 rounded-2xl border border-line bg-surface p-3.5">
                <View className="h-9 w-9 items-center justify-center rounded-xl bg-mint">
                  <Package size={18} color="#0B6E4F" />
                </View>
                <View className="flex-1 gap-0.5">
                  <T className="font-sans-bold text-sm">You’re all caught up</T>
                  <T className="text-xs text-muted-2">New orders, payouts and reviews will show here.</T>
                </View>
              </View>
            ) : null}
          </View>
          <Button title="Close" className="mt-2 h-11" onPress={() => setNotificationsOpen(false)} />
        </View>
      </BottomSheet>

      <NinaSheet store={sellerStore} visible={ninaOpen} onClose={() => setNinaOpen(false)} />
    </Screen>
  );
}
