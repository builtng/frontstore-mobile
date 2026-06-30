import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity, Share, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withDelay, withSpring, withTiming, withSequence,
} from 'react-native-reanimated';
import ConfettiCannon from 'react-native-confetti-cannon';
import { ExternalLink, Share2, ArrowRight, QrCode } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function SuccessScreen() {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const confettiRef = useRef<any>(null);
  const { storeName, storeUsername } = useOnboardingStore();
  const { user } = useAuthStore();

  const titleOpacity = useSharedValue(0);
  const titleY = useSharedValue(40);
  const cardOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.85);
  const buttonsOpacity = useSharedValue(0);
  const emojiScale = useSharedValue(0);

  useEffect(() => {
    // Haptic celebration
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(() => confettiRef.current?.start(), 200);

    emojiScale.value = withDelay(300, withSpring(1, { damping: 10, stiffness: 200 }));
    titleOpacity.value = withDelay(500, withTiming(1, { duration: 500 }));
    titleY.value = withDelay(500, withSpring(0, { damping: 15 }));
    cardOpacity.value = withDelay(800, withTiming(1, { duration: 400 }));
    cardScale.value = withDelay(800, withSpring(1, { damping: 15 }));
    buttonsOpacity.value = withDelay(1100, withTiming(1, { duration: 400 }));
  }, []);

  const emojiStyle = useAnimatedStyle(() => ({ transform: [{ scale: emojiScale.value }] }));
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value, transform: [{ translateY: titleY.value }] }));
  const cardStyle = useAnimatedStyle(() => ({ opacity: cardOpacity.value, transform: [{ scale: cardScale.value }] }));
  const buttonsStyle = useAnimatedStyle(() => ({ opacity: buttonsOpacity.value }));

  const storeUrl = `frontstore.app/${storeUsername || user?.store?.username || 'your-store'}`;

  const handleShare = async () => {
    await Share.share({
      message: `Check out my store on FrontStore! 🛍️\nhttps://${storeUrl}`,
      title: `${storeName || 'My Store'} — FrontStore`,
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <ConfettiCannon
        ref={confettiRef}
        count={180}
        origin={{ x: width / 2, y: -20 }}
        autoStart={false}
        fadeOut
        colors={[Colors.primary, Colors.teal, Colors.amber, Colors.success, '#FF69B4']}
      />

      <View style={styles.content}>
        {/* Big emoji */}
        <Animated.Text style={[styles.emoji, emojiStyle]}>🎉</Animated.Text>

        {/* Title */}
        <Animated.View style={[styles.titleBlock, titleStyle]}>
          <Text style={[styles.title, { color: theme.text }]}>Your Store is Live!</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            Congratulations{user?.name ? `, ${user.name.split(' ')[0]}` : ''}! You're officially open for business.
          </Text>
        </Animated.View>

        {/* Store card */}
        <Animated.View style={[cardStyle, styles.card, { backgroundColor: theme.card }, Shadow.lg as any]}>
          <LinearGradient
            colors={[Colors.primary, Colors.primaryLight ?? '#4ADE80']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardHeader}
          >
            <View style={styles.storeBadge}>
              <Text style={styles.storeBadgeText}>LIVE</Text>
            </View>
            <Text style={styles.storeName}>{storeName || user?.store?.name || 'My Store'}</Text>
          </LinearGradient>

          <View style={styles.cardBody}>
            <Text style={[styles.urlLabel, { color: theme.textTertiary }]}>Store URL</Text>
            <Text style={[styles.url, { color: Colors.primary }]}>
              {storeUrl}
            </Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: Colors.primaryDim }]}
                onPress={handleShare}
              >
                <Share2 size={18} color={Colors.primary} />
                <Text style={[styles.actionBtnText, { color: Colors.primary }]}>Share Store</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: isDark ? Colors.navyLight : Colors.gray100 }]}
              >
                <QrCode size={18} color={theme.textSecondary} />
                <Text style={[styles.actionBtnText, { color: theme.textSecondary }]}>QR Code</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>

        {/* Bottom buttons */}
        <Animated.View style={[styles.buttons, buttonsStyle]}>
          <Button
            title="Go to Dashboard"
            onPress={() => router.replace('/(merchant)')}
            size="xl"
            icon={<ArrowRight size={20} color={Colors.white} />}
            iconPosition="right"
          />
          <TouchableOpacity style={styles.viewStore}>
            <ExternalLink size={16} color={Colors.primary} />
            <Text style={[styles.viewStoreText, { color: Colors.primary }]}>View Live Store</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing[6], justifyContent: 'center', alignItems: 'center', gap: Spacing[6] },
  emoji: { fontSize: 72 },
  titleBlock: { alignItems: 'center' },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['4xl'], letterSpacing: -1, textAlign: 'center', marginBottom: Spacing[3] },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.md, textAlign: 'center', lineHeight: 26 },
  card: { width: '100%', borderRadius: Radius.xl, overflow: 'hidden' },
  cardHeader: { padding: Spacing[5], gap: Spacing[2] },
  storeBadge: { backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: Spacing[3], paddingVertical: 3, borderRadius: Radius.full, alignSelf: 'flex-start' },
  storeBadgeText: { fontFamily: FontFamily.bodySemiBold, fontSize: 10, color: Colors.white, letterSpacing: 1 },
  storeName: { fontFamily: FontFamily.headingBold, fontSize: FontSize['2xl'], color: Colors.white, letterSpacing: -0.5 },
  cardBody: { padding: Spacing[5], gap: Spacing[4] },
  urlLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8 },
  url: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md, letterSpacing: -0.3 },
  actions: { flexDirection: 'row', gap: Spacing[3] },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2], paddingVertical: Spacing[3], borderRadius: Radius.md },
  actionBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  buttons: { width: '100%', gap: Spacing[3] },
  viewStore: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2] },
  viewStoreText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
});
