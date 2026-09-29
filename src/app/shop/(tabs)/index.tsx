import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, Search } from 'lucide-react-native';
import { Screen, T, cx } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, ChipRow, useTileWidth } from '@/features/buyer/parts';
import { getMe } from '@/api/auth';
import { getMarketplaceStores, getBuyerOrders } from '@/api/buyer';

const CATS = ['For you', 'Fashion', 'Food', 'Beauty', 'Gadgets'];

export default function BuyerHome() {
  const [cat, setCat] = useState('For you');
  const tile = useTileWidth();

  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: liveStores = [] } = useQuery({ queryKey: ['marketplace-stores'], queryFn: () => getMarketplaceStores() });
  const { data: orders = [] } = useQuery({ queryKey: ['buyer-orders'], queryFn: getBuyerOrders });

  const activeOrder = orders.find((o) => o.order_status === 'paid' || o.order_status === 'shipped');

  const user = me?.user;
  const userName = user?.name ? user.name.split(' ')[0] : 'Customer';
  const userInitials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase() : 'FS';

  const filteredStores = liveStores.filter((s) => cat === 'For you' || s.category === cat || s.category_label === cat);

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-3.5 px-4 pb-6 pt-3" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between">
          <View>
            <T className="text-[13px] text-muted">Delivering to Nigeria</T>
            <T className="font-display-x text-[26px] tracking-[-0.5px]">Hi {userName}</T>
          </View>
          <Link href="/switch?from=shop" asChild>
            <Pressable accessibilityRole="button" accessibilityLabel="Switch account" className="h-11 flex-row items-center gap-1.5 rounded-full border border-line bg-surface pl-1 pr-1.5">
              <View className="h-[34px] w-[34px] items-center justify-center rounded-full bg-ink">
                <T className="font-sans-bold text-xs text-white">{userInitials}</T>
              </View>
              <ChevronDown size={14} color="#4A524E" strokeWidth={2} />
            </Pressable>
          </Link>
        </View>

        <Link href="/shop/search" asChild>
          <Pressable accessibilityRole="search" className="h-12 flex-row items-center gap-2.5 rounded-[14px] border border-line bg-surface px-3.5">
            <Search size={18} color="#5B6660" strokeWidth={2} />
            <T className="text-[15px] text-muted">Search stores and products</T>
          </Pressable>
        </Link>

        {activeOrder ? (
          <Link href={`/shop/track/${activeOrder.id}`} asChild>
            <Pressable accessibilityRole="button" accessibilityLabel={`Track order ${activeOrder.id}`} className="flex-row items-center gap-3 rounded-[20px] bg-ink p-3.5">
              <Avatar initial={activeOrder.store?.name?.[0] ?? 'S'} color="#8E4A5E" size={44} radius={12} fontSize={16} />
              <View className="flex-1 gap-1.5">
                <T className="text-sm text-bg">
                  <T className="font-sans-bold text-sm text-bg">{activeOrder.order_status === 'shipped' ? 'Out for delivery' : 'Processing'}</T> · {activeOrder.store?.name ?? 'Store'}
                </T>
                <View className="flex-row gap-1">
                  {[0, 1, 2, 3].map((i) => (
                    <View key={i} className={cx('h-1 flex-1 rounded-full', i < (activeOrder.order_status === 'shipped' ? 3 : 1) ? 'bg-leaf' : 'bg-[#33504A]')} />
                  ))}
                </View>
              </View>
              <T className="font-sans-bold text-[13px] text-gold">Track</T>
            </Pressable>
          </Link>
        ) : null}

        <ChipRow options={CATS} value={cat} onChange={setCat} />

        <View className="flex-row items-baseline justify-between">
          <T className="font-sans-bold text-[17px]">Stores on Frontstore</T>
          <Link href="/shop/saved" asChild>
            <Pressable accessibilityRole="link" hitSlop={12}>
              <T className="font-sans-bold text-[13px] text-green">See all</T>
            </Pressable>
          </Link>
        </View>

        {filteredStores.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="grow-0" contentContainerClassName="gap-3">
            {filteredStores.map((s, i) => (
              <Link key={s.slug || String(s.id)} href={`/shop/store/${s.slug}`} asChild>
                <Pressable accessibilityRole="link" accessibilityLabel={s.name} className="w-[72px] items-center gap-1.5">
                  <View className={cx('rounded-[24px] border-2 p-0.5', i === 0 ? 'border-green' : 'border-transparent')}>
                    <Avatar initial={s.name?.[0] ?? 'S'} color={s.primary_color ?? '#0B6E4F'} size={64} radius={20} fontSize={22} />
                  </View>
                  <T numberOfLines={1} className="text-center font-sans-semibold text-xs">{s.name}</T>
                </Pressable>
              </Link>
            ))}
          </ScrollView>
        ) : (
          <T className="text-sm text-muted">No stores found for {cat.toLowerCase()}.</T>
        )}

        <Link href="/switch?from=shop" asChild>
          <Pressable accessibilityRole="button" className="mt-4 flex-row items-center gap-3 rounded-[20px] border border-line bg-mint p-4">
            <View className="flex-1">
              <T className="font-sans-bold text-[15px]">Got something to sell?</T>
              <T className="text-[13px] text-muted-2">Open your own Frontstore in minutes.</T>
            </View>
            <T className="font-sans-bold text-[13px] text-green">Start selling</T>
          </Pressable>
        </Link>
      </ScrollView>
    </Screen>
  );
}
