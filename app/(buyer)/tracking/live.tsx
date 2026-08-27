import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MoreHorizontal,
  Plus,
  Minus,
  MessageSquare,
  Phone,
  Navigation,
  MapPin,
} from 'lucide-react-native';
import { FontFamily } from '@/constants/typography';

const { width } = Dimensions.get('window');

export default function LiveTrackingMapScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [zoomLevel, setZoomLevel] = useState(1);

  const courier = {
    name: 'Ralph Edwards',
    role: 'Delivery Man',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&q=80',
    weight: '1.50 Kg',
    estimate: '15-20 mins',
    status: 'In Transit',
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Floating Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.floatingCircleBtn}
          activeOpacity={0.7}
          onPress={() => router.back()}
        >
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>

        <Text style={styles.topHeaderTitle}>Live Tracking</Text>

        <TouchableOpacity style={styles.floatingCircleBtn} activeOpacity={0.7}>
          <MoreHorizontal size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Simulated Clean Vector Map Canvas */}
      <View style={styles.mapContainer}>
        {/* Background Grid & Roads Pattern */}
        <View style={styles.mapBackground}>
          {/* Diagonal & orthogonal roads */}
          <View style={[styles.roadHorizontal, { top: '22%' }]} />
          <View style={[styles.roadHorizontal, { top: '48%' }]} />
          <View style={[styles.roadHorizontal, { top: '75%' }]} />
          <View style={[styles.roadVertical, { left: '30%' }]} />
          <View style={[styles.roadVertical, { left: '72%' }]} />
          <View style={[styles.roadDiagonal, { top: '15%', left: '10%' }]} />

          {/* Street Labels */}
          <Text style={[styles.streetLabel, { top: '18%', left: '34%' }]}>Ahmadu Bello Way</Text>
          <Text style={[styles.streetLabel, { top: '44%', left: '15%' }]}>Ozumba Mbadiwe Ave</Text>
          <Text style={[styles.streetLabel, { top: '70%', left: '38%' }]}>Admiralty Way, Lekki</Text>

          {/* Map Polyline Route (SVG-style CSS simulation) */}
          <View style={styles.routeContainer}>
            {/* Origin Point */}
            <View style={styles.originPoint}>
              <View style={styles.originPointInner} />
            </View>

            {/* Connecting Path Lines */}
            <View style={styles.routeSegment1} />
            <View style={styles.routeSegment2} />

            {/* Courier Pulse Location Marker */}
            <View style={styles.courierLocationBeacon}>
              <View style={styles.beaconRing3} />
              <View style={styles.beaconRing2} />
              <View style={styles.beaconCore}>
                <Navigation size={14} color="#FFFFFF" fill="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
              </View>
            </View>

            {/* Destination Marker */}
            <View style={styles.destinationMarker}>
              <MapPin size={22} color="#0F172A" fill="#0F172A" />
            </View>
          </View>
        </View>

        {/* Floating Zoom Controls */}
        <View style={styles.zoomControls}>
          <TouchableOpacity
            style={styles.zoomBtn}
            activeOpacity={0.7}
            onPress={() => setZoomLevel((z) => Math.min(z + 0.2, 2))}
          >
            <Plus size={18} color="#0F172A" />
          </TouchableOpacity>
          <View style={styles.zoomDivider} />
          <TouchableOpacity
            style={styles.zoomBtn}
            activeOpacity={0.7}
            onPress={() => setZoomLevel((z) => Math.max(z - 0.2, 0.8))}
          >
            <Minus size={18} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Floating Bottom Sheet: Package Information */}
      <View style={styles.bottomSheet}>
        <Text style={styles.sheetTitle}>Package Information</Text>

        {/* Courier Profile & Action Buttons */}
        <View style={styles.courierRow}>
          <View style={styles.courierAvatarWrap}>
            <Image source={{ uri: courier.avatar }} style={styles.courierAvatar} />
          </View>

          <View style={styles.courierDetails}>
            <Text style={styles.courierName}>{courier.name}</Text>
            <Text style={styles.courierRole}>{courier.role}</Text>
          </View>

          <View style={styles.courierActions}>
            <TouchableOpacity
              style={styles.chatActionBtn}
              activeOpacity={0.8}
              onPress={() => router.push(`/(buyer)/tracking/chat?id=${id}` as any)}
            >
              <MessageSquare size={18} color="#128C7E" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.callActionBtn}
              activeOpacity={0.8}
              onPress={() => router.push(`/(buyer)/tracking/call?id=${id}` as any)}
            >
              <Phone size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashed / Subtle Divider */}
        <View style={styles.sheetDivider} />

        {/* Key Metrics Row */}
        <View style={styles.metricsRow}>
          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Weight</Text>
            <Text style={styles.metricValue}>{courier.weight}</Text>
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Estimate</Text>
            <Text style={styles.metricValue}>{courier.estimate}</Text>
          </View>

          <View style={styles.metricCol}>
            <Text style={styles.metricLabel}>Status</Text>
            <Text style={[styles.metricValue, { color: '#128C7E' }]}>{courier.status}</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  floatingCircleBtn: {
    width: 44,
    height: 44,
    borderRadius: 9999,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  topHeaderTitle: {
    fontSize: 17,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  mapContainer: {
    flex: 1,
    position: 'relative',
    backgroundColor: '#F1F5F9',
  },
  mapBackground: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#F1F5F9',
  },
  roadHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  roadVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 14,
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
  },
  roadDiagonal: {
    position: 'absolute',
    width: 300,
    height: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ rotate: '35deg' }],
  },
  streetLabel: {
    position: 'absolute',
    fontSize: 10.5,
    fontFamily: FontFamily.headingSemiBold,
    color: '#94A3B8',
    letterSpacing: 0.2,
  },
  routeContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  originPoint: {
    position: 'absolute',
    top: '26%',
    left: '70%',
    width: 16,
    height: 16,
    borderRadius: 9999,
    backgroundColor: 'rgba(18, 140, 126, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  originPointInner: {
    width: 8,
    height: 8,
    borderRadius: 9999,
    backgroundColor: '#128C7E',
  },
  routeSegment1: {
    position: 'absolute',
    top: '28%',
    left: '42%',
    width: 130,
    height: 4,
    backgroundColor: '#128C7E',
    transform: [{ rotate: '-35deg' }],
  },
  routeSegment2: {
    position: 'absolute',
    top: '38%',
    left: '35%',
    width: 4,
    height: 110,
    backgroundColor: '#128C7E',
  },
  courierLocationBeacon: {
    position: 'absolute',
    top: '52%',
    left: '32%',
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconRing3: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
  },
  beaconRing2: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(18, 140, 126, 0.25)',
  },
  beaconCore: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#128C7E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 5,
  },
  destinationMarker: {
    position: 'absolute',
    top: '24%',
    left: '72%',
  },
  zoomControls: {
    position: 'absolute',
    right: 20,
    bottom: 240,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 36,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  sheetTitle: {
    fontSize: 16.5,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
    marginBottom: 16,
  },
  courierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  courierAvatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 9999,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(18, 140, 126, 0.2)',
  },
  courierAvatar: {
    width: '100%',
    height: '100%',
  },
  courierDetails: {
    flex: 1,
  },
  courierName: {
    fontSize: 15,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  courierRole: {
    fontSize: 12.5,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: 2,
  },
  courierActions: {
    flexDirection: 'row',
    gap: 10,
  },
  chatActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 9999,
    backgroundColor: 'rgba(18, 140, 126, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  callActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 9999,
    backgroundColor: '#128C7E',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#128C7E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  sheetDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 18,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricCol: {
    flex: 1,
  },
  metricLabel: {
    fontSize: 12,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
  },
  metricValue: {
    fontSize: 14.5,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
    marginTop: 3,
  },
});
