import React, { useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Share, Alert, Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Download, Share2, Printer } from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import * as MediaLibrary from 'expo-media-library';
import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useModuleStatus } from '@/hooks/useModuleStatus';
import { EmptyState } from '@/components/ui/EmptyState';

export default function QRCodeScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const qrRef = useRef<any>(null);
  const moduleStatus = useModuleStatus('qr_code');
  const isPro = user?.plan === 'pro_monthly' || user?.plan === 'pro_yearly';

  const storeUrl = user?.store?.username ? `https://frontstore.ng/${user.store.username}` : 'https://frontstore.ng';

  const shareStoreLink = async () => {
    await Share.share({ message: `Shop at ${user?.store?.name ?? 'my store'} on FrontStore!\n${storeUrl}` });
  };

  const downloadQRCode = async () => {
    if (!qrRef.current) return;
    try {
      const mediaPermission = await MediaLibrary.requestPermissionsAsync();
      if (mediaPermission.status !== 'granted') {
        Alert.alert('Permission needed', 'Allow access to save QR code to your photos.');
        return;
      }
      qrRef.current.toDataURL(async (base64: string) => {
        try {
          const fileUri = FileSystem.cacheDirectory + 'qrcode.png';
          await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
          await MediaLibrary.saveToLibraryAsync(fileUri);
          Alert.alert('Saved!', 'QR code saved to your photos.');
        } catch {
          Alert.alert('Error', 'Could not save QR code.');
        }
      });
    } catch {
      Alert.alert('Error', 'Could not save QR code.');
    }
  };

  const printQRCode = async () => {
    if (!qrRef.current) return;
    qrRef.current.toDataURL(async (base64: string) => {
      try {
        const html = `
          <html><body style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;padding:40px">
            <h2 style="color:#128C7E;margin-bottom:8px">${user?.store?.name ?? 'My Store'}</h2>
            <p style="color:#666;margin-bottom:24px">Scan to visit our store</p>
            <img src="data:image/png;base64,${base64}" style="width:240px;height:240px" />
            <p style="color:#128C7E;margin-top:20px;font-size:14px">${storeUrl}</p>
          </body></html>
        `;
        await Print.printAsync({ html });
      } catch {
        Alert.alert('Error', 'Could not open print dialog.');
      }
    });
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Store QR Code</Text>
        <View style={{ width: 22 }} />
      </View>

      {moduleStatus === 'coming_soon' ? (
        <EmptyState
          type="coming-soon"
          title="My QR Code"
          description="Your store's QR code is being finalized. We'll let you know the moment it's ready."
        />
      ) : !isPro ? (
        <EmptyState
          type="generic"
          title="My QR Code is a Pro feature"
          description="Get a branded, printable QR code for your store so customers can scan and shop instantly. Upgrade to Pro to unlock it."
          actionLabel="Upgrade to Pro"
          onAction={() => Linking.openURL('https://frontstore.ng/dashboard?tab=billing')}
        />
      ) : (
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
          Share or print this code — customers scan it to open your store instantly.
        </Text>

        {/* QR Code */}
        <View style={[styles.qrCard, { backgroundColor: theme.card }, Shadow.md as any]}>
          <View style={[styles.qrWrapper, { backgroundColor: Colors.white }]}>
            <QRCode
              value={storeUrl}
              size={220}
              color="#128C7E"
              backgroundColor={Colors.white}
              getRef={(ref) => { qrRef.current = ref; }}
              logo={require('../../assets/icon.png')}
              logoSize={48}
              logoBackgroundColor={Colors.white}
              logoBorderRadius={10}
            />
          </View>
          <Text style={[styles.storeName, { color: theme.text }]}>{user?.store?.name ?? 'My Store'}</Text>
          <Text style={[styles.qrUrl, { color: Colors.primary }]}>{storeUrl}</Text>
        </View>

        {/* Action buttons */}
        <View style={styles.qrActions}>
          <TouchableOpacity style={[styles.qrActionBtn, { backgroundColor: Colors.primaryDim }]} onPress={downloadQRCode}>
            <Download size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={[styles.qrActionText, { color: Colors.primary }]}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.qrActionBtn, { backgroundColor: Colors.primaryDim }]} onPress={shareStoreLink}>
            <Share2 size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={[styles.qrActionText, { color: Colors.primary }]}>Share</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.qrActionBtn, { backgroundColor: Colors.primaryDim }]} onPress={printQRCode}>
            <Printer size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={[styles.qrActionText, { color: Colors.primary }]}>Print</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[8] },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4] },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },

  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.sm, textAlign: 'center', lineHeight: 20, marginBottom: Spacing[6] },

  qrCard: { borderRadius: Radius.xl, padding: Spacing[6], alignItems: 'center', gap: Spacing[4] },
  qrWrapper: { padding: Spacing[5], borderRadius: Radius.lg },
  storeName: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg },
  qrUrl: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs, textAlign: 'center', marginTop: -Spacing[2] },

  qrActions: { flexDirection: 'row', gap: Spacing[3], marginTop: Spacing[6] },
  qrActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing[2], paddingVertical: Spacing[4], borderRadius: Radius.lg },
  qrActionText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
});
