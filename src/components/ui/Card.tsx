import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { useTheme } from '@/hooks/useTheme';
import { Radius, Shadow, Spacing } from '@/constants/spacing';

interface CardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  padding?: number;
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'glow' | 'glowTeal';
  radius?: number;
  bordered?: boolean;
  variant?: 'glass' | 'solid';
}

export const Card: React.FC<CardProps> = ({
  children,
  onPress,
  style,
  padding = Spacing[5],
  shadow = 'sm',
  radius = Radius.card,
  bordered = true,
  variant = 'solid',
}) => {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const containerStyle: ViewStyle[] = [
    styles.card,
    {
      borderRadius: radius,
      padding,
      backgroundColor: theme.card,
    },
    shadow !== 'none' && (Shadow[shadow] as ViewStyle),
    bordered && { borderWidth: 1, borderColor: theme.border },
    style as ViewStyle,
  ].filter(Boolean) as ViewStyle[];

  const content = (
    <Animated.View style={[animatedStyle, containerStyle]}>
      {children}
    </Animated.View>
  );

  if (!onPress) return content;

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

  return <GestureDetector gesture={gesture}>{content}</GestureDetector>;
};

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
});
