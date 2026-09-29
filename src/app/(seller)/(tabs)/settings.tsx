import { Linking, Pressable, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronRight } from 'lucide-react-native';
import { Screen, T, cx } from '@/components/ui';
import { naira } from '@/lib/format';
import { getMe } from '@/api/auth';
import { getStore } from '@/api/store';
import { getWalletBalance } from '@/api/orders';

export default function Settings() {
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

  const suiteRows: Array<{ label: string; value: string; tag?: string; href?: Href }> = [
    { label: 'Frontstore Nina AI Agent', value: 'Active', tag: 'AI 24/7' },
    { label: 'Frontstore Flow (Chat Store)', value: 'WhatsApp Connected' },
    { label: 'Frontstore Pay (Escrow)', value: walletBalance, href: '/payouts' },
    { label: 'Frontstore Reach (Broadcasts)', value: 'Active' },
    { label: 'Frontstore Pulse (Analytics)', value: 'Weekly Ready' },
  ];

  const generalRows: Array<{ label: string; value: string; href?: Href }> = [
    { label: 'Switch to Buyer view', value: userName, href: '/switch' },
    { label: 'WhatsApp Business Number', value: userPhone },
    { label: 'Delivery & Shipping Zones', value: 'Default Zone' },
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
          <Pressable accessibilityRole="button" hitSlop={4} className="h-10 justify-center rounded-full bg-saffron px-3.5">
            <T className="font-sans-bold text-[13px] text-deep">Active</T>
          </Pressable>
        </View>

        <T className="font-sans-bold text-xs tracking-wider text-muted uppercase">Frontstore Suite</T>
        <View className="rounded-[22px] border border-line bg-surface">
          {suiteRows.map((r, i) => (
            <Pressable
              key={r.label}
              accessibilityRole="button"
              onPress={r.href ? () => router.push(r.href as Href) : undefined}
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
              onPress={r.href ? () => router.push(r.href as Href) : undefined}
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
    </Screen>
  );
}
