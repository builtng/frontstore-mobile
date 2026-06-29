import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bell, ShoppingBag, CreditCard, Package, Users, CheckCheck } from 'lucide-react-native';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonCard } from '@/components/ui/SkeletonLoader';
import { Button } from '@/components/ui/Button';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { format } from 'date-fns';

const NOTIF_ICONS: Record<string, { Icon: any; color: string }> = {
  order: { Icon: ShoppingBag, color: Colors.primary },
  payment: { Icon: CreditCard, color: Colors.success },
  product: { Icon: Package, color: Colors.warning },
  customer: { Icon: Users, color: Colors.info },
  default: { Icon: Bell, color: Colors.gray500 },
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: merchantApi.getNotifications,
    select: (r) => r.data ?? [],
  });

  const { mutate: markRead } = useMutation({
    mutationFn: merchantApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const { mutate: markAllRead, isPending: isMarkingAll } = useMutation({
    mutationFn: merchantApi.markAllNotificationsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications: any[] = data ?? [];
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={() => markAllRead()}>
            <CheckCheck size={20} color={Colors.primary} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 20 }} />
        )}
      </View>

      {unreadCount > 0 && (
        <View style={[styles.unreadBanner, { backgroundColor: Colors.primaryDim }]}>
          <Bell size={14} color={Colors.primary} />
          <Text style={[styles.unreadText, { color: Colors.primary }]}>
            {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
          </Text>
          <TouchableOpacity onPress={() => markAllRead()}>
            <Text style={[styles.markAllText, { color: Colors.primary }]}>Mark all read</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.list}>
          {[1, 2, 3, 4].map((i) => <SkeletonCard key={i} style={{ marginBottom: Spacing[3] }} />)}
        </View>
      ) : notifications.length ? (
        <ScrollView
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await refetch(); setRefreshing(false); }} tintColor={Colors.primary} />}
        >
          {notifications.map((notif: any) => {
            const { Icon, color } = NOTIF_ICONS[notif.type] ?? NOTIF_ICONS.default;
            return (
              <TouchableOpacity
                key={notif.id}
                style={[
                  styles.notifCard,
                  { backgroundColor: notif.is_read ? theme.card : Colors.primaryDim + '60' },
                  Shadow.sm as any,
                ]}
                onPress={() => {
                  if (!notif.is_read) markRead(notif.id);
                  if (notif.order_id) router.push(`/(merchant)/orders/${notif.order_id}` as any);
                }}
                activeOpacity={0.8}
              >
                <View style={[styles.notifIcon, { backgroundColor: color + '18' }]}>
                  <Icon size={20} color={color} strokeWidth={2} />
                </View>
                <View style={styles.notifContent}>
                  <Text style={[styles.notifTitle, { color: theme.text }]} numberOfLines={1}>
                    {notif.title}
                  </Text>
                  <Text style={[styles.notifBody, { color: theme.textSecondary }]} numberOfLines={2}>
                    {notif.body ?? notif.message}
                  </Text>
                  <Text style={[styles.notifTime, { color: theme.textTertiary }]}>
                    {format(new Date(notif.created_at), 'MMM d · h:mm a')}
                  </Text>
                </View>
                {!notif.is_read && <View style={[styles.unreadDot, { backgroundColor: Colors.primary }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      ) : (
        <EmptyState
          type="generic"
          title="No notifications yet"
          description="You'll be notified when you receive new orders, payments, and customer activity."
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  unreadBanner: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2], paddingHorizontal: Spacing[6], paddingVertical: Spacing[3], marginBottom: Spacing[2] },
  unreadText: { flex: 1, fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  markAllText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, textDecorationLine: 'underline' },
  list: { paddingHorizontal: Spacing[6], paddingBottom: 100 },
  notifCard: { flexDirection: 'row', alignItems: 'flex-start', borderRadius: Radius.lg, padding: Spacing[4], gap: Spacing[3], marginBottom: Spacing[3] },
  notifIcon: { width: 42, height: 42, borderRadius: Radius.sm, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  notifContent: { flex: 1, gap: 3 },
  notifTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.base },
  notifBody: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, lineHeight: 18 },
  notifTime: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: Spacing[1] },
});
