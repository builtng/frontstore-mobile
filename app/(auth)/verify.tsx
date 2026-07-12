import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withDelay, withTiming,
} from 'react-native-reanimated';
import { ArrowLeft, CheckCircle } from 'lucide-react-native';
import { OTPInput } from '@/components/ui/OTPInput';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { authApi } from '@/services/authApi';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

export default function VerifyScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const setAuth = useAuthStore((s) => s.setAuth);
  const params = useLocalSearchParams<{
    phone: string;
    dial_code: string;
    formatted: string;
    email: string;
    is_new_user: string;
  }>();

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
      const result = await authApi.verifyOtp({
        phone_number: params.phone,
        otp: code,
        country_dial_code: params.dial_code,
      });

      setSuccess(true);
      successScale.value = withSpring(1, { damping: 12, stiffness: 180 });
      haptics.success();

      // Short delay for the success animation
      await new Promise((r) => setTimeout(r, 600));

      if (result.is_new_user) {
        // New user → go to business setup
        router.replace({
          pathname: '/(auth)/setup',
          params: { setup_token: result.setup_token!, phone: result.phone_number! },
        });
      } else {
        // Existing user → log them in
        await setAuth(result.data!.user, result.token!);
        router.replace('/(merchant)');
      }
    } catch (err: any) {
      setHasError(true);
      haptics.error();
      setOtp('');
      const msg = err?.response?.data?.message ?? 'Incorrect code. Please try again.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    try {
      await authApi.sendOtp({
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

  const displayPhone = params.formatted ?? `${params.dial_code}${params.phone}`;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        <TouchableOpacity style={styles.back} onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>

        <View style={styles.header}>
          {success ? (
            <Animated.View style={[styles.successCircle, successStyle]}>
              <CheckCircle size={48} color={Colors.success} strokeWidth={1.5} />
            </Animated.View>
          ) : (
            <View style={[styles.phoneIconWrap, { backgroundColor: Colors.primaryDim }]}>
              <Text style={[styles.phoneDisplay, { color: Colors.primary }]}>{displayPhone}</Text>
            </View>
          )}
          <Text style={[styles.title, { color: theme.text }]}>
            {success ? 'Verified!' : 'Enter the code'}
          </Text>
          {!success && (
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              We sent a 6-digit code to{' '}
              <Text style={{ fontFamily: FontFamily.bodySemiBold, color: theme.text }}>
                {params.email || displayPhone}
              </Text>
            </Text>
          )}
        </View>

        {!success && (
          <>
            <OTPInput
              length={6}
              value={otp}
              onChange={setOtp}
              onComplete={handleComplete}
              error={hasError}
              onResend={handleResend}
            />

            {isLoading && (
              <Button
                title="Verifying..."
                onPress={() => {}}
                isLoading
                size="lg"
                style={styles.verifyBtn}
              />
            )}

            <Text style={[styles.note, { color: theme.textTertiary }]}>
              Didn't receive it? Check your spam folder or tap resend below.
            </Text>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { flex: 1, paddingHorizontal: Spacing[6], paddingBottom: Spacing[8] },
  back: { marginTop: Spacing[4], marginBottom: Spacing[8], width: 40, height: 40, justifyContent: 'center' },

  header: { alignItems: 'center', marginBottom: Spacing[10], gap: Spacing[4] },
  phoneIconWrap: { paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], borderRadius: Radius.full },
  phoneDisplay: { fontFamily: FontFamily.headingBold, fontSize: FontSize.lg, letterSpacing: 0.5 },
  successCircle: { marginBottom: Spacing[2] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24, textAlign: 'center' },

  verifyBtn: { marginTop: Spacing[6] },
  note: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textAlign: 'center', lineHeight: 18, marginTop: Spacing[8] },
});

import { Radius } from '@/constants/spacing';
