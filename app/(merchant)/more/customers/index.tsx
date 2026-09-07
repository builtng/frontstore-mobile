import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TouchableOpacity,
  RefreshControl, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Phone, MessageCircle, Users, TrendingUp, ArrowLeft } from 'lucide-react-native';
import { SearchBar } from '@/components/ui/SearchBar';
import { Avatar } from '@/components/ui/Avatar';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', minimumFractionDigits: 0 }).format(n);

export default function CustomersScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['customers', search],
    queryFn: () => merchantApi.getCustomers({ search: search || undefined }),
    select: (r) => r.data ?? [],
  });

  const customers: any[] = data ?? [];

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const callCustomer = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const whatsappCustomer = (phone: string, name: string) => {
    const clean = phone.replace(/\D/g, '');
    const msg = `Hi ${name}, this is a message from your FrontStore merchant.`;
    Linking.openURL(`https://wa.me/${clean}?text=${encodeURIComponent(msg)}`);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.text }]}>Customers</Text>
          <Text style={[styles.count, { color: theme.textSecondary }]}>
            {data?.length ?? 0} total customers
          </Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: Colors.glow.primarySoft }]}>
          <Users size={14} color={Colors.primaryLight} />
          <Text style={[styles.statChipText, { color: Colors.primaryLight }]}>
            {data?.length ?? 0}
          </Text>
        </View>
      </View>

      <View style={styles.searchWrap}>
        <SearchBar value={search} onChangeText={setSearch} placeholder="Search by name or phone..." />
      </View>

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)}
        </View>
      ) : (
        <FlashList
          data={customers}
          keyExtractor={(c) => String(c.id ?? c.phone_number ?? c.phone)}
          estimatedItemSize={80}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primaryLight} />}
          renderItem={({ item: customer }) => {
            const phone = customer.phone_number || customer.phone || '';
            const orderCount = customer.purchase_count ?? customer.order_count ?? customer.store_order_count ?? 0;
            const totalSpent = Number(customer.lifetime_value ?? customer.total_spent ?? 0);

            return (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.card }, Shadow.sm as any]}
                onPress={() => router.push(`/(merchant)/more/customers/${customer.id ?? phone}` as any)}
                activeOpacity={0.82}
              >
                <Avatar name={customer.name ?? 'Customer'} size={48} />

                <View style={styles.info}>
                  <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                    {customer.name ?? 'Customer'}
                  </Text>
                  {phone ? (
                    <Text style={[styles.phone, { color: theme.textSecondary }]}>{phone}</Text>
                  ) : null}
                  <View style={styles.metaRow}>
                    <Text style={[styles.meta, { color: theme.textTertiary }]}>
                      {orderCount} order{orderCount !== 1 ? 's' : ''}
                    </Text>
                    {totalSpent > 0 && (
                      <Text style={[styles.meta, { color: Colors.primaryLight }]}>
                        · {formatCurrency(totalSpent)}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.actions}>
                  {phone ? (
                    <>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.successLight }]}
                        onPress={() => whatsappCustomer(phone, customer.name)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <MessageCircle size={16} color={Colors.success} strokeWidth={2} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.actionBtn, { backgroundColor: Colors.infoLight }]}
                        onPress={() => callCustomer(phone)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Phone size={16} color={Colors.info} strokeWidth={2} />
                      </TouchableOpacity>
                    </>
                  ) : null}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              type="customers"
              title="No customers yet"
              description="Customers appear here once they place their first order from your store."
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing[6], paddingTop: Spacing[4], paddingBottom: Spacing[3], gap: 12,
  },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['2xl'], letterSpacing: -0.5 },
  count: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, marginTop: 2 },
  statChip: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], paddingHorizontal: Spacing[3], paddingVertical: Spacing[2], borderRadius: Radius.full },
  statChipText: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sm },
  searchWrap: { paddingHorizontal: Spacing[6], marginBottom: Spacing[4] },
  list: { paddingHorizontal: Spacing[6], paddingBottom: 120 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: Radius.lg, padding: Spacing[4], gap: Spacing[3], marginBottom: Spacing[3] },
  info: { flex: 1 },
  name: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.base },
  phone: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, marginTop: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], marginTop: Spacing[1] },
  meta: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
  actions: { flexDirection: 'row', gap: Spacing[2] },
  actionBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
});
