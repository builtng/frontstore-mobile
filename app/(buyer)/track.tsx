import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, TextInput, TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Search, Package } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { publicApi } from '@/services/publicApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';

export default function TrackOrderScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const [orderId, setOrderId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleTrack = async () => {
    const id = orderId.trim();
    if (!id || isNaN(Number(id))) {
      toast.error('Please enter a valid numeric order ID.');
      return;
    }
    setIsLoading(true);
    try {
      await publicApi.trackOrder(Number(id));
      router.push(`/(buyer)/orders/${id}` as any);
    } catch {
      toast.error('Order not found. Please check the ID and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>Track Order</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <View style={[styles.iconWrap, { backgroundColor: Colors.primaryDim }]}>
          <Package size={36} color={Colors.primary} strokeWidth={1.5} />
        </View>
        <Text style={[styles.heading, { color: theme.text }]}>Find your order</Text>
        <Text style={[styles.sub, { color: theme.textSecondary }]}>
          Enter the order ID you received in your WhatsApp confirmation message.
        </Text>

        <View style={[styles.inputWrap, { backgroundColor: theme.card, borderColor: theme.border }, Shadow.sm as any]}>
          <Search size={18} color={theme.textTertiary} />
          <TextInput
            style={[styles.input, { color: theme.text }]}
            placeholder="Order ID (e.g. 1042)"
            placeholderTextColor={theme.textTertiary}
            keyboardType="numeric"
            value={orderId}
            onChangeText={setOrderId}
            onSubmitEditing={handleTrack}
            returnKeyType="search"
            autoFocus
          />
        </View>

        <Button
          title="Track Order"
          onPress={handleTrack}
          isLoading={isLoading}
          disabled={!orderId.trim()}
          size="xl"
          style={styles.btn}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing[5], paddingTop: Spacing[4], paddingBottom: Spacing[2],
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl },

  content: {
    flex: 1, paddingHorizontal: Spacing[6], paddingTop: Spacing[10],
    alignItems: 'center', gap: Spacing[5],
  },
  iconWrap: { width: 80, height: 80, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  heading: { fontFamily: FontFamily.headingBold, fontSize: FontSize['2xl'], letterSpacing: -0.5, textAlign: 'center' },
  sub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, textAlign: 'center', lineHeight: 24 },

  inputWrap: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    width: '100%', borderRadius: Radius.lg, borderWidth: 1.5,
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[4],
  },
  input: { flex: 1, fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg },
  btn: { width: '100%' },
});
