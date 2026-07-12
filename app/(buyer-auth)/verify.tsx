import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { OTPInput } from '@/components/ui/OTPInput';
import { useToast } from '@/components/ui/Toast';
import { buyerApi } from '@/services/buyerApi';
import { useBuyerStore } from '@/stores/buyerStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

export default function BuyerVerifyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const { setBuyerAuth } = useBuyerStore();
  const params = useLocalSearchParams<{ phone: string; dial_code: string; formatted: string; email: string }>();

  const [otp, setOtp] = useState('');
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const successScale = useSharedValue(0);
  const successStyle = useAnimatedStyle(() => ({ transform: [{ scale: successScale.value }] }));

  const handleComplete = async (code: string) => {
    if (isLoading) return;
    setIsLoading(true);
    setHasError(false);
    haptics.light();

    try {
      const result = await buyerApi.verifyOtp({
        phone_number: params.phone,
        otp: code,
        country_dial_code: params.dial_code,
      });

      setSuccess(true);
      successScale.value = withSpring(1, { damping: 12, stiffness: 180 });
      haptics.success();

      await new Promise((r) => setTimeout(r, 600));
      await setBuyerAuth(result.buyer, result.token);

      // Go back to wherever the buyer came from
      router.replace('/(public)');
    } catch (err: any) {
      setHasError(true);
      haptics.error();
      setOtp('');
      toast.error(err?.response?.data?.message ?? 'Incorrect code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await buyerApi.sendOtp({
        phone_number: params.phone,
        country_dial_code: params.dial_code,
        email: params.email || undefined,
      });
      toast.success(`New code sent to ${params.email || 'your email'}`);
      setOtp('');
      setHasError(false);
    } catch {
      toast.error('Failed to resend. Please wait a moment.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          {success ? (
            <Animated.View style={successStyle}>
              <CheckCircle size={52} color={Colors.success} strokeWidth={1.5} />
            </Animated.View>
          ) : (
            <View style={[styles.phoneTag, { backgroundColor: Colors.primaryDim }]}>
              <Text style={[styles.phoneText, { color: Colors.primary }]}>{params.formatted}</Text>
            </View>
          )}
          <Text style={[styles.title, { color: theme.text }]}>
            {success ? 'Verified!' : 'Enter the code'}
          </Text>
          {!success && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We sent a 6-digit code to{' '}
              <Text style={{ fontFamily: FontFamily.bodySemiBold, color: theme.text }}>
                {params.email || params.formatted}
              </Text>
            </Text>
          )}
        </View>

        {!success && (
          <OTPInput
            length={6}
            value={otp}
            onChange={setOtp}
            onComplete={handleComplete}
            onResend={handleResend}
            error={hasError}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing[6] },
  back: { marginTop: Spacing[4], marginBottom: Spacing[8], width: 40, height: 40, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: Spacing[10], gap: Spacing[4] },
  phoneTag: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderRadius: Radius.full },
  phoneText: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md, letterSpacing: 0.5 },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24, textAlign: 'center' },
});
