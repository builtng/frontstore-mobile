import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ChevronDown, ChevronRight, Trash2, X } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, T, cx } from '@/components/ui';
import { Toggle, goBack } from '@/features/seller/parts';
import { getProduct, updateProduct, uploadProductImage } from '@/api/products';
import { ProductImage } from '@/features/products/ProductImage';
import { formatNaira } from '@/lib/format';
import { SearchableSelectModal } from '@/components/SearchableSelectModal';
import { useCategories } from '@/features/products/useCategories';
import { ColourChips } from '@/features/products/ColourChips';

const ALL_SIZES = ['S', 'M', 'L', 'XL'];
const MAX_PHOTOS = 3;

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const categories = useCategories();
  const [category, setCategory] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [inStock, setInStock] = useState(true);
  const [stock, setStock] = useState('');
  const [visible, setVisible] = useState(true);
  const [photos, setPhotos] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setPrice(String(Math.round(product.price_kobo / 100)));
      setCategory(product.category_id ?? '');
      setInStock(product.stock_count > 0);
      setStock(product.stock_count > 0 ? String(product.stock_count) : '');
      setVisible(product.status !== 'hidden');
      setPhotos(product.images ?? []);
      if (product.sizes) setSizes(product.sizes);
      if (product.colors) setColors(product.colors);
    }
  }, [product]);

  const addFrom = async (source: 'camera' | 'library') => {
    setErrorMsg(null);
    if (source === 'camera' && !(await ImagePicker.requestCameraPermissionsAsync()).granted) {
      setErrorMsg('Allow camera access in Settings to take product photos.');
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (res.canceled || !res.assets?.[0]) return;
    setUploading(true);
    try {
      const { url } = await uploadProductImage(res.assets[0].uri);
      setPhotos((cur) => [...cur, url].slice(0, MAX_PHOTOS));
    } catch (err: any) {
      setErrorMsg(err.message || 'That photo didn’t upload. Check your connection and try again.');
    } finally {
      setUploading(false);
    }
  };

  const addPhoto = () => {
    Alert.alert('Add product photo', undefined, [
      { text: 'Take a photo', onPress: () => addFrom('camera') },
      { text: 'Choose from gallery', onPress: () => addFrom('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const toggleSize = (s: string) => setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const saveMutation = useMutation({
    mutationFn: (payload: any) => updateProduct(id!, payload, product?.variants),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      goBack('/products');
    },
    onError: (err: any) => {
      setErrorMsg(err.message || 'Could not save product changes.');
      setSubmitting(false);
    },
  });

  const save = () => {
    if (submitting) return;
    const numericPriceKobo = Math.round(parseFloat(price.replace(/,/g, '')) * 100);
    if (!name.trim() || !numericPriceKobo) {
      setErrorMsg('Add a name and price first.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    saveMutation.mutate({
      name,
      price_kobo: numericPriceKobo,
      category_id: category || null,
      // The exact count the seller typed; switching "In stock" off sets it to 0.
      stock_count: !inStock ? 0 : Math.max(1, parseInt(stock, 10) || 1),
      status: visible ? 'live' : 'hidden',
      images: photos,
      sizes,
      colors,
    });
  };

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-3 pb-2 pt-1">
        <Pressable accessibilityRole="button" onPress={() => goBack('/products')} className="h-11 justify-center px-2">
          <T className="font-sans-semibold text-base text-muted">Cancel</T>
        </Pressable>
        <T className="font-sans-bold text-[17px]">Edit product</T>
        <Pressable accessibilityRole="button" onPress={save} disabled={submitting || uploading} className="h-11 justify-center px-2">
          <T className="font-sans-bold text-base text-green">{submitting ? 'Saving...' : 'Save'}</T>
        </Pressable>
      </View>

      {errorMsg ? (
        <View className="mx-5 my-1 rounded-xl bg-red-100 p-3.5 border border-red-200">
          <T className="text-sm font-sans-medium text-red-800">{errorMsg}</T>
        </View>
      ) : null}

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 px-5 pb-6 pt-2">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5">
          {photos.length ? photos.map((uri, i) => (
            <View key={uri} className="h-[110px] w-[110px]">
              <ProductImage uri={uri} name={name} className="h-full w-full rounded-[18px]" textClassName="text-2xl" />
              {i === 0 ? (
                <View className="absolute bottom-2 left-2 rounded-full bg-surface px-2 py-[3px]">
                  <T className="font-sans-bold text-[11px]">Cover</T>
                </View>
              ) : null}
              {photos.length > 1 ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove photo ${i + 1}`}
                  hitSlop={8}
                  onPress={() => setPhotos((cur) => cur.filter((p) => p !== uri))}
                  className="absolute right-1.5 top-1.5 h-7 w-7 items-center justify-center rounded-full bg-[rgba(14,26,21,0.7)]"
                >
                  <X size={14} color="#FFFFFF" strokeWidth={2.5} />
                </Pressable>
              ) : null}
            </View>
          )) : (
            <ProductImage name={name} className="h-[110px] w-[110px] rounded-[18px]" textClassName="text-2xl" />
          )}
          {photos.length < MAX_PHOTOS ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Add photo" onPress={addPhoto} disabled={uploading} className="h-[110px] w-[110px] items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed border-[#B9B1A0] bg-surface">
              {uploading ? <ActivityIndicator color="#0B6E4F" /> : <Camera size={22} color="#5B6660" strokeWidth={2} />}
              <T className="font-sans-semibold text-[13px] text-muted">{uploading ? 'Uploading…' : 'Add photo'}</T>
            </Pressable>
          ) : null}
        </ScrollView>

        <View className="gap-1.5">
          <T className="font-sans-bold text-sm">Product name</T>
          <TextInput value={name} onChangeText={setName} accessibilityLabel="Product name" className="h-[50px] rounded-[14px] border border-line-2 bg-surface px-3.5 font-sans text-base text-ink" />
        </View>

        <View className="flex-row gap-3">
          <View className="w-[140px] gap-1.5">
            <T className="font-sans-bold text-sm">Price</T>
            <View className="h-[50px] flex-row items-center gap-1.5 rounded-[14px] border-[1.5px] border-green bg-surface px-3.5">
              <T className="font-sans-bold">₦</T>
              <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" accessibilityLabel="Price" className="h-full min-w-0 flex-1 font-sans-semibold text-base text-ink" />
            </View>
          </View>
          <View className="min-w-0 flex-1 gap-1.5">
            <T className="font-sans-bold text-sm">Collection</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Collection, ${categories.nameOf(category) || 'not set'}`}
              onPress={() => setCategoryModalOpen(true)}
              className="h-[50px] flex-row items-center justify-between rounded-[14px] border border-line-2 bg-surface px-3"
            >
              <T className="text-[15px]" numberOfLines={1}>{categories.nameOf(category) || 'Select'}</T>
              <ChevronDown size={16} color="#5B6660" strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <SearchableSelectModal
          visible={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          title="Select Collection"
          subtitle="Choose collection for this product"
          placeholder="Search collections..."
          items={categories.items}
          selectedId={category}
          onSelect={(item) => setCategory(item.id)}
        />

        <View className="gap-2">
          <T className="font-sans-bold text-sm">Sizes</T>
          <View className="flex-row flex-wrap gap-2">
            {ALL_SIZES.map((s) => {
              const on = sizes.includes(s);
              return (
                <Pressable
                  key={s}
                  accessibilityRole="checkbox"
                  accessibilityLabel={`Size ${s}`}
                  accessibilityState={{ checked: on }}
                  onPress={() => toggleSize(s)}
                  className={cx('min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3.5', on ? 'bg-ink' : 'border border-line-2 bg-surface')}
                >
                  <T className={cx('font-sans-bold text-sm', on ? 'text-bg' : 'text-muted')}>{s}</T>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <T className="font-sans-bold text-sm">Colours</T>
          <ColourChips value={colors} onChange={setColors} />
        </View>

        <View className="rounded-[18px] border border-line bg-surface">
          <View className="flex-row items-center justify-between px-4 py-3.5">
            <T className="font-sans-semibold text-[15px]">In stock</T>
            <Toggle label="In stock" value={inStock} onChange={(v) => { setInStock(v); if (v && !stock) setStock('1'); }} />
          </View>
          {inStock ? (
            <View className="flex-row items-center justify-between border-t border-line px-4 py-2.5">
              <T className="font-sans-semibold text-[15px]">How many</T>
              <TextInput
                value={stock}
                onChangeText={(v) => setStock(v.replace(/\D/g, '').slice(0, 5))}
                keyboardType="number-pad"
                placeholder="1"
                placeholderTextColor="#8A928E"
                accessibilityLabel="How many in stock"
                className="h-10 w-24 rounded-xl border border-line-2 bg-surface px-3 text-right font-sans-semibold text-base text-ink"
              />
            </View>
          ) : null}
          <View className="flex-row items-center justify-between border-t border-line px-4 py-3.5">
            <T className="font-sans-semibold text-[15px]">Show on storefront</T>
            <Toggle label="Show on storefront" value={visible} onChange={setVisible} />
          </View>
        </View>
      </ScrollView>

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="flex-row gap-2.5 border-t border-line bg-bg px-5 pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Delete product"
          onPress={() => router.push(`/product/${id}/delete`)}
          className="h-[54px] w-[54px] items-center justify-center rounded-full border-[1.5px] border-[#E7B3A8] bg-surface"
        >
          <Trash2 size={22} color="#A8321E" strokeWidth={2} />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={save} disabled={submitting || uploading} className="h-[54px] flex-1 flex-row items-center justify-center gap-2 rounded-full bg-deep">
          {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
          <T className="font-sans-bold text-[17px] text-white">{submitting ? 'Saving...' : 'Save changes'}</T>
        </Pressable>
      </View>
    </Screen>
  );
}
