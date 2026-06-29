import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Phone, MessageCircle, MapPin, ShoppingBag, TrendingUp } from 'lucide-react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Badge, getOrderStatusBadge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { OrderCard } from '@/components/merchant/OrderCard';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { format } from 'date-fns';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme } = useTheme();

  const { data, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: () => merchantApi.getCustomer(id),
    select: (r) => r.data,
    enabled: !!id,
  });

  const customer = data?.customer;
  const orders = data?.orders ?? [];

  const callCustomer = () => {
    if (customer?.phone) Linking.openURL(`tel:${customer.phone}`);
  };

  const whatsappCustomer = () => {
    if (!customer?.phone) return;
    const clean = customer.phone.replace(/\D/g, '');
    const msg = `Hi ${customer.name}, following up on your order from our store.`;
    Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
        <View style={styles.pad}>
          <Skeleton height={120} radius={16} style={{ marginBottom: Spacing[5] }} />
          <Skeleton height={200} radius={16} />
        </View>
      </SafeAreaView>
    );
  }

  if (!customer) return null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Customer Profile</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile card */}
        <View style={[styles.profileCard, { backgroundColor: theme.card }, Shadow.md as any]}>
          <Avatar name={customer.name ?? 'U'} size={64} />
          <View style={styles.profileInfo}>
            <Text style={[styles.name, { color: theme.text }]}>{customer.name ?? 'Unknown'}</Text>
            <Text style={[styles.phone, { color: theme.textSecondary }]}>{customer.phone}</Text>
            {customer.email && (
              <Text style={[styles.email, { color: theme.textTertiary }]}>{customer.email}</Text>
            )}
            {customer.address && (
              <View style={styles.addressRow}>
                <MapPin size={12} color={theme.textTertiary} />
                <Text style={[styles.address, { color: theme.textTertiary }]}>{customer.address}</Text>
              </View>
            )}
          </View>

          <View style={styles.contactBtns}>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: '#25D366' + '20' }]} onPress={whatsappCustomer}>
              <MessageCircle size={20} color="#25D366" strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.contactBtn, { backgroundColor: Colors.infoLight }]} onPress={callCustomer}>
              <Phone size={20} color={Colors.info} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          {[
            { label: 'Total Orders', value: customer.order_count ?? orders.length, Icon: ShoppingBag, color: Colors.primary },
            { label: 'Lifetime Spend', value: formatCurrency(customer.total_spent ?? 0), Icon: TrendingUp, color: Colors.success },
          ].map(({ label, value, Icon, color }) => (
            <View key={label} style={[styles.statCard, { backgroundColor: theme.card }, Shadow.sm as any]}>
              <View style={[styles.statIcon, { backgroundColor: color + '18' }]}>
                <Icon size={18} color={color} strokeWidth={2} />
              </View>
              <Text style={[styles.statValue, { color: theme.text }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: theme.textTertiary }]}>{label}</Text>
            </View>
          ))}
        </View>

        {/* First order date */}
        {customer.first_order_at && (
          <Text style={[styles.memberSince, { color: theme.textTertiary }]}>
            Customer since {format(new Date(customer.first_order_at), 'MMMM yyyy')}
          </Text>
        )}

        {/* Notes */}
        {customer.notes && (
          <View style={[styles.notesCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.notesTitle, { color: theme.text }]}>Notes</Text>
            <Text style={[styles.notesText, { color: theme.textSecondary }]}>{customer.notes}</Text>
          </View>
        )}

        {/* Order history */}
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Order History</Text>
        {orders.length > 0 ? (
          orders.map((order: any) => (
            <OrderCard
              key={order.id}
              order={order}
              onPress={() => router.push(`/(merchant)/orders/${order.id}` as any)}
            />
          ))
        ) : (
          <Text style={[styles.noOrders, { color: theme.textTertiary }]}>No orders found</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  pad: { padding: Spacing[6] },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4] },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: 100 },

  profileCard: { borderRadius: Radius.xl, padding: Spacing[5], gap: Spacing[4], marginBottom: Spacing[5] },
  profileInfo: { flex: 1, gap: Spacing[1] },
  name: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  phone: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base },
  email: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], marginTop: Spacing[1] },
  address: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, flex: 1 },
  contactBtns: { flexDirection: 'row', gap: Spacing[2] },
  contactBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[4] },
  statCard: { flex: 1, borderRadius: Radius.lg, padding: Spacing[4], gap: Spacing[2] },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl },
  statLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },

  memberSince: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, textAlign: 'center', marginBottom: Spacing[5] },

  notesCard: { borderRadius: Radius.lg, padding: Spacing[4], borderWidth: 1, marginBottom: Spacing[5], gap: Spacing[2] },
  notesTitle: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  notesText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 20 },

  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, marginBottom: Spacing[4] },
  noOrders: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, textAlign: 'center', paddingVertical: Spacing[8] },
});
