import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { Colors } from '@/constants/colors';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  radius?: number;
  bordered?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  padding = Spacing[5],
  shadow = 'md',
  radius = Radius.lg,
  bordered = false,
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle: ViewStyle[] = [
    styles.card,
    { backgroundColor: theme.card, borderRadius: radius, padding },
    shadow !== 'none' && (Shadow[shadow] as ViewStyle),
    bordered && { borderWidth: 1, borderColor: theme.border },
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  if (!onPress) {
    return <Animated.View style={containerStyle}>{children}</Animated.View>;
  }

  const gesture = Gesture.Tap()
    .onBegin(() => {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 400 });
    })
    .onEnd(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
      onPress();
    })
    .onFinalize(() => {
      scale.value = withSpring(1, { damping: 15, stiffness: 400 });
    });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[animatedStyle, containerStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
