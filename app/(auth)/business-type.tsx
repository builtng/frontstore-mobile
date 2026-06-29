import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore, BusinessType } from '@/stores/onboardingStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const BUSINESS_TYPES: { type: BusinessType; label: string; emoji: string; desc: string }[] = [
  { type: 'physical', label: 'Physical Products', emoji: '📦', desc: 'Goods, merchandise, retail items' },
  { type: 'digital', label: 'Digital Products', emoji: '💾', desc: 'E-books, courses, templates' },
  { type: 'services', label: 'Services', emoji: '🛠️', desc: 'Freelance, consulting, repairs' },
  { type: 'fashion', label: 'Fashion', emoji: '👗', desc: 'Clothing, shoes, accessories' },
  { type: 'food', label: 'Food & Beverage', emoji: '🍜', desc: 'Restaurant, cloud kitchen, snacks' },
  { type: 'beauty', label: 'Beauty & Wellness', emoji: '💅', desc: 'Cosmetics, skincare, spa' },
  { type: 'electronics', label: 'Electronics', emoji: '📱', desc: 'Gadgets, phones, computers' },
  { type: 'creator', label: 'Creator & Media', emoji: '🎨', desc: 'Art, music, content, subscriptions' },
  { type: 'other', label: 'Other', emoji: '✨', desc: 'Something else entirely' },
];

const BusinessTypeCard = ({
  item,
  selected,
  onPress,
}: {
  item: typeof BUSINESS_TYPES[0];
  selected: boolean;
  onPress: () => void;
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handlePress = () => {
    scale.value = withSpring(0.96, { damping: 15 }, () => {
      scale.value = withSpring(1, { damping: 15 });
    });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={1}>
      <Animated.View
        style={[
          styles.typeCard,
          {
            backgroundColor: selected ? Colors.primaryDim : theme.card,
            borderColor: selected ? Colors.primary : theme.border,
            borderWidth: selected ? 2 : 1.5,
          },
          !selected && (Shadow.sm as any),
        ]}
      >
        <Text style={styles.emoji}>{item.emoji}</Text>
        <View style={styles.typeInfo}>
          <Text style={[styles.typeName, { color: selected ? Colors.primary : theme.text }]}>
            {item.label}
          </Text>
          <Text style={[styles.typeDesc, { color: theme.textTertiary }]}>{item.desc}</Text>
        </View>
        {selected && (
          <View style={styles.checkCircle}>
            <Check size={14} color={Colors.white} strokeWidth={3} />
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

export default function BusinessTypeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const haptics = useHaptics();
  const { businessType, setBusinessType } = useOnboardingStore();

  const handleSelect = (type: BusinessType) => {
    haptics.selection();
    setBusinessType(type);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { width: '20%' }]} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.step, { color: Colors.primary }]}>Step 1 of 8</Text>
          <Text style={[styles.title, { color: theme.text }]}>What do you sell?</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            This helps us personalise your store experience
          </Text>
        </View>

        <View style={styles.grid}>
          {BUSINESS_TYPES.map((item) => (
            <BusinessTypeCard
              key={item.type}
              item={item}
              selected={businessType === item.type}
              onPress={() => handleSelect(item.type)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <Button
          title="Continue"
          onPress={() => businessType && router.push('/(auth)/store-setup')}
          disabled={!businessType}
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
  header: { marginBottom: Spacing[7] },
  step: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: Spacing[2] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8, marginBottom: Spacing[2] },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },
  grid: { gap: Spacing[3] },
  typeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing[4],
    borderRadius: Radius.lg,
    gap: Spacing[3],
  },
  emoji: { fontSize: 28 },
  typeInfo: { flex: 1 },
  typeName: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base, marginBottom: 2 },
  typeDesc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, lineHeight: 16 },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[5],
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
});
