import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Image,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  MoreHorizontal,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  PhoneOff,
} from 'lucide-react-native';
import { FontFamily } from '@/constants/typography';

const WAVE_BARS = [14, 28, 42, 56, 38, 62, 48, 30, 52, 68, 44, 26, 40, 58, 32, 18];

export default function CourierCallScreen() {
  const router = useRouter();
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [callState, setCallState] = useState<'calling' | 'connected'>('calling');

  useEffect(() => {
    // Simulate pickup after 2.5s
    const connectTimer = setTimeout(() => {
      setCallState('connected');
    }, 2500);

    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (callState === 'connected') {
      const interval = setInterval(() => {
        setCallDuration((d) => d + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [callState]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <MoreHorizontal size={22} color="#0F172A" />
        </TouchableOpacity>
      </View>

      {/* Center Caller Info */}
      <View style={styles.centerContainer}>
        {/* Avatar with Glow Ring */}
        <View style={styles.avatarGlowContainer}>
          <View style={styles.avatarRing}>
            <Image
              source={{
                uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&q=80',
              }}
              style={styles.avatarImage}
            />
          </View>
        </View>

        {/* Courier Name & Role */}
        <Text style={styles.courierName}>Ralph Edwards</Text>
        <Text style={styles.courierRole}>Delivery Man</Text>

        <Text style={styles.callStatus}>
          {callState === 'calling' ? 'Calling...' : formatTimer(callDuration)}
        </Text>

        {/* Audio Soundwave Visualization */}
        <View style={styles.waveformContainer}>
          {WAVE_BARS.map((height, idx) => {
            const isActive = idx < 9;
            return (
              <View
                key={idx}
                style={[
                  styles.waveformBar,
                  {
                    height: callState === 'connected' ? height : Math.max(10, height * 0.4),
                    backgroundColor: isActive ? '#128C7E' : '#E2E8F0',
                  },
                ]}
              />
            );
          })}
        </View>
      </View>

      {/* Bottom Floating Call Controls */}
      <View style={styles.bottomControls}>
        {/* Speaker Toggle */}
        <TouchableOpacity
          style={[styles.controlBtn, isSpeakerOn && styles.controlBtnActive]}
          activeOpacity={0.8}
          onPress={() => setIsSpeakerOn(!isSpeakerOn)}
        >
          {isSpeakerOn ? (
            <Volume2 size={22} color="#128C7E" />
          ) : (
            <VolumeX size={22} color="#64748B" />
          )}
        </TouchableOpacity>

        {/* End Call Button */}
        <TouchableOpacity
          style={styles.endCallBtn}
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <PhoneOff size={28} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Mute Toggle */}
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          activeOpacity={0.8}
          onPress={() => setIsMuted(!isMuted)}
        >
          {isMuted ? (
            <MicOff size={22} color="#EF4444" />
          ) : (
            <Mic size={22} color="#64748B" />
          )}
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
    paddingBottom: 10,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginTop: -40,
  },
  avatarGlowContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  avatarRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
    padding: 6,
    borderWidth: 2,
    borderColor: '#128C7E',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  courierName: {
    fontSize: 22,
    fontFamily: FontFamily.headingBold,
    color: '#0F172A',
  },
  courierRole: {
    fontSize: 14,
    fontFamily: FontFamily.bodyRegular,
    color: '#64748B',
    marginTop: 4,
  },
  callStatus: {
    fontSize: 15,
    fontFamily: FontFamily.headingSemiBold,
    color: '#128C7E',
    marginTop: 18,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 80,
    marginTop: 36,
  },
  waveformBar: {
    width: 4,
    borderRadius: 9999,
  },
  bottomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 32,
    paddingBottom: 50,
  },
  controlBtn: {
    width: 58,
    height: 58,
    borderRadius: 9999,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnActive: {
    backgroundColor: 'rgba(18, 140, 126, 0.12)',
    borderWidth: 1,
    borderColor: '#128C7E',
  },
  endCallBtn: {
    width: 68,
    height: 68,
    borderRadius: 9999,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 6,
  },
});
