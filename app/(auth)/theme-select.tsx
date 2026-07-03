import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore, StoreTheme } from '@/stores/onboardingStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - Spacing[6] * 2 - Spacing[4]) / 2;

const THEMES: {
  id: StoreTheme;
  name: string;
  tagline: string;
  colors: string[];
  bg: string;
}[] = [
  { id: 'modern', name: 'Modern', tagline: 'Clean & bold', colors: ['#128C7E', '#0A192F', '#FFFFFF'], bg: '#F8F9FA' },
  { id: 'minimal', name: 'Minimal', tagline: 'Pure simplicity', colors: ['#1A1A1A', '#FFFFFF', '#F5F5F5'], bg: '#FFFFFF' },
  { id: 'luxury', name: 'Luxury', tagline: 'Premium feel', colors: ['#B8860B', '#1A0A00', '#FAF6F0'], bg: '#1A0A00' },
  { id: 'creator', name: 'Creator', tagline: 'Vibrant energy', colors: ['#FF6B6B', '#4ECDC4', '#FFFFFF'], bg: '#FFF8F0' },
  { id: 'fashion', name: 'Fashion', tagline: 'Editorial style', colors: ['#E91E8C', '#1A1A2E', '#FFFFFF'], bg: '#FAFAFA' },
  { id: 'restaurant', name: 'Restaurant', tagline: 'Warm & inviting', colors: ['#E65100', '#1B0000', '#FFF8F0'], bg: '#1B0000' },
];

const ThemeCard = ({
  t,
  selected,
  onPress,
}: {
  t: typeof THEMES[0];
  selected: boolean;
  onPress: () => void;
}) => {
  const { theme: appTheme } = useTheme();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <View
        style={[
          styles.themeCard,
          {
            borderColor: selected ? Colors.primary : appTheme.border,
            borderWidth: selected ? 2.5 : 1.5,
          },
          !selected && (Shadow.sm as any),
        ]}
      >
        {/* Theme preview mockup */}
        <View style={[styles.previewArea, { backgroundColor: t.bg }]}>
          {/* Fake header */}
          <View style={[styles.fakeHeader, { backgroundColor: t.colors[0] }]}>
            <View style={styles.fakeLogo} />
            <View style={styles.fakeNav}>
              {[1, 2, 3].map((i) => (
                <View key={i} style={[styles.fakeNavDot, { backgroundColor: 'rgba(255,255,255,0.5)' }]} />
              ))}
            </View>
          </View>
          {/* Fake hero */}
          <View style={[styles.fakeHero, { backgroundColor: t.colors[1] + '22' }]}>
            <View style={[styles.fakeTitle, { backgroundColor: t.colors[1] + '55', width: '70%' }]} />
            <View style={[styles.fakeTitle, { backgroundColor: t.colors[1] + '33', width: '50%', height: 6 }]} />
            <View style={[styles.fakeBtn, { backgroundColor: t.colors[0] }]} />
          </View>
          {/* Color swatches */}
          <View style={styles.swatches}>
            {t.colors.map((c, i) => (
              <View key={i} style={[styles.swatch, { backgroundColor: c, borderColor: '#00000020', borderWidth: 1 }]} />
            ))}
          </View>
        </View>

        {/* Info */}
        <View style={[styles.themeInfo, { backgroundColor: appTheme.card }]}>
          <View>
            <Text style={[styles.themeName, { color: selected ? Colors.primary : appTheme.text }]}>
              {t.name}
            </Text>
            <Text style={[styles.themeTagline, { color: appTheme.textTertiary }]}>{t.tagline}</Text>
          </View>
          {selected && (
            <View style={[styles.check, { backgroundColor: Colors.primary }]}>
              <Check size={12} color={Colors.white} strokeWidth={3} />
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function ThemeSelectScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const haptics = useHaptics();
  const { selectedTheme, setTheme } = useOnboardingStore();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { width: '60%' }]} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.step, { color: Colors.primary }]}>Step 4 of 8</Text>
          <Text style={[styles.title, { color: theme.text }]}>Choose your theme</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Your theme sets the look and feel of your storefront
          </Text>
        </View>

        <View style={styles.grid}>
          {THEMES.map((t) => (
            <ThemeCard
              key={t.id}
              t={t}
              selected={selectedTheme === t.id}
              onPress={() => { haptics.selection(); setTheme(t.id); }}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <Button
          title="Continue"
          onPress={() => router.push('/(auth)/connect-payments')}
          disabled={!selectedTheme}
          size="xl"
          icon={<ArrowRight size={20} color={Colors.white} />}
          iconPosition="right"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  progressTrack: { height: 3 },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[4] },
  back: { marginTop: Spacing[4], marginBottom: Spacing[6], width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: Spacing[6] },
  step: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: Spacing[2] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8, marginBottom: Spacing[2] },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[4] },
  themeCard: {
    width: CARD_WIDTH,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  previewArea: { height: 140, padding: Spacing[2] },
  fakeHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing[2], borderRadius: Radius.sm, marginBottom: Spacing[2] },
  fakeLogo: { width: 20, height: 8, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.7)' },
  fakeNav: { flexDirection: 'row', gap: 4 },
  fakeNavDot: { width: 16, height: 4, borderRadius: 2 },
  fakeHero: { borderRadius: Radius.sm, padding: Spacing[2], gap: 5, alignItems: 'flex-start' },
  fakeTitle: { height: 8, borderRadius: 2 },
  fakeBtn: { width: 40, height: 14, borderRadius: 4, marginTop: 2 },
  swatches: { flexDirection: 'row', gap: 4, marginTop: Spacing[2] },
  swatch: { width: 16, height: 16, borderRadius: 8 },
  themeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing[3],
  },
  themeName: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  themeTagline: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 1 },
  check: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  footer: { paddingHorizontal: Spacing[6], paddingVertical: Spacing[5] },
});
