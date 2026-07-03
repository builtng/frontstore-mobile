import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, KeyboardAvoidingView, Platform,
  TouchableOpacity, SafeAreaView, Switch, TextInput,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import * as ImagePicker from 'expo-image-picker';
import { Image } from 'expo-image';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ImagePlus, X, Sparkles, ChevronDown, Plus, Package, Download, Wrench } from 'lucide-react-native';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useToast } from '@/components/ui/Toast';
import { merchantApi } from '@/services/merchantApi';
import { Colors } from '@/constants/colors';
import { FontFamily, FontSize } from '@/constants/typography';
import { Radius, Shadow, Spacing } from '@/constants/spacing';
import { useTheme } from '@/hooks/useTheme';
import { useHaptics } from '@/hooks/useHaptics';
import { Category } from '@/types/merchant';

const schema = z.object({
  name: z.string().min(2, 'Product name is required'),
  price: z.string().refine((v) => !isNaN(Number(v)) && Number(v) > 0, 'Enter a valid price'),
  compare_price: z.string().optional(),
  stock: z.string().optional(),
  sku: z.string().optional(),
  description: z.string().optional(),
  type: z.enum(['physical', 'digital', 'service']),
  status: z.enum(['active', 'draft']),
});

type FormData = z.infer<typeof schema>;

interface Variant {
  id: string;
  name: string;     // e.g. "Size", "Color", "Weight"
  options: string;  // e.g. "S, M, L, XL"
}

