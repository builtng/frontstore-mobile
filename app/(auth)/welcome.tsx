import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  ShoppingBag,
  BarChart2,
  Wallet,
  LucideIcon,
  TrendingUp,
  Package,
  Bell,
} from 'lucide-react-native';
import { Image } from 'expo-image';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing, Shadow } from '@/constants/spacing';

const { width } = Dimensions.get('window');

const FEATURES: { icon: LucideIcon; label: string; caption: string }[] = [
  { icon: ShoppingBag, label: 'Catalog', caption: 'Manage products & inventory' },
  { icon: TrendingUp, label: 'Analytics', caption: 'Real-time sales data' },
  { icon: Wallet, label: 'Wallet', caption: 'Instant payouts & earnings' },
];

export default function WelcomeScreen() {
  const router = useRouter();

  const fade = useSharedValue(0);
  const rise = useSharedValue(14);

  useEffect(() => {
    fade.value = withTiming(1, { duration: 550, easing: Easing.out(Easing.cubic) });
    rise.value = withTiming(0, { duration: 550, easing: Easing.out(Easing.cubic) });
  }, []);

  const entranceStyle = useAnimatedStyle(() => ({
    opacity: fade.value,
    transform: [{ translateY: rise.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <LinearGradient
        colors={['#020C1B', '#071A2E']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.glow} />

      <SafeAreaView style={styles.safe}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <Image source={require('../../assets/logo.png')} style={styles.logoImage} />
            <Text style={styles.logoText}>frontstore</Text>
          </View>
        </View>

        {/* Hero + Dashboard Mock */}
        <View style={styles.content}>
          <Text style={styles.kicker}>For Merchants</Text>
          <Text style={styles.headline}>Manage your business{'\n'}from anywhere.</Text>
          <Text style={styles.subheadline}>
            Control your catalog, track orders, view real-time analytics, and withdraw
            earnings — all in one place.
          </Text>

          {/* Merchant dashboard preview mock card */}
          <Animated.View style={[styles.mockCard, entranceStyle]}>
            {/* Mock header */}
            <View style={styles.mockHeader}>
              <View>
                <Text style={styles.mockGreeting}>Good morning 👋</Text>
                <Text style={styles.mockStoreName}>Chidi's Fashion Hub</Text>
              </View>
              <View style={styles.mockBellWrap}>
                <Bell size={14} color={Colors.teal} />
                <View style={styles.mockNotifDot} />
              </View>
            </View>

            {/* Revenue strip */}
            <LinearGradient
              colors={['#128C7E', '#25D366']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.mockRevenue}
            >
              <View>
                <Text style={styles.mockRevenueLabel}>Today's Revenue</Text>
                <Text style={styles.mockRevenueAmount}>₦128,500</Text>
              </View>
              <View style={styles.mockRevenueStats}>
                {[
                  { label: 'Orders', value: '14' },
                  { label: 'Pending', value: '3' },
                ].map((s) => (
                  <View key={s.label} style={styles.mockRevenueStat}>
                    <Text style={styles.mockRevenueStatVal}>{s.value}</Text>
                    <Text style={styles.mockRevenueStatLabel}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </LinearGradient>

            {/* Recent order row */}
            <View style={styles.mockOrderRow}>
              <View style={[styles.mockOrderIcon, { backgroundColor: 'rgba(100,255,218,0.1)' }]}>
                <Package size={13} color={Colors.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mockOrderTitle}>Ankara Dress — Size M</Text>
                <Text style={styles.mockOrderSub}>Order #1042 · Adaeze Obi</Text>
              </View>
              <View style={styles.mockOrderBadge}>
                <Text style={styles.mockOrderBadgeText}>New</Text>
              </View>
            </View>

            {/* Fulfillment sparkline placeholder */}
            <View style={styles.mockChartRow}>
              {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
                <View
                  key={i}
                  style={[
                    styles.mockBar,
                    {
                      height: h * 0.55,
                      backgroundColor: i === 5
                        ? Colors.teal
                        : 'rgba(100,255,218,0.25)',
                    },
                  ]}
                />
              ))}
            </View>
          </Animated.View>

          {/* Feature strip */}
          <View style={styles.featureRow}>
            {FEATURES.map((feature) => (
              <View key={feature.label} style={styles.featureItem}>
                <feature.icon size={18} color={Colors.teal} />
                <Text style={styles.featureLabel}>{feature.label}</Text>
                <Text style={styles.featureCaption}>{feature.caption}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom CTA */}
        <View style={styles.bottomSection}>
          <Text style={styles.socialProof}>
            Trusted by <Text style={styles.socialProofStrong}>10,000+ merchants</Text> across Africa
          </Text>

          {/* Primary CTA — OTP login (email or phone) */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(auth)/otp-login' as any);
            }}
            style={styles.ctaButtonWrapper}
          >
            <LinearGradient
              colors={[Colors.primary, '#25D366']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <BarChart2 size={20} color="#FFFFFF" />
              <Text style={styles.ctaButtonLabel}>Get Started</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary — password login */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/sign-in');
            }}
            style={styles.secondaryCtaButton}
          >
            <Text style={styles.secondaryCtaButtonLabel}>Continue with Password</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  safe: {
    flex: 1,
    paddingHorizontal: Spacing[6],
    justifyContent: 'space-between',
  },

  glow: {
    position: 'absolute',
    top: -width * 0.35,
    left: -width * 0.05,
    width: width * 1.1,
    height: width * 1.1,
    borderRadius: 9999,
    backgroundColor: 'rgba(100, 255, 218, 0.05)',
  },

  // Header
  header: {
    paddingTop: Spacing[4],
    alignItems: 'center',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  logoImage: {
    width: 28,
    height: 28,
    borderRadius: Radius.sm,
  },
  logoText: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    color: Colors.white,
    letterSpacing: -0.5,
  },

  // Hero content
  content: {
    width: '100%',
  },
  kicker: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs - 1,
    color: 'rgba(100, 255, 218, 0.75)',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing[3],
  },
  headline: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['3xl'],
    lineHeight: FontSize['3xl'] * 1.15,
    color: Colors.white,
    letterSpacing: -0.6,
    marginBottom: Spacing[3],
  },
  subheadline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.55)',
    marginBottom: Spacing[5],
  },

  // Dashboard mock card
  mockCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    ...Shadow.md,
  },
  mockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  mockGreeting: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs - 1,
    color: 'rgba(255,255,255,0.45)',
  },
  mockStoreName: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  mockBellWrap: {
    width: 28,
    height: 28,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(100,255,218,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mockNotifDot: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.danger,
  },

  // Revenue strip
  mockRevenue: {
    borderRadius: Radius.md,
    padding: Spacing[3],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  mockRevenueLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs - 1,
    color: 'rgba(255,255,255,0.7)',
  },
  mockRevenueAmount: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    color: Colors.white,
    letterSpacing: -0.5,
  },
  mockRevenueStats: {
    flexDirection: 'row',
    gap: Spacing[4],
  },
  mockRevenueStat: {
    alignItems: 'center',
  },
  mockRevenueStatVal: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.lg,
    color: Colors.white,
  },
  mockRevenueStatLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs - 1,
    color: 'rgba(255,255,255,0.6)',
  },

  // Order row
  mockOrderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: Radius.md,
    padding: Spacing[3],
  },
  mockOrderIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockOrderTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.xs,
    color: Colors.white,
  },
  mockOrderSub: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs - 2,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 1,
  },
  mockOrderBadge: {
    backgroundColor: 'rgba(100,255,218,0.12)',
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(100,255,218,0.3)',
  },
  mockOrderBadgeText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs - 3,
    color: Colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },

  // Chart row
  mockChartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
    height: 36,
    paddingTop: Spacing[2],
  },
  mockBar: {
    flex: 1,
    borderRadius: 3,
  },

  // Feature strip
  featureRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing[5],
    paddingTop: Spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  featureItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  featureLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
    marginTop: 2,
  },
  featureCaption: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs - 2,
    color: 'rgba(255, 255, 255, 0.4)',
    textAlign: 'center',
  },

  // Bottom action layout
  bottomSection: {
    width: '100%',
    paddingBottom: Spacing[6],
    gap: Spacing[4],
  },
  socialProof: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
  },
  socialProofStrong: {
    fontFamily: FontFamily.bodyBold,
    color: Colors.teal,
  },
  ctaButtonWrapper: {
    width: '100%',
    borderRadius: Radius.lg,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[4],
    minHeight: 56,
  },
  ctaButtonLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.base,
    color: Colors.white,
  },
  secondaryCtaButton: {
    width: '100%',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    marginTop: Spacing[2],
  },
  secondaryCtaButtonLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.base,
    color: '#FFFFFF',
  },
  terms: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs - 1,
    color: 'rgba(255, 255, 255, 0.35)',
    textAlign: 'center',
    lineHeight: 16,
  },
  termsLink: {
    color: 'rgba(255, 255, 255, 0.55)',
    textDecorationLine: 'underline',
  },
});
