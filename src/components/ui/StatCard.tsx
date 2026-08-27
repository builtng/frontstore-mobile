import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { Card } from './Card';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

interface StatCardProps {
  label: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  accentColor?: string;
  compact?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  icon,
  accentColor = '#128C7E',
  compact = false,
}) => {
  const { theme } = useTheme();
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card
      style={StyleSheet.flatten([styles.card, compact && styles.compact])}
      padding={compact ? Spacing[4] : Spacing[5]}
      shadow="sm"
    >
      <View style={[styles.iconWrapper, { backgroundColor: 'rgba(18, 140, 126, 0.08)' }]}>
        {icon}
      </View>

      <Text style={[styles.value, { color: theme.text }, compact && styles.valueCompact]}>
        {value}
      </Text>

      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>

      {change !== undefined && (
        <View style={styles.changeRow}>
          {isPositive ? (
            <TrendingUp size={12} color="#10B981" strokeWidth={2.5} />
          ) : (
            <TrendingDown size={12} color="#EF4444" strokeWidth={2.5} />
          )}
          <Text
            style={[
              styles.changeText,
              { color: isPositive ? '#10B981' : '#EF4444' },
            ]}
          >
            {Math.abs(change)}%
          </Text>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 120,
    borderRadius: Radius.card,
  },
  compact: {
    minHeight: 100,
  },
  iconWrapper: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
  },
  value: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize['2xl'],
    marginBottom: 2,
  },
  valueCompact: {
    fontSize: FontSize.xl,
  },
  label: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
  },
  changeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: Spacing[2],
  },
  changeText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.xs,
  },
});
