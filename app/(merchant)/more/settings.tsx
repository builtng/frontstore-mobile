import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ArrowLeft, Camera, Globe, CheckCircle } from 'lucide-react-native';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/SkeletonLoader';
import { useToast } from '@/components/ui/Toast';
import { merchantApi } from '@/services/merchantApi';
import { useAuthStore } from '@/stores/authStore';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

export default function SettingsScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const queryClient = useQueryClient();
  const { user, updateStore } = useAuthStore();
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const { data: store, isLoading } = useQuery({
    queryKey: ['store'],
    queryFn: merchantApi.getStore,
    select: (r) => r.data,
  });

  const { mutate: saveStore, isPending } = useMutation({
    mutationFn: (payload: any) => merchantApi.updateStore(payload),
    onSuccess: (r) => {
      updateStore(r.data);
      queryClient.invalidateQueries({ queryKey: ['store'] });
      toast.success('Store updated!');
      haptics.success();
    },
    onError: () => toast.error('Failed to update store'),
  });

  const isPro = user?.plan === 'pro_monthly' || user?.plan === 'pro_yearly';

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      whatsapp_number: '',
      currency: 'NGN',
      username: '',
    },
  });

  // Populate form once store data arrives from the API
  useEffect(() => {
    if (store) {
      reset({
        name: store.name ?? '',
        description: store.description ?? '',
        whatsapp_number: store.whatsapp_number ?? '',
        currency: store.currency ?? 'NGN',
        username: store.username ?? '',
      });
    } else if (user?.store) {
      reset({
        name: user.store.name ?? '',
        description: '',
        whatsapp_number: '',
        currency: user.store.currency ?? 'NGN',
        username: user.store.username ?? '',
      });
    }
  }, [store, user?.store]);

  const pickAndUploadLogo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadingLogo(true);
      try {
        const formData = new FormData();
        formData.append('logo', { uri: result.assets[0].uri, name: 'logo.jpg', type: 'image/jpeg' } as any);
        const res = await merchantApi.uploadLogo(formData);
        updateStore({ logo_url: res.data?.logo_url });
        queryClient.invalidateQueries({ queryKey: ['store'] });
        toast.success('Logo updated!');
        haptics.success();
      } catch {
        toast.error('Failed to upload logo');
      } finally {
        setUploadingLogo(false);
      }
    }
  };

  const logoUrl = store?.logo_url ?? user?.store?.logo_url;
  const storeUsername = store?.username ?? user?.store?.username;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={22} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Store Settings</Text>
        <View style={{ width: 22 }} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          {/* Logo section */}
          <View style={styles.logoSection}>
            <TouchableOpacity style={styles.logoWrapper} onPress={pickAndUploadLogo} activeOpacity={0.85}>
              {logoUrl ? (
                <Image source={{ uri: logoUrl }} style={styles.logo} contentFit="cover" />
              ) : (
                <View style={[styles.logoPlaceholder, { backgroundColor: Colors.glow.primarySoft }]}>
                  <Text style={styles.logoInitial}>
                    {(store?.name ?? user?.store?.name ?? 'S')[0]?.toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={[styles.cameraBtn, { backgroundColor: Colors.primaryLight }]}>
                <Camera size={14} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <View style={styles.logoInfo}>
              <Text style={[styles.logoStoreName, { color: theme.text }]}>
                {store?.name ?? user?.store?.name ?? 'Your Store'}
              </Text>
              {storeUsername && (
                <View style={styles.urlRow}>
                  <Globe size={12} color={Colors.primaryLight} />
                  <Text style={[styles.logoUrl, { color: Colors.primaryLight }]}>{storeUsername}.frontstore.ng</Text>
                </View>
              )}
              {store?.is_verified && (
                <View style={styles.verifiedRow}>
                  <CheckCircle size={13} color={Colors.success} fill={Colors.success} />
                  <Text style={[styles.verified, { color: Colors.success }]}>Verified Store</Text>
                </View>
              )}
            </View>
          </View>

          {isLoading ? (
            <View style={{ gap: Spacing[5] }}>
              {[1, 2, 3, 4].map((i) => <Skeleton key={i} height={52} radius={14} />)}
            </View>
          ) : (
            <>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Store Information</Text>

              <Controller
                control={control}
                name="name"
                rules={{ required: 'Store name is required' }}
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input label="Store Name" placeholder="Your store name" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
                )}
              />

              <Controller
                control={control}
                name="description"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input
                    label={`Store Description (${(value || '').length}/306)`}
                    placeholder="Describe your store (max 306 characters)…"
                    multiline
                    numberOfLines={3}
                    maxLength={306}
                    value={value}
                    onChangeText={(text) => onChange(text.slice(0, 306))}
                    onBlur={onBlur}
                    style={{ minHeight: 80, textAlignVertical: 'top' }}
                    optional
                  />
                )}
              />

              <Controller
                control={control}
                name="whatsapp_number"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input label="WhatsApp Number" placeholder="+234 800 000 0000" keyboardType="phone-pad" value={value} onChangeText={onChange} onBlur={onBlur} optional />
                )}
              />

              <Controller
                control={control}
                name="currency"
                render={({ field: { value } }) => (
                  <View style={[styles.currencyRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.currencyLabel, { color: theme.text }]}>Currency</Text>
                    <View style={[styles.currencyBadge, { backgroundColor: Colors.glow.primarySoft }]}>
                      <Text style={[styles.currencyValue, { color: Colors.primaryLight }]}>{value}</Text>
                    </View>
                  </View>
                )}
              />

              {/* Store URL */}
              {isPro ? (
                <Controller
                  control={control}
                  name="username"
                  rules={{ required: 'Username is required', minLength: { value: 3, message: 'Too short' } }}
                  render={({ field: { onChange, value, onBlur } }) => (
                    <Input
                      label="Store URL Username"
                      placeholder="my-store"
                      value={value}
                      onChangeText={(text) => {
                        const raw = text.toLowerCase();
                        const cleaned = raw.includes('@') ? raw.split('@')[0] : raw;
                        onChange(cleaned.replace(/_/g, '-').replace(/[^a-z0-9-]/g, ''));
                      }}
                      onBlur={onBlur}
                      error={errors.username?.message}
                      hint="your-username.frontstore.ng"
                      autoCapitalize="none"
                    />
                  )}
                />
              ) : (
                <View style={[styles.urlCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing[2] }}>
                    <Text style={[styles.urlLabel, { color: theme.textSecondary }]}>Store URL</Text>
                    <Badge label="Pro" variant="primary" size="sm" />
                  </View>
                  <Text style={[styles.urlValue, { color: Colors.primaryLight }]}>
                    {storeUsername ?? '—'}.frontstore.ng
                  </Text>
                  <Text style={[styles.urlNote, { color: theme.textTertiary }]}>
                    Free plan usernames are locked. Upgrade to Pro to change it.
                  </Text>
                </View>
              )}

              <Button
                title="Save Changes"
                onPress={handleSubmit((data) => saveStore(data))}
                isLoading={isPending}
                size="xl"
                style={{ marginTop: Spacing[4] }}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4], borderBottomWidth: 1 },
  headerTitle: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[10] },

  logoSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4], paddingVertical: Spacing[6] },
  logoWrapper: { position: 'relative' },
  logo: { width: 80, height: 80, borderRadius: Radius.xl },
  logoPlaceholder: { width: 80, height: 80, borderRadius: Radius.xl, alignItems: 'center', justifyContent: 'center' },
  logoInitial: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], color: Colors.primaryLight },
  cameraBtn: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: Colors.white },
  logoInfo: { flex: 1, gap: Spacing[1] },
  logoStoreName: { fontFamily: FontFamily.headingBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  logoUrl: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },
  verifiedRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
  verified: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },

  sectionTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.lg, marginBottom: Spacing[5] },
  currencyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing[4], borderRadius: Radius.md, borderWidth: 1.5, marginBottom: Spacing[5] },
  currencyLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base },
  currencyBadge: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.full },
  currencyValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.sm },
  urlCard: { padding: Spacing[4], borderRadius: Radius.md, borderWidth: 1.5, gap: Spacing[2] },
  urlLabel: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, textTransform: 'uppercase', letterSpacing: 0.8 },
  urlValue: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md },
  urlNote: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs },
});