export default function AddProductScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const toast = useToast();
  const haptics = useHaptics();
  const queryClient = useQueryClient();
  const [variants, setVariants] = useState<Variant[]>([]);
  // localImages: local URIs for preview; uploadedUrls: server URLs after upload
  const [localImages, setLocalImages] = useState<string[]>([]);
  const [uploadedUrls, setUploadedUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [trackStock, setTrackStock] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [categorySheetOpen, setCategorySheetOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: merchantApi.getCategories,
    select: (d) => d.data ?? [],
  });

  const { mutate: createProduct, isPending } = useMutation({
    mutationFn: merchantApi.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product published!');
      haptics.success();
      router.back();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message ?? 'Failed to create product'),
  });

  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { type: 'physical', status: 'active' },
  });

  const productName = watch('name');

  const pickImage = async () => {
    if (localImages.length >= 5) {
      toast.warning('Maximum 5 images per product');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const localUri = result.assets[0].uri;
      setLocalImages((prev) => [...prev, localUri]);
      // Upload immediately so we have the server URL ready when submitting
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('image', {
          uri: localUri,
          name: `product_${Date.now()}.jpg`,
          type: 'image/jpeg',
        } as any);
        const res = await merchantApi.uploadProductImage(formData);
        setUploadedUrls((prev) => [...prev, res.data?.url ?? res.url]);
      } catch {
        // Remove the local preview if upload failed
        setLocalImages((prev) => prev.filter((u) => u !== localUri));
        toast.error('Failed to upload image. Please try again.');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const removeImage = (index: number) => {
    setLocalImages((prev) => prev.filter((_, i) => i !== index));
    setUploadedUrls((prev) => prev.filter((_, i) => i !== index));
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

  const addVariant = () => {
    setVariants((prev) => [
      ...prev,
      { id: Date.now().toString(), name: '', options: '' },
    ]);
  };

  const updateVariant = (id: string, field: keyof Variant, value: string) => {
    setVariants((prev) => prev.map((v) => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariant = (id: string) => {
    setVariants((prev) => prev.filter((v) => v.id !== id));
  };

  const onSubmit = (data: FormData) => {
    if (isUploading) {
      toast.warning('Please wait for images to finish uploading');
      return;
    }
    const cleanVariants = variants
      .filter((v) => v.name.trim() && v.options.trim())
      .map((v) => ({ name: v.name.trim(), options: v.options.split(',').map((o) => o.trim()).filter(Boolean) }));

    createProduct({
      name: data.name,
      price: Number(data.price),
      compare_price: data.compare_price ? Number(data.compare_price) : undefined,
      stock: trackStock ? Number(data.stock ?? 0) : 0,
      track_stock: trackStock,
      description: data.description,
      category_id: selectedCategory?.id,
      type: data.type,
      status: data.status,
      images: uploadedUrls,
      sku: data.sku || undefined,
      variants: cleanVariants.length > 0 ? cleanVariants : undefined,
    });
  };

  const PRODUCT_TYPES = [
    { value: 'physical', label: 'Physical', Icon: Package },
    { value: 'digital', label: 'Digital', Icon: Download },
    { value: 'service', label: 'Service', Icon: Wrench },
  ];

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Add Product</Text>
          <Controller
            control={control}
            name="status"
            render={({ field: { value, onChange } }) => (
              <TouchableOpacity
                onPress={() => onChange(value === 'active' ? 'draft' : 'active')}
                style={[styles.statusToggle, { backgroundColor: value === 'active' ? Colors.successLight : theme.card }]}
              >
                <Text style={[styles.statusText, { color: value === 'active' ? Colors.success : theme.textSecondary }]}>
                  {value === 'active' ? '● Active' : '○ Draft'}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Images */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>Photos</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.imageRow}>
              {localImages.map((uri, i) => (
                <View key={i} style={styles.imageThumb}>
                  {i === 0 && <View style={styles.primaryBadge}><Text style={styles.primaryBadgeText}>Cover</Text></View>}
                  <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  {/* Show spinner overlay while this specific image uploads */}
                  {isUploading && i === localImages.length - 1 && (
                    <View style={[StyleSheet.absoluteFill, styles.uploadingOverlay]}>
                      <Text style={styles.uploadingDot}>↑</Text>
                    </View>
                  )}
                  <TouchableOpacity style={styles.removeImage} onPress={() => removeImage(i)}>
                    <X size={11} color={Colors.white} strokeWidth={3} />
                  </TouchableOpacity>
                </View>
              ))}
              {localImages.length < 5 && (
                <TouchableOpacity
                  style={[styles.addImage, { backgroundColor: theme.card, borderColor: theme.border, opacity: isUploading ? 0.5 : 1 }]}
                  onPress={isUploading ? undefined : pickImage}
                >
                  <ImagePlus size={22} color={theme.textTertiary} />
                  <Text style={[styles.addImageText, { color: theme.textTertiary }]}>
                    {isUploading ? 'Uploading…' : 'Add Photo'}
                  </Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>

          {/* Product type */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.text }]}>Product Type</Text>
            <Controller
              control={control}
              name="type"
              render={({ field: { value, onChange } }) => (
                <View style={styles.typeRow}>
                  {PRODUCT_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      onPress={() => onChange(t.value)}
                      style={[
                        styles.typeChip,
                        { backgroundColor: value === t.value ? Colors.primaryDim : theme.card, borderColor: value === t.value ? Colors.primary : theme.border },
                      ]}
                    >
                      <t.Icon size={16} color={value === t.value ? Colors.primary : theme.textSecondary} strokeWidth={1.8} />
                      <Text style={[styles.typeLabel, { color: value === t.value ? Colors.primary : theme.textSecondary }]}>{t.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
          </View>

          {/* Name */}
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="Product Name" placeholder="e.g. Premium Leather Bag" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.name?.message} />
            )}
          />

          {/* Category */}
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Category</Text>
            <TouchableOpacity
              style={[styles.categoryBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              onPress={() => setCategorySheetOpen(true)}
            >
              <Text style={[styles.categoryBtnText, { color: selectedCategory ? theme.text : theme.textTertiary }]}>
                {selectedCategory?.name ?? 'Select a category'}
              </Text>
              <ChevronDown size={18} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Prices */}
          <View style={styles.priceRow}>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="price"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input label="Price (₦)" placeholder="0.00" keyboardType="decimal-pad" value={value} onChangeText={onChange} onBlur={onBlur} error={errors.price?.message} containerStyle={{ marginBottom: 0 }} />
                )}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Controller
                control={control}
                name="compare_price"
                render={({ field: { onChange, value, onBlur } }) => (
                  <Input label="Compare Price" placeholder="Original price" keyboardType="decimal-pad" value={value} onChangeText={onChange} onBlur={onBlur} optional containerStyle={{ marginBottom: 0 }} />
                )}
              />
            </View>
          </View>

          {/* Stock */}
          <View style={[styles.stockToggleCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View>
              <Text style={[styles.stockLabel, { color: theme.text }]}>Track Inventory</Text>
              <Text style={[styles.stockSub, { color: theme.textTertiary }]}>Monitor stock levels</Text>
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
                <Input label="Stock Quantity" placeholder="e.g. 100" keyboardType="number-pad" value={value} onChangeText={onChange} onBlur={onBlur} />
              )}
            />
          )}

          {/* SKU */}
          <Controller
            control={control}
            name="sku"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input label="SKU / Product Code" placeholder="e.g. FS-001-RED-M" autoCapitalize="characters" value={value} onChangeText={onChange} onBlur={onBlur} optional hint="Stock Keeping Unit for inventory tracking" />
            )}
          />

          {/* Variants */}
          <View style={styles.section}>
            <View style={styles.descHeader}>
              <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Product Variants</Text>
              <TouchableOpacity style={[styles.aiBtn, { backgroundColor: Colors.primaryDim }]} onPress={addVariant}>
                <Plus size={13} color={Colors.primary} />
                <Text style={[styles.aiBtnText, { color: Colors.primary }]}>Add Variant</Text>
              </TouchableOpacity>
            </View>
            {variants.map((v) => (
              <View key={v.id} style={[styles.variantRow, { backgroundColor: theme.background, borderColor: theme.border }]}>
                <View style={styles.variantInputs}>
                  <TextInput
                    style={[styles.variantName, { color: theme.text, borderColor: theme.border, fontFamily: FontFamily.bodySemiBold }]}
                    placeholder="Name (e.g. Size)"
                    placeholderTextColor={theme.textTertiary}
                    autoCapitalize="words"
                    autoCorrect={false}
                    value={v.name}
                    onChangeText={(t) => updateVariant(v.id, 'name', t)}
                  />
                  <TextInput
                    style={[styles.variantOptions, { color: theme.text, borderColor: theme.border, fontFamily: FontFamily.bodyRegular }]}
                    placeholder="Options: S, M, L, XL"
                    placeholderTextColor={theme.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={v.options}
                    onChangeText={(t) => updateVariant(v.id, 'options', t)}
                  />
                </View>
                <TouchableOpacity onPress={() => removeVariant(v.id)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                  <X size={18} color={Colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
            {variants.length === 0 && (
              <Text style={[styles.variantHint, { color: theme.textTertiary }]}>
                Add variants like Size, Color, or Weight. Separate options with commas.
              </Text>
            )}
          </View>

          {/* Description */}
          <View style={styles.descHeader}>
            <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Description</Text>
            <TouchableOpacity style={[styles.aiBtn, { backgroundColor: Colors.primaryDim }]} onPress={generateDescription}>
              <Sparkles size={13} color={Colors.primary} />
              <Text style={[styles.aiBtnText, { color: Colors.primary }]}>{isGenerating ? 'Generating…' : 'AI Write'}</Text>
            </TouchableOpacity>
          </View>
          <Controller
            control={control}
            name="description"
            render={({ field: { onChange, value, onBlur } }) => (
              <Input placeholder="Describe your product in detail…" multiline numberOfLines={5} value={value} onChangeText={onChange} onBlur={onBlur} style={{ minHeight: 110, textAlignVertical: 'top' }} />
            )}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <Button title="Publish Product" onPress={handleSubmit(onSubmit)} isLoading={isPending} size="xl" />
      </View>

      {/* Category bottom sheet */}
      <BottomSheet isVisible={categorySheetOpen} onClose={() => setCategorySheetOpen(false)} title="Select Category" snapPoint={0.55} scrollable>
        {(categories ?? []).map((cat: Category) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catItem, { borderBottomColor: theme.border }]}
            onPress={() => { setSelectedCategory(cat); setCategorySheetOpen(false); }}
          >
            <Text style={[styles.catName, { color: theme.text }]}>{cat.name}</Text>
            {selectedCategory?.id === cat.id && <View style={[styles.catCheck, { backgroundColor: Colors.primary }]} />}
          </TouchableOpacity>
        ))}
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing[6], paddingTop: Spacing[5], paddingBottom: Spacing[4], borderBottomWidth: 1 },
  headerTitle: { fontFamily: FontFamily.headingSemiBold, fontSize: FontSize.xl, letterSpacing: -0.3 },
  statusToggle: { paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.full },
  statusText: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },
  scroll: { paddingHorizontal: Spacing[6], paddingBottom: Spacing[4] },
  section: { marginBottom: Spacing[5] },
  sectionLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.sm, marginBottom: Spacing[3] },
  imageRow: { gap: Spacing[3] },
  imageThumb: { width: 88, height: 88, borderRadius: Radius.md, overflow: 'hidden', position: 'relative' },
  primaryBadge: { position: 'absolute', bottom: 4, left: 4, backgroundColor: Colors.primary, borderRadius: 4, paddingHorizontal: 5, paddingVertical: 1, zIndex: 1 },
  primaryBadgeText: { color: Colors.white, fontSize: 9, fontFamily: FontFamily.bodySemiBold },
  removeImage: { position: 'absolute', top: 5, right: 5, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(0,0,0,0.65)', alignItems: 'center', justifyContent: 'center' },
  addImage: { width: 88, height: 88, borderRadius: Radius.md, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  addImageText: { fontFamily: FontFamily.bodyRegular, fontSize: 10 },
  uploadingOverlay: { backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', zIndex: 2 },
  uploadingDot: { color: Colors.white, fontSize: 22, fontFamily: FontFamily.headingBold },
  typeRow: { flexDirection: 'row', gap: Spacing[3] },
  typeChip: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: Spacing[3], borderRadius: Radius.md, borderWidth: 1.5, gap: 4 },

  typeLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.xs },
  categoryBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing[4], borderRadius: Radius.md, borderWidth: 1.5 },
  categoryBtnText: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.base },
  priceRow: { flexDirection: 'row', gap: Spacing[4], marginBottom: Spacing[5] },
  stockToggleCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: Spacing[4], borderRadius: Radius.md, borderWidth: 1.5, marginBottom: Spacing[5] },
  stockLabel: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base },
  stockSub: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, marginTop: 2 },
  descHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing[3] },
  aiBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1], paddingHorizontal: Spacing[3], paddingVertical: Spacing[1], borderRadius: Radius.full },
  aiBtnText: { fontFamily: FontFamily.bodySemiBold, fontSize: 11 },
  footer: { padding: Spacing[5], borderTopWidth: 1 },
  catItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: Spacing[4], borderBottomWidth: 1 },
  catName: { fontFamily: FontFamily.bodySemiBold, fontSize: FontSize.base },
  catCheck: { width: 10, height: 10, borderRadius: 5 },
  variantRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing[3], padding: Spacing[3], borderRadius: Radius.md, borderWidth: 1, marginBottom: Spacing[3] },
  variantInputs: { flex: 1, gap: Spacing[2] },
  variantName: { fontSize: FontSize.sm, paddingVertical: Spacing[2], borderBottomWidth: 1 },
  variantOptions: { fontSize: FontSize.sm, paddingVertical: Spacing[2] },
  variantHint: { fontFamily: FontFamily.bodyRegular, fontSize: FontSize.xs, lineHeight: 18, textAlign: 'center', paddingVertical: Spacing[4] },
});
