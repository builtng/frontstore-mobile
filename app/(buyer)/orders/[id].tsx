import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, CheckCircle, Clock, Package, Truck, MapPin } from 'lucide-react-native';
import { Badge, getOrderStatusBadge, getPaymentStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { publicApi } from '@/services/publicApi';
import { buyerApi } from '@/services/buyerApi';
import { PublicOrder } from '@/types/buyer';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { format } from 'date-fns';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function BuyerOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();

  const { data: order, isLoading, refetch } = useQuery({
    queryKey: ['buyer-order', id],
    queryFn: () => publicApi.trackOrder(Number(id)),
    select: (r) => r.data as PublicOrder,
    enabled: !!id,
  });

  const { mutate: confirmDelivery, isPending: isConfirming } = useMutation({
    mutationFn: () => publicApi.confirmDelivery(Number(id)),
    onSuccess: () => {
      toast.success('Delivery confirmed! Payment has been released to the seller.');
      refetch();
    },
    onError: () => toast.error('Failed to confirm delivery'),
  });

  const openWhatsApp = () => {
    if (!order?.store?.whatsapp_number) return;
    const phone = order.store.whatsapp_number.replace(/\D/g, '');
    const message = `Hi, I'm following up on order #${order.reference}`;
    Linking.openURL(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.pad}>
          <Skeleton height={200} radius={16} style={{ marginBottom: Spacing[5] }} />
          <Skeleton height={160} radius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Order #{order.reference}</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Status card */}
        <View style={[styles.statusCard, { backgroundColor: theme.card }, Shadow.md as any]}>
          <View style={styles.statusTop}>
            <View>
              <Text style={[styles.statusLabel, { color: theme.textTertiary }]}>Order Status</Text>
              <Badge label={order.status.replace(/_/g, ' ')} variant={getOrderStatusBadge(order.status)} dot />
            </View>
            <View>
              <Text style={[styles.statusLabel, { color: theme.textTertiary }]}>Payment</Text>
              <Badge label={order.payment_status.replace(/_/g, ' ')} variant={getPaymentStatusBadge(order.payment_status)} />
            </View>
            <View>
              <Text style={[styles.statusLabel, { color: theme.textTertiary }]}>Total</Text>
              <Text style={[styles.statusTotal, { color: Colors.primary }]}>{formatCurrency(order.total)}</Text>
            </View>
          </View>

          {/* Progress steps */}
          <View style={styles.stepsRow}>
            {STATUS_STEPS.map((step, i) => {
              const done = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <View key={step} style={styles.stepItem}>
                  <View style={[styles.stepDot, { backgroundColor: done ? Colors.primary : theme.border, transform: [{ scale: isCurrent ? 1.3 : 1 }] }]}>
                    {done && <CheckCircle size={8} color={Colors.white} strokeWidth={3} />}
                  </View>
                  {i < STATUS_STEPS.length - 1 && (
                    <View style={[styles.stepLine, { backgroundColor: i < currentStepIndex ? Colors.primary : theme.border }]} />
                  )}
                  <Text style={[styles.stepLabel, { color: done ? theme.text : theme.textTertiary }]} numberOfLines={1}>
                    {step.charAt(0).toUpperCase() + step.slice(1)}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={[styles.placedDate, { color: theme.textTertiary }]}>
            Placed {format(new Date(order.created_at), 'MMM d, yyyy · h:mm a')}
          </Text>
        </View>

        {/* Items */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Items</Text>
        <View style={[styles.itemsCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
          {order.items.map((item, i) => (
            <View key={i} style={[styles.itemRow, i < order.items.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
              <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>{item.product?.name}</Text>
              <Text style={[styles.itemQty, { color: theme.textTertiary }]}>×{item.quantity}</Text>
              <Text style={[styles.itemPrice, { color: theme.text }]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}
          <View style={[styles.totalRow, { borderTopColor: theme.border }]}>
            <Text style={[styles.totalLabel, { color: theme.text }]}>Total</Text>
            <Text style={[styles.totalValue, { color: Colors.primary }]}>{formatCurrency(order.total)}</Text>
          </View>
        </View>

        {/* Store info */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Seller</Text>
        <View style={[styles.storeCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
          <Text style={[styles.storeName, { color: theme.text }]}>{order.store?.name}</Text>
          <Text style={[styles.storeUrl, { color: Colors.primary }]}>frontstore.app/{order.store?.username}</Text>
          {order.store?.whatsapp_number && (
            <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp}>
              <MessageCircle size={16} color={Colors.white} />
              <Text style={styles.waBtnText}>Contact on WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Confirm delivery */}
        {order.status === 'shipped' && order.payment_status === 'in_escrow' && (
          <View style={[styles.confirmCard, { backgroundColor: Colors.successLight, borderColor: Colors.success }]}>
            <Text style={styles.confirmTitle}>Received your order?</Text>
            <Text style={styles.confirmDesc}>
              Confirming delivery releases payment to the seller from escrow.
            </Text>
            <Button
              title="Confirm Delivery Received"
              onPress={() => confirmDelivery()}
              isLoading={isConfirming}
              size="md"
              style={styles.confirmBtn}
            />
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  pad: { padding: Spacing[6] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4] },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.lg, letterSpacing: -0.3 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 100 },

  statusCard: { borderRadius: Radius.xl, padding: Spacing[5], gap: Spacing[5] },
  statusTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  statusLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginBottom: Spacing[1] },
  statusTotal: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl },

  stepsRow: { flexDirection: 'row', alignItems: 'flex-start' },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot: { width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[1] },
  stepLine: { position: 'absolute', top: 7, left: '50%', right: '-50%', height: 2 },
  stepLabel: { fontFamily: FontFamily.bodyRegular, fontSize: 9, textAlign: 'center' },

  placedDate: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },

  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, marginTop: Spacing[5], marginBottom: Spacing[3] },

  itemsCard: { borderRadius: Radius.lg, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[3] },
  itemName: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  itemQty: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  itemPrice: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sm, minWidth: 72, textAlign: 'right' },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], borderTopWidth: 1 },
  totalLabel: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md },
  totalValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.lg },

  storeCard: { borderRadius: Radius.lg, padding: Spacing[5], gap: Spacing[3] },
  storeName: { fontFamily: FontFamily.headingBold, fontSize: FontSize.lg },
  storeUrl: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  waBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], backgroundColor: '#25D366', paddingHorizontal: Spacing[4], paddingVertical: Spacing[3], borderRadius: Radius.lg, alignSelf: 'flex-start' },
  waBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, color: Colors.white },

  confirmCard: { borderRadius: Radius.lg, padding: Spacing[5], borderWidth: 1.5, gap: Spacing[3], marginTop: Spacing[5] },
  confirmTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md, color: '#166534' },
  confirmDesc: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, color: '#15803d', lineHeight: 20 },
  confirmBtn: { backgroundColor: Colors.success },
});
