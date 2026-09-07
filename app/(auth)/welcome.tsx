import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  ShoppingBag,
  TrendingUp,
  Wallet,
  LucideIcon,
  ArrowRight,
  Zap,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';

const { height } = Dimensions.get('window');


const FEATURES: { icon: LucideIcon; label: string; caption: string; color: string; bg: string }[] = [
  { icon: ShoppingBag, label: 'Catalog', caption: 'Manage inventory', color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' },
  { icon: TrendingUp, label: 'Analytics', caption: 'Real-time data', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
  { icon: Wallet, label: 'Wallet', caption: 'Instant payouts', color: '#A78BFA', bg: 'rgba(167,139,250,0.12)' },
];

const STATS = [
  { value: '10K+', label: 'Merchants' },
  { value: '₦2B+', label: 'Processed' },
  { value: '99.9%', label: 'Uptime' },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // Staggered entrance animations
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(-10);

  const heroOpacity = useSharedValue(0);
  const heroY = useSharedValue(20);

  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.92);
  const cardY = useSharedValue(30);

  const statsOpacity = useSharedValue(0);
  const statsY = useSharedValue(16);

  const featuresOpacity = useSharedValue(0);
  const featuresY = useSharedValue(16);

  const ctaOpacity = useSharedValue(0);
  const ctaY = useSharedValue(24);

  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);

    logoOpacity.value = withDelay(50, withTiming(1, { duration: 500, easing: easeOut }));
    logoY.value = withDelay(50, withTiming(0, { duration: 500, easing: easeOut }));

    heroOpacity.value = withDelay(200, withTiming(1, { duration: 600, easing: easeOut }));
    heroY.value = withDelay(200, withTiming(0, { duration: 600, easing: easeOut }));

    cardOpacity.value = withDelay(350, withTiming(1, { duration: 700, easing: easeOut }));
    cardScale.value = withDelay(350, withSpring(1, { damping: 14, stiffness: 100 }));
    cardY.value = withDelay(350, withTiming(0, { duration: 700, easing: easeOut }));

    statsOpacity.value = withDelay(550, withTiming(1, { duration: 500, easing: easeOut }));
    statsY.value = withDelay(550, withTiming(0, { duration: 500, easing: easeOut }));

    featuresOpacity.value = withDelay(650, withTiming(1, { duration: 500, easing: easeOut }));
    featuresY.value = withDelay(650, withTiming(0, { duration: 500, easing: easeOut }));

    ctaOpacity.value = withDelay(800, withTiming(1, { duration: 600, easing: easeOut }));
    ctaY.value = withDelay(800, withTiming(0, { duration: 600, easing: easeOut }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({ opacity: logoOpacity.value, transform: [{ translateY: logoY.value }] }));
  const heroStyle = useAnimatedStyle(() => ({ opacity: heroOpacity.value, transform: [{ translateY: heroY.value }] }));
  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }, { scale: cardScale.value }],
  }));
  const statsStyle = useAnimatedStyle(() => ({ opacity: statsOpacity.value, transform: [{ translateY: statsY.value }] }));
  const featuresStyle = useAnimatedStyle(() => ({ opacity: featuresOpacity.value, transform: [{ translateY: featuresY.value }] }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value, transform: [{ translateY: ctaY.value }] }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Full-screen aurora background */}
      <Image
        source={require('../../assets/welcome_bg.png')}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
      />

      {/* Dark overlay to ensure text legibility */}
      <LinearGradient
        colors={['rgba(3,8,16,0.55)', 'rgba(3,8,16,0.15)', 'rgba(3,8,16,0.82)', 'rgba(3,8,16,0.98)']}
        locations={[0, 0.25, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.safe, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>

        {/* ── LOGO ── */}
        <Animated.View style={[styles.header, logoStyle]}>
          <View style={styles.logoRow}>
            <View style={styles.logoIconWrap}>
              <Image source={require('../../assets/logo.png')} style={styles.logoImage} contentFit="cover" />
            </View>
            <Text style={styles.logoText}>frontstore</Text>
          </View>
          <View style={styles.badgePill}>
            <View style={styles.badgeDot} />
            <Text style={styles.badgeText}>Merchant App</Text>
          </View>
        </Animated.View>

        {/* ── HERO COPY ── */}
        <Animated.View style={[styles.heroSection, heroStyle]}>
          <View style={styles.kickerRow}>
            <Zap size={11} color="#22C55E" fill="#22C55E" />
            <Text style={styles.kicker}>FOR MERCHANTS</Text>
          </View>
          <Text style={styles.headline}>
            Run your store.{'\n'}
            <Text style={styles.headlineAccent}>From anywhere.</Text>
          </Text>
          <Text style={styles.subheadline}>
            Catalog, orders, analytics & payouts — all in one powerful app built for African merchants.
          </Text>
        </Animated.View>

        {/* ── HERO DASHBOARD ILLUSTRATION (PNG) ── */}
        <Animated.View style={[styles.illustrationWrapper, cardStyle]}>
          <Image
            source={require('../../assets/dashboard_mock.png')}
            style={styles.illustrationImage}
            contentFit="contain"
          />
        </Animated.View>

        {/* ── STATS ROW ── */}
        <Animated.View style={[styles.statsRow, statsStyle]}>
          {STATS.map((s, i) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
              {i < STATS.length - 1 && <View style={styles.statDivider} />}
            </View>
          ))}
        </Animated.View>

        {/* ── FEATURE PILLS ── */}
        <Animated.View style={[styles.featuresRow, featuresStyle]}>
          {FEATURES.map((f) => (
            <View key={f.label} style={[styles.featurePill, { backgroundColor: f.bg }]}>
              <f.icon size={13} color={f.color} strokeWidth={2.2} />
              <Text style={[styles.featurePillLabel, { color: f.color }]}>{f.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── CTA BUTTONS ── */}
        <Animated.View style={[styles.ctaSection, ctaStyle]}>
          {/* Primary */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(auth)/otp-login' as any);
            }}
            style={styles.primaryBtnWrapper}
          >
            <LinearGradient
              colors={['#0D9E6E', '#22C55E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryBtn}
            >
              <Text style={styles.primaryBtnLabel}>Get Started</Text>
              <View style={styles.primaryBtnArrow}>
                <ArrowRight size={18} color="#fff" strokeWidth={2.5} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Secondary */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/sign-in');
            }}
            style={styles.secondaryBtn}
          >
            <Text style={styles.secondaryBtnLabel}>Sign in with Password</Text>
          </TouchableOpacity>

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text>
            {' '}and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030810',
  },
  safe: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // ── Header / Logo ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    overflow: 'hidden',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
  },
  logoImage: {
    width: 32,
    height: 32,
  },
  logoText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 19,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(20,184,166,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(20,184,166,0.3)',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  badgeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#14B8A6',
  },
  badgeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: '#14B8A6',
    letterSpacing: 0.3,
  },

  // ── Hero Section ──
  heroSection: {
    marginBottom: 18,
  },
  kickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 10,
  },
  kicker: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: '#22C55E',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  headline: {
    fontFamily: FontFamily.headingBold,
    fontSize: 34,
    lineHeight: 40,
    color: '#FFFFFF',
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  headlineAccent: {
    color: '#22C55E',
  },
  subheadline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.52)',
  },

  // ── Hero Illustration (PNG) ──
  illustrationWrapper: {
    width: '100%',
    height: height * 0.28,
    borderRadius: 22,
    overflow: 'hidden',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(3, 8, 16, 0.6)',
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.15)',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },

  // ── Stats ──
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 0,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    position: 'relative',
  },
  statValue: {
    fontFamily: FontFamily.headingBold,
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  statLabel: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
  },
  statDivider: {
    position: 'absolute',
    right: 0,
    top: '15%',
    height: '70%',
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },

  // ── Feature Pills ──
  featuresRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  featurePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  featurePillLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 12,
  },

  // ── CTA ──
  ctaSection: {
    gap: 10,
  },
  primaryBtnWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#22C55E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  primaryBtnLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  primaryBtnArrow: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  secondaryBtnLabel: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  terms: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10.5,
    color: 'rgba(255,255,255,0.28)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 2,
  },
  termsLink: {
    color: 'rgba(255,255,255,0.5)',
    textDecorationLine: 'underline',
  },
});
