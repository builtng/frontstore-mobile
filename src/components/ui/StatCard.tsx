import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { Card } from './Card';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';

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
  accentColor = Colors.primaryLight,
  compact = false,
}) => {
  const isPositive = (change ?? 0) >= 0;

  return (
    <Card
      style={StyleSheet.flatten([styles.card, compact && styles.compact])}
      padding={compact ? Spacing[4] : Spacing[5]}
      shadow="sm"
    >
      <View style={[styles.iconWrapper, { backgroundColor: accentColor + '20', borderColor: accentColor + '35' }]}>
        {icon}
      </View>

      <Text style={[styles.value, { color: Colors.dark.text }, compact && styles.valueCompact]}>
        {value}
      </Text>

      <Text style={[styles.label, { color: Colors.dark.textSecondary }]}>{label}</Text>

      {change !== undefined && (
        <View style={styles.changeRow}>
          {isPositive ? (
            <TrendingUp size={12} color="#4ADE80" strokeWidth={2.5} />
          ) : (
            <TrendingDown size={12} color="#F87171" strokeWidth={2.5} />
          )}
          <Text
            style={[
              styles.changeText,
              { color: isPositive ? '#4ADE80' : '#F87171' },
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
  },
  compact: {
    minHeight: 100,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: Radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[3],
    borderWidth: 1,
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
