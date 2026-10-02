import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, ChevronDown, Lock } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Screen, T, cx } from '@/components/ui';
import { Sparkle, goBack } from '@/features/seller/parts';
import { createProduct, uploadProductImage, createAiProductDraft, getAiProductDraftStatus } from '@/api/products';
import { formatNaira } from '@/lib/format';
import { SearchableSelectModal } from '@/components/SearchableSelectModal';
import { STORE_CATEGORIES } from '@/data/categories';

type Stage = 'empty' | 'reading' | 'filled';
const ghost = ['Product name', 'Price', 'Category', 'Description'];

function AiBadge({ label = 'AI' }: { label?: string }) {
  return (
    <View className="rounded-md bg-mint px-[7px] py-0.5">
      <T className="font-sans-bold text-[11px] text-green">{label}</T>
    </View>
  );
}

function Label({ text, badge }: { text: string; badge?: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <T className="font-sans-bold text-sm">{text}</T>
      <AiBadge label={badge} />
    </View>
  );
}

function DashedChip({ label, className, onPress }: { label: string; className?: string; onPress?: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className={cx('min-h-[40px] justify-center rounded-xl border border-dashed border-[#C9A56A] bg-surface px-3', className)}>
      <T className="font-sans-bold text-sm text-[#3D2608]">{label}</T>
    </Pressable>
  );
}

