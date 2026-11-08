import { Image, Pressable, ScrollView, View } from 'react-native';
import { Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomBar, Heading, Progress, StepHeader } from '@/features/setup/parts';
import { initialOf, toSlug, updateDraft, useDraft } from '@/features/setup/draft';
import { C } from '@/lib/theme';

const SWATCHES: Array<[string, string]> = [
  ['Terracotta', '#C8553D'], ['Forest', '#1E5E3A'], ['Indigo', '#2F5D8A'], ['Plum', '#7B3F61'], ['Ochre', '#8A5A12'], ['Ink', '#0E1A15'],
];
const CATS = ['Fashion', 'Food', 'Beauty', 'Gadgets', 'Home', 'Other'];

export default function StoreStyle() {
  const { name, color, category, logo_uri } = useDraft();

  const pickLogo = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.8 });
    if (!res.canceled && res.assets?.[0]) updateDraft({ logo_uri: res.assets[0].uri });
  };

  return (
    <Screen>
      <StepHeader fallback="/store-name" label="4 of 5" right={{ title: 'Skip', href: '/payout' }} />
      <Progress pct={80} />
      <ScrollView contentContainerClassName="gap-[18px] px-5 pt-[22px] pb-6">
        <Heading title="Pick your look" sub="Choose what you sell and a colour. We set up the rest." />

        <View accessibilityRole="radiogroup" accessibilityLabel="What do you sell?" className="flex-row flex-wrap gap-2">
          {CATS.map((c) => {
            const on = c === category;
            return (
              <Pressable
                key={c}
                accessibilityRole="radio"
                accessibilityState={{ checked: on }}
                onPress={() => updateDraft({ category: c })}
                className={cx('h-[42px] justify-center rounded-full border-[1.5px] px-4', on ? 'border-green bg-mint' : 'border-line bg-surface')}
              >
                <T className={cx('font-sans-bold text-sm', on ? 'text-accent' : 'text-ink')}>{c}</T>
              </Pressable>
            );
          })}
        </View>

        <View accessibilityRole="radiogroup" accessibilityLabel="Brand colour" className="flex-row flex-wrap gap-2.5">
          {SWATCHES.map(([label, hex]) => {
            const on = hex === color;
            return (
              <Pressable
                key={hex}
                accessibilityRole="radio"
                accessibilityLabel={label}
                accessibilityState={{ checked: on }}
                onPress={() => updateDraft({ color: hex })}
                style={{ backgroundColor: hex, borderColor: on ? C.ink : '#FFFFFF' }}
                className="h-11 w-11 rounded-full border-[3px]"
              />
            );
          })}
        </View>

        {/* Live preview of the storefront; tap the logo to add your own. */}
        <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
          <View style={{ backgroundColor: color }} className="h-[70px]" />
          <View className="gap-2.5 px-4 pb-4">
            <View className="-mt-[26px] self-start">
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={logo_uri ? 'Change logo' : 'Add logo'}
                onPress={pickLogo}
                className="h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-2xl border-4 border-surface bg-panel"
              >
                {logo_uri ? (
                  <Image source={{ uri: logo_uri }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <T className="font-display-x text-base text-white">{initialOf(name)}</T>
                )}
              </Pressable>
              <View pointerEvents="none" className="absolute -bottom-1 -right-1 h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-green">
                <Camera size={11} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </View>
            <View>
              <T numberOfLines={1} className="font-display text-[17px]">{name.trim() || 'Your store'}</T>
              <T numberOfLines={1} className="text-[13px] text-muted">frontstore.app/{toSlug(name) || 'yourstore'}</T>
            </View>
            <View className="flex-row gap-2">
              {['#F2E6D4', '#E3E9F2', '#EDE7F1'].map((c) => <View key={c} style={{ backgroundColor: c }} className="h-[66px] flex-1 rounded-xl" />)}
            </View>
            <View style={{ backgroundColor: color }} className="h-[38px] items-center justify-center rounded-xl">
              <T className="font-sans-bold text-[13px] text-white">Shop {(category || 'Other').toLowerCase()}</T>
            </View>
          </View>
        </View>
      </ScrollView>
      <BottomBar>
        <Button title="Continue" href="/payout" />
      </BottomBar>
    </Screen>
  );
}
