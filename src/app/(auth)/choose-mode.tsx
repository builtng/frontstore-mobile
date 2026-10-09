import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomBar, Heading } from '@/features/setup/parts';
import { setUserMode } from '@/api/authStore';
import { updateDraft } from '@/features/setup/draft';

type Mode = 'shop' | 'sell';

const OPTIONS: Array<{ id: Mode; title: string; body: string; color: string; icon: string }> = [
  { id: 'shop', title: 'I want to shop', body: 'Discover Nigerian stores, pay safely and track every order in one place.', color: '#C8553D', icon: 'M6 3h12l1 18H5zM9 7a3 3 0 0 0 6 0' },
  { id: 'sell', title: 'I want to sell', body: 'Open your store in minutes, get paid online and manage orders from your phone.', color: '#0B6E4F', icon: 'M3 9l1.5-5h15L21 9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v8h14v-8' },
];

export default function ChooseMode() {
  const [mode, setMode] = useState<Mode>('sell');
  const { setup_token } = useLocalSearchParams<{ setup_token?: string }>();

  const onContinue = async () => {
    await setUserMode(mode === 'shop' ? 'buyer' : 'seller');
    if (mode === 'shop') {
      router.replace('/shop');
    } else {
      if (setup_token) {
        updateDraft({ setup_token });
      }
      router.replace({
        pathname: '/store-name',
        params: setup_token ? { setup_token } : undefined,
      });
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-5 px-5 pt-8 pb-4">
        <Heading title="What brings you to Frontstore?" sub="One account for both. You can switch any time from your profile." />
        <View accessibilityRole="radiogroup" className="gap-5">
          {OPTIONS.map((o) => {
            const on = o.id === mode;
            return (
              <Pressable
                key={o.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                accessibilityLabel={o.title}
                accessibilityHint={o.body}
                onPress={() => setMode(o.id)}
                className={cx('gap-3.5 rounded-3xl bg-surface p-5', on ? 'border-2 border-ink' : 'border border-line')}
              >
                <View className="flex-row items-center justify-between">
                  <View style={{ backgroundColor: o.color }} className="h-[52px] w-[52px] items-center justify-center rounded-2xl">
                    <Glyph d={o.icon} />
                  </View>
                  <View
                    style={{ borderWidth: on ? 7 : 1.5, borderColor: on ? '#0B6E4F' : '#B9B1A0' }}
                    className="h-6 w-6 rounded-full"
                  />
                </View>
                <View className="gap-1">
                  <T className="font-display text-[20px]">{o.title}</T>
                  <T className="text-sm leading-[21px] text-muted-2">{o.body}</T>
                </View>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <BottomBar>
        <Button title="Continue" onPress={onContinue} />
      </BottomBar>
    </Screen>
  );
}

/** Icon paths straight from the design. */
function Glyph({ d }: { d: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  );
}
