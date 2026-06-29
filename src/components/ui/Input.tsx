import React, { useState, useRef } from 'react';
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
import { Eye, EyeOff } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
  optional?: boolean;
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
  style,
  ...props
}) => {
  const { theme, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusAnim = useSharedValue(0);

  const handleFocus = () => {
    setFocused(true);
    focusAnim.value = withTiming(1, { duration: 200 });
    props.onFocus?.({} as any);
  };

  const handleBlur = () => {
    setFocused(false);
    focusAnim.value = withTiming(0, { duration: 200 });
    props.onBlur?.({} as any);
  };

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: interpolateColor(
      focusAnim.value,
      [0, 1],
      [error ? Colors.danger : theme.border, error ? Colors.danger : Colors.primary]
    ),
    borderWidth: withTiming(focusAnim.value === 1 ? 2 : 1.5, { duration: 150 }),
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
          {optional && (
            <Text style={[styles.optional, { color: theme.textTertiary }]}>Optional</Text>
          )}
        </View>
      )}

      <Animated.View
        style={[
          styles.inputWrapper,
          { backgroundColor: theme.surface },
          animatedBorder,
        ]}
      >
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}

        <TextInput
          style={[
            styles.input,
            { color: theme.text, fontFamily: FontFamily.bodyRegular },
            leftIcon && styles.inputWithLeft,
            (rightIcon || isPassword) && styles.inputWithRight,
            style,
          ]}
          placeholderTextColor={theme.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          secureTextEntry={isPassword && !showPassword}
          autoCorrect={false}
          autoCapitalize={isPassword ? 'none' : (props.autoCapitalize ?? 'none')}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={() => setShowPassword(!showPassword)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {showPassword ? (
              <EyeOff size={18} color={theme.textTertiary} />
            ) : (
              <Eye size={18} color={theme.textTertiary} />
            )}
          </TouchableOpacity>
        ) : rightIcon ? (
          <View style={styles.rightIcon}>{rightIcon}</View>
        ) : null}
      </Animated.View>

      {error && <Text style={styles.error}>{error}</Text>}
      {hint && !error && <Text style={[styles.hint, { color: theme.textTertiary }]}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing[5],
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing[2],
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.sm,
  },
  optional: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.md,
    borderWidth: 1.5,
    minHeight: 52,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    minHeight: 52,
  },
  inputWithLeft: {
    paddingLeft: Spacing[2],
  },
  inputWithRight: {
    paddingRight: Spacing[2],
  },
  leftIcon: {
    paddingLeft: Spacing[4],
  },
  rightIcon: {
    paddingRight: Spacing[4],
  },
  error: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    color: Colors.danger,
    marginTop: Spacing[1],
    marginLeft: Spacing[1],
  },
  hint: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    marginTop: Spacing[1],
    marginLeft: Spacing[1],
  },
});
