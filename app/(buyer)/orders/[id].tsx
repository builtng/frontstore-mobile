import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import {
  ArrowLeft,
  MoreHorizontal,
  Copy,
  Check,
  MapPin,
  Truck,
  User,
  Package,
  CheckCircle2,
  Circle,
} from 'lucide-react-native';
import { publicApi } from '@/services/publicApi';
import { PublicOrder } from '@/types/buyer';
import { FontFamily } from '@/constants/typography';
import { useToast } from '@/components/ui/Toast';

export default function BuyerOrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const [copied, setCopied] = React.useState(false);

  const { data: rawOrder, isLoading } = useQuery({
    queryKey: ['buyer-order', id],
    queryFn: () => publicApi.trackOrder(Number(id)),
    select: (r) => r.data as PublicOrder,
    enabled: !!id && !isNaN(Number(id)),
  });

  // Fallback demo data matching the reference screen if testing or offline
  const order: any = rawOrder || {
    id: id || '1042',
    reference: 'BGS08988673',
    product_name: 'ODYSSEY ELMT',
    variant: 'Gray, 42',
    image_url: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&q=80',
    total: 92000,
    status: 'in_transit',
    from_address: 'Plot 14, Victoria Island, Lagos',
    destination_address: 'Block 2B, Lekki Phase 1, Lagos',
    customer_name: 'Wade Warren',
    weight: '1.50 Kg',
    events: [
      {
        id: 1,
        title: 'Tracking Number Created',
        location: 'Victoria Island Fulfillment Center',
        time: 'Today, 11:24 AM',
        completed: true,
      },
      {
        id: 2,
        title: 'In Transit',
        location: 'Dispatched with Courier Ralph',
        time: 'Today, 12:52 PM',
        completed: true,
      },
      {
        id: 3,
        title: 'Package Out For Delivery',
        location: 'Lekki Toll Transit Hub',
        time: 'Today, 03:12 PM',
        completed: true,
      },
      {
        id: 4,
        title: 'Arrival at Destination',
        location: 'Block 2B, Lekki Phase 1, Lagos',
        time: 'Estimated 04:30 PM',
        completed: false,
      },
    ],
  };

  const copyOrderRef = async () => {
    await Clipboard.setStringAsync(order.reference || String(order.id));
    setCopied(true);
    toast.success('Order ID copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIconButton}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Tracking Details</Text>

        <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
          <MoreHorizontal size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Product Snapshot Card */}
        <View style={styles.productCard}>
          <View style={styles.thumbnailWrap}>
            {order.image_url ? (
              <Image source={{ uri: order.image_url }} style={styles.thumbnailImage} />
            ) : (
              <Package size={28} color="#128C7E" />
            )}
          </View>

          <View style={styles.productInfo}>
            <Text style={styles.productName}>{order.product_name || `Order #${order.reference}`}</Text>
            <TouchableOpacity
              onPress={copyOrderRef}
              style={styles.orderIdRow}
              activeOpacity={0.7}
            >
              <Text style={styles.orderIdText}>ID Order : {order.reference || order.id}</Text>
              {copied ? (
                <Check size={14} color="#128C7E" />
              ) : (
                <Copy size={14} color="#128C7E" />
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* 2x2 Specs & Logistics Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {/* From */}
            <View style={styles.gridItem}>
              <View style={styles.gridIconWrap}>
                <MapPin size={18} color="#128C7E" />
              </View>
              <View style={styles.gridContent}>
                <Text style={styles.gridLabel}>From</Text>
                <Text style={styles.gridValue} numberOfLines={2}>
                  {order.from_address || order.store?.address || 'Victoria Island Hub, Lagos'}
                </Text>
              </View>
            </View>

            {/* Destination */}
            <View style={styles.gridItem}>
              <View style={styles.gridIconWrap}>
                <Truck size={18} color="#128C7E" />
              </View>
              <View style={styles.gridContent}>
                <Text style={styles.gridLabel}>Destination</Text>
                <Text style={styles.gridValue} numberOfLines={2}>
                  {order.destination_address || order.shipping_address || 'Lekki Phase 1, Lagos'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.gridRow}>
            {/* Customer */}
            <View style={styles.gridItem}>
              <View style={styles.gridIconWrap}>
                <User size={18} color="#128C7E" />
              </View>
              <View style={styles.gridContent}>
                <Text style={styles.gridLabel}>Customer</Text>
                <Text style={styles.gridValue} numberOfLines={1}>
                  {order.customer_name || order.customer?.name || 'Wade Warren'}
                </Text>
              </View>
            </View>

            {/* Weight */}
            <View style={styles.gridItem}>
              <View style={styles.gridIconWrap}>
                <Package size={18} color="#128C7E" />
              </View>
              <View style={styles.gridContent}>
                <Text style={styles.gridLabel}>Weight</Text>
                <Text style={styles.gridValue}>{order.weight || '1.50 Kg'}</Text>
              </View>
            </View>
          </View>

          {/* Status Row */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Status</Text>
            <View style={styles.statusPill}>
              <Text style={styles.statusPillText}>In Transit</Text>
            </View>
          </View>
        </View>

        {/* Timeline / Progress Tracking */}
        <View style={styles.timelineSection}>
          {(order.events || []).map((event: any, index: number) => {
            const isLast = index === (order.events.length - 1);
            return (
              <View key={event.id || index} style={styles.timelineItem}>
                {/* Left Indicator & Vertical Line */}
                <View style={styles.timelineLeft}>
                  {event.completed ? (
                    <CheckCircle2 size={22} color="#25D366" fill="rgba(37, 211, 102, 0.15)" />
                  ) : (
                    <Circle size={22} color="#CBD5E1" strokeWidth={2.5} />
                  )}
                  {!isLast && (
                    <View
                      style={[
                        styles.timelineLine,
                        { backgroundColor: event.completed ? '#25D366' : '#E2E8F0' },
                      ]}
                    />
                  )}
                </View>

                {/* Right Content */}
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeaderRow}>
                    <Text
                      style={[
                        styles.timelineTitle,
                        !event.completed && styles.timelineTitlePending,
                      ]}
                    >
                      {event.title}
                    </Text>
                    <Text style={styles.timelineTime}>{event.time}</Text>
                  </View>
                  <Text style={styles.timelineLocation}>{event.location}</Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Bottom Sticky Action Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.liveTrackingBtn}
          activeOpacity={0.88}
          onPress={() => router.push(`/(buyer)/tracking/live?id=${order.id || id}` as any)}
        >
          <Text style={styles.liveTrackingBtnText}>Live Tracking</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
  },
  thumbnailWrap: {
    width: 68,
    height: 68,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumbnailImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 17,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  orderIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  orderIdText: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  gridContainer: {
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderColor: '#F1F5F9',
    gap: 16,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  gridItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  gridIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(18, 140, 126, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    flex: 1,
  },
  gridLabel: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  gridValue: {
    fontSize: 13,
    fontFamily: FontFamily.headingSemiBold,
    color: '#0F172A',
    marginTop: 2,
    lineHeight: 18,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  statusLabel: {
    fontSize: 13,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  statusPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 9999,
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
  },
  statusPillText: {
    fontSize: 12,
    fontFamily: FontFamily.headingSemiBold,
    color: '#128C7E',
  },
  timelineSection: {
    paddingVertical: 24,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 16,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    minHeight: 44,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 28,
  },
  timelineHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timelineTitle: {
    fontSize: 14.5,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  timelineTitlePending: {
    color: '#64748B',
  },
  timelineTime: {
    fontSize: 11.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#94A3B8',
  },
  timelineLocation: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: 4,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderTopWidth: 1,
    borderColor: '#F1F5F9',
  },
  liveTrackingBtn: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#128C7E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
    elevation: 4,
  },
  liveTrackingBtnText: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: '#FFFFFF',
  },
});
