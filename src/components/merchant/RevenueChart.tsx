import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Circle, Text as SvgText } from 'react-native-svg';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { ChartDataPoint } from '@/types/merchant';
import { format, parseISO } from 'date-fns';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_HEIGHT = 150;
const PADDING = { top: 20, bottom: 26, left: 10, right: 10 };

interface RevenueChartProps {
  data: ChartDataPoint[];
  title?: string;
  currency?: string;
}

export const RevenueChart: React.FC<RevenueChartProps> = ({ data, title, currency = 'NGN' }) => {
  const { theme, isDark } = useTheme();
  const chartWidth = SCREEN_WIDTH - 48 - PADDING.left - PADDING.right;

  // If no data is passed, provide default date points for a beautiful baseline view
  const effectiveData = useMemo(() => {
    if (data && data.length > 0) return data;
    const now = new Date();
    const points: ChartDataPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      points.push({
        date: d.toISOString().split('T')[0],
        amount: 0,
        orders: 0,
      });
    }
    return points;
  }, [data]);

  const hasNonZeroData = useMemo(() => {
    return effectiveData.some((d) => (d.amount ?? 0) > 0);
  }, [effectiveData]);

  const { path, fillPath, labels, lastPoint } = useMemo(() => {
    const values = effectiveData.map((d) => d.amount ?? 0);
    const maxVal = Math.max(...values);
    const max = maxVal > 0 ? maxVal * 1.2 : 100;
    const step = chartWidth / (effectiveData.length - 1 || 1);

    const points = effectiveData.map((d, i) => {
      const amt = d.amount ?? 0;
      const yFraction = hasNonZeroData ? amt / max : 0.04;
      return {
        x: PADDING.left + i * step,
        y: PADDING.top + CHART_HEIGHT * (1 - yFraction),
      };
    });

    let linePath = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const cp1x = points[i - 1].x + step * 0.45;
      const cp1y = points[i - 1].y;
      const cp2x = points[i].x - step * 0.45;
      const cp2y = points[i].y;
      linePath += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${points[i].x} ${points[i].y}`;
    }

    const bottomY = PADDING.top + CHART_HEIGHT;
    const fill =
      linePath +
      ` L ${points[points.length - 1].x} ${bottomY} L ${points[0].x} ${bottomY} Z`;

    const labelStep = Math.max(1, Math.floor(effectiveData.length / 5));
    const lbls = effectiveData
      .filter((_, i) => i % labelStep === 0 || i === effectiveData.length - 1)
      .map((d) => {
        let labelText = '';
        try {
          labelText = format(parseISO(d.date), 'MMM d');
        } catch {
          labelText = d.date;
        }
        return {
          label: labelText,
          x: PADDING.left + effectiveData.indexOf(d) * step,
        };
      });

    return {
      path: linePath,
      fillPath: fill,
      labels: lbls,
      lastPoint: points[points.length - 1],
    };
  }, [effectiveData, chartWidth, hasNonZeroData]);

  const totalHeight = CHART_HEIGHT + PADDING.top + PADDING.bottom;

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.textSecondary }]}>{title.toUpperCase()}</Text>
          {!hasNonZeroData && (
            <View style={styles.baselineBadge}>
              <Text style={styles.baselineBadgeText}>Baseline</Text>
            </View>
          )}
        </View>
      )}

      <Svg width={chartWidth + PADDING.left + PADDING.right} height={totalHeight}>
        <Defs>
          <LinearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor="#10B981" stopOpacity={hasNonZeroData ? 0.35 : 0.12} />
            <Stop offset="60%" stopColor="#128C7E" stopOpacity={hasNonZeroData ? 0.12 : 0.04} />
            <Stop offset="100%" stopColor="#128C7E" stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Subtle grid lines */}
        {[0, 0.33, 0.66, 1].map((pct, idx) => (
          <Line
            key={pct}
            x1={PADDING.left}
            y1={PADDING.top + CHART_HEIGHT * pct}
            x2={chartWidth + PADDING.left}
            y2={PADDING.top + CHART_HEIGHT * pct}
            stroke={isDark ? 'rgba(51, 65, 85, 0.4)' : '#F1F5F9'}
            strokeWidth={1}
            strokeDasharray={idx === 3 ? undefined : '3, 4'}
          />
        ))}

        {/* Gradient fill */}
        <Path d={fillPath} fill="url(#revenueGrad)" />

        {/* Bezier spline curve */}
        <Path
          d={path}
          stroke={hasNonZeroData ? '#10B981' : '#14B8A6'}
          strokeWidth={hasNonZeroData ? 3 : 2}
          fill="none"
          strokeLinecap="round"
          opacity={hasNonZeroData ? 1 : 0.8}
        />

        {/* Live endpoint dot */}
        {lastPoint && (
          <>
            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={6}
              fill="rgba(16, 185, 129, 0.25)"
            />
            <Circle
              cx={lastPoint.x}
              cy={lastPoint.y}
              r={3.5}
              fill="#10B981"
              stroke="#FFFFFF"
              strokeWidth={1.5}
            />
          </>
        )}

        {/* Date Labels */}
        {labels.map((l, i) => (
          <SvgText
            key={i}
            x={l.x}
            y={totalHeight - 6}
            fontSize={10}
            fill={isDark ? Colors.gray500 : '#94A3B8'}
            fontFamily={FontFamily.bodyRegular}
            textAnchor="middle"
          >
            {l.label}
          </SvgText>
        ))}
      </Svg>

      {!hasNonZeroData && (
        <View style={styles.hintRow}>
          <View style={styles.hintDot} />
          <Text style={styles.hintText}>Live revenue tracking enabled</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
  },
  title: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.xs,
    letterSpacing: 0.8,
  },
  baselineBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 9999,
    backgroundColor: 'rgba(18, 140, 126, 0.08)',
  },
  baselineBadgeText: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: 10,
    color: '#128C7E',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 6,
  },
  hintDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  hintText: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 11,
    color: '#94A3B8',
  },
});
