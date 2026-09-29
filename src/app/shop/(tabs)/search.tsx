import { useRef, useState } from 'react';
import { Keyboard, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Link } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react-native';
import { Screen, T, cx } from '@/components/ui';
import { naira } from '@/lib/format';
import { Avatar, ChipRow, FollowPill, useTileWidth } from '@/features/buyer/parts';
import { getMarketplaceStores } from '@/api/buyer';

const FILTERS = ['All', 'Stores', 'Under ₦20k', 'Lagos'];

export default function BuyerSearch() {
  const [q, setQ] = useState('');
  const [focused, setFocused] = useState(false);
  const [filter, setFilter] = useState('All');
  const input = useRef<TextInput>(null);
  const tile = useTileWidth();

  const { data: stores = [] } = useQuery({
    queryKey: ['marketplace-search', q, filter],
    queryFn: () => getMarketplaceStores({ search: q, category: filter === 'All' || filter === 'Stores' ? undefined : filter }),
  });

  const cancel = () => {
    setQ('');
    input.current?.blur();
    Keyboard.dismiss();
  };

  return (
    <Screen>
      <View className="gap-3.5 px-4 pt-3">
        <View className={cx('h-[50px] flex-row items-center gap-2.5 rounded-[14px] border-[1.5px] bg-surface pl-3.5 pr-3', focused || q ? 'border-green' : 'border-line')}>
          <Search size={18} color="#5B6660" strokeWidth={2} />
          <TextInput
            ref={input}
            value={q}
            onChangeText={setQ}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search stores and products"
            placeholderTextColor="#8A928E"
            accessibilityLabel="Search"
            returnKeyType="search"
            autoCorrect={false}
            className="h-full min-w-0 flex-1 font-sans text-base text-ink"
          />
          {focused || q ? (
            <Pressable accessibilityRole="button" onPress={cancel} hitSlop={12}>
              <T className="font-sans-bold text-sm text-green">Cancel</T>
            </Pressable>
          ) : null}
        </View>
        <ChipRow options={FILTERS} value={filter} onChange={setFilter} px={12} />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" contentContainerClassName="gap-3.5 px-4 pb-6 pt-3.5">
        {stores.length ? (
          <>
            <T className="mt-1 font-sans-bold text-[15px] text-muted-2">Stores ({stores.length})</T>
            {stores.map((s) => (
              <Link key={s.slug || s.id} href={`/shop/store/${s.slug}`} asChild>
                <Pressable accessibilityRole="link" accessibilityLabel={s.name} className="flex-row items-center gap-3 rounded-[18px] border border-line bg-surface p-3">
                  <Avatar initial={s.name?.[0] ?? 'S'} color={s.primary_color ?? '#0B6E4F'} />
                  <View className="flex-1">
                    <T className="font-sans-bold text-base">{s.name}</T>
                    <T className="text-[13px] text-muted">{s.location || 'Nigeria'}</T>
                  </View>
                </Pressable>
              </Link>
            ))}
          </>
        ) : (
          <View className="items-center gap-1 pt-16">
            <T className="font-display text-lg">No results{q ? ` for “${q.trim()}”` : ''}</T>
            <T className="text-center text-sm text-muted">Try another search term or filter.</T>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}
