import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { Star } from 'lucide-react-native';
import { Screen, Swatch, T, cx } from '@/components/ui';
import { AccountHeader } from '@/features/buyer/account';
import { getBuyerReviews } from '@/api/buyer';
import { Review } from '@/api/types';

type Tab = 'to' | 'written';

function Stars({ n, gap = 2 }: { n: number; gap?: number }) {
  return (
    <View accessible accessibilityLabel={n ? `${n} out of 5 stars` : 'Not rated'} style={{ gap }} className="flex-row">
      {[1, 2, 3, 4, 5].map((i) => {
        const c = i <= n ? '#E9A23B' : '#E3DED2';
        return <Star key={i} size={16} color={c} fill={c} strokeWidth={0} />;
      })}
    </View>
  );
}

export default function BuyerMyReviews() {
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('to');

  const { data: liveReviews = [] } = useQuery({ queryKey: ['buyer-reviews'], queryFn: getBuyerReviews });

  const toReviewList: any[] = [];
  const writtenList = liveReviews.map((r) => ({
    store: r.store?.name || 'Store',
    product: r.product?.name || 'Product',
    stars: r.rating,
    date: r.created_at ? new Date(r.created_at).toLocaleDateString() : 'Recently',
    text: r.comment || '',
    reply: r.seller_reply || '',
  }));

  const tabs: [Tab, string, number][] = [['to', 'To review', toReviewList.length], ['written', 'Written', writtenList.length]];

  return (
    <Screen>
      <AccountHeader title="My reviews" />
      <ScrollView contentContainerClassName="gap-3 px-4 pt-2" contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
        <View accessibilityRole="tablist" className="flex-row gap-1 self-start rounded-full bg-sand p-1">
          {tabs.map(([k, label, n]) => {
            const on = k === tab;
            return (
              <Pressable
                key={k}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => setTab(k)}
                className={cx('h-[38px] justify-center rounded-full px-4', on ? 'bg-surface' : 'bg-transparent')}
              >
                <T className="font-sans-bold text-sm">{`${label} · ${n}`}</T>
              </Pressable>
            );
          })}
        </View>

        {tab === 'to' ? (
          <View className="gap-2.5 py-6">
            <T className="text-center text-sm text-muted">No pending items to review.</T>
          </View>
        ) : (
          <View className="gap-2.5">
            {writtenList.length === 0 ? (
              <T className="py-6 text-center text-sm text-muted">No reviews written yet.</T>
            ) : (
              writtenList.map((r, i) => (
                <View key={`${r.product}-${i}`} className="gap-2 rounded-[20px] border border-line bg-surface p-3.5">
                  <View className="flex-row items-center justify-between gap-2">
                    <View className="flex-1">
                      <T className="font-sans-bold text-[15px]">{r.product}</T>
                      <T className="text-xs text-muted">{r.store} · {r.date}</T>
                    </View>
                    <Stars n={r.stars} />
                  </View>
                  {r.text ? <T className="text-sm leading-[21px] text-[#33403A]">{r.text}</T> : null}
                  {r.reply ? (
                    <View className="rounded-xl bg-bg px-3 py-2.5">
                      <T className="font-sans-bold text-[13px] leading-[19px]">{r.store} replied</T>
                      <T className="text-[13px] leading-[19px]">{r.reply}</T>
                    </View>
                  ) : null}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
