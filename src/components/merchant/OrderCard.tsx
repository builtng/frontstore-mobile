import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, Package } from 'lucide-react-native';
import { Badge, getOrderStatusBadge, getPaymentStatusBadge } from '@/components/ui/Badge';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { Order } from '@/types/merchant';
import { format } from 'date-fns';

interface OrderCardProps {
  order: Order;
  onPress: () => void;
}

const formatCurrency = (amount: number, currency = 'NGN') => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
};

export const OrderCard: React.FC<OrderCardProps> = ({ order, onPress }) => {
  const { theme } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border },
        Shadow.sm as any,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.top}>
        <View style={styles.refRow}>
          <View style={styles.iconBg}>
            <Package size={18} color="#128C7E" strokeWidth={2} />
          </View>
          <View style={styles.refInfo}>
            <Text style={[styles.ref, { color: theme.text }]}>#{order.reference}</Text>
            <Text style={[styles.customer, { color: theme.textSecondary }]} numberOfLines={1}>
              {order.customer_name}
            </Text>
          </View>
        </View>
        <View style={styles.rightSide}>
          <Text style={[styles.total, { color: theme.text }]}>
            {formatCurrency(order.total)}
          </Text>
          <ChevronRight size={16} color={theme.textTertiary} />
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.bottom}>
        <View style={styles.badges}>
          <Badge
            label={order.status}
            variant={getOrderStatusBadge(order.status)}
            size="sm"
            dot
          />
          <Badge
            label={order.payment_status.replace('_', ' ')}
            variant={getPaymentStatusBadge(order.payment_status)}
            size="sm"
          />
        </View>
        <Text style={[styles.date, { color: theme.textTertiary }]}>
          {format(new Date(order.created_at), 'MMM d, h:mm a')}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.card,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  refRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing[3],
  },
  iconBg: {
    width: 42,
    height: 42,
    borderRadius: Radius.md,
    backgroundColor: 'rgba(18, 140, 126, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refInfo: {
    flex: 1,
  },
  ref: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.base,
  },
  customer: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  rightSide: {
    alignItems: 'flex-end',
    flexDirection: 'row',
    gap: 6,
  },
  total: {
    fontFamily: FontFamily.headingBold,
    fontSize: FontSize.md,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 12,
  },
  bottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badges: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  date: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: 10.5,
  },
});
