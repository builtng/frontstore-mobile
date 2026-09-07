import React, { useEffect } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 16,
  radius = Radius.sm,
  style,
}) => {
  const { isDark } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
    return () => cancelAnimation(opacity);
  }, []);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: isDark ? Colors.navyLight : Colors.gray200,
        },
        animStyle,
        style,
      ]}
    />
  );
};

export const SkeletonCard: React.FC<{ style?: ViewStyle }> = ({ style }) => {
  const { theme, isDark } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: 18,
          padding: 16,
          borderWidth: 1,
          borderColor: isDark ? Colors.dark.border : '#EAEFF5',
        },
        style,
      ]}
    >
      <View style={styles.row}>
        <Skeleton width={48} height={48} radius={14} />
        <View style={styles.col}>
          <Skeleton width="65%" height={15} radius={6} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={11} radius={4} />
        </View>
      </View>
      <Skeleton height={10} radius={4} style={{ marginTop: 12, marginBottom: 8 }} />
      <Skeleton width="75%" height={10} radius={4} />
    </View>
  );
};

export const SkeletonStatCard: React.FC = () => {
  const { theme, isDark } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: 18,
          padding: 16,
          flex: 1,
          borderWidth: 1,
          borderColor: isDark ? Colors.dark.border : '#EAEFF5',
          minHeight: 114,
          justifyContent: 'space-between',
        },
      ]}
    >
      <Skeleton width={38} height={38} radius={12} style={{ marginBottom: 12 }} />
      <Skeleton width="60%" height={22} radius={6} style={{ marginBottom: 6 }} />
      <Skeleton width="45%" height={12} radius={4} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  col: {
    flex: 1,
  },
});
