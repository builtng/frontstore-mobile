import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView,
  Platform, TouchableOpacity, SafeAreaView, Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { ArrowLeft, X, ImagePlus, Sparkles } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';

const schema = z.object({
  name: z.string().min(2, 'Product name is required'),
  price: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid price'),
  stock: z.string().optional(),
  description: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function AddProductScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [trackStock, setTrackStock] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const productName = watch('name');

  const pickImage = async () => {
    if (localImages.length >= 5) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      setLocalImages((prev) => [...prev, localUri]);
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', { uri: localUri, name: `product_${Date.now()}.jpg`, type: 'image/jpeg' } as any);
        const res = await merchantApi.uploadProductImage(formData);
        setUploadedUrls((prev) => [...prev, res.data?.url ?? res.url]);
      } catch {
        setLocalImages((prev) => prev.filter((u) => u !== localUri));
        toast.error('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const generateDescription = async () => {
    if (!productName || productName.length < 3) {
      toast.warning('Enter a product name first');
      return;
    }
    setIsGenerating(true);
    try {
      const result = await merchantApi.generateAIDescription(productName);
      setValue('description', result.description);
      haptics.success();
    } catch {
      toast.error('Could not generate description');
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      if (isUploading) {
        toast.warning('Please wait for images to finish uploading');
        setIsLoading(false);
        return;
      }
      await merchantApi.createProduct({
        name: data.name,
        price: Number(data.price),
        stock: trackStock ? Number(data.stock ?? 0) : 0,
        track_stock: trackStock,
        description: data.description,
        type: 'physical',
        status: 'active',
        images: uploadedUrls,
      });
      haptics.success();
      router.push('/(auth)/success');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
        <View style={[styles.progressFill, { width: '90%' }]} />
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.back} onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.step, { color: Colors.primary }]}>Step 7 of 8</Text>
            <Text style={[styles.title, { color: theme.text }]}>Add your first product</Text>
            <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
              Don't worry — you can add more products from your dashboard
            </Text>
          </View>

          {/* Images */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>Product Images</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {localImages.map((uri, i) => (
                <View key={i} style={styles.imageThumb}>
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {isUploading && i === localImages.length - 1 && (
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ color: Colors.white, fontSize: 18 }}>↑</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={styles.removeImage}
                    onPress={() => {
                      setLocalImages((prev) => prev.filter((_, idx) => idx !== i));
                      setUploadedUrls((prev) => prev.filter((_, idx) => idx !== i));
                    }}
                  >
                    <X size={12} color={Colors.white} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
              {localImages.length < 5 && (
                <TouchableOpacity
                  style={[styles.addImage, { backgroundColor: theme.card, borderColor: theme.border, opacity: isUploading ? 0.5 : 1 }]}
                  onPress={isUploading ? undefined : pickImage}
                >
                  <ImagePlus size={24} color={theme.textTertiary} />
                  <Text style={[styles.addImageText, { color: theme.textTertiary }]}>
                    {isUploading ? 'Uploading…' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Form fields */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Product Name"
                placeholder="e.g. Classic White T-Shirt"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.name?.message}
              />
            )}
          />

          <Controller
            control={control}
            name="price"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                label="Price (NGN)"
                placeholder="0.00"
                keyboardType="decimal-pad"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                error={errors.price?.message}
                leftIcon={<Text style={[styles.currencySymbol, { color: theme.textTertiary }]}>₦</Text>}
              />
            )}
          />

          {/* Stock toggle */}
          <View style={[styles.stockRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View>
              <Text style={[styles.stockLabel, { color: theme.text }]}>Track stock</Text>
              <Text style={[styles.stockSub, { color: theme.textTertiary }]}>
                Get alerts when stock is low
              </Text>
            </View>
            <Switch
              value={trackStock}
              onValueChange={setTrackStock}
              trackColor={{ false: theme.border, true: Colors.primaryDim }}
              thumbColor={trackStock ? Colors.primary : Colors.gray400}
            />
          </View>

          {trackStock && (
            <Controller
              control={control}
              name="stock"
              render={({ field: { onChange, value, onBlur } }) => (
                <Input
                  label="Stock Quantity"
                  placeholder="e.g. 50"
                  keyboardType="number-pad"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />
          )}

          <View style={styles.descHeader}>
            <Text style={[styles.descLabel, { color: theme.textSecondary }]}>Description</Text>
            <TouchableOpacity
              style={[styles.aiBtn, { backgroundColor: Colors.primaryDim }]}
              onPress={generateDescription}
            >
              <Sparkles size={14} color={Colors.primary} />
              <Text style={[styles.aiBtnText, { color: Colors.primary }]}>
                {isGenerating ? 'Generating...' : 'AI Generate'}
              </Text>
            </TouchableOpacity>
          </View>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input
                placeholder="Describe your product..."
                multiline
                numberOfLines={4}
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: theme.background }]}>
        <Button
          title="Publish Product"
          onPress={handleSubmit(onSubmit)}
          isLoading={isLoading}
          size="xl"
        />
        <Button
          title="Skip — I'll add products later"
          onPress={() => router.push('/(auth)/success')}
          variant="ghost"
          size="md"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  progressTrack: { height: 3 },
  progressFill: { height: 3, backgroundColor: Colors.primary, borderRadius: 2 },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[4] },
  back: { marginTop: Spacing[4], marginBottom: Spacing[6], width: 40, height: 40, justifyContent: 'center' },
  header: { marginBottom: Spacing[6] },
  step: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: Spacing[2] },
  title: { fontFamily: FontFamily.headingBold, fontSize: FontSize['3xl'], letterSpacing: -0.8, marginBottom: Spacing[2] },
  subtitle: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base, lineHeight: 24 },
  section: { marginBottom: Spacing[5] },
  sectionLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: Spacing[3] },
  imageRow: { gap: Spacing[3] },
  imageThumb: { width: 80, height: 80, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  removeImage: {
    position: 'absolute', top: 4, right: 4,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center', justifyContent: 'center',
  },
  addImage: {
    width: 80, height: 80, borderRadius: Radius.md,
    borderWidth: 1.5, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addImageText: { fontFamily: FontFamily.bodyRegular, fontSize: 10 },
  stockRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    padding: Spacing[4], borderRadius: Radius.md, borderWidth: 1.5, marginBottom: Spacing[5],
  },
  stockLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base },
  stockSub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 2 },
  descHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[2] },
  descLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.full },
  aiBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },
  currencySymbol: { fontFamily: FontFamily.headingBold, fontSize: FontSize.md },
  footer: { paddingHorizontal: Spacing[6], paddingVertical: Spacing[4], gap: Spacing[2] },
});
