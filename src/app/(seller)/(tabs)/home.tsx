import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Link, router, type Href } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, Bell, CheckCircle, ChevronRight, Link2, Package, Plus, ReceiptText, Share, Wallet, X } from 'lucide-react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, Screen, Skeleton, T, cx } from '@/components/ui';
import { BottomSheet } from '@/features/buyer/account';
import { IconTile } from '@/features/seller/parts';
import { getMe } from '@/api/auth';
import { getDailyVisits, getSellerOrders, getWalletBalance } from '@/api/orders';
import { getStore } from '@/api/store';
import { getProducts } from '@/api/products';
import { ContactEditSheet } from '@/features/account/ContactEditSheet';
import { PERIODS, PERIOD_LABEL, SALES_ORDER_LIMIT, summarise, visitsFor, type Period } from '@/features/seller/salesStats';
import { formatNaira } from '@/lib/format';
import { WhatsAppIcon } from '@/features/setup/parts';
import { C } from '@/lib/theme';

/** How long ago, in words: "2 hours old". */
function age(iso?: string | null) {
  if (!iso) return '';
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins} min${mins === 1 ? '' : 's'} old`;
  const h = Math.round(mins / 60);
  if (h < 48) return `${h} hour${h === 1 ? '' : 's'} old`;
  return `${Math.round(h / 24)} days old`;
}

const QUICK: Array<{ label: string; href: Href; Icon: typeof Plus }> = [
  { label: 'Add product', href: '/add-product', Icon: Plus },
  { label: 'Share store', href: '/share', Icon: Share },
  { label: 'Payment link', href: '/payment-links', Icon: Link2 },
  { label: 'Invoice', href: '/invoices', Icon: ReceiptText },
];

function NeedRow({ first, tone, Icon, title, sub, href, onOpen }: { first?: boolean; tone: 'green' | 'warn' | 'danger'; Icon: typeof Plus; title: string; sub: string; href: Href; onOpen?: () => void }) {
  const color = { green: C.accent, warn: C['warn-fg'], danger: C.danger }[tone];
  return (
    <Pressable accessibilityRole="button" onPress={() => { onOpen?.(); router.push(href); }} className={cx('flex-row items-center gap-3 px-4 py-3.5', !first && 'border-t border-line')}>
        <IconTile tone={tone}><Icon size={19} color={color} strokeWidth={2} /></IconTile>
        <View className="min-w-0 flex-1 gap-px">
          <T numberOfLines={1} className="font-sans-bold text-[15px]">{title}</T>
          <T numberOfLines={1} className="text-[13px] text-muted">{sub}</T>
        </View>
        <ChevronRight size={18} color={C['faint-2']} strokeWidth={2} />
    </Pressable>
  );
}

export default function Home() {
  const [period, setPeriod] = useState<Period>('today');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [whatsappOpen, setWhatsappOpen] = useState(false);

  const { data: authData, isLoading: authLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: walletData } = useQuery({ queryKey: ['wallet'], queryFn: getWalletBalance });
  // A longer order list than the Orders tab, so sales for 30 days and the 30 before can be added up.
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['seller-sales-orders'],
    queryFn: () => getSellerOrders({ limit: SALES_ORDER_LIMIT }),
  });
  const { data: visits } = useQuery({ queryKey: ['seller-visits'], queryFn: getDailyVisits });
  const { data: sellerStore } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => getProducts() });

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const firstName = (authData?.user?.name || '').trim().split(/\s+/)[0];

  const store = authData?.store;
  const storeName = store?.store_name || store?.name || 'My store';
  const username = store?.username || store?.slug || '';
  const initials = storeName.split(/\s+/).filter(Boolean).slice(0, 2).map((w: string) => w[0]).join('').toUpperCase();
  const needsWhatsapp = !!sellerStore && !sellerStore.whatsapp_phone;

  const sum = summarise(orders ?? [], period);
  const toShip = (orders ?? []).filter((o) => o.status === 'paid' || o.status === 'packed');
  const toPack = (orders ?? []).filter((o) => o.status === 'paid');
  const oldestToPack = toPack.length ? toPack[toPack.length - 1] : null;
  const low = (products ?? []).filter((p) => p.status !== 'hidden' && p.stock_count > 0 && p.stock_count <= 3);
  const soldOut = (products ?? []).filter((p) => p.status !== 'hidden' && p.stock_count <= 0);
  const balanceKobo = walletData?.available_balance_kobo ?? 0;
  const v = visitsFor(visits, period);
  const mini: Array<[string, string]> = [
    ['Orders', String(sum.orders)],
    [v?.label ?? 'Visits', v ? (v.value >= 1000 ? `${(v.value / 1000).toFixed(1)}k` : String(v.value)) : '–'],
    ['To ship', String(toShip.length)],
  ];

  const needs: Array<Parameters<typeof NeedRow>[0]> = [];
  if (toPack.length) needs.push({ tone: 'warn', Icon: Package, title: `${toPack.length} paid order${toPack.length === 1 ? '' : 's'} to pack`, sub: oldestToPack ? `Oldest is ${age(oldestToPack.paid_at || oldestToPack.created_at)}` : '', href: '/orders' });
  if (low.length || soldOut.length) {
    const list = [...soldOut, ...low];
    needs.push({
      tone: 'danger', Icon: AlertTriangle,
      title: soldOut.length ? `${soldOut.length} sold out${low.length ? `, ${low.length} running low` : ''}` : `${low.length} product${low.length === 1 ? '' : 's'} running low`,
      sub: list.slice(0, 2).map((p) => p.name).join(', ') + (list.length > 2 ? ` +${list.length - 2}` : ''),
      href: '/products',
    });
  }
  if (balanceKobo > 0) needs.push({ tone: 'green', Icon: Wallet, title: `${formatNaira(balanceKobo / 100)} ready to withdraw`, sub: 'Paid out next business day, 10am', href: '/payouts' });

  return (
    <Screen>
      <ScrollView contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between px-5 pt-1">
          <View className="min-w-0 flex-1 flex-row items-center gap-3 pr-3">
            <Link href="/switch" asChild>
              <Pressable accessibilityRole="button" accessibilityLabel="Switch account" className="h-11 w-11 items-center justify-center rounded-[14px] bg-terra">
                <T className="font-display-x text-base text-white">{authLoading ? '' : initials}</T>
              </Pressable>
            </Link>
            <View className="min-w-0 flex-1">
              <T numberOfLines={1} className="text-[13px] text-muted">{greeting}{firstName ? `, ${firstName}` : ''}</T>
              {authLoading ? <Skeleton className="mt-1 h-5 w-32" /> : <T numberOfLines={1} className="font-display text-lg">{storeName}</T>}
            </View>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={toShip.length ? `Notifications, ${toShip.length} orders to ship` : 'Notifications'}
            onPress={() => setNotificationsOpen(true)}
            className="h-[42px] w-[42px] items-center justify-center rounded-full border border-line bg-surface"
          >
            <Bell size={20} color={C.ink} strokeWidth={2} />
            {toShip.length > 0 ? <View className="absolute right-2.5 top-[9px] h-2 w-2 rounded-full border-2 border-surface bg-terra" /> : null}
          </Pressable>
        </View>

        <View className="gap-3.5 px-5 pt-4">
          {needsWhatsapp ? (
            <Pressable accessibilityRole="button" onPress={() => setWhatsappOpen(true)} className="flex-row items-center gap-3 rounded-[20px] bg-warn-bg p-4">
              <View className="h-10 w-10 items-center justify-center rounded-xl bg-surface"><WhatsAppIcon size={22} /></View>
              <View className="min-w-0 flex-1 gap-0.5">
                <T className="font-sans-bold text-warn-fg">Add your WhatsApp number</T>
                <T className="text-[13px] text-warn-fg">Get order alerts there, and let buyers message you.</T>
              </View>
              <T className="font-sans-bold text-sm text-warn-fg">Add</T>
            </Pressable>
          ) : null}

          {/* Sales card */}
          <LinearGradient colors={['#1E5E3A', '#164A2D']} start={{ x: 0.2, y: 0.1 }} end={{ x: 0.8, y: 0.9 }} style={{ borderRadius: 24, padding: 18, gap: 14 }}>
            <View className="flex-row items-center justify-between gap-2">
              <T numberOfLines={1} className="shrink text-[13px] text-mint-2">Sales · {PERIOD_LABEL[period]}</T>
              <View accessibilityRole="tablist" className="flex-row gap-0.5 rounded-xl bg-white/10 p-[3px]">
                {PERIODS.map(([val, label]) => {
                  const on = val === period;
                  return (
                    <Pressable key={val} accessibilityRole="tab" accessibilityState={{ selected: on }} onPress={() => setPeriod(val)} className={cx('h-[30px] justify-center rounded-[9px] px-2.5', on && 'bg-white')}>
                      <T className={cx('font-sans-bold text-xs', on ? 'text-[#1E5E3A]' : 'text-white')}>{label}</T>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            <View className="-mt-1.5 gap-1">
              {ordersLoading ? (
                <Skeleton className="my-1.5 h-8 w-36 bg-white/15" />
              ) : (
                <T numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6} className="font-display text-[34px] tracking-[-0.68px] text-white">{formatNaira(sum.salesKobo / 100)}</T>
              )}
              {sum.delta ? <T className="font-sans-bold text-[13px] text-gold">{sum.delta}</T> : null}
            </View>
            <View accessibilityLabel="Sales chart" className="h-16 flex-row items-end gap-1.5">
              {sum.bars.map((h, i) => (
                <View key={i} style={{ height: `${Math.round(h * 100)}%` }} className={cx('flex-1 rounded-md', i === 6 ? 'bg-gold' : 'bg-white/30')} />
              ))}
            </View>
            <View className="flex-row gap-2">
              {mini.map(([l, val]) => (
                <View key={l} className="flex-1 gap-0.5 rounded-[14px] bg-white/10 p-2.5">
                  <T numberOfLines={1} className="text-[11px] text-mint-2">{l}</T>
                  <T numberOfLines={1} className="font-display text-lg text-white">{ordersLoading && l !== 'To ship' && l !== 'Visits' ? '…' : val}</T>
                </View>
              ))}
            </View>
          </LinearGradient>

          {/* Quick actions */}
          <View className="flex-row gap-2">
            {QUICK.map(({ label, href, Icon }) => (
              <Link key={label} href={href} asChild>
                <Pressable accessibilityRole="button" className="flex-1 items-center gap-1.5">
                  <View className="h-14 w-14 items-center justify-center rounded-[18px] border border-line bg-surface">
                    <Icon size={22} color={C.accent} strokeWidth={2} />
                  </View>
                  <T numberOfLines={1} className="text-center font-sans-bold text-xs">{label}</T>
                </Pressable>
              </Link>
            ))}
          </View>

          <View className="flex-row items-baseline justify-between">
            <T className="font-display text-lg">Needs you</T>
            <Link href="/orders" asChild>
              <Pressable accessibilityRole="link" hitSlop={12}><T className="font-sans-bold text-sm text-accent">All orders</T></Pressable>
            </Link>
          </View>
          <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
            {ordersLoading && !orders ? (
              <View className="gap-2 p-4"><Skeleton className="h-4 w-3/5" /><Skeleton className="h-3 w-2/5" /></View>
            ) : needs.length ? (
              needs.map((n, i) => <NeedRow key={n.title} first={i === 0} {...n} />)
            ) : (
              <View className="flex-row items-center gap-3 px-4 py-3.5">
                <IconTile><CheckCircle size={19} color={C.accent} strokeWidth={2} /></IconTile>
                <View className="flex-1 gap-px">
                  <T className="font-sans-bold text-[15px]">You’re all caught up</T>
                  <T className="text-[13px] text-muted">New paid orders and low stock will show here.</T>
                </View>
              </View>
            )}
          </View>

          <Pressable accessibilityRole="button" onPress={() => router.push('/share')} className="flex-row items-center gap-3 rounded-[20px] bg-panel px-4 py-3.5">
            <View className="h-2 w-2 rounded-full bg-leaf" />
            <View className="min-w-0 flex-1">
              <T className="text-xs text-on-dark-2">{store?.is_active === false ? 'Your store is paused' : 'Your store is live'}</T>
              {authLoading ? <Skeleton className="mt-1 h-4 w-40 bg-white/15" /> : <T numberOfLines={1} className="font-sans-bold text-[15px] text-white">frontstore.app/{username}</T>}
            </View>
            <View className="h-[34px] flex-row items-center gap-1.5 rounded-full bg-gold px-3">
              <Share size={14} color="#2A1B05" strokeWidth={2.2} />
              <T className="font-sans-bold text-[13px] text-[#2A1B05]">Share</T>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <ContactEditSheet kind={whatsappOpen ? 'whatsapp' : null} onClose={() => setWhatsappOpen(false)} />

      <BottomSheet visible={notificationsOpen} onClose={() => setNotificationsOpen(false)}>
        <View className="gap-3 py-1">
          <View className="flex-row items-center justify-between">
            <T className="font-display text-xl">Notifications</T>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={() => setNotificationsOpen(false)}>
              <X size={20} color={C.ink} />
            </Pressable>
          </View>
          <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
            {needs.length ? needs.map((n, i) => <NeedRow key={n.title} first={i === 0} {...n} onOpen={() => setNotificationsOpen(false)} />) : (
              <View className="items-center p-4"><T className="text-sm text-muted">You’re all caught up.</T></View>
            )}
          </View>
          <Button title="Close" kind="outline" className="mt-1 h-12" onPress={() => setNotificationsOpen(false)} />
        </View>
      </BottomSheet>
    </Screen>
  );
}
