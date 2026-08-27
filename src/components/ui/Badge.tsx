import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius } from '@/constants/spacing';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'primary' | 'neutral' | 'teal';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  style?: ViewStyle;
}

const variantConfig: Record<BadgeVariant, { bg: string; border: string; text: string; dot: string }> = {
  success: { bg: 'rgba(16, 185, 129, 0.12)', border: 'transparent', text: '#059669', dot: '#10B981' },
  warning: { bg: 'rgba(245, 158, 11, 0.12)', border: 'transparent', text: '#D97706', dot: '#F59E0B' },
  danger: { bg: 'rgba(239, 68, 68, 0.12)', border: 'transparent', text: '#DC2626', dot: '#EF4444' },
  info: { bg: 'rgba(59, 130, 246, 0.12)', border: 'transparent', text: '#2563EB', dot: '#3B82F6' },
  primary: { bg: 'rgba(18, 140, 126, 0.12)', border: 'transparent', text: '#128C7E', dot: '#128C7E' },
  neutral: { bg: '#F1F5F9', border: 'transparent', text: '#475569', dot: '#94A3B8' },
  teal: { bg: 'rgba(20, 184, 166, 0.12)', border: 'transparent', text: '#0D9488', dot: '#14B8A6' },
};

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'neutral',
  size = 'md',
  dot = false,
  style,
}) => {
  const config = variantConfig[variant] || variantConfig.neutral;

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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2.5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  label: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.1,
  },
  labelSm: {
    fontSize: 10,
  },
});
