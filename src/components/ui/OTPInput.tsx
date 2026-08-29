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
  withRepeat,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { RefreshCw } from 'lucide-react-native';

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
  const { theme, isDark } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [countdown, setCountdown] = useState(RESEND_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(0);
  const shakeAnim = useSharedValue(0);
  const cursorOpacity = useSharedValue(1);

  const digits = Array.from({ length }).map((_, i) => value[i] || '');

  useEffect(() => {
    inputRef.current?.focus();
    cursorOpacity.value = withRepeat(
      withSequence(
        withTiming(0.2, { duration: 500 }),
        withTiming(1, { duration: 500 })
      ),
      -1,
      true
    );
  }, []);

  useEffect(() => {
    if (error) {
      shakeAnim.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-4, { duration: 50 }),
        withTiming(0, { duration: 50 })
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

  const animatedCursor = useAnimatedStyle(() => ({
    opacity: cursorOpacity.value,
  }));

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.95} onPress={() => inputRef.current?.focus()}>
        <Animated.View style={[styles.row, animatedRow]}>
          {digits.map((digit, i) => {
            const isFocused = (value.length === i || (value.length === length && i === length - 1)) && focusedIndex !== null && !error;
            const isCurrentBlankFocus = value.length === i && focusedIndex !== null && !error;
            const filled = i < value.length;

            return (
              <View
                key={i}
                style={[
                  styles.cell,
                  {
                    backgroundColor: isDark
                      ? isFocused
                        ? 'rgba(18, 140, 126, 0.12)'
                        : 'rgba(15, 23, 42, 0.8)'
                      : isFocused
                      ? 'rgba(18, 140, 126, 0.04)'
                      : '#FFFFFF',
                    borderColor: error
                      ? Colors.danger
                      : isFocused
                      ? Colors.primary
                      : filled
                      ? isDark
                        ? Colors.primaryDark
                        : 'rgba(18, 140, 126, 0.35)'
                      : isDark
                      ? Colors.dark.border
                      : Colors.light.border,
                    borderWidth: isFocused || error ? 1.5 : 1,
                  },
                ]}
              >
                {digit ? (
                  <Text style={[styles.digit, { color: theme.text }]}>
                    {digit}
                  </Text>
                ) : isCurrentBlankFocus ? (
                  <Animated.View
                    style={[
                      styles.cursor,
                      { backgroundColor: Colors.primary },
                      animatedCursor,
                    ]}
                  />
                ) : null}
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
        onFocus={() => setFocusedIndex(value.length)}
        onBlur={() => setFocusedIndex(null)}
        caretHidden
      />

      <View style={styles.resendRow}>
        {canResend ? (
          <TouchableOpacity
            style={[
              styles.resendBtn,
              {
                backgroundColor: isDark
                  ? 'rgba(18, 140, 126, 0.15)'
                  : 'rgba(18, 140, 126, 0.08)',
                borderColor: Colors.primaryDim,
              },
            ]}
            onPress={handleResend}
            activeOpacity={0.7}
          >
            <RefreshCw size={14} color={Colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.resendActiveText}>Resend Code</Text>
          </TouchableOpacity>
        ) : (
          <View
            style={[
              styles.timerBadge,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.03)',
              },
            ]}
          >
            <Text style={[styles.resendTimer, { color: theme.textSecondary }]}>
              Resend code in <Text style={{ color: Colors.primary, fontFamily: FontFamily.bodySemiBold }}>{countdown}s</Text>
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing[2],
    justifyContent: 'center',
  },
  cell: {
    width: 48,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  digit: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xl,
    textAlign: 'center',
  },
  cursor: {
    width: 2,
    height: 22,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  resendRow: {
    marginTop: Spacing[6],
    alignItems: 'center',
  },
  timerBadge: {
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
  },
  resendTimer: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    letterSpacing: 0.1,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  resendActiveText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    color: Colors.primary,
  },
});

