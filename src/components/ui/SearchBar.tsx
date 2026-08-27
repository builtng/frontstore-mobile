import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Search, X } from 'lucide-react-native';
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
      borderAnim.value === 1 ? '#128C7E' : '#E2E8F0',
      { duration: 200 }
    ),
    borderWidth: withTiming(borderAnim.value === 1 ? 1.5 : 1, { duration: 150 }),
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: '#FFFFFF' },
        animatedBorder,
        style,
      ]}
    >
      <Search size={18} color={focused ? '#128C7E' : '#94A3B8'} strokeWidth={2} />
      <TextInput
        style={[styles.input, { color: '#0F172A', fontFamily: FontFamily.bodyRegular }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
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
            <X size={12} color="#64748B" strokeWidth={2.5} />
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
    paddingVertical: Spacing[2],
    gap: Spacing[3],
    height: 48,
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
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
