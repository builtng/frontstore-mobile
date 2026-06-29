import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
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
  accentColor = Colors.primary,
  compact = false,
}) => {
  const { theme } = useTheme();
  const isPositive = (change ?? 0) >= 0;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: theme.card },
        Shadow.md,
        compact && styles.compact,
      ]}
    >
      <View style={[styles.iconWrapper, { backgroundColor: accentColor + '18' }]}>
        {icon}
      </View>

      <Text style={[styles.value, { color: theme.text }, compact && styles.valueCompact]}>
        {value}
      </Text>

      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>

      {change !== undefined && (
        <View style={styles.changeRow}>
          {isPositive ? (
            <TrendingUp size={12} color={Colors.success} strokeWidth={2.5} />
          ) : (
            <TrendingDown size={12} color={Colors.danger} strokeWidth={2.5} />
          )}
          <Text
            style={[
              styles.changeText,
              { color: isPositive ? Colors.success : Colors.danger },
            ]}
          >
            {Math.abs(change)}%
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    padding: Spacing[5],
    borderRadius: Radius.lg,
    minHeight: 120,
  },
  compact: {
    minHeight: 100,
    padding: Spacing[4],
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
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
    gap: 3,
    marginTop: Spacing[2],
  },
  changeText: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
  },
});
