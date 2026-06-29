import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Check, MapPin, Truck, Monitor, ShoppingBag } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { publicApi } from '@/services/publicApi';
import { useCartStore } from '@/stores/cartStore';
import { useBuyerStore } from '@/stores/buyerStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const schema = z.object({
  customer_name: z.string().min(2, 'Please enter your name'),
  customer_phone: z.string().min(10, 'Enter a valid phone number'),
  customer_email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  delivery_address: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

const DELIVERY_OPTIONS = [
  { value: 'pickup', label: 'Pickup', desc: 'Collect from store location', Icon: ShoppingBag },
  { value: 'delivery', label: 'Local Delivery', desc: 'Delivered to your address', Icon: Truck },
  { value: 'digital', label: 'Digital', desc: 'Instant delivery via email', Icon: Monitor },
] as const;

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function CheckoutScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const { buyer } = useBuyerStore();
  const { items, clearStoreItems } = useCartStore();
  const [deliveryType, setDeliveryType] = useState<'pickup' | 'delivery' | 'digital'>('pickup');

  const storeItems = items.filter((i) => i.storeUsername === username);
  const subtotal = storeItems.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_name: buyer?.name ?? '',
      customer_email: buyer?.email ?? '',
      customer_phone: buyer?.phone ?? '',
    },
  });

  const { mutate: placeOrder, isPending } = useMutation({
    mutationFn: (data: FormData) =>
      publicApi.createOrder(username, {
        customer_name: data.customer_name,
        customer_phone: data.customer_phone,
        customer_email: data.customer_email || undefined,
        delivery_type: deliveryType,
        delivery_address: deliveryType === 'delivery' ? data.delivery_address : undefined,
        notes: data.notes || undefined,
        items: storeItems.map((i) => ({
          product_id: i.productId,
          quantity: i.quantity,
          price: i.price,
        })),
      }),
    onSuccess: (response) => {
      clearStoreItems(username);
      haptics.success();
      const orderId = response?.data?.id ?? response?.order?.id;
      router.replace(`/(buyer)/orders/${orderId}` as any);
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message ?? 'Failed to place order. Please try again.');
    },
  });

  if (storeItems.length === 0) {
    router.replace('/(public)/cart');
    return null;
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Checkout</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

          {/* Order summary */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Summary</Text>
          <View style={[styles.summaryCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
            {storeItems.map((item, i) => (
              <View key={item.productId} style={[styles.summaryItem, i < storeItems.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
                <Text style={[styles.itemName, { color: theme.text }]}>{item.productName}</Text>
                <Text style={[styles.itemQty, { color: theme.textTertiary }]}>×{item.quantity}</Text>
                <Text style={[styles.itemPrice, { color: theme.text }]}>{formatCurrency(item.price * item.quantity)}</Text>
              </View>
            ))}
            <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
              <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
              <Text style={[styles.totalValue, { color: Colors.primary }]}>{formatCurrency(subtotal)}</Text>
            </View>
          </View>

          {/* Delivery type */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Delivery Method</Text>
          <View style={styles.deliveryOptions}>
            {DELIVERY_OPTIONS.map(({ value, label, desc, Icon }) => (
              <TouchableOpacity
                key={value}
                onPress={() => setDeliveryType(value)}
                style={[
                  styles.deliveryOption,
                  {
                    backgroundColor: deliveryType === value ? Colors.primaryDim : theme.card,
                    borderColor: deliveryType === value ? Colors.primary : theme.border,
                  },
                ]}
              >
                <Icon size={20} color={deliveryType === value ? Colors.primary : theme.textTertiary} strokeWidth={2} />
                <View style={styles.deliveryInfo}>
                  <Text style={[styles.deliveryLabel, { color: deliveryType === value ? Colors.primary : theme.text }]}>{label}</Text>
                  <Text style={[styles.deliveryDesc, { color: theme.textTertiary }]}>{desc}</Text>
                </View>
                {deliveryType === value && (
                  <View style={[styles.checkCircle, { backgroundColor: Colors.primary }]}>
                    <Check size={12} color={Colors.white} strokeWidth={3} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* Customer details */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Your Details</Text>

          <Controller control={control} name="customer_name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Full Name" placeholder="Your full name" autoCapitalize="words" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.customer_name?.message} />
            )} />

          <Controller control={control} name="customer_phone"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Phone Number" placeholder="+234 800 000 0000" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.customer_phone?.message} />
            )} />

          <Controller control={control} name="customer_email"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Email Address" placeholder="Optional — for receipt" keyboardType="email-address" autoCapitalize="none" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.customer_email?.message} optional />
            )} />

          {deliveryType === 'delivery' && (
            <Controller control={control} name="delivery_address"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input label="Delivery Address" placeholder="Street, area, city..." multiline numberOfLines={3} value={value} onChangeText={onChange} onBlur={onBlur} error={errors.delivery_address?.message} style={{ minHeight: 80, textAlignVertical: 'top' }} />
              )} />
          )}

          <Controller control={control} name="notes"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Order Notes" placeholder="Any special instructions for the seller..." multiline numberOfLines={2} value={value} onChangeText={onChange} onBlur={onBlur} optional style={{ minHeight: 64, textAlignVertical: 'top' }} />
            )} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Button
          title={`Place Order — ${formatCurrency(subtotal)}`}
          onPress={handleSubmit((data) => placeOrder(data))}
          isLoading={isPending}
          size="xl"
        />
        <Text style={[styles.footerNote, { color: theme.textTertiary }]}>
          Payment is handled separately by the store.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4], borderBottomWidth: 1 },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[4] },

  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, marginTop: Spacing[6], marginBottom: Spacing[4] },

  summaryCard: { borderRadius: Radius.lg, overflow: 'hidden' },
  summaryItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[3] },
  itemName: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  itemQty: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  itemPrice: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sm, minWidth: 80, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderTopWidth: 1 },
  totalLabel: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md },
  totalValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.lg },

  deliveryOptions: { gap: Spacing[3] },
  deliveryOption: { flexDirection: 'row', alignItems: 'center', padding: Spacing[4], borderRadius: Radius.lg, borderWidth: 1.5, gap: Spacing[3] },
  deliveryInfo: { flex: 1 },
  deliveryLabel: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.base },
  deliveryDesc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 2 },
  checkCircle: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },

  footer: { padding: Spacing[5], borderTopWidth: 1, gap: Spacing[2] },
  footerNote: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textAlign: 'center' },
});
