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
      padding={compact ? 14 : 16}
      shadow="sm"
      bordered
      radius={18}
    >
      <View style={styles.topRow}>
        <View
          style={[
            styles.iconWrapper,
            {
              backgroundColor: accentColor + '12',
              borderColor: accentColor + '20',
            },
          ]}
        >
          {icon}
        </View>

        {change !== undefined && (
          <View
            style={[
              styles.changeBadge,
              { backgroundColor: isPositive ? '#ECFDF5' : '#FEF2F2' },
            ]}
          >
            {isPositive ? (
              <TrendingUp size={10} color="#059669" strokeWidth={2.5} />
            ) : (
              <TrendingDown size={10} color="#DC2626" strokeWidth={2.5} />
            )}
            <Text
              style={[
                styles.changeText,
                { color: isPositive ? '#059669' : '#DC2626' },
              ]}
            >
              {Math.abs(change)}%
            </Text>
          </View>
        )}
      </View>

      <Text
        style={[
          styles.value,
          { color: theme.text },
          compact && styles.valueCompact,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>

      <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 114,
    justifyContent: 'space-between',
  },
  compact: {
    minHeight: 96,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9999,
  },
  changeText: {
    fontFamily: FontFamily.headingBold,
    fontSize: 10,
  },
  value: {
    fontFamily: FontFamily.headingBold,
    fontSize: 22,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  valueCompact: {
    fontSize: 18,
  },
  label: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 12,
    letterSpacing: -0.1,
  },
});
