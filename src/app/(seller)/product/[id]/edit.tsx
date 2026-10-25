import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ChevronDown, Trash2 } from 'lucide-react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, T, cx } from '@/components/ui';
import { Toggle, goBack } from '@/features/seller/parts';
import { getProduct, updateProduct, uploadProductImage } from '@/api/products';
import { SearchableSelectModal } from '@/components/SearchableSelectModal';
import { useCategories } from '@/features/products/useCategories';
import { ColourChips } from '@/features/products/ColourChips';

const ALL_SIZES = ['S', 'M', 'L', 'XL'];
const MAX_PHOTOS = 3;
const inputBox = 'rounded-[14px] border border-line-2 bg-surface px-3.5 font-sans text-base text-ink';

export default function EditProduct() {
  const { id, focus } = useLocalSearchParams<{ id: string; focus?: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const stockInput = useRef<TextInput>(null);

  const { data: product, isLoading, isError, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProduct(id!),
    enabled: !!id,
  });

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const categories = useCategories();
  const [category, setCategory] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [sizes, setSizes] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [stock, setStock] = useState('');
  const [visible, setVisible] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!product) return;
    setName(product.name);
    setPrice(String(Math.round(product.price_kobo / 100)));
    setDescription(product.description ?? '');
    setCategory(product.category_id ?? '');
    setStock(String(product.stock_count ?? 0));
    setVisible(product.status !== 'hidden');
    setImages((product.images ?? []).filter(Boolean));
    if (product.sizes) setSizes(product.sizes);
    if (product.colors) setColors(product.colors);
    // From "Mark as in stock": ask for the quantity straight away
    if (focus === 'stock') setTimeout(() => stockInput.current?.focus(), 300);
  }, [product, focus]);

  const toggleSize = (s: string) => setSizes((cur) => (cur.includes(s) ? cur.filter((x) => x !== s) : [...cur, s]));

  const saveMutation = useMutation({
    mutationFn: (payload: any) => updateProduct(id!, payload, product?.variants),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', id] });
      goBack('/products');
    },
    onError: (err: any) => setErrorMsg(err.message || 'Could not save product changes.'),
  });

  const addPhotos = async (source: 'camera' | 'library') => {
    const room = MAX_PHOTOS - images.length;
    if (room <= 0) return;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        setErrorMsg('Allow camera access in Settings to take product photos.');
        return;
      }
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.8 };
    const res = source === 'camera'
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync({ ...options, allowsMultipleSelection: true, selectionLimit: room });
    if (res.canceled || !res.assets?.length) return;

    setUploading(true);
    setErrorMsg(null);
    const results = await Promise.allSettled(res.assets.slice(0, room).map((a) => uploadProductImage(a.uri)));
    setUploading(false);
    const urls = results.flatMap((r) => (r.status === 'fulfilled' && r.value?.url ? [r.value.url] : []));
    if (urls.length < results.length) setErrorMsg('Some photos didn’t upload. Try those again.');
    setImages((cur) => [...cur, ...urls].slice(0, MAX_PHOTOS));
  };

  const pickPhotos = () =>
    Alert.alert('Add product photos', undefined, [
      { text: 'Take a photo', onPress: () => addPhotos('camera') },
      { text: 'Choose from gallery', onPress: () => addPhotos('library') },
      { text: 'Cancel', style: 'cancel' },
    ]);

  const removePhoto = (url: string) =>
    Alert.alert('Remove this photo?', undefined, [
      { text: 'Keep', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => setImages((cur) => cur.filter((u) => u !== url)) },
    ]);

  const save = () => {
    if (saveMutation.isPending || uploading || !product) return;
    const numericPriceKobo = Math.round(parseFloat(price.replace(/,/g, '')) * 100);
    if (!name.trim() || !numericPriceKobo) {
      setErrorMsg('Add a name and price first.');
      return;
    }
    if (stock.trim() === '') {
      setErrorMsg('Add how many you have in stock (0 for sold out).');
      return;
    }
    setErrorMsg(null);
    saveMutation.mutate({
      name: name.trim(),
      price_kobo: numericPriceKobo,
      description: description.trim(),
      category_id: category || null,
      images,
      stock_count: parseInt(stock, 10) || 0,
      // Keep pre-order products on pre-order
      status: !visible ? 'hidden' : product.status === 'preorder' ? 'preorder' : 'live',
      sizes,
      colors,
    });
  };

  const saving = saveMutation.isPending;

  if (!product) {
    return (
      <Screen>
        <View className="flex-row items-center px-3 pb-2 pt-1">
          <Pressable accessibilityRole="button" onPress={() => goBack('/products')} className="h-11 justify-center px-2">
            <T className="font-sans-semibold text-base text-muted">Cancel</T>
          </Pressable>
        </View>
        <View className="flex-1 items-center justify-center gap-3">
          {isLoading ? <ActivityIndicator color="#0B6E4F" /> : (
            <Pressable accessibilityRole="button" onPress={() => refetch()}>
              <T className="text-muted-2">{isError ? 'Couldn’t load this product. Tap to try again.' : 'Product not found.'}</T>
            </Pressable>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-3 pb-2 pt-1">
        <Pressable accessibilityRole="button" onPress={() => goBack('/products')} className="h-11 justify-center px-2">
          <T className="font-sans-semibold text-base text-muted">Cancel</T>
        </Pressable>
        <T className="font-sans-bold text-[17px]">Edit product</T>
        <Pressable accessibilityRole="button" onPress={save} disabled={saving || uploading} className="h-11 justify-center px-2">
          <T className="font-sans-bold text-base text-green">{saving ? 'Saving...' : 'Save'}</T>
        </Pressable>
      </View>

      {errorMsg ? (
        <View className="mx-5 my-1 rounded-xl border border-red-200 bg-red-100 p-3.5">
          <T className="text-sm font-sans-medium text-red-800">{errorMsg}</T>
        </View>
      ) : null}

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-4 px-5 pb-6 pt-2">
        <View className="flex-row flex-wrap gap-2.5">
          {images.map((url, k) => (
            <Pressable
              key={url}
              accessibilityRole="button"
              accessibilityLabel={`${k === 0 ? 'Cover photo' : `Photo ${k + 1}`}, remove`}
              onPress={() => removePhoto(url)}
              className="h-[100px] w-[100px] overflow-hidden rounded-[18px] bg-sand"
            >
              <Image source={{ uri: url }} className="h-full w-full" resizeMode="cover" />
              {k === 0 ? (
                <View className="absolute bottom-2 left-2 rounded-full bg-surface px-2 py-[3px]">
                  <T className="font-sans-bold text-[11px]">Cover</T>
                </View>
              ) : null}
            </Pressable>
          ))}
          {images.length < MAX_PHOTOS ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Add photo"
              onPress={pickPhotos}
              disabled={uploading}
              className="h-[100px] w-[100px] items-center justify-center gap-1.5 rounded-[18px] border-[1.5px] border-dashed border-[#B9B1A0] bg-surface"
            >
              {uploading ? <ActivityIndicator color="#0B6E4F" /> : <Camera size={22} color="#5B6660" strokeWidth={2} />}
              <T className="font-sans-semibold text-[13px] text-muted">{uploading ? 'Uploading…' : 'Add photo'}</T>
            </Pressable>
          ) : null}
        </View>
        {images.length ? <T className="-mt-2 text-xs text-muted">Tap a photo to remove it.</T> : null}

        <View className="gap-1.5">
          <T className="font-sans-bold text-sm">Product name</T>
          <TextInput value={name} onChangeText={setName} accessibilityLabel="Product name" className={cx(inputBox, 'h-[50px]')} />
        </View>

        <View className="flex-row gap-3">
          <View className="flex-1 gap-1.5">
            <T className="font-sans-bold text-sm">Price</T>
            <View className="h-[50px] flex-row items-center gap-1.5 rounded-[14px] border border-line-2 bg-surface px-3.5">
              <T className="font-sans-bold">₦</T>
              <TextInput value={price} onChangeText={(v) => setPrice(v.replace(/[^\d]/g, ''))} keyboardType="number-pad" accessibilityLabel="Price" className="h-full min-w-0 flex-1 font-sans-semibold text-base text-ink" />
            </View>
          </View>
          <View className="w-[140px] gap-1.5">
            <T className="font-sans-bold text-sm">Category</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Category, ${categories.nameOf(category) || 'not set'}`}
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
          title="Select Category"
          placeholder="Search categories..."
          items={categories.items}
          selectedId={category}
          onSelect={(item) => setCategory(item.id)}
        />

        <View className="gap-1.5">
          <T className="font-sans-bold text-sm">Description</T>
          <TextInput
            value={description}
            onChangeText={setDescription}
            multiline
            textAlignVertical="top"
            accessibilityLabel="Description"
            className={cx(inputBox, 'min-h-[96px] py-2.5 text-[15px] leading-[22px]')}
          />
        </View>

        <View className="gap-2">
          <T className="font-sans-bold text-sm">Sizes</T>
          <View className="flex-row flex-wrap gap-2">
            {/* Sizes added on the web (e.g. 42) stay selectable here too */}
            {[...ALL_SIZES, ...sizes.filter((s) => !ALL_SIZES.includes(s))].map((s) => {
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
          <View className="flex-row items-center justify-between gap-3 px-4 py-3">
            <View className="flex-1">
              <T className="font-sans-semibold text-[15px]">How many in stock</T>
              <T className="text-xs text-muted">{sizes.length || colors.length ? 'Shared across sizes and colours' : '0 shows it as sold out'}</T>
            </View>
            <TextInput
              ref={stockInput}
              value={stock}
              onChangeText={(v) => setStock(v.replace(/\D/g, '').slice(0, 6))}
              keyboardType="number-pad"
              accessibilityLabel="How many in stock"
              className="h-11 w-24 rounded-xl border border-line-2 bg-surface px-3 text-right font-sans-semibold text-base text-ink"
            />
          </View>
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
        <Pressable accessibilityRole="button" onPress={save} disabled={saving || uploading} className={cx('h-[54px] flex-1 flex-row items-center justify-center gap-2 rounded-full bg-deep', (saving || uploading) && 'opacity-60')}>
          {saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
          <T className="font-sans-bold text-[17px] text-white">{saving ? 'Saving...' : 'Save changes'}</T>
        </Pressable>
      </View>
    </Screen>
  );
}
