import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withSequence,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';

const { width, height } = Dimensions.get('window');

export default function WelcomeScreen() {
  const router = useRouter();

  const logoOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0.7);
  const taglineOpacity = useSharedValue(0);
  const taglineY = useSharedValue(20);
  const headlineOpacity = useSharedValue(0);
  const headlineY = useSharedValue(30);
  const subtitleOpacity = useSharedValue(0);
  const buttonsOpacity = useSharedValue(0);
  const buttonsY = useSharedValue(40);
  const orbScale = useSharedValue(0.8);

  useEffect(() => {
    // Animated orb background
    orbScale.value = withSequence(
      withTiming(1.1, { duration: 2000 }),
      withTiming(0.95, { duration: 2000 }),
      withTiming(1.05, { duration: 2000 })
    );

    // Logo entrance
    logoOpacity.value = withDelay(200, withTiming(1, { duration: 600 }));
    logoScale.value = withDelay(200, withSpring(1, { damping: 14, stiffness: 120 }));

    // Tagline
    taglineOpacity.value = withDelay(600, withTiming(1, { duration: 500 }));
    taglineY.value = withDelay(600, withSpring(0, { damping: 15 }));

    // Headline
    headlineOpacity.value = withDelay(900, withTiming(1, { duration: 500 }));
    headlineY.value = withDelay(900, withSpring(0, { damping: 15 }));

    // Subtitle
    subtitleOpacity.value = withDelay(1100, withTiming(1, { duration: 500 }));

    // Buttons
    buttonsOpacity.value = withDelay(1300, withTiming(1, { duration: 400 }));
    buttonsY.value = withDelay(1300, withSpring(0, { damping: 15 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ scale: logoScale.value }],
  }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineY.value }],
  }));
  const headlineStyle = useAnimatedStyle(() => ({
    opacity: headlineOpacity.value,
    transform: [{ translateY: headlineY.value }],
  }));
  const subtitleStyle = useAnimatedStyle(() => ({ opacity: subtitleOpacity.value }));
  const buttonsStyle = useAnimatedStyle(() => ({
    opacity: buttonsOpacity.value,
    transform: [{ translateY: buttonsY.value }],
  }));
  const orbStyle = useAnimatedStyle(() => ({
    transform: [{ scale: orbScale.value }],
  }));

  return (
    <View style={styles.root}>
      <StatusBar style="light" />

      {/* Background gradient */}
      <LinearGradient
        colors={['#0A192F', '#022C22', '#25D366']}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Animated orb */}
      <Animated.View style={[styles.orb, orbStyle]} />
      <Animated.View style={[styles.orbSecondary, orbStyle]} />

      <SafeAreaView style={styles.safe}>
        {/* Top — Logo + tagline */}
        <View style={styles.topSection}>
          <Animated.View style={[styles.logoContainer, logoStyle]}>
            <View style={styles.logoMark}>
              <View style={styles.logoBubble} />
              <View style={styles.logoBubbleSmall} />
            </View>
            <Text style={styles.logoText}>frontstore</Text>
          </Animated.View>

          <Animated.Text style={[styles.tagline, taglineStyle]}>
            Commerce Through Conversation
          </Animated.Text>
        </View>

        {/* Middle — headline */}
        <View style={styles.middleSection}>
          <Animated.Text style={[styles.headline, headlineStyle]}>
            Start selling{'\n'}in minutes
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, subtitleStyle]}>
            Build your online store, accept payments, manage orders, and grow your business—all from one app.
          </Animated.Text>

          {/* Social proof dots */}
          <Animated.View style={[styles.proofRow, subtitleStyle]}>
            {['🇳🇬', '🇰🇪', '🇬🇭', '🇿🇦', '🇺🇬'].map((flag, i) => (
              <Text key={i} style={styles.flag}>{flag}</Text>
            ))}
            <Text style={styles.proofText}>10,000+ merchants</Text>
          </Animated.View>
        </View>

        {/* Bottom — actions */}
        <Animated.View style={[styles.bottomSection, buttonsStyle]}>
          <Button
            title="Continue with WhatsApp"
            onPress={() => router.push('/(auth)/phone')}
            size="xl"
            style={styles.primaryBtn}
            textStyle={{ color: Colors.primary }}
          />

          <Text style={styles.terms}>
            By continuing, you agree to our{' '}
            <Text style={styles.termsLink}>Terms of Service</Text> and{' '}
            <Text style={styles.termsLink}>Privacy Policy</Text>
          </Text>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing[6] },

  orb: {
    position: 'absolute',
    width: width * 0.8,
    height: width * 0.8,
    borderRadius: width * 0.4,
    backgroundColor: 'rgba(98, 16, 159, 0.35)',
    top: -width * 0.2,
    right: -width * 0.2,
  },
  orbSecondary: {
    position: 'absolute',
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: width * 0.3,
    backgroundColor: 'rgba(100, 255, 218, 0.06)',
    bottom: height * 0.25,
    left: -width * 0.15,
  },

  topSection: {
    paddingTop: Spacing[8],
    alignItems: 'flex-start',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  logoMark: {
    width: 32,
    height: 32,
    position: 'relative',
  },
  logoBubble: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: Colors.teal,
    top: 0,
    left: 0,
  },
  logoBubbleSmall: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 5,
    backgroundColor: Colors.amber,
    bottom: 0,
    right: 0,
  },
  logoText: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    color: Colors.white,
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
    color: Colors.teal,
    letterSpacing: 0.5,
  },

  middleSection: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: Spacing[6],
  },
  headline: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['6xl'],
    color: Colors.white,
    lineHeight: FontSize['6xl'] * 1.1,
    letterSpacing: -1.5,
    marginBottom: Spacing[5],
  },
  subtitle: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.lg,
    color: 'rgba(255,255,255,0.65)',
    lineHeight: 28,
    marginBottom: Spacing[6],
  },
  proofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[1],
  },
  flag: { fontSize: 18 },
  proofText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.5)',
    marginLeft: Spacing[2],
  },

  bottomSection: {
    paddingBottom: Spacing[8],
    gap: Spacing[3],
  },
  primaryBtn: {
    backgroundColor: Colors.white,
  },
  ghostBtn: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.25)',
  },

  terms: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: 'rgba(255,255,255,0.35)',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: Spacing[2],
  },
  termsLink: {
    color: 'rgba(255,255,255,0.6)',
    textDecorationLine: 'underline',
  },
});