export default function AddProduct() {
  const insets = useSafeAreaInsets();
  const [stage, setStage] = useState<Stage>('empty');
  const [photos, setPhotos] = useState<string[]>([]);
  const [jobId, setJobId] = useState<string | null>(null);

  const [name, setName] = useState('Àdìrẹ two-piece set');
  const [price, setPrice] = useState('18500');
  const [category, setCategory] = useState('Fashion');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [desc, setDesc] = useState('Hand-dyed àdìrẹ-style two-piece set.');
  const [colors, setColors] = useState<string[]>(['Saffron']);
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L', 'XL']);
  const [stock, setStock] = useState('10');

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pick photos using expo-image-picker
  const pickImages = async () => {
    try {
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 3,
        quality: 0.8,
      });

      if (!res.canceled && res.assets && res.assets.length > 0) {
        const uris = res.assets.map((a) => a.uri);
        setPhotos(uris);
        setStage('reading');
        setErrorMsg(null);

        // Upload images and kick off AI vision draft
        const uploadPromises = uris.map((uri) => uploadProductImage(uri).catch(() => ({ url: uri })));
        const uploaded = await Promise.all(uploadPromises);
        const imageUrls = uploaded.map((u) => u.url);

        const draftJob = await createAiProductDraft(imageUrls);
        setJobId(draftJob.job_id);
      }
    } catch (err: any) {
      // Fallback preview mode
      setStage('reading');
    }
  };

  // Poll status of AI Vision Draft job
  useEffect(() => {
    if (stage !== 'reading' || !jobId) return;

    const interval = setInterval(async () => {
      try {
        const status = await getAiProductDraftStatus(jobId);
        if (status.status === 'completed') {
          if (status.title) setName(status.title);
          if (status.suggested_price_kobo) setPrice(String(Math.round(status.suggested_price_kobo / 100)));
          if (status.category) setCategory(status.category);
          if (status.description) setDesc(status.description);
          if (status.colors && status.colors.length > 0) setColors(status.colors);
          setStage('filled');
          clearInterval(interval);
        }
      } catch {
        // Fallback after 2.5 seconds
        setTimeout(() => setStage('filled'), 2500);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stage, jobId]);

  const onPublish = async () => {
    if (stage !== 'filled' || submitting) return;
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const numericPriceKobo = Math.round(parseFloat(price.replace(/,/g, '')) * 100) || 1850000;
      await createProduct({
        name,
        price_kobo: numericPriceKobo,
        category,
        description: desc,
        stock_count: parseInt(stock, 10) || 10,
        status: 'live',
        images: photos,
        sizes,
      });
      router.dismissTo('/products');
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not publish product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const filled = stage === 'filled';
  const reading = stage === 'reading';

  return (
    <Screen>
      <View className="flex-row items-center justify-between px-3 pb-2 pt-1">
        <Pressable accessibilityRole="button" onPress={() => goBack('/products')} className="h-11 justify-center px-2">
          <T className="font-sans-semibold text-base text-muted">Cancel</T>
        </Pressable>
        <T className="font-sans-bold text-[17px]">New product</T>
        <View className="w-[60px]" />
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3.5 px-5 pb-6 pt-3">
        <View className="flex-row items-center justify-between gap-2">
          <T className="flex-1 text-sm text-muted-2">Start with a photo. AI does the typing.</T>
          <View className="flex-row items-center gap-[5px] rounded-full bg-mint px-2.5 py-[5px]">
            <Sparkle size={12} />
            <T className="font-sans-bold text-xs text-green">Unlimited AI</T>
          </View>
        </View>

        {errorMsg ? (
          <View className="rounded-xl bg-red-100 p-3.5 border border-red-200">
            <T className="text-sm font-sans-medium text-red-800">{errorMsg}</T>
          </View>
        ) : null}

        {stage === 'empty' ? (
          <Pressable
            accessibilityRole="button"
            onPress={pickImages}
            className="h-[210px] items-center justify-center gap-2.5 rounded-[22px] border-2 border-dashed border-[#B9B1A0] bg-surface"
          >
            <View className="h-14 w-14 items-center justify-center rounded-full bg-mint">
              <Camera size={26} color="#0B6E4F" strokeWidth={2} />
            </View>
            <T className="font-sans-bold text-base text-[#33403A]">Take a photo or choose from gallery</T>
            <T className="text-[13px] text-muted">Up to 3 photos · Nina AI fills in the rest</T>
          </Pressable>
        ) : (
          <View className="flex-row gap-2">
            {photos.map((uri, idx) => (
              <View key={idx} className="h-[92px] w-[92px] overflow-hidden rounded-2xl bg-saffron">
                <Image source={{ uri }} className="h-full w-full" resizeMode="cover" />
                {idx === 0 ? (
                  <View className="absolute bottom-1.5 left-1.5 rounded-full bg-surface px-[7px] py-0.5">
                    <T className="font-sans-bold text-[10px]">Cover</T>
                  </View>
                ) : null}
              </View>
            ))}
            {photos.length < 3 ? (
              <Pressable accessibilityRole="button" onPress={pickImages} className="h-[92px] flex-1 items-center justify-center rounded-2xl border-[1.5px] border-dashed border-[#B9B1A0] bg-surface">
                <T className="text-[22px] text-muted">+</T>
              </Pressable>
            ) : null}
          </View>
        )}

        {reading ? (
          <View accessibilityLiveRegion="polite" className="gap-2.5 rounded-[20px] bg-ink p-4">
            <View className="flex-row items-center gap-2">
              <Sparkle size={16} color="#6FD3A4" />
              <T className="font-sans-bold text-[15px] text-bg">Nina AI is reading your photos…</T>
            </View>
            <View className="h-1.5 overflow-hidden rounded-full bg-[#33504A]">
              <View className="h-1.5 w-[64%] rounded-full bg-leaf" />
            </View>
            <T className="text-sm text-on-dark">✓ Two-piece: top + wide-leg trousers</T>
            <T className="text-sm text-on-dark">✓ Àdìrẹ-style print, saffron colour</T>
            <T className="text-sm text-on-dark-2">… Checking prices in Lagos</T>
            <Pressable accessibilityRole="button" onPress={() => setStage('filled')} className="h-[38px] justify-center self-start rounded-full border border-[rgba(246,243,236,0.3)] px-3.5">
              <T className="font-sans-semibold text-[13px] text-bg">Skip - fill in myself</T>
            </Pressable>
          </View>
        ) : null}

        {!filled ? (
          <View className="gap-2.5">
            {ghost.map((g) => (
              <View key={g} className="gap-2 rounded-[14px] border border-sand bg-surface px-3.5 py-3">
                <T className="font-sans-bold text-[11px] uppercase tracking-[0.9px] text-[#A7ADA9]">{g}</T>
                <View style={{ backgroundColor: reading ? '#DCE9E2' : '#ECE8DF' }} className="h-[9px] w-[55%] rounded-full" />
              </View>
            ))}
            <View className="flex-row items-center justify-center gap-2">
              <Lock size={15} color="#0B6E4F" strokeWidth={2} />
              <T className="font-sans-semibold text-sm text-muted">{reading ? 'Filling in from your photos…' : 'Add a photo to unlock the form'}</T>
            </View>
          </View>
        ) : (
          <View className="gap-3.5">
            <View className="flex-row items-center justify-between gap-2 rounded-[14px] bg-mint px-3 py-2.5">
              <View className="flex-1 flex-row items-center gap-2">
                <Sparkle size={15} />
                <T className="font-sans-semibold text-[13px] text-deep">Filled in by Nina AI. Check it.</T>
              </View>
              <Pressable accessibilityRole="button" onPress={() => setStage('reading')} hitSlop={6} className="h-8 justify-center rounded-full border border-[#9CC7B2] bg-surface px-3">
                <T className="font-sans-bold text-xs text-green">Read again</T>
              </Pressable>
            </View>

            <View className="gap-1.5">
              <Label text="Product name" />
              <TextInput value={name} onChangeText={setName} accessibilityLabel="Product name" className="h-[50px] rounded-[14px] border border-line-2 bg-surface px-3.5 font-sans text-base text-ink" />
            </View>

            <View className="flex-row gap-2.5">
              <View className="flex-1 gap-1.5">
                <Label text="Price" badge="Suggested" />
                <View className="h-[50px] flex-row items-center gap-1.5 rounded-[14px] border border-line-2 bg-surface px-3.5">
                  <T className="font-sans-bold">₦</T>
                  <TextInput value={price} onChangeText={setPrice} keyboardType="number-pad" accessibilityLabel="Price" className="h-full min-w-0 flex-1 font-sans-semibold text-base text-ink" />
                </View>
              </View>
              <View className="w-[140px] gap-1.5">
                <Label text="Category" />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Category, ${category}`}
                  onPress={() => setCategoryModalOpen(true)}
                  className="h-[50px] flex-row items-center justify-between rounded-[14px] border border-line-2 bg-surface px-3"
                >
                  <T className="text-[15px]" numberOfLines={1}>{category}</T>
                  <ChevronDown size={16} color="#5B6660" strokeWidth={2} />
                </Pressable>
              </View>
            </View>
            <T className="-mt-1.5 text-xs text-muted">Similar items in Lagos: ₦16,000 - ₦22,000</T>

            <View className="gap-1.5">
              <Label text="Description" />
              <TextInput
                value={desc}
                onChangeText={setDesc}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                accessibilityLabel="Description"
                className="min-h-[88px] rounded-[14px] border border-line-2 bg-surface px-3.5 py-2.5 font-sans text-[15px] leading-[22px] text-ink"
              />
            </View>

            <View className="gap-2">
              <Label text="Colour" />
              <View className="flex-row gap-2">
                {colors.map((c, i) => (
                  <View key={i} className="min-h-[40px] justify-center rounded-xl bg-ink px-3.5">
                    <T className="font-sans-bold text-sm text-bg">{c}</T>
                  </View>
                ))}
              </View>
            </View>

            <View className="gap-2.5 rounded-2xl bg-peach p-3.5">
              <T className="font-sans-bold text-sm text-[#3D2608]">Stock quantity</T>
              <TextInput value={stock} onChangeText={setStock} keyboardType="number-pad" className="h-[44px] rounded-xl border border-line-2 bg-surface px-3 font-sans-semibold text-base" />
            </View>
          </View>
        )}
      </ScrollView>

      <SearchableSelectModal
        visible={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Select Category"
        subtitle="Choose category for this product"
        placeholder="Search category..."
        items={STORE_CATEGORIES.map((cat) => ({
          id: cat.id,
          title: cat.name,
          subtitle: cat.description,
          badge: cat.id,
        }))}
        selectedId={category}
        onSelect={(item) => setCategory(item.id)}
      />

      <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="border-t border-line bg-bg px-5 pt-3">
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !filled || submitting }}
          disabled={!filled || submitting}
          onPress={onPublish}
          className={cx('h-[54px] flex-row items-center justify-center gap-2 rounded-full', filled ? 'bg-green' : 'bg-[#BFD3C8]')}
        >
          {submitting ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
          <T className="font-sans-bold text-[17px] text-white">{submitting ? 'Publishing...' : 'Save and publish'}</T>
        </Pressable>
      </View>
    </Screen>
  );
}
