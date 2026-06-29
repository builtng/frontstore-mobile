import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Minus, Plus, Trash2 } from 'lucide-react-native';
import { CartItem } from '@/types/buyer';
import { useCartStore } from '@/stores/cartStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

interface CartItemRowProps {
  item: CartItem;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({ item }) => {
  const { theme } = useTheme();
  const haptics = useHaptics();
  const { updateQuantity, removeItem } = useCartStore();

  const handleDecrement = () => {
    haptics.light();
    updateQuantity(item.productId, item.quantity - 1);
  };

  const handleIncrement = () => {
    haptics.light();
    updateQuantity(item.productId, item.quantity + 1);
  };

  const handleRemove = () => {
    haptics.medium();
    removeItem(item.productId);
  };

  return (
    <View style={[styles.row, { backgroundColor: theme.card }]}>
      <View style={styles.image}>
        {item.productImage ? (
          <Image source={{ uri: item.productImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.primaryDim, alignItems: 'center', justifyContent: 'center' }]}>
            <Text style={{ fontSize: 20 }}>🛍️</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={2}>{item.productName}</Text>
        <Text style={[styles.store, { color: theme.textTertiary }]}>{item.storeName}</Text>
        <Text style={[styles.price, { color: Colors.primary }]}>{formatCurrency(item.price)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.ctrlBtn, { borderColor: theme.border }]}
          onPress={handleDecrement}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {item.quantity === 1 ? (
            <Trash2 size={14} color={Colors.danger} />
          ) : (
            <Minus size={14} color={theme.text} />
          )}
        </TouchableOpacity>

        <Text style={[styles.qty, { color: theme.text }]}>{item.quantity}</Text>

        <TouchableOpacity
          style={[styles.ctrlBtn, { borderColor: theme.border }]}
          onPress={handleIncrement}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={14} color={theme.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    padding: Spacing[4],
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  info: { flex: 1, gap: 3 },
  name: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, lineHeight: 18 },
  store: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
  price: { fontFamily: FontFamily.headingBold, fontSize: FontSize.base, marginTop: 2 },
  controls: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  ctrlBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qty: { fontFamily: FontFamily.headingBold, fontSize: FontSize.base, minWidth: 20, textAlign: 'center' },
});
