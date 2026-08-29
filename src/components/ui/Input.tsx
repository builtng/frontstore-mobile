import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { Eye, EyeOff, AlertCircle, CheckCircle2, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  optional?: boolean;
  success?: boolean;
  showClear?: boolean;
  onClear?: () => void;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerStyle,
  isPassword = false,
  optional = false,
  success = false,
  showClear = false,
  onClear,
  style,
  value,
  ...props
}) => {
  const { theme, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = (e: any) => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
    props.onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
    props.onBlur?.(e);
  };

  const animatedWrapperStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [
        error
          ? Colors.danger
          : success
          ? Colors.success
          : isDark
          ? Colors.dark.border
          : Colors.light.border,
        error
          ? Colors.danger
          : success
          ? Colors.success
          : Colors.primary,
      ]
    );

    const backgroundColor = interpolateColor(
      focusAnim.value,
      [0, 1],
      [
        isDark ? 'rgba(15, 23, 42, 0.6)' : '#F8FAFC',
        isDark ? Colors.dark.surface : '#FFFFFF',
      ]
    );

    return {
      borderColor,
      backgroundColor,
      borderWidth: withTiming(focused || error ? 1.5 : 1, { duration: 150 }),
      shadowColor: error ? Colors.danger : Colors.primary,
      shadowOffset: { width: 0, height: focused ? 3 : 0 },
      shadowOpacity: withTiming(focused ? 0.12 : 0, { duration: 200 }),
      shadowRadius: withTiming(focused ? 8 : 0, { duration: 200 }),
      elevation: focused ? 2 : 0,
    };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.text }]}>
            {label}
          </Text>
          {optional && (
            <View
              style={[
                styles.optionalBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(0, 0, 0, 0.04)',
                },
              ]}
            >
              <Text style={[styles.optionalText, { color: theme.textTertiary }]}>
                Optional
              </Text>
            </View>
          )}
        </View>
      )}

      <Animated.View style={[styles.inputWrapper, animatedWrapperStyle]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            {React.isValidElement(leftIcon)
              ? React.cloneElement(leftIcon as React.ReactElement<any>, {
                  color: error
                    ? Colors.danger
                    : focused
                    ? Colors.primary
                    : theme.textTertiary,
                  size: (leftIcon.props as any)?.size || 18,
                })
              : leftIcon}
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              fontFamily: FontFamily.bodyRegular,
            },
            leftIcon ? styles.inputWithLeft : null,
            rightIcon || isPassword || success || (showClear && value)
              ? styles.inputWithRight
              : null,
            style,
          ]}
          placeholderTextColor={theme.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          autoCorrect={false}
          autoCapitalize={isPassword ? 'none' : props.autoCapitalize ?? 'none'}
          value={value}
          {...props}
        />

        <View style={styles.rightActionsContainer}>
          {showClear && value && value.length > 0 && (
            <TouchableOpacity
              onPress={onClear}
              activeOpacity={0.7}
              style={styles.actionBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <View style={[styles.clearPill, { backgroundColor: isDark ? '#334155' : '#E2E8F0' }]}>
                <X size={10} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>
          )}

          {isPassword ? (
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              {showPassword ? (
                <EyeOff size={18} color={focused ? Colors.primary : theme.textTertiary} />
              ) : (
                <Eye size={18} color={focused ? Colors.primary : theme.textTertiary} />
              )}
            </TouchableOpacity>
          ) : success ? (
            <View style={styles.actionBtn}>
              <CheckCircle2 size={18} color={Colors.success} />
            </View>
          ) : rightIcon ? (
            <View style={styles.actionBtn}>
              {React.isValidElement(rightIcon)
                ? React.cloneElement(rightIcon as React.ReactElement<any>, {
                    color: focused ? Colors.primary : theme.textTertiary,
                    size: (rightIcon.props as any)?.size || 18,
                  })
                : rightIcon}
            </View>
          ) : null}
        </View>
      </Animated.View>

      {error ? (
        <View style={styles.feedbackRow}>
          <AlertCircle size={13} color={Colors.danger} style={styles.feedbackIcon} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[styles.hintText, { color: theme.textTertiary }]}>{hint}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[4],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: 13,
    letterSpacing: 0.15,
  },
  optionalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  optionalText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    minHeight: 50,
    paddingHorizontal: Spacing[3],
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[1],
    minHeight: 50,
  },
  inputWithLeft: {
    paddingLeft: Spacing[2],
  },
  inputWithRight: {
    paddingRight: Spacing[2],
  },
  leftIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: Spacing[1],
    paddingRight: Spacing[2],
  },
  rightActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    paddingRight: Spacing[1],
  },
  actionBtn: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing[1],
  },
  clearPill: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feedbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 2,
  },
  feedbackIcon: {
    marginRight: 5,
  },
  errorText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.danger,
    lineHeight: 16,
  },
  hintText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    marginTop: 6,
    marginLeft: 2,
    lineHeight: 16,
  },
});

