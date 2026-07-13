import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, SafeAreaView,
  TouchableOpacity, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Phone, MessageCircle, Check, X, Send } from 'lucide-react-native';
import { Badge, getOrderStatusBadge, getPaymentStatusBadge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { merchantApi } from '@/services/merchantApi';
import { Order, OrderItem, OrderStatus } from '@/types/merchant';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { format } from 'date-fns';
import { useHaptics } from '@/hooks/useHaptics';

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(amount);

const STATUS_FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const queryClient = useQueryClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await merchantApi.getOrder(Number(id));
      return res.data;
    },
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: (status: OrderStatus) => merchantApi.updateOrderStatus(Number(id), status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['order', id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Order status updated');
      haptics.success();
    },
    onError: () => toast.error('Failed to update status'),
  });

  const { mutate: sendReceipt, isPending: isSending } = useMutation({
    mutationFn: () => merchantApi.sendReceipt(Number(id)),
    onSuccess: () => { toast.success('Receipt sent!'); haptics.success(); },
    onError: () => toast.error('Failed to send receipt'),
  });

  const nextStatus = order
    ? STATUS_FLOW[STATUS_FLOW.indexOf(order.status as OrderStatus) + 1]
    : null;

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.loaderPad}>
          <Skeleton height={300} radius={16} style={{ marginBottom: 16 }} />
          <Skeleton height={200} radius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (!order) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>#{order.reference}</Text>
        <Badge label={order.status} variant={getOrderStatusBadge(order.status)} dot />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Customer card */}
        <View style={[styles.customerCard, { backgroundColor: theme.card }, Shadow.md as any]}>
          <View style={styles.customerRow}>
            <View style={[styles.customerAvatar, { backgroundColor: Colors.primaryDim }]}>
              <Text style={styles.customerInitial}>
                {order.customer_name[0]?.toUpperCase()}
              </Text>
            </View>
            <View style={styles.customerInfo}>
              <Text style={[styles.customerName, { color: theme.text }]}>{order.customer_name}</Text>
              {order.customer_email && (
                <Text style={[styles.customerContact, { color: theme.textSecondary }]}>{order.customer_email}</Text>
              )}
              {order.customer_phone && (
                <Text style={[styles.customerContact, { color: theme.textSecondary }]}>{order.customer_phone}</Text>
              )}
            </View>
            {order.customer_phone && (
              <View style={styles.contactBtns}>
                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.successLight }]}>
                  <Phone size={16} color={Colors.success} />
                </TouchableOpacity>
                <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.infoLight }]}>
                  <MessageCircle size={16} color={Colors.info} />
                </TouchableOpacity>
              </View>
            )}
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Date</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>
                {format(new Date(order.created_at), 'MMM d, yyyy · h:mm a')}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Payment</Text>
              <Badge label={order.payment_status.replace('_', ' ')} variant={getPaymentStatusBadge(order.payment_status)} size="sm" />
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Delivery</Text>
              <Text style={[styles.detailValue, { color: theme.text, textTransform: 'capitalize' }]}>
                {order.delivery_type}
              </Text>
            </View>
            {order.delivery_address && (
              <View style={styles.detailItem}>
                <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>Address</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>{order.delivery_address}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Order items */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Items Ordered</Text>
        <View style={[styles.itemsCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
          {order.items.map((item: OrderItem, i: number) => (
            <View key={item.id} style={[styles.itemRow, i < order.items.length - 1 && { borderBottomColor: theme.border, borderBottomWidth: 1 }]}>
              <Text style={[styles.itemName, { color: theme.text }]} numberOfLines={1}>
                {item.product.name}
              </Text>
              <Text style={[styles.itemQty, { color: theme.textTertiary }]}>×{item.quantity}</Text>
              <Text style={[styles.itemPrice, { color: theme.text }]}>{formatCurrency(item.total)}</Text>
            </View>
          ))}

          <View style={[styles.totalsSection, { borderTopColor: theme.border }]}>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Subtotal</Text>
              <Text style={[styles.totalValue, { color: theme.text }]}>{formatCurrency(order.subtotal)}</Text>
            </View>
            {order.delivery_fee > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.totalLabel, { color: theme.textSecondary }]}>Delivery</Text>
                <Text style={[styles.totalValue, { color: theme.text }]}>{formatCurrency(order.delivery_fee)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={[styles.grandLabel, { color: theme.text }]}>Total</Text>
              <Text style={[styles.grandValue, { color: Colors.primary }]}>{formatCurrency(order.total)}</Text>
            </View>
          </View>
        </View>

        {/* Notes */}
        {order.notes && (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Customer Note</Text>
            <View style={[styles.noteCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Text style={[styles.noteText, { color: theme.textSecondary }]}>{order.notes}</Text>
            </View>
          </>
        )}

        {/* Status timeline */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Order Timeline</Text>
        <View style={[styles.timeline, { backgroundColor: theme.card }, Shadow.sm as any]}>
          {STATUS_FLOW.map((s, i) => {
            const currentIdx = STATUS_FLOW.indexOf(order.status as OrderStatus);
            const isDone = i <= currentIdx;
            const isCurrent = i === currentIdx;
            return (
              <View key={s} style={styles.timelineItem}>
                <View style={styles.timelineLine}>
                  <View style={[styles.timelineDot, { backgroundColor: isDone ? Colors.primary : theme.border, borderColor: isCurrent ? Colors.primary : 'transparent', borderWidth: isCurrent ? 3 : 0 }]} />
                  {i < STATUS_FLOW.length - 1 && (
                    <View style={[styles.timelineConnector, { backgroundColor: isDone && i < currentIdx ? Colors.primary : theme.border }]} />
                  )}
                </View>
                <Text style={[styles.timelineLabel, { color: isDone ? theme.text : theme.textTertiary, fontFamily: isCurrent ? FontFamily.bodySemiBold : FontFamily.bodyRegular }]}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Actions */}
      <View style={[styles.actions, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Button
          title={`Send Receipt`}
          onPress={() => sendReceipt()}
          variant="secondary"
          size="md"
          isLoading={isSending}
          icon={<Send size={16} color={Colors.primary} />}
          fullWidth={false}
          style={styles.actionBtn}
        />
        {nextStatus && order.status !== 'cancelled' && (
          <Button
            title={`Mark as ${nextStatus}`}
            onPress={() => updateStatus(nextStatus)}
            size="md"
            isLoading={isPending}
            icon={<Check size={16} color={Colors.white} />}
            style={styles.actionBtn}
          />
        )}
        {order.status === 'pending' && (
          <Button
            title="Cancel"
            onPress={() => Alert.alert('Cancel Order', 'Are you sure?', [
              { text: 'No' },
              { text: 'Yes, Cancel', style: 'destructive', onPress: () => updateStatus('cancelled') },
            ])}
            variant="danger"
            size="md"
            icon={<X size={16} color={Colors.white} />}
            fullWidth={false}
            style={styles.actionBtn}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  loaderPad: { padding: Spacing[6] },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[6],
    paddingTop: Spacing[5], paddingBottom: Spacing[4], gap: Spacing[3],
  },
  headerTitle: { flex: 1, fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 100 },

  customerCard: { borderRadius: Radius.lg, padding: Spacing[5], marginBottom: Spacing[5] },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  customerAvatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  customerInitial: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, color: Colors.primary },
  customerInfo: { flex: 1 },
  customerName: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md },
  customerContact: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, marginTop: 2 },
  contactBtns: { flexDirection: 'row', gap: Spacing[2] },
  contactBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  divider: { height: 1, marginVertical: Spacing[4] },
  detailsGrid: { gap: Spacing[3] },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  detailValue: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },

  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.md, marginBottom: Spacing[3], marginTop: Spacing[5] },

  itemsCard: { borderRadius: Radius.lg, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[4], gap: Spacing[3] },
  itemName: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  itemQty: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  itemPrice: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sm, minWidth: 80, textAlign: 'right' },
  totalsSection: { borderTopWidth: 1, padding: Spacing[5], gap: Spacing[3] },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between' },
  totalLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  totalValue: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  grandLabel: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md },
  grandValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md },

  noteCard: { borderRadius: Radius.md, padding: Spacing[4], borderWidth: 1 },
  noteText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 22 },

  timeline: { borderRadius: Radius.lg, padding: Spacing[5], flexDirection: 'row', justifyContent: 'space-between' },
  timelineItem: { alignItems: 'center', flex: 1 },
  timelineLine: { alignItems: 'center', width: '100%', position: 'relative', marginBottom: Spacing[2] },
  timelineDot: { width: 12, height: 12, borderRadius: 6, zIndex: 1 },
  timelineConnector: { position: 'absolute', left: '50%', top: 5, right: '-50%', height: 2 },
  timelineLabel: { fontSize: 10, textAlign: 'center' },

  actions: { flexDirection: 'row', padding: Spacing[4], gap: Spacing[3], borderTopWidth: 1 },
  actionBtn: { flex: 1 },
});
