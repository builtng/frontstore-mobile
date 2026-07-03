import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ShoppingBag, ClipboardList, Package, Users, BarChart2, Star, Clock } from 'lucide-react-native';
import { Button } from './Button';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

type EmptyType = 'orders' | 'products' | 'customers' | 'reviews' | 'bookings' | 'analytics' | 'generic' | 'coming-soon';

interface EmptyStateProps {
  type?: EmptyType;
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const configs: Record<EmptyType, { Icon: any; title: string; description: string }> = {
  orders: {
    Icon: ClipboardList,
    title: 'No orders yet',
    description: 'When customers place orders, they\'ll appear here. Share your store to start selling.',
  },
  products: {
    Icon: Package,
    title: 'No products yet',
    description: 'Add your first product to start selling. You can add photos, prices, and descriptions.',
  },
  customers: {
    Icon: Users,
    title: 'No customers yet',
    description: 'Your customers will appear here once they place their first order.',
  },
  reviews: {
    Icon: Star,
    title: 'No reviews yet',
    description: 'Customer reviews will appear here after they rate their orders.',
  },
  bookings: {
    Icon: ClipboardList,
    title: 'No bookings yet',
    description: 'Create time slots and share your booking link to start receiving appointments.',
  },
  analytics: {
    Icon: BarChart2,
    title: 'No data yet',
    description: 'Analytics will appear once you start receiving orders and traffic.',
  },
  generic: {
    Icon: ShoppingBag,
    title: 'Nothing here yet',
    description: 'There\'s nothing to show right now. Check back later.',
  },
  'coming-soon': {
    Icon: Clock,
    title: 'Coming Soon',
    description: 'We\'re putting the finishing touches on this. Check back soon!',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  type = 'generic',
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { theme, isDark } = useTheme();
  const config = configs[type];
  const Icon = config.Icon;

  return (
    <View style={styles.container}>
      <View style={[styles.iconWrapper, { backgroundColor: isDark ? Colors.navyLight : Colors.primaryDim }]}>
        <Icon size={36} color={Colors.primary} strokeWidth={1.5} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{title ?? config.title}</Text>
      <Text style={[styles.description, { color: theme.textSecondary }]}>
        {description ?? config.description}
      </Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          size="md"
          style={styles.button}
          fullWidth={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
    paddingVertical: Spacing[12],
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing[5],
  },
  title: {
    fontFamily: FontFamily.headingSemiBold,
    fontSize: FontSize.xl,
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  description: {
    fontFamily: FontFamily.bodyRegular,
    fontSize: FontSize.base,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing[6],
  },
  button: {
    paddingHorizontal: Spacing[8],
  },
});
