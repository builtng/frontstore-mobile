import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CalendarDays, Clock, Users, Plus, Check, X } from 'lucide-react-native';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { merchantApi } from '@/services/merchantApi';
import { Booking } from '@/types/merchant';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { format, parseISO } from 'date-fns';

const STATUS_FILTERS = ['all', 'pending', 'confirmed', 'cancelled', 'completed'];

const getBookingBadge = (status: string) => {
  const map: Record<string, any> = {
    pending: 'warning',
    confirmed: 'success',
    cancelled: 'danger',
    completed: 'info',
  };
  return map[status] ?? 'neutral';
};

export default function BookingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const queryClient = useQueryClient();
  const [activeStatus, setActiveStatus] = useState('all');
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'bookings' | 'slots'>('bookings');

  const { data: bookings, isLoading, refetch } = useQuery({
    queryKey: ['bookings', activeStatus],
    queryFn: () => merchantApi.getBookings({ status: activeStatus === 'all' ? undefined : activeStatus }),
    select: (r) => r.data ?? [],
  });

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      merchantApi.updateBookingStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      toast.success('Booking updated');
      haptics.success();
    },
    onError: () => toast.error('Failed to update booking'),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Bookings</Text>
        <TouchableOpacity style={[styles.addBtn, { backgroundColor: Colors.primaryDim }]}>
          <Plus size={18} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabs, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {(['bookings', 'slots'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && { backgroundColor: Colors.primary }]}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab ? Colors.white : theme.textSecondary }]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Status filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
        {STATUS_FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setActiveStatus(f)}
            style={[
              styles.filterChip,
              { backgroundColor: activeStatus === f ? Colors.primary : theme.card, borderColor: activeStatus === f ? Colors.primary : theme.border },
            ]}
          >
            <Text style={[styles.filterLabel, { color: activeStatus === f ? Colors.white : theme.textSecondary }]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          [1, 2, 3].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)
        ) : (bookings as Booking[])?.length ? (
          (bookings as Booking[]).map((booking) => (
            <View key={booking.id} style={[styles.bookingCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
              <View style={styles.bookingTop}>
                <View style={[styles.bookingIcon, { backgroundColor: Colors.primaryDim }]}>
                  <CalendarDays size={18} color={Colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.bookingInfo}>
                  <Text style={[styles.bookingRef, { color: theme.text }]}>#{booking.booking_reference}</Text>
                  <Text style={[styles.bookingCustomer, { color: theme.textSecondary }]}>{booking.customer_name}</Text>
                </View>
                <Badge label={booking.status} variant={getBookingBadge(booking.status)} dot size="sm" />
              </View>

              <View style={[styles.bookingDetails, { backgroundColor: theme.background, borderRadius: Radius.md }]}>
                <View style={styles.bookingDetailItem}>
                  <CalendarDays size={14} color={theme.textTertiary} />
                  <Text style={[styles.bookingDetailText, { color: theme.textSecondary }]}>
                    {booking.slot?.slot_date
                      ? format(parseISO(booking.slot.slot_date), 'MMM d, yyyy')
                      : '—'}
                  </Text>
                </View>
                <View style={styles.bookingDetailItem}>
                  <Clock size={14} color={theme.textTertiary} />
                  <Text style={[styles.bookingDetailText, { color: theme.textSecondary }]}>
                    {booking.slot?.start_time} – {booking.slot?.end_time}
                  </Text>
                </View>
                {booking.customer_phone && (
                  <View style={styles.bookingDetailItem}>
                    <Users size={14} color={theme.textTertiary} />
                    <Text style={[styles.bookingDetailText, { color: theme.textSecondary }]}>
                      {booking.customer_phone}
                    </Text>
                  </View>
                )}
              </View>

              {booking.status === 'pending' && (
                <View style={styles.bookingActions}>
                  <Button
                    title="Confirm"
                    onPress={() => updateStatus({ id: booking.id, status: 'confirmed' })}
                    size="sm"
                    isLoading={isPending}
                    icon={<Check size={14} color={Colors.white} />}
                    style={styles.confirmBtn}
                  />
                  <Button
                    title="Cancel"
                    onPress={() => updateStatus({ id: booking.id, status: 'cancelled' })}
                    size="sm"
                    variant="danger"
                    icon={<X size={14} color={Colors.white} />}
                    style={styles.cancelBtn}
                  />
                </View>
              )}
            </View>
          ))
        ) : (
          <EmptyState
            type="bookings"
            actionLabel="Create Time Slot"
            onAction={() => {}}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4] },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', marginHorizontal: Spacing[6], borderRadius: Radius.lg, borderWidth: 1, padding: 4, marginBottom: Spacing[4] },
  tab: { flex: 1, alignItems: 'center', paddingVertical: Spacing[2], borderRadius: Radius.md },
  tabLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  filters: { paddingHorizontal: Spacing[6], gap: Spacing[2], paddingBottom: Spacing[4] },
  filterChip: { paddingHorizontal: Spacing[4], paddingVertical: Spacing[2], borderRadius: 20, borderWidth: 1.5 },
  filterLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 100 },
  bookingCard: { borderRadius: Radius.lg, padding: Spacing[4], marginBottom: Spacing[3], gap: Spacing[4] },
  bookingTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  bookingIcon: { width: 40, height: 40, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center' },
  bookingInfo: { flex: 1 },
  bookingRef: { fontFamily: FontFamily.headingBold, fontSize: FontSize.base },
  bookingCustomer: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 2 },
  bookingDetails: { padding: Spacing[3], gap: Spacing[2] },
  bookingDetailItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  bookingDetailText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  bookingActions: { flexDirection: 'row', gap: Spacing[3] },
  confirmBtn: { flex: 1 },
  cancelBtn: { flex: 1 },
});
