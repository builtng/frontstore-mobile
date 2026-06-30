import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { ArrowLeft, ArrowRight, Upload, RefreshCw } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Button } from '@/components/ui/Button';
import { useOnboardingStore } from '@/stores/onboardingStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const { width } = Dimensions.get('window');
const LOGO_SIZE = width * 0.45;

export default function UploadLogoScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const haptics = useHaptics();
  const { logoUri, setLogoUri, storeName } = useOnboardingStore();
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const logoScale = useSharedValue(1);
  const logoStyle = useAnimatedStyle(() => ({ transform: [{ scale: logoScale.value }] }));

  const pickImage = async () => {
    setIsPickerOpen(true);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    setIsPickerOpen(false);

    if (!result.canceled && result.assets[0]) {
      logoScale.value = withSpring(0.85, { damping: 12 }, () => {
        logoScale.value = withSpring(1, { damping: 12 });
      });
      setLogoUri(result.assets[0].uri);
      haptics.success();
    }
  };

  const getInitial = () => (storeName ? storeName[0]?.toUpperCase() : 'F');

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { width: '50%' }]} />
      </View>

      <View style={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={[styles.step, { color: Colors.primary }]}>Step 3 of 8</Text>
          <Text style={[styles.title, { color: theme.text }]}>Add your logo</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            A great logo builds trust with your customers
          </Text>
        </View>

        {/* Logo preview area */}
        <View style={styles.logoArea}>
          <TouchableOpacity onPress={pickImage} activeOpacity={0.85}>
            <Animated.View style={logoStyle}>
              {logoUri ? (
                <View style={styles.logoWrapper}>
                  <Image
                    source={{ uri: logoUri }}
                    style={styles.logo}
                    contentFit="cover"
                  />
                  <View style={styles.changeOverlay}>
                    <RefreshCw size={20} color={Colors.white} />
                    <Text style={styles.changeText}>Change</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.logoPlaceholder}>
                  <LinearGradient
                    colors={[Colors.primaryDim, '#BBF7D0']}
                    style={StyleSheet.absoluteFill}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  />
                  <Text style={styles.logoInitial}>{getInitial()}</Text>
                  <View style={[styles.uploadBadge, { backgroundColor: Colors.primary }]}>
                    <Upload size={14} color={Colors.white} />
                  </View>
                </View>
              )}
            </Animated.View>
          </TouchableOpacity>

          <Text style={[styles.logoName, { color: theme.text }]}>{storeName || 'Your Store'}</Text>
          <Text style={[styles.logoHint, { color: theme.textTertiary }]}>frontstore.app/your-store</Text>
        </View>

        {/* Tips */}
        <View style={[styles.tips, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.tipsTitle, { color: theme.text }]}>Logo tips</Text>
          {[
            'Square image works best (1:1 ratio)',
            'Minimum 400×400px for crisp display',
            'PNG or JPG format accepted',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={[styles.tipDot, { backgroundColor: Colors.primary }]} />
              <Text style={[styles.tipText, { color: theme.textSecondary }]}>{tip}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <Button
          title={logoUri ? 'Continue' : 'Skip for now'}
          onPress={() => router.push('/(auth)/theme-select')}
          size="xl"
          variant={logoUri ? 'primary' : 'secondary'}
          icon={<ArrowRight size={20} color={logoUri ? Colors.white : Colors.primary} />}
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
  content: { flex: 1, paddingHorizontal: Spacing[6] },
  back: { marginTop: Spacing[4], marginBottom: Spacing[6], width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: Spacing[8] },
  step: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: Spacing[2] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8, marginBottom: Spacing[2] },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },

  logoArea: { alignItems: 'center', marginBottom: Spacing[8] },
  logoWrapper: { position: 'relative', borderRadius: Radius.xl, overflow: 'hidden' },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE, borderRadius: Radius.xl },
  changeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[1],
  },
  changeText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.white },
  logoPlaceholder: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoInitial: {
    fontFamily: FontFamily.headingBold,
    fontSize: LOGO_SIZE * 0.45,
    color: Colors.primary,
  },
  uploadBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoName: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, marginTop: Spacing[4] },
  logoHint: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, marginTop: 4 },

  tips: {
    borderRadius: Radius.lg,
    padding: Spacing[4],
    borderWidth: 1,
    gap: Spacing[3],
  },
  tipsTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: Spacing[1] },
  tipRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  tipDot: { width: 6, height: 6, borderRadius: 3 },
  tipText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, flex: 1 },

  footer: { paddingHorizontal: Spacing[6], paddingVertical: Spacing[5] },
});
