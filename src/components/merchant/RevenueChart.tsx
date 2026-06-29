import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { ChartDataPoint } from '@/types/merchant';
import { format, parseISO } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 140;
const PADDING = { top: 16, bottom: 24, left: 8, right: 8 };

interface RevenueChartProps {
  data: ChartDataPoint[];
  title?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, title = 'Revenue' }) => {
  const { theme, isDark } = useTheme();
  const chartWidth = SCREEN_WIDTH - 48 - PADDING.left - PADDING.right;

  const { path, fillPath, maxValue, labels } = useMemo(() => {
    if (!data.length) return { path: '', fillPath: '', maxValue: 0, labels: [] };

    const values = data.map((d) => d.amount);
    const max = Math.max(...values) * 1.15 || 1;
    const step = chartWidth / (data.length - 1 || 1);

    const points = data.map((d, i) => ({
      x: PADDING.left + i * step,
      y: PADDING.top + CHART_HEIGHT * (1 - d.amount / max),
    }));

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + step * 0.4;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - step * 0.4;
      const cp2y = points[i].y;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
    }

    const bottomY = PADDING.top + CHART_HEIGHT;
    const fill =
      linePath +
      ` L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

    const labelStep = Math.max(1, Math.floor(data.length / 5));
    const lbls = data
      .filter((_, i) => i % labelStep === 0 || i === data.length - 1)
      .map((d) => ({
        label: format(parseISO(d.date), 'MMM d'),
        x:
          PADDING.left +
          data.indexOf(d) * step,
      }));

    return { path: linePath, fillPath: fill, maxValue: max, labels: lbls };
  }, [data, chartWidth]);

  if (!data.length) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.card }]}>
        <Text style={[styles.emptyText, { color: theme.textTertiary }]}>No revenue data yet</Text>
      </View>
    );
  }

  const totalHeight = CHART_HEIGHT + PADDING.top + PADDING.bottom;

  return (
    <View>
      {title && (
        <Text style={[styles.title, { color: theme.textSecondary }]}>{title.toUpperCase()}</Text>
      )}
      <Svg width={chartWidth + PADDING.left + PADDING.right} height={totalHeight}>
        <Defs>
          <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={Colors.primary} stopOpacity="0.25" />
            <Stop offset="1" stopColor={Colors.primary} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((pct) => (
          <Line
            key={pct}
            x1={PADDING.left}
            y1={PADDING.top + CHART_HEIGHT * pct}
            x2={chartWidth + PADDING.left}
            y2={PADDING.top + CHART_HEIGHT * pct}
            stroke={isDark ? Colors.navyLight : Colors.gray100}
            strokeWidth={1}
          />
        ))}

        {/* Fill */}
        <Path d={fillPath} fill="url(#grad)" />

        {/* Line */}
        <Path d={path} stroke={Colors.primary} strokeWidth={2.5} fill="none" strokeLinecap="round" />

        {/* Labels */}
        {labels.map((l, i) => (
          <SvgText
            key={i}
            x={l.x}
            y={totalHeight - 4}
            fontSize={9}
            fill={isDark ? Colors.gray600 : Colors.gray500}
            fontFamily={FontFamily.bodyRegular}
            textAnchor="middle"
          >
            {l.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  title: {
    fontFamily: FontFamily.bodySemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
    marginBottom: Spacing[3],
  },
  empty: {
    height: 160,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.sm,
  },
});
