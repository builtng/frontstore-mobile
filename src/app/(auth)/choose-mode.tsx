import { useEffect, useState } from 'react';
import { ActivityIndicator, BackHandler, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import Svg, { Path } from 'react-native-svg';
import { ArrowRight } from 'lucide-react-native';
import { LogoMark, Screen, T, cx } from '@/components/ui';
import { setUserMode } from '@/api/authStore';
import { completeBuyerSetup } from '@/api/auth';
import { updateDraft, useDraft } from '@/features/setup/draft';
import { C } from '@/lib/theme';

type Mode = 'shop' | 'sell';

const OPTIONS: Array<{ id: Mode; title: string; body: string; cta: string; icon: string }> = [
  { id: 'shop', title: 'I want to shop', body: 'Discover Nigerian stores, pay safely and track every order.', cta: 'Start browsing', icon: 'M6 3h12l1 18H5zM9 7a3 3 0 0 0 6 0' },
  { id: 'sell', title: 'I want to sell', body: 'Open a free store in minutes and get paid online.', cta: 'Create my store', icon: 'M3 9l1.5-5h15L21 9M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M5 12v8h14v-8' },
];

export default function ChooseMode() {
  const params = useLocalSearchParams<{ setup_token?: string; initial_mode?: Mode }>();
  const draft = useDraft();
  const activeToken = params.setup_token || draft.setup_token;

  const [mode, setMode] = useState<Mode>(params.initial_mode === 'shop' ? 'shop' : 'sell');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeToken) {
      updateDraft({ setup_token: activeToken });
    }
  }, [activeToken]);

  const onContinue = async (picked: Mode) => {
    if (loading) return;
    setMode(picked);
    setLoading(true);
    try {
      await setUserMode(picked === 'shop' ? 'buyer' : 'seller');
      if (picked === 'shop') {
        if (activeToken) {
          try {
            await completeBuyerSetup({ setup_token: activeToken });
          } catch (setupErr) {
            console.warn('completeBuyerSetup warning:', setupErr);
          }
        }
        router.replace({
          pathname: '/shop',
          params: {
            from_onboarding: '1',
            setup_token: activeToken || '',
          },
        });
      } else {
        if (activeToken) {
          updateDraft({ setup_token: activeToken });
        }
        router.replace({
          pathname: '/store-name',
          params: activeToken ? { setup_token: activeToken } : undefined,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-3.5 px-5 pt-[30px] pb-10">
        <View className="flex-row items-center gap-2">
          <LogoMark size={32} />
          <T className="font-display text-xl">frontstore</T>
        </View>
        <T accessibilityRole="header" className="mt-[26px] font-display-x text-[32px] leading-[35px] tracking-[-0.64px]">What brings you here?</T>
        <T className="mb-2 text-base text-muted">You can switch any time from your profile.</T>
        {OPTIONS.map((o) => {
          const sell = o.id === 'sell';
          const busy = loading && mode === o.id;
          return (
            <Pressable
              key={o.id}
              accessibilityRole="button"
              accessibilityLabel={o.title}
              accessibilityHint={o.body}
              disabled={loading}
              onPress={() => onContinue(o.id)}
              className={cx('gap-3 rounded-[26px] p-[22px]', sell ? 'bg-green' : 'border border-line bg-surface', loading && !busy && 'opacity-50')}
            >
              <View className={cx('h-14 w-14 items-center justify-center rounded-[18px]', sell ? 'bg-white/15' : 'bg-warn-bg')}>
                <Glyph d={o.icon} color={sell ? '#FFFFFF' : '#C8553D'} />
              </View>
              <T className={cx('font-display text-[22px]', sell && 'text-white')}>{o.title}</T>
              <T className={cx('text-[15px] leading-[22px]', sell ? 'text-mint-2' : 'text-muted')}>{o.body}</T>
              <View className="flex-row items-center gap-1.5">
                {busy ? <ActivityIndicator size="small" color={sell ? '#F3C77A' : C.accent} /> : null}
                <T className={cx('font-sans-bold text-sm', sell ? 'text-gold' : 'text-accent')}>{o.cta}</T>
                <ArrowRight size={16} color={sell ? '#F3C77A' : C.accent} strokeWidth={2.2} />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

/** Icon paths straight from the design. */
function Glyph({ d, color }: { d: string; color: string }) {
  return (
    <Svg width={26} height={26} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.9} strokeLinecap="round" strokeLinejoin="round">
      <Path d={d} />
    </Svg>
  );
}
