import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { Search, X } from 'lucide-react-native';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { Colors } from '@/constants/colors';
import { useTheme } from '@/hooks/useTheme';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onClear?: () => void;
  style?: ViewStyle;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onClear,
  style,
  autoFocus = false,
}) => {
  const { theme, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderAnim = useSharedValue(0);

  const animatedContainerStyle = useAnimatedStyle(() => {
    const borderColor = interpolateColor(
      borderAnim.value,
      [0, 1],
      [
        isDark ? Colors.dark.border : Colors.light.border,
        Colors.primary,
      ]
    );

    const backgroundColor = interpolateColor(
      borderAnim.value,
      [0, 1],
      [
        isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
        isDark ? Colors.dark.surface : '#FFFFFF',
      ]
    );

    return {
      borderColor,
      backgroundColor,
      borderWidth: withTiming(focused ? 1.5 : 1, { duration: 150 }),
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: focused ? 2 : 0 },
      shadowOpacity: withTiming(focused ? 0.1 : 0, { duration: 200 }),
      shadowRadius: withTiming(focused ? 6 : 0, { duration: 200 }),
      elevation: focused ? 2 : 0,
    };
  });

  return (
    <Animated.View style={[styles.container, animatedContainerStyle, style]}>
      <Search
        size={18}
        color={focused ? Colors.primary : theme.textTertiary}
        strokeWidth={2}
      />
      <TextInput
        style={[
          styles.input,
          {
            color: theme.text,
            fontFamily: FontFamily.bodyRegular,
          },
        ]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        autoFocus={autoFocus}
        onFocus={() => {
          setFocused(true);
          borderAnim.value = withTiming(1, { duration: 200 });
        }}
        onBlur={() => {
          setFocused(false);
          borderAnim.value = withTiming(0, { duration: 200 });
        }}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View
            style={[
              styles.clearBtn,
              { backgroundColor: isDark ? '#334155' : '#E2E8F0' },
            ]}
          >
            <X size={11} color={isDark ? '#94A3B8' : '#64748B'} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.full,
    paddingHorizontal: Spacing[4],
    gap: Spacing[3],
    height: 46,
  },
  input: {
    flex: 1,
    fontSize: FontSize.sm,
    padding: 0,
    height: '100%',
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

