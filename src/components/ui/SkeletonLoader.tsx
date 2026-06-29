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
  const { theme } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: theme.card,
          borderRadius: Radius.lg,
          padding: 20,
        },
        style,
      ]}
    >
      <View style={styles.row}>
        <Skeleton width={40} height={40} radius={Radius.full} />
        <View style={styles.col}>
          <Skeleton width="60%" height={14} style={{ marginBottom: 8 }} />
          <Skeleton width="40%" height={10} />
        </View>
      </View>
      <Skeleton height={12} style={{ marginTop: 16, marginBottom: 8 }} />
      <Skeleton width="80%" height={12} />
    </View>
  );
};

export const SkeletonStatCard: React.FC = () => {
  const { theme } = useTheme();
  return (
    <View style={[{ backgroundColor: theme.card, borderRadius: Radius.lg, padding: 20, flex: 1 }]}>
      <Skeleton width={32} height={32} radius={Radius.sm} style={{ marginBottom: 12 }} />
      <Skeleton width="70%" height={22} style={{ marginBottom: 6 }} />
      <Skeleton width="50%" height={12} />
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  col: {
    flex: 1,
  },
});
