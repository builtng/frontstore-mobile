import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Bot, ArrowRight } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing, Shadow } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

interface NinaCardProps {
  merchantName?: string;
  hint?: string;
}

const DEFAULT_HINTS = [
  'Your store is looking good. Want tips on getting more customers?',
  'Add product images to increase buyer trust and conversions.',
  'Sharing your store link on WhatsApp status can bring in more orders.',
  'Your top-selling products should appear first in your catalog.',
  'Responding to orders quickly builds repeat customers.',
];

export function NinaCard({ merchantName, hint }: NinaCardProps) {
  const router = useRouter();
  const { theme, isDark } = useTheme();

  const displayHint = hint ?? DEFAULT_HINTS[Math.floor(Date.now() / 86400000) % DEFAULT_HINTS.length];

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(merchant)/nina');
  };

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.card }, Shadow.md as any]}
      onPress={handlePress}
      activeOpacity={0.88}
    >
      <LinearGradient
        colors={isDark ? ['#022C22', '#0A3D2E'] : ['#ECFDF5', '#D1FAE5']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.row}>
          <LinearGradient
            colors={['#128C7E', '#25D366']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.avatar}
          >
            <Bot size={18} color={Colors.white} strokeWidth={2} />
          </LinearGradient>

          <View style={styles.body}>
            <View style={styles.nameRow}>
              <Text style={[styles.name, { color: Colors.primary }]}>Nina</Text>
              <View style={styles.liveDot} />
            </View>
            <Text style={[styles.hint, { color: theme.text }]} numberOfLines={2}>
              {displayHint}
            </Text>
          </View>

          <View style={[styles.arrowWrap, { backgroundColor: Colors.primary + '18' }]}>
            <ArrowRight size={16} color={Colors.primary} strokeWidth={2.5} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  gradient: {
    padding: Spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  name: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.sm,
    letterSpacing: -0.2,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  hint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    lineHeight: 17,
  },
  arrowWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
