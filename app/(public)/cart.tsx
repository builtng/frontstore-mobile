import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ShoppingCart, ArrowRight, Trash2 } from 'lucide-react-native';
import { CartItemRow } from '@/components/buyer/CartItemRow';
import { Button } from '@/components/ui/Button';
import { useCartStore } from '@/stores/cartStore';
import { useBuyerStore } from '@/stores/buyerStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function CartScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { items, clearCart } = useCartStore();
  const { isAuthenticated } = useBuyerStore();

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  // Group items by store so user sees which store each item is from
  const storeGroups = items.reduce<Record<string, typeof items>>((acc, item) => {
    if (!acc[item.storeUsername]) acc[item.storeUsername] = [];
    acc[item.storeUsername].push(item);
    return acc;
  }, {});

  const handleCheckout = () => {
    if (items.length === 0) return;
    // All cart items must be from the same store for checkout
    const storeUsernames = [...new Set(items.map((i) => i.storeUsername))];
    if (storeUsernames.length > 1) {
      // Multiple stores — guide user to check out one store at a time
      return;
    }
    router.push(`/(public)/store/${storeUsernames[0]}/checkout` as any);
  };

  if (items.length === 0) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Cart</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: Colors.primaryDim }]}>
            <ShoppingCart size={40} color={Colors.primary} strokeWidth={1.5} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.text }]}>Your cart is empty</Text>
          <Text style={[styles.emptyDesc, { color: theme.textSecondary }]}>
            Browse stores and add products you love
          </Text>
          <Button title="Browse Stores" onPress={() => router.push('/(public)')} size="lg" fullWidth={false} style={styles.browseBtn} />
        </View>
      </SafeAreaView>
    );
  }

  const multipleStores = Object.keys(storeGroups).length > 1;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Cart</Text>
        <TouchableOpacity onPress={clearCart} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Text style={[styles.clearBtn, { color: Colors.danger }]}>Clear</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {multipleStores && (
          <View style={[styles.warningBanner, { backgroundColor: Colors.warningLight, borderColor: Colors.warning }]}>
            <Text style={[styles.warningText, { color: '#D97706' }]}>
              ⚠️ You have items from {Object.keys(storeGroups).length} different stores. You'll need to checkout one store at a time.
            </Text>
          </View>
        )}

        {Object.entries(storeGroups).map(([storeUsername, storeItems]) => (
          <View key={storeUsername} style={styles.storeGroup}>
            <View style={styles.storeGroupHeader}>
              <Text style={[styles.storeGroupName, { color: theme.textSecondary }]}>
                🏪 {storeItems[0].storeName}
              </Text>
              {multipleStores && (
                <Button
                  title="Checkout this store"
                  onPress={() => router.push(`/(public)/store/${storeUsername}/checkout` as any)}
                  size="sm"
                  fullWidth={false}
                />
              )}
            </View>
            {storeItems.map((item) => (
              <CartItemRow key={item.productId} item={item} />
            ))}
          </View>
        ))}

        {/* Summary */}
        <View style={[styles.summary, { backgroundColor: theme.card }, Shadow.md as any]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Items ({itemCount})</Text>
            <Text style={[styles.summaryValue, { color: theme.text }]}>{formatCurrency(total)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Delivery</Text>
            <Text style={[styles.summaryValue, { color: theme.textTertiary }]}>Calculated at checkout</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.summaryRow}>
            <Text style={[styles.grandLabel, { color: theme.text }]}>Estimated Total</Text>
            <Text style={[styles.grandValue, { color: Colors.primary }]}>{formatCurrency(total)}</Text>
          </View>
        </View>
      </ScrollView>

      {!multipleStores && (
        <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <Button
            title={`Checkout — ${formatCurrency(total)}`}
            onPress={handleCheckout}
            size="xl"
            icon={<ArrowRight size={20} color={Colors.white} />}
            iconPosition="right"
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4],
  },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.5 },
  clearBtn: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 120 },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[8], gap: Spacing[4] },
  emptyIcon: { width: 88, height: 88, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, textAlign: 'center' },
  emptyDesc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, textAlign: 'center', lineHeight: 24 },
  browseBtn: { paddingHorizontal: Spacing[8] },

  warningBanner: { borderRadius: Radius.md, padding: Spacing[4], borderWidth: 1, marginBottom: Spacing[5] },
  warningText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 20 },

  storeGroup: { marginBottom: Spacing[4] },
  storeGroupHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  storeGroupName: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },

  summary: { borderRadius: Radius.lg, padding: Spacing[5], gap: Spacing[3], marginTop: Spacing[2] },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  summaryValue: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  divider: { height: 1 },
  grandLabel: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md },
  grandValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.lg },

  footer: { padding: Spacing[5], borderTopWidth: 1 },
});
