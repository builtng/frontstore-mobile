import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Keyboard,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  onResend?: () => void;
  error?: boolean;
}

const RESEND_SECONDS = 60;

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  onResend,
  value,
  onChange,
  onComplete,
  error = false,
}) => {
  const { theme } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const shakeAnim = useSharedValue(0);

  const digits = Array.from({ length }).map((_, i) => value[i] || '');

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (error) {
      shakeAnim.value = withSequence(
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(-8, { duration: 60 }),
        withTiming(8, { duration: 60 }),
        withTiming(0, { duration: 60 })
      );
    }
  }, [error]);

  useEffect(() => {
    if (countdown === 0) {
      setCanResend(true);
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleResend = () => {
    if (!canResend) return;
    setCountdown(RESEND_SECONDS);
    setCanResend(false);
    onChange('');
    inputRef.current?.focus();
    onResend?.();
  };

  const handleChange = useCallback(
    (text: string) => {
      const cleaned = text.replace(/\D/g, '').slice(0, length);
      onChange(cleaned);
      if (cleaned.length === length) {
        Keyboard.dismiss();
        onComplete?.(cleaned);
      }
    },
    [length, onChange, onComplete]
  );

  const animatedRow = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnim.value }],
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={1} onPress={() => inputRef.current?.focus()}>
        <Animated.View style={[styles.row, animatedRow]}>
          {digits.map((digit, i) => {
            const isFocused = value.length === i && !error;
            const filled = i < value.length;
            return (
              <View
                key={i}
                style={[
                  styles.cell,
                  {
                    backgroundColor: theme.surface,
                    borderColor: error
                      ? Colors.danger
                      : isFocused
                      ? Colors.primary
                      : filled
                      ? Colors.primaryDim
                      : theme.border,
                    borderWidth: isFocused || error ? 2 : 1.5,
                  },
                ]}
              >
                <Text style={[styles.digit, { color: theme.text }]}>
                  {digit || (isFocused ? '|' : '')}
                </Text>
              </View>
            );
          })}
        </Animated.View>
      </TouchableOpacity>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        style={styles.hiddenInput}
        caretHidden
      />

      <View style={styles.resendRow}>
        {canResend ? (
          <TouchableOpacity onPress={handleResend}>
            <Text style={styles.resendActive}>Resend Code</Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.resendTimer, { color: theme.textTertiary }]}>
            Resend in <Text style={{ color: Colors.primary }}>{countdown}s</Text>
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[3],
  },
  cell: {
    width: 52,
    height: 60,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    textAlign: 'center',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 0,
    height: 0,
  },
  resendRow: {
    marginTop: Spacing[6],
  },
  resendTimer: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
  resendActive: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
});
