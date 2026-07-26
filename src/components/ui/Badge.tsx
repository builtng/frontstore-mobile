import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral' | 'teal';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: ViewStyle;
}

// Tinted-glass pills: a low-opacity wash of the accent color over the dark
// surface, with the accent itself carrying the text so it still reads bright.
const variantConfig: Record<BadgeVariant, { bg: string; border: string; text: string; dot: string }> = {
  success: { bg: 'rgba(46, 204, 113, 0.16)', border: 'rgba(46, 204, 113, 0.3)', text: '#4ADE80', dot: Colors.success },
  warning: { bg: 'rgba(241, 196, 15, 0.16)', border: 'rgba(241, 196, 15, 0.3)', text: '#FBBF24', dot: Colors.warning },
  danger: { bg: 'rgba(231, 76, 60, 0.16)', border: 'rgba(231, 76, 60, 0.3)', text: '#F87171', dot: Colors.danger },
  info: { bg: 'rgba(59, 130, 246, 0.16)', border: 'rgba(59, 130, 246, 0.3)', text: '#60A5FA', dot: Colors.info },
  primary: { bg: Colors.glow.primarySoft, border: 'rgba(37, 211, 102, 0.32)', text: Colors.primaryLight, dot: Colors.primaryLight },
  neutral: { bg: Colors.glass.bg, border: Colors.glass.border, text: Colors.dark.textSecondary, dot: Colors.dark.textTertiary },
  teal: { bg: 'rgba(100, 255, 218, 0.14)', border: 'rgba(100, 255, 218, 0.3)', text: Colors.teal, dot: Colors.teal },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  dot = false,
  style,
}) => {
  const config = variantConfig[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg, borderColor: config.border },
        size === 'sm' && styles.sm,
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: config.dot }]} />}
      <Text style={[styles.label, { color: config.text }, size === 'sm' && styles.labelSm]}>
        {label}
      </Text>
    </View>
  );
};

export const getOrderStatusBadge = (status: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    pending: 'warning',
    confirmed: 'info',
    processing: 'info',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'danger',
    refunded: 'neutral',
  };
  return map[status] ?? 'neutral';
};

export const getPaymentStatusBadge = (status: string): BadgeVariant => {
  const map: Record<string, BadgeVariant> = {
    paid: 'success',
    pending: 'warning',
    failed: 'danger',
    in_escrow: 'info',
    released: 'success',
    refunded: 'neutral',
  };
  return map[status] ?? 'neutral';
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: Radius.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: Spacing[1],
  },
  label: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    textTransform: 'capitalize',
  },
  labelSm: {
    fontSize: 10,
  },
});
