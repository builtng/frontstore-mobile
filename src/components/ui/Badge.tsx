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

const variantConfig: Record<BadgeVariant, { bg: string; text: string; dot: string }> = {
  success: { bg: Colors.successLight, text: '#16A34A', dot: Colors.success },
  warning: { bg: Colors.warningLight, text: '#D97706', dot: Colors.warning },
  danger: { bg: Colors.dangerLight, text: '#DC2626', dot: Colors.danger },
  info: { bg: Colors.infoLight, text: '#2563EB', dot: Colors.info },
  primary: { bg: Colors.primaryDim, text: Colors.primary, dot: Colors.primary },
  neutral: { bg: Colors.gray100, text: Colors.gray600, dot: Colors.gray400 },
  teal: { bg: '#CCFDF5', text: '#0D9488', dot: Colors.teal },
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
        { backgroundColor: config.bg },
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
