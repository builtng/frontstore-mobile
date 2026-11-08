import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, TextInput, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ChevronDown, ChevronRight, Trash2, X } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LoadError, Screen, Skeleton, T, cx } from '@/components/ui';
import { BackHeader, Toggle, goBack } from '@/features/seller/parts';
import { updateProduct, uploadProductImage } from '@/api/products';
import { useSellerProduct } from '@/features/products/useSellerProduct';
import { ProductImage } from '@/features/products/ProductImage';
import { formatNaira } from '@/lib/format';
import { SearchableSelectModal } from '@/components/SearchableSelectModal';
import { useCategories } from '@/features/products/useCategories';
import { ColourChips } from '@/features/products/ColourChips';
import { C } from '@/lib/theme';

const ALL_SIZES = ['S', 'M', 'L', 'XL'];
const MAX_PHOTOS = 3;

export default function EditProduct() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();

  const { data: product, isLoading } = useSellerProduct(id);

  const [name, setName] = useState(product?.name ?? '');
  const [price, setPrice] = useState(product ? String(Math.round(product.price_kobo / 100)) : '');
  const categories = useCategories();
  const [category, setCategory] = useState<string>((product?.category_id as any) ?? '');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [sizes, setSizes] = useState<string[]>(product?.sizes ?? []);
  const [colors, setColors] = useState<string[]>(product?.colors ?? []);
  const [inStock, setInStock] = useState(product ? product.stock_count > 0 : true);
  const [stock, setStock] = useState(product && product.stock_count > 0 ? String(product.stock_count) : '');
  const [visible, setVisible] = useState(product ? product.status !== 'hidden' : true);
  const [preorder, setPreorder] = useState(!!product?.allow_preorder);
  const [was, setWas] = useState(product?.compare_at_price_kobo ? String(Math.round(product.compare_at_price_kobo / 100)) : '');
  const [photos, setPhotos] = useState<string[]>(product?.images ?? []);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fill the form once. A background refresh must never overwrite what the seller is typing.
  const [ready, setReady] = useState(!!product);
  useEffect(() => {
    if (product && !ready) {
      setReady(true);
      setName(product.name);
      setPrice(String(Math.round(product.price_kobo / 100)));
      setCategory(product.category_id ?? '');
      setInStock(product.stock_count > 0);
      setStock(product.stock_count > 0 ? String(product.stock_count) : '');
      setVisible(product.status !== 'hidden');
      setPreorder(!!product.allow_preorder);
      setWas(product.compare_at_price_kobo ? String(Math.round(product.compare_at_price_kobo / 100)) : '');
      setPhotos(product.images ?? []);
      if (product.sizes) setSizes(product.sizes);
      if (product.colors) setColors(product.colors);
    }
  }, [product, ready]);

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
    const wasKobo = was.trim() ? Math.round(parseFloat(was.replace(/,/g, '')) * 100) : null;
    if (wasKobo != null && (!wasKobo || wasKobo <= numericPriceKobo)) {
      setErrorMsg('The “was” price must be higher than the price, or left empty.');
      return;
    }
    setSubmitting(true);
    setErrorMsg(null);
    saveMutation.mutate({
      compare_at_price_kobo: wasKobo,
      allow_preorder: preorder,
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
      <BackHeader
        title="Edit product"
        fallback="/products"
        right={
          <Pressable accessibilityRole="button" accessibilityLabel="Delete product" onPress={() => router.push(`/product/${id}/delete`)} hitSlop={6} className="h-10 w-10 items-center justify-center rounded-full border border-line bg-surface">
            <Trash2 size={18} color={C.danger} strokeWidth={2} />
          </Pressable>
        }
      />

      {errorMsg ? (
        <View className="mx-5 my-1 rounded-2xl border border-danger/20 bg-danger-bg p-3.5">
          <T className="font-sans-medium text-sm text-danger">{errorMsg}</T>
        </View>
      ) : null}

      {!ready && !isLoading ? (
        <View className="px-5 pt-2"><LoadError what="this product" /></View>
      ) : !ready ? (
        <View className="gap-4 px-5 pt-2">
          <Skeleton className="h-[110px] w-[110px] rounded-[18px]" />
          <Skeleton className="h-[50px] rounded-[14px]" />
          <Skeleton className="h-[50px] rounded-[14px]" />
          <Skeleton className="h-40 rounded-[22px]" />
        </View>
      ) : (
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3.5 px-5 pb-6 pt-1.5">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2.5">
          {photos.length ? photos.map((uri, i) => (
            <View key={uri} className="h-24 w-24">
              <ProductImage uri={uri} name={name} className="h-full w-full rounded-[18px]" textClassName="text-2xl" />
              {i === 0 ? (
                <View className="absolute bottom-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5">
                  <T className="font-sans-bold text-[10px] text-white">COVER</T>
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
            <ProductImage name={name} className="h-24 w-24 rounded-[18px]" textClassName="text-2xl" />
          )}
          {photos.length < MAX_PHOTOS ? (
            <Pressable accessibilityRole="button" accessibilityLabel="Add photo" onPress={addPhoto} disabled={uploading} className="h-24 w-24 items-center justify-center gap-1 rounded-[18px] border-[1.5px] border-dashed border-rule">
              {uploading ? <ActivityIndicator color={C.accent} /> : <Camera size={22} color={C.muted} strokeWidth={2} />}
              <T className="font-sans-semibold text-[13px] text-muted">{uploading ? 'Uploading…' : 'Add photo'}</T>
            </Pressable>
          ) : null}
        </ScrollView>

        <View className="gap-1.5">
          <T className="font-sans-bold text-[13px] text-muted">Product name</T>
          <TextInput value={name} onChangeText={setName} accessibilityLabel="Product name" className="h-[50px] rounded-[14px] border border-line bg-surface px-3.5 font-sans-semibold text-base text-ink" />
        </View>

        <View className="flex-row gap-2.5">
          <View className="min-w-0 flex-1 gap-1.5">
            <T className="font-sans-bold text-[13px] text-muted">Price</T>
            <View className="h-[50px] flex-row items-center gap-1 rounded-[14px] border border-line bg-surface px-3.5">
              <T className="font-sans-semibold text-base">₦</T>
              <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" accessibilityLabel="Price" className="h-full min-w-0 flex-1 font-sans-semibold text-base text-ink" />
            </View>
          </View>
          <View className="min-w-0 flex-1 gap-1.5">
            <T className="font-sans-bold text-[13px] text-muted">Was (optional)</T>
            <View className="h-[50px] flex-row items-center gap-1 rounded-[14px] border border-line bg-surface px-3.5">
              <T className="font-sans-semibold text-base text-muted">₦</T>
              <TextInput value={was} onChangeText={(v) => setWas(v.replace(/[^\d]/g, ''))} keyboardType="number-pad" placeholder="Old price" placeholderTextColor={C.placeholder} accessibilityLabel="Was price, optional" className="h-full min-w-0 flex-1 font-sans-semibold text-base text-ink" />
            </View>
          </View>
        </View>

        <View className="flex-row gap-2.5">
          <View className="min-w-0 flex-1 gap-1.5">
            <T className="font-sans-bold text-[13px] text-muted">Stock</T>
            <TextInput
              value={inStock ? stock : '0'}
              onChangeText={(v) => { const d = v.replace(/\D/g, '').slice(0, 5); setStock(d); setInStock(d !== '' && d !== '0'); }}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={C.placeholder}
              accessibilityLabel="How many in stock"
              className="h-[50px] rounded-[14px] border border-line bg-surface px-3.5 font-sans-semibold text-base text-ink"
            />
          </View>
          <View className="min-w-0 flex-1 gap-1.5">
            <T className="font-sans-bold text-[13px] text-muted">Category</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Collection, ${categories.nameOf(category) || 'not set'}`}
              onPress={() => setCategoryModalOpen(true)}
              className="h-[50px] flex-row items-center justify-between rounded-[14px] border border-line bg-surface px-3.5"
            >
              <T className="flex-1 font-sans-semibold text-base" numberOfLines={1}>{categories.nameOf(category) || 'Select'}</T>
              <ChevronDown size={16} color={C.muted} strokeWidth={2} />
            </Pressable>
          </View>
        </View>

        <SearchableSelectModal
          visible={categoryModalOpen}
          onClose={() => setCategoryModalOpen(false)}
          title="Category"
          subtitle="Where this product shows in your store"
          placeholder="Search categories…"
          items={categories.items}
          selectedId={category}
          onSelect={(item) => setCategory(item.id)}
        />

        <View className="gap-2">
          <T className="font-sans-bold text-[13px] text-muted">Sizes</T>
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
                  className={cx('min-h-[44px] min-w-[44px] items-center justify-center rounded-xl px-3.5', on ? 'bg-ink' : 'border border-line bg-surface')}
                >
                  <T className={cx('font-sans-bold text-sm', on ? 'text-bg' : 'text-muted')}>{s}</T>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <T className="font-sans-bold text-[13px] text-muted">Colours</T>
          <ColourChips value={colors} onChange={setColors} />
        </View>

        <View className="flex-row items-center justify-between gap-3 rounded-[14px] border border-line bg-surface px-3.5 py-3">
          <View className="min-w-0 flex-1">
            <T className="font-sans-bold text-[15px]">Show in store</T>
            <T className="text-xs text-muted">Hidden products keep their link</T>
          </View>
          <Toggle label="Show in store" value={visible} onChange={setVisible} />
        </View>
        <View className="flex-row items-center justify-between gap-3 rounded-[14px] border border-line bg-surface px-3.5 py-3">
          <View className="min-w-0 flex-1">
            <T className="font-sans-bold text-[15px]">Allow pre-orders</T>
            <T className="text-xs text-muted">Keep selling when stock hits 0</T>
          </View>
          <Toggle label="Allow pre-orders" value={preorder} onChange={setPreorder} />
        </View>
      </ScrollView>
      )}

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="px-5 pt-3">
        <Pressable accessibilityRole="button" onPress={save} disabled={submitting || uploading} className="h-[54px] flex-row items-center justify-center gap-2 rounded-2xl bg-green">
          {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
          <T className="font-sans-bold text-base text-white">{submitting ? 'Saving…' : 'Save changes'}</T>
        </Pressable>
      </View>
    </Screen>
  );
}
