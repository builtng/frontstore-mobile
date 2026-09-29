import { useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Share as ShareIcon } from 'lucide-react-native';
import { Screen, T, cx } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, ChipRow, useTileWidth } from '@/features/buyer/parts';
import { getPublicStore, toggleFollowStore } from '@/api/buyer';

export default function BuyerStore() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const tile = useTileWidth();
  const queryClient = useQueryClient();

  const { data: liveData } = useQuery({
    queryKey: ['public-store', slug],
    queryFn: () => getPublicStore(slug!),
    enabled: !!slug,
  });

  const storeObj = liveData?.store;
  const liveProducts = liveData?.products || [];

  const storeName = storeObj?.name || slug || 'Store';
  const storeInitial = storeName[0] || 'S';
  const storeColor = storeObj?.primary_color || '#0F172A';
  const storeBio = storeObj?.store_bio || '';
  const storeLocation = storeObj?.location || '';
  const storeId = storeObj?.id;

  const [following, setFollowing] = useState(false);
  const [cat, setCat] = useState('All');
  const [cart, setCart] = useState<Record<string, number>>({});

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
    cat: p.category || 'General',
  }));

  const cats = ['All', ...Array.from(new Set(itemsList.map((i) => i.cat)))];
  const shown = itemsList.filter((i) => cat === 'All' || i.cat === cat);
  const count = Object.values(cart).reduce((a, b) => a + b, 0);
  const total = itemsList.reduce((sum, i) => sum + (i.price ?? 0) * (cart[i.id] ?? 0), 0);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/shop'));
  const share = () => Share.share({ message: `${storeName} on Frontstore: https://frontstore.ng/${slug}` }).catch(() => {});
  const meta = storeLocation ? `★ 5.0 · ${storeLocation}` : '★ 5.0';

  return (
    <Screen className="bg-surface-2">
      <View className="flex-row items-center justify-between px-2 pb-1">
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={back} className="h-11 w-11 items-center justify-center">
          <ChevronLeft size={24} color="#0E1A15" strokeWidth={2} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Share store" onPress={share} className="h-11 w-11 items-center justify-center">
          <ShareIcon size={20} color="#0E1A15" strokeWidth={2} />
        </Pressable>
      </View>

      <ScrollView contentContainerClassName="pb-6" showsVerticalScrollIndicator={false}>
        <View className="gap-2.5 px-4">
          <View className="flex-row items-center gap-3.5">
            <Avatar initial={storeInitial} color={storeColor} size={64} radius={20} fontSize={26} />
            <View className="flex-1 gap-0.5">
              <T className="font-display-x text-[22px]">{storeName}</T>
              <T className="text-[13px] text-muted-2">{meta}</T>
            </View>
          </View>
          <T className="text-sm leading-[21px] text-muted-2">{storeBio}</T>
          <View className="flex-row gap-2">
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ selected: following }}
              accessibilityLabel={following ? `Following ${storeName}, tap to unfollow` : `Follow ${storeName}`}
              onPress={handleToggleFollow}
              className={cx('h-11 flex-1 items-center justify-center rounded-full', following ? 'border border-line-2 bg-surface' : 'bg-ink')}
            >
              <T className={cx('font-sans-bold text-[15px]', following ? 'text-ink' : 'text-white')}>{following ? 'Following' : 'Follow'}</T>
            </Pressable>
            <Pressable accessibilityRole="button" className="h-11 flex-1 items-center justify-center rounded-full border border-line-2 bg-surface">
              <T className="font-sans-bold text-[15px]">Reviews</T>
            </Pressable>
          </View>
        </View>

        <ChipRow options={cats} value={cat} onChange={setCat} bordered="border-line-2" className="pt-4" contentPadding />

        <View className="flex-row flex-wrap gap-x-3 gap-y-4 px-4 pt-3.5">
          {shown.map((p) => {
            const q = cart[p.id] ?? 0;
            return (
              <View key={p.id} style={{ width: tile }} className="gap-1.5">
                <View style={{ backgroundColor: p.color }} className="h-[140px] rounded-2xl" />
                <T className="font-sans-bold text-sm">{p.name}</T>
                <View className="flex-row items-center justify-between">
                  <T className="font-sans-bold text-sm">{naira(p.price)}</T>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={q ? `Add another ${p.name}, ${q} in cart` : `Add ${p.name}`}
                    onPress={() => setCart((c) => ({ ...c, [p.id]: q + 1 }))}
                    style={q ? { backgroundColor: storeColor } : undefined}
                    className={cx('h-10 min-w-[44px] items-center justify-center rounded-full px-2.5', !q && 'border-[1.5px] border-ink bg-surface')}
                  >
                    <T className={cx('font-sans-bold text-sm', q ? 'text-white' : 'text-ink')}>{q ? `${q} in cart` : '+ Add'}</T>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {count > 0 ? (
        <View style={{ paddingBottom: Math.max(insets.bottom, 12) }} className="px-3 pt-2">
          <View className="flex-row items-center justify-between rounded-full bg-ink py-2.5 pl-[18px] pr-2.5">
            <View>
              <T className="text-xs text-on-dark-2">{count} items</T>
              <T className="font-sans-bold text-base text-white">{naira(total)}</T>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`Checkout, ${count} items, ${naira(total)}`} className="h-[46px] justify-center rounded-full bg-green px-5">
              <T className="font-sans-bold text-[15px] text-white">Checkout</T>
            </Pressable>
          </View>
        </View>
      ) : null}
    </Screen>
  );
}
