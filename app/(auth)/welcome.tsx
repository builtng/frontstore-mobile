import React, { useRef, useState } from 'react';
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
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { ArrowRight } from 'lucide-react-native';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FontFamily } from '@/constants/typography';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface OnboardingSlide {
  id: string;
  title: string;
  subtitle: string;
  image: any;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'slide-1',
    title: 'Your store. Online in minutes.',
    subtitle: 'Create a sleek storefront and start selling right away. No coding required.',
    image: require('../../assets/website-designer-illustration-concept_1150-39366.png'),
  },
  {
    id: 'slide-2',
    title: 'Sell where your buyers are.',
    subtitle: 'Turn WhatsApp chats and social media followers into instant paying customers.',
    image: require('../../assets/pngtree-mobile-shopping-concept-with-giant-mobile-phone-png-image_5356739.png'),
  },
  {
    id: 'slide-3',
    title: 'Effortless shopping experience.',
    subtitle: 'Delight customers with fast browsing, clear catalogs, and one-tap checkout.',
    image: require('../../assets/pngtree-female-customers-shopping-online-vector-design-png-image_5347768.png'),
  },
  {
    id: 'slide-4',
    title: 'Instant payments & fulfillment.',
    subtitle: 'Accept cards, bank transfers, and mobile money securely. Track orders with ease.',
    image: require('../../assets/the-couple-goes-shopping-chart-in-a-mobile-online-shop-illustration-svg-download-png-4254817.webp'),
  },
  {
    id: 'slide-5',
    title: 'Run your business anywhere.',
    subtitle: 'Monitor real-time sales, manage inventory, and get fast payouts from your phone.',
    image: require('../../assets/dashboard_mock.png'),
  },
];

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const flatListRef = useRef<FlatList>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const offset = event.nativeEvent.contentOffset.x;
    const index = Math.round(offset / slideSize);
    if (index !== activeIndex && index >= 0 && index < ONBOARDING_SLIDES.length) {
      setActiveIndex(index);
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
  const illustrationHeight = Math.min(SCREEN_HEIGHT * 0.36, 290);

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      <View
        style={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === 'ios' ? 8 : 16),
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        {/* ── MINIMALIST HEADER ── */}
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/logo.png')}
              style={styles.logoImage}
              contentFit="contain"
            />
            <Text style={styles.logoText}>frontstore</Text>
          </View>

          {!isLastSlide ? (
            <TouchableOpacity
              activeOpacity={0.6}
              onPress={handleSkip}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
          ) : (
            <View style={{ width: 40 }} />
          )}
        </View>

        {/* ── CLEAN CAROUSEL SLIDES ── */}
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
          renderItem={({ item }) => (
            <View style={styles.slide}>
              {/* Floating Illustration with generous breathing room */}
              <View style={[styles.illustrationContainer, { height: illustrationHeight }]}>
                <Image
                  source={item.image}
                  style={styles.illustration}
                  contentFit="contain"
                  priority="high"
                />
              </View>

              {/* Minimalist, focused typography */}
              <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.subtitle}>{item.subtitle}</Text>
              </View>
            </View>
          )}
        />

        {/* ── FOOTER CONTROLS ── */}
        <View style={styles.footer}>
          {/* Subtle pagination dots */}
          <View style={styles.dotsRow}>
            {ONBOARDING_SLIDES.map((slide, idx) => {
              const isActive = idx === activeIndex;
              return (
                <View
                  key={slide.id}
                  style={[
                    styles.dot,
                    isActive && styles.dotActive,
                  ]}
                />
              );
            })}
          </View>

          {/* Clean Primary Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={handleNext}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>
              {isLastSlide ? 'Get Started' : 'Continue'}
            </Text>
            <ArrowRight size={18} color="#FFFFFF" strokeWidth={2.4} />
          </TouchableOpacity>

          {/* Discreet Sign-in link */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleSignIn}
            style={styles.secondaryLink}
          >
            <Text style={styles.secondaryText}>
              Already have an account? <Text style={styles.signInHighlight}>Sign in</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#030712',
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
    paddingVertical: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoImage: {
    width: 26,
    height: 26,
  },
  logoText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 18,
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  skipText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.45)',
  },

  // ── Slide ──
  slide: {
    width: SCREEN_WIDTH,
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustrationContainer: {
    width: SCREEN_WIDTH - 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontFamily: FontFamily.headingBold,
    fontSize: 24,
    lineHeight: 32,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.55)',
    textAlign: 'center',
    maxWidth: 320,
  },

  // ── Footer ──
  footer: {
    paddingHorizontal: 28,
    paddingTop: 12,
    gap: 16,
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 4,
  },
  dot: {
    height: 4,
    width: 12,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  dotActive: {
    width: 24,
    backgroundColor: '#10B981',
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#10B981',
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: 16,
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  secondaryLink: {
    paddingVertical: 4,
  },
  secondaryText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 13.5,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  signInHighlight: {
    fontFamily: FontFamily.bodySemiBold,
    color: '#10B981',
  },
});
