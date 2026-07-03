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
import Svg, { Path } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { ShoppingBag, ShieldCheck, MessageCircle, LucideIcon } from 'lucide-react-native';
import { Image } from 'expo-image';

import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing, Shadow } from '@/constants/spacing';

const { width } = Dimensions.get('window');

// WhatsApp Brand Icon
const WhatsAppIcon = ({ color = '#FFFFFF', size = 22 }: { color?: string; size?: number }) => {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12.012 2C6.485 2 2 6.484 2 12.011c0 1.767.46 3.427 1.262 4.887L2 22l5.244-1.376A9.972 9.972 0 0012.012 22c5.528 0 10.013-4.484 10.013-10.011C22.025 6.484 17.54 2 12.012 2zm0 18.294c-1.61 0-3.183-.42-4.57-1.22l-.328-.194-3.1 .812.827-3.023-.213-.34a8.232 8.232 0 01-1.264-4.34C3.368 7.237 7.243 3.362 12.012 3.362c4.77 0 8.647 3.875 8.647 8.65 0 4.773-3.877 8.282-8.647 8.282zm4.743-6.495c-.26-.13-1.534-.757-1.77-.843-.238-.087-.41-.13-.583.13-.173.26-.67.843-.82.996-.152.152-.303.173-.563.043a7.086 7.086 0 01-2.09-1.288 7.822 7.822 0 01-1.446-1.8c-.152-.26-.016-.4.113-.53.118-.118.26-.303.39-.454.13-.151.173-.26.26-.433.086-.173.043-.325-.022-.454-.065-.13-.583-1.407-.798-1.927-.21-.506-.42-.437-.583-.445l-.497-.008c-.173 0-.455.065-.692.325-.238.26-.908.887-.908 2.164 0 1.277.93 2.51 1.06 2.684.13.173 1.83 2.793 4.433 3.916 2.603 1.122 2.603.748 3.078.705.476-.043 1.533-.627 1.75-1.233.216-.606.216-1.125.151-1.233-.065-.108-.238-.173-.497-.303z"
        fill={color}
      />
    </Svg>
  );
};

const FEATURES: { icon: LucideIcon; label: string; caption: string }[] = [
  { icon: MessageCircle, label: 'Chat', caption: 'Orders over WhatsApp' },
  { icon: ShieldCheck, label: 'Escrow', caption: 'Funds held until delivery' },
  { icon: ShoppingBag, label: 'Nina', caption: 'Your AI sales partner' },
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

        {/* Hero + Product Mock */}
        <View style={styles.content}>
          <Text style={styles.kicker}>Commerce through conversation</Text>
          <Text style={styles.headline}>Turn WhatsApp chats{'\n'}into real sales.</Text>
          <Text style={styles.subheadline}>
            Frontstore runs your catalog, checkout, and secure payments right inside
            the conversation your customers already trust.
          </Text>

          <Animated.View style={[styles.mockCard, entranceStyle]}>
            <View style={styles.mockHeader}>
              <View style={styles.mockAvatar}>
                <WhatsAppIcon color={Colors.teal} size={14} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mockTitle}>Eko Fashion</Text>
                <Text style={styles.mockSubtitle}>Online · Powered by Frontstore</Text>
              </View>
              <View style={styles.mockStatusDot} />
            </View>

            <View style={styles.mockBubbleRight}>
              <Text style={styles.mockBubbleRightText}>Can I get the Ankara dress in M?</Text>
            </View>

            <View style={styles.mockBubbleLeft}>
              <Text style={styles.mockBubbleLeftLabel}>Nina</Text>
              <Text style={styles.mockBubbleLeftText}>Yes! Size M is in stock. Here's the item — tap Pay to order now.</Text>
            </View>

            <View style={styles.mockProductRow}>
              <View style={styles.mockThumb}>
                <ShoppingBag size={16} color={Colors.teal} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.mockProductTitle} numberOfLines={1}>Bespoke Ankara Outfit</Text>
                <Text style={styles.mockProductPrice}>₦38,000 · In stock</Text>
              </View>
              <View style={styles.mockPayChip}>
                <Text style={styles.mockPayChipText}>Pay</Text>
              </View>
            </View>
          </Animated.View>

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

        {/* Bottom Section - Social proof + CTA */}
        <View style={styles.bottomSection}>
          <Text style={styles.socialProof}>
            Trusted by <Text style={styles.socialProofStrong}>10,000+ merchants</Text> across Africa
          </Text>

          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              router.push('/(auth)/phone');
            }}
            style={styles.ctaButtonWrapper}
          >
            <LinearGradient
              colors={['#25D366', '#128C7E']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.ctaButton}
            >
              <WhatsAppIcon color="#FFFFFF" size={20} />
              <Text style={styles.ctaButtonLabel}>Continue with WhatsApp</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/sign-in');
            }}
            style={styles.secondaryCtaButton}
          >
            <Text style={styles.secondaryCtaButtonLabel}>Continue with Email</Text>
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
    backgroundColor: 'rgba(100, 255, 218, 0.06)',
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

  // Product mock card
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
    gap: Spacing[2],
    paddingBottom: Spacing[3],
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  mockAvatar: {
    width: 26,
    height: 26,
    borderRadius: Radius.full,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  mockSubtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs - 1,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  mockStatusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.success,
  },
  mockBubbleRight: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.18)',
    borderRadius: Radius.md,
    borderBottomRightRadius: 4,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    maxWidth: '85%',
  },
  mockBubbleRightText: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  mockBubbleLeft: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(18, 140, 126, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(18, 140, 126, 0.25)',
    borderRadius: Radius.md,
    borderBottomLeftRadius: 4,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    maxWidth: '85%',
    gap: 2,
  },
  mockBubbleLeftLabel: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.xs - 1,
    color: Colors.teal,
    letterSpacing: 0.3,
  },
  mockBubbleLeftText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: 'rgba(255,255,255,0.85)',
  },
  mockProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: Radius.md,
    padding: Spacing[3],
  },
  mockThumb: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    backgroundColor: 'rgba(100, 255, 218, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mockProductTitle: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.sm,
    color: Colors.white,
  },
  mockProductPrice: {
    fontFamily: FontFamily.bodyMedium,
    fontSize: FontSize.xs,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 1,
  },
  mockPayChip: {
    backgroundColor: 'rgba(100, 255, 218, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(100, 255, 218, 0.3)',
    borderRadius: Radius.xs,
    paddingHorizontal: Spacing[3],
    paddingVertical: 6,
  },
  mockPayChipText: {
    fontFamily: FontFamily.bodyBold,
    fontSize: FontSize.xs - 1,
    color: Colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
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
