import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Search, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
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
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderAnim = useSharedValue(0);

  const animatedBorder = useAnimatedStyle(() => ({
    borderColor: withTiming(
      borderAnim.value === 1 ? Colors.primary : theme.border,
      { duration: 200 }
    ),
    borderWidth: withTiming(borderAnim.value === 1 ? 2 : 1.5, { duration: 150 }),
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.surface },
        animatedBorder,
        style,
      ]}
    >
      <Search size={18} color={focused ? Colors.primary : theme.textTertiary} strokeWidth={2} />
      <TextInput
        style={[styles.input, { color: theme.text, fontFamily: FontFamily.bodyRegular }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textTertiary}
        autoFocus={autoFocus}
        onFocus={() => { setFocused(true); borderAnim.value = 1; }}
        onBlur={() => { setFocused(false); borderAnim.value = 0; }}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity
          onPress={() => { onChangeText(''); onClear?.(); }}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <View style={styles.clearBtn}>
            <X size={12} color={Colors.white} strokeWidth={2.5} />
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
    paddingVertical: Spacing[3],
    gap: Spacing[3],
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: FontSize.base,
    padding: 0,
  },
  clearBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.gray400,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
