import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import {
  ArrowRight,
  Sparkles,
  Zap,
  MessageCircle,
  ShoppingBag,
  ShieldCheck,
  TrendingUp,
  ChevronRight,
  LucideIcon,
} from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily, FontSize } from '@/constants/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  badge: string;
  badgeIcon: LucideIcon;
  headline: string;
  headlineAccent: string;
  subheadline: string;
  image: any;
  metricLabel: string;
  metricHighlight: string;
  accentColor: string;
  accentBg: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'slide-1',
    badge: 'INSTANT STOREFRONT',
    badgeIcon: Zap,
    headline: 'Build your dream store\n',
    headlineAccent: 'in under 2 minutes.',
    subheadline:
      'Turn your products into a high-converting digital storefront. Zero coding, zero agency fees, instantaneous setup.',
    image: require('../../assets/website-designer-illustration-concept_1150-39366.png'),
    metricLabel: 'Setup Time',
    metricHighlight: '< 120 Seconds',
    accentColor: '#10B981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
  },
  {
    id: 'slide-2',
    badge: 'SOCIAL COMMERCE',
    badgeIcon: MessageCircle,
    headline: 'Sell directly where\n',
    headlineAccent: 'your customers browse.',
    subheadline:
      'Transform WhatsApp chats, Instagram DMs, and social links into automated checkouts with mobile-first storefronts.',
    image: require('../../assets/pngtree-mobile-shopping-concept-with-giant-mobile-phone-png-image_5356739.png'),
    metricLabel: 'Channel Reach',
    metricHighlight: 'WhatsApp & Socials',
    accentColor: '#22C55E',
    accentBg: 'rgba(34, 197, 94, 0.12)',
  },
  {
    id: 'slide-3',
    badge: 'BUYER EXPERIENCE',
    badgeIcon: ShoppingBag,
    headline: 'Delight your shoppers,\n',
    headlineAccent: 'ignite repeat orders.',
    subheadline:
      'Offer frictionless browsing, lightning-fast product loading, and one-tap checkout that turns visitors into lifelong customers.',
    image: require('../../assets/pngtree-female-customers-shopping-online-vector-design-png-image_5347768.png'),
    metricLabel: 'Checkout Velocity',
    metricHighlight: '3.4x Conversion',
    accentColor: '#14B8A6',
    accentBg: 'rgba(20, 184, 166, 0.12)',
  },
  {
    id: 'slide-4',
    badge: 'PAYMENTS & LOGISTICS',
    badgeIcon: ShieldCheck,
    headline: 'Get paid instantly,\n',
    headlineAccent: 'dispatch with ease.',
    subheadline:
      'Accept bank cards, instant transfers, and mobile money securely. Track orders and manage delivery straight from your pocket.',
    image: require('../../assets/the-couple-goes-shopping-chart-in-a-mobile-online-shop-illustration-svg-download-png-4254817.webp'),
    metricLabel: 'Settlement Speed',
    metricHighlight: 'Instant Payouts',
    accentColor: '#38BDF8',
    accentBg: 'rgba(56, 189, 248, 0.12)',
  },
  {
    id: 'slide-5',
    badge: 'EXECUTIVE INTELLIGENCE',
    badgeIcon: TrendingUp,
    headline: 'Command your entire\n',
    headlineAccent: 'commerce empire.',
    subheadline:
      'Live revenue analytics, inventory tracking, and merchant capital tools. Everything you need to scale profitably.',
    image: require('../../assets/dashboard_mock.png'),
    metricLabel: 'Platform Volume',
    metricHighlight: '₦2B+ Processed',
    accentColor: '#A78BFA',
    accentBg: 'rgba(167, 139, 250, 0.12)',
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Header and controls animation values
  const headerOpacity = useSharedValue(0);
  const headerY = useSharedValue(-12);
  const footerOpacity = useSharedValue(0);
  const footerY = useSharedValue(20);

  useEffect(() => {
    const easeOut = Easing.out(Easing.cubic);
    headerOpacity.value = withDelay(100, withTiming(1, { duration: 500, easing: easeOut }));
    headerY.value = withDelay(100, withTiming(0, { duration: 500, easing: easeOut }));

    footerOpacity.value = withDelay(300, withTiming(1, { duration: 600, easing: easeOut }));
    footerY.value = withDelay(300, withTiming(0, { duration: 600, easing: easeOut }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
    transform: [{ translateY: footerY.value }],
  }));

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    if (index !== activeIndex && index >= 0 && index < ONBOARDING_SLIDES.length) {
      setActiveIndex(index);
      Haptics.selectionAsync();
    }
  };

  const handleNext = () => {
    if (activeIndex < ONBOARDING_SLIDES.length - 1) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      flatListRef.current?.scrollToIndex({
        index: activeIndex + 1,
        animated: true,
      });
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    flatListRef.current?.scrollToIndex({
      index: ONBOARDING_SLIDES.length - 1,
      animated: true,
    });
  };

  const handleGetStarted = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/(auth)/otp-login' as any);
  };

  const handleSignIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/(auth)/sign-in');
  };

  const isLastSlide = activeIndex === ONBOARDING_SLIDES.length - 1;
  const currentSlide = ONBOARDING_SLIDES[activeIndex];

  // Dynamic image container height responsive to screen size
  const illustrationHeight = Math.min(SCREEN_HEIGHT * 0.35, 300);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Subtle executive ambient glow - NO background noise or box */}
      <View style={styles.ambientGlowContainer} pointerEvents="none">
        <LinearGradient
          colors={['rgba(16, 185, 129, 0.08)', 'rgba(6, 78, 59, 0.03)', 'transparent']}
          style={styles.ambientTopGlow}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </View>

      <View
        style={[
          styles.safeContainer,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 14),
            paddingBottom: Math.max(insets.bottom, 12),
          },
        ]}
      >
        {/* ── TOP NAV / BRAND HEADER ── */}
        <Animated.View style={[styles.topNav, headerStyle]}>
          <View style={styles.brandRow}>
            <View style={styles.brandLogoWrap}>
              <Image
                source={require('../../assets/logo.png')}
                style={styles.brandLogoImage}
                contentFit="contain"
              />
            </View>
            <View>
              <Text style={styles.brandName}>frontstore</Text>
            </View>
            <View style={styles.brandBadge}>
              <View style={styles.badgePulseDot} />
              <Text style={styles.badgeLabel}>Merchant OS</Text>
            </View>
          </View>

          {/* Skip CTA if not on final slide */}
          {!isLastSlide ? (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleSkip}
              style={styles.skipBtn}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.skipBtnText}>Skip</Text>
              <ChevronRight size={14} color="rgba(255, 255, 255, 0.45)" strokeWidth={2.2} />
            </TouchableOpacity>
          ) : (
            <View style={styles.slideCounterPill}>
              <Text style={styles.slideCounterText}>5 of 5</Text>
            </View>
          )}
        </Animated.View>

        {/* ── SWIPEABLE ONBOARDING CAROUSEL ── */}
        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          renderItem={({ item }) => {
            const BadgeIcon = item.badgeIcon;
            return (
              <View style={styles.slide}>
                {/* 100% CLEAN HERO ILLUSTRATION - ZERO BACKGROUND */}
                <View style={[styles.illustrationFrame, { height: illustrationHeight }]}>
                  <Image
                    source={item.image}
                    style={styles.illustrationImage}
                    contentFit="contain"
                    priority="high"
                    cachePolicy="memory-disk"
                  />
                </View>

                {/* SLIDE CONTENT AREA */}
                <View style={styles.slideContent}>
                  {/* Category Pill + Metric Pill */}
                  <View style={styles.metaRow}>
                    <View style={[styles.categoryPill, { backgroundColor: item.accentBg }]}>
                      <BadgeIcon size={12} color={item.accentColor} strokeWidth={2.5} />
                      <Text style={[styles.categoryPillText, { color: item.accentColor }]}>
                        {item.badge}
                      </Text>
                    </View>

                    <View style={styles.statChip}>
                      <Sparkles size={11} color="#10B981" strokeWidth={2} />
                      <Text style={styles.statChipText}>{item.metricHighlight}</Text>
                    </View>
                  </View>

                  {/* Headline */}
                  <Text style={styles.headline}>
                    {item.headline}
                    <Text style={[styles.headlineAccent, { color: item.accentColor }]}>
                      {item.headlineAccent}
                    </Text>
                  </Text>

                  {/* Subheadline Copy */}
                  <Text style={styles.subheadline}>{item.subheadline}</Text>
                </View>
              </View>
            );
          }}
        />

        {/* ── FOOTER CONTROLS ── */}
        <Animated.View style={[styles.footer, footerStyle]}>
          {/* Pagination Indicator Pills */}
          <View style={styles.paginationRow}>
            {ONBOARDING_SLIDES.map((slide, idx) => {
              const isActive = idx === activeIndex;
              return (
                <TouchableOpacity
                  key={slide.id}
                  onPress={() => {
                    Haptics.selectionAsync();
                    flatListRef.current?.scrollToIndex({ index: idx, animated: true });
                  }}
                  activeOpacity={0.8}
                  style={[
                    styles.pageDot,
                    isActive && styles.pageDotActive,
                    isActive && { backgroundColor: slide.accentColor },
                  ]}
                />
              );
            })}
          </View>

          {/* CTA Actions */}
          <View style={styles.ctaGroup}>
            {/* Primary Action Button */}
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={handleNext}
              style={styles.primaryBtnOuter}
            >
              <LinearGradient
                colors={
                  isLastSlide
                    ? ['#059669', '#10B981', '#34D399']
                    : ['#0D9488', '#10B981']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.primaryBtn}
              >
                <Text style={styles.primaryBtnText}>
                  {isLastSlide ? 'Get Started Free' : 'Continue'}
                </Text>
                <View style={styles.primaryBtnIconCircle}>
                  <ArrowRight size={17} color="#FFFFFF" strokeWidth={2.6} />
                </View>
              </LinearGradient>
            </TouchableOpacity>

            {/* Secondary Action - Sign In (Clean Minimalist Glass) */}
            <TouchableOpacity
              activeOpacity={0.78}
              onPress={handleSignIn}
              style={styles.secondaryBtn}
            >
              <Text style={styles.secondaryBtnText}>
                Already have an account? <Text style={styles.secondaryBtnLink}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Regulatory & Trust Statement */}
          <Text style={styles.legalDisclaimer}>
            By continuing, you agree to Frontstore's{' '}
            <Text style={styles.legalLink}>Terms</Text> and{' '}
            <Text style={styles.legalLink}>Privacy Policy</Text>.
          </Text>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030712', // Deep luxury slate black
  },
  ambientGlowContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  ambientTopGlow: {
    width: '100%',
    height: SCREEN_HEIGHT * 0.45,
  },
  safeContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // ── Top Navigation ──
  topNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    marginBottom: 6,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  brandLogoWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandLogoImage: {
    width: 24,
    height: 24,
  },
  brandName: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: '#F9FAFB',
    letterSpacing: -0.5,
  },
  brandBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginLeft: 3,
  },
  badgePulseDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  badgeLabel: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.3,
  },
  skipBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  skipBtnText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  slideCounterPill: {
    paddingVertical: 4,
    paddingHorizontal: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  slideCounterText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 11,
    color: '#10B981',
  },

  // ── Slide Layout ──
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationFrame: {
    width: SCREEN_WIDTH - 48,
    alignItems: 'center',
    justifyContent: 'center',
    // Zero background, zero border, zero box
    backgroundColor: 'transparent',
    marginBottom: 16,
  },
  illustrationImage: {
    width: '100%',
    height: '100%',
  },
  slideContent: {
    width: '100%',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
  },
  categoryPillText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10.5,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statChipText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 10.5,
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.2,
  },
  headline: {
    fontFamily: FontFamily.headingBold,
    fontSize: 28,
    lineHeight: 35,
    color: '#FFFFFF',
    letterSpacing: -0.6,
    marginBottom: 10,
  },
  headlineAccent: {
    color: '#10B981',
  },
  subheadline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 14.5,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.62)',
    letterSpacing: -0.1,
  },

  // ── Footer Controls ──
  footer: {
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
  },
  paginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginBottom: 4,
  },
  pageDot: {
    height: 4.5,
    width: 14,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  pageDotActive: {
    width: 32,
    backgroundColor: '#10B981',
  },

  // ── CTA Buttons ──
  ctaGroup: {
    gap: 8,
  },
  primaryBtnOuter: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    gap: 10,
  },
  primaryBtnText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.1,
  },
  primaryBtnIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.55)',
  },
  secondaryBtnLink: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#10B981',
  },
  legalDisclaimer: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.32)',
    textAlign: 'center',
    lineHeight: 16,
    marginTop: -2,
  },
  legalLink: {
    color: 'rgba(255, 255, 255, 0.55)',
    textDecorationLine: 'underline',
  },
});
