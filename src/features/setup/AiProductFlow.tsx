import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, Easing, Image, Pressable, TextInput, View } from 'react-native';
import { Camera, Check, ChevronDown, ImageIcon, Type } from 'lucide-react-native';
import { T, cx } from '@/components/ui';
import { SparkleIcon } from './parts';
import { SearchableSelectModal } from '@/components/SearchableSelectModal';
import { useCategories } from '@/features/products/useCategories';
import { ColourChips } from '@/features/products/ColourChips';
import { usePhotoDraft, type PhotoStage } from '@/features/products/usePhotoDraft';

export type AiStage = PhotoStage;

const SIZES = ['S', 'M', 'L', 'XL'];

export type AiProduct = {
  name: string; price: string; categoryId: string; description: string; colours: string[]; sizes: string[]; stock: string;
  /** AI's price range for similar items, e.g. "₦16,000 - ₦22,000". */
  priceRange: string;
};

const EMPTY: AiProduct = { name: '', price: '', categoryId: '', description: '', colours: [], sizes: [], stock: '', priceRange: '' };
const ngn = (kobo: number) => `₦${Math.round(kobo / 100).toLocaleString('en-NG')}`;

/**
 * Photo-first "Nina AI" product flow: empty -> reading (photos uploaded, AI
 * draft polling) -> filled. State lives in the parent so the screen can gate
 * its bottom button and publish `photos.imageUrls`.
 */
export function useAiProduct() {
  const [product, setProduct] = useState<AiProduct>(EMPTY);
  const photos = usePhotoDraft((d) =>
    setProduct((p) => ({
      ...p,
      name: d.title ?? p.name,
      price: d.suggested_price_kobo ? Math.round(d.suggested_price_kobo / 100).toLocaleString('en-NG') : p.price,
      categoryId: d.category_id ?? p.categoryId,
      priceRange: d.price_min_kobo && d.price_max_kobo ? `${ngn(d.price_min_kobo)} - ${ngn(d.price_max_kobo)}` : p.priceRange,
      description: d.description ?? p.description,
      colours: d.colors?.length ? d.colors : p.colours,
    })),
  );

  const update = (patch: Partial<AiProduct>) => setProduct((p) => ({ ...p, ...patch }));
  return { stage: photos.stage, product, update, photos };
}

type Flow = ReturnType<typeof useAiProduct>;

/** Small amber "AI" mark on fields Nina filled in. */
function Tag({ label }: { label: string }) {
  return (
    <View className="rounded-md bg-warn-bg px-1.5 py-px">
      <T className="font-sans-bold text-[11px] text-warn-fg">{label}</T>
    </View>
  );
}

function FieldLabel({ label, tag }: { label: string; tag: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <T className="font-sans-bold text-[13px] text-muted">{label}</T>
      <Tag label={tag} />
    </View>
  );
}

/** The checklist under the photo while Nina works. Steps tick over on a timer; the real wait is the AI's. */
const STEPS = ['Looking at the item and its colours', 'Matching it to a category', 'Writing the name and description', 'Suggesting a price from similar items'];
const STEP_MS = 3500;

function Corner({ pos }: { pos: 'tl' | 'tr' | 'bl' | 'br' }) {
  const v = pos[0] === 't' ? { top: 22 } : { bottom: 22 };
  const h = pos[1] === 'l' ? { left: 22 } : { right: 22 };
  const b = {
    borderColor: '#FFFFFF',
    borderTopWidth: pos[0] === 't' ? 3 : 0,
    borderBottomWidth: pos[0] === 'b' ? 3 : 0,
    borderLeftWidth: pos[1] === 'l' ? 3 : 0,
    borderRightWidth: pos[1] === 'r' ? 3 : 0,
    [`border${pos[0] === 't' ? 'Top' : 'Bottom'}${pos[1] === 'l' ? 'Left' : 'Right'}Radius`]: 10,
  };
  return <View style={{ position: 'absolute', width: 28, height: 28, ...v, ...h, ...b }} />;
}

function Reading({ uri, onSkip }: { uri?: string; onSkip: () => void }) {
  const [step, setStep] = useState(0);
  const scan = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const t = setInterval(() => setStep((n) => Math.min(n + 1, STEPS.length - 1)), STEP_MS);
    const a = Animated.loop(Animated.sequence([
      Animated.timing(scan, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
      Animated.timing(scan, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: false }),
    ]));
    a.start();
    return () => { clearInterval(t); a.stop(); };
  }, [scan]);
  const top = scan.interpolate({ inputRange: [0, 1], outputRange: ['18%', '82%'] });

  return (
    <View className="gap-3.5" accessibilityLiveRegion="polite">
      <View className="h-[260px] overflow-hidden rounded-[28px] bg-[#10251B]">
        {uri ? <Image source={{ uri }} className="h-full w-full" resizeMode="cover" /> : null}
        <Animated.View style={{ position: 'absolute', left: 30, right: 30, top, height: 2, backgroundColor: '#FFFFFF', shadowColor: '#FFFFFF', shadowOpacity: 1, shadowRadius: 6, elevation: 3 }} />
        <Corner pos="tl" /><Corner pos="tr" /><Corner pos="bl" /><Corner pos="br" />
        <View className="absolute bottom-5 self-center flex-row items-center gap-1.5 rounded-full bg-[rgba(14,26,21,0.75)] px-3.5 py-2">
          <SparkleIcon size={14} color="#F3C77A" />
          <T className="font-sans-bold text-[13px] text-white">Nina is reading your photo</T>
        </View>
      </View>
      <View className="gap-3 rounded-[22px] border border-line bg-surface p-4">
        {STEPS.map((label, i) => {
          const done = i < step;
          const doing = i === step;
          return (
            <View key={label} className="flex-row items-center gap-3">
              <View className={cx('h-[26px] w-[26px] items-center justify-center rounded-full', done ? 'bg-green' : doing ? 'bg-mint' : 'bg-sand')}>
                {done ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : doing ? <ActivityIndicator size="small" color="#1E5E3A" /> : null}
              </View>
              <T className={cx('flex-1 text-[15px]', done ? 'font-sans-bold' : doing ? 'font-sans-medium' : 'font-sans-bold text-muted')}>{label}</T>
            </View>
          );
        })}
      </View>
      <Pressable accessibilityRole="button" onPress={onSkip} className="min-h-11 items-center justify-center">
        <T className="font-sans-bold text-sm text-green">Skip, I’ll fill it in myself</T>
      </Pressable>
    </View>
  );
}

/** The dark camera stage from the design, with Gallery / shutter / Type it underneath. */
function Snap({ flow }: { flow: Flow }) {
  const { photos } = flow;
  return (
    <View className="gap-3.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Take a photo"
        onPress={() => photos.addFrom('camera')}
        disabled={photos.uploading}
        className="h-[300px] items-center justify-center overflow-hidden rounded-[28px] bg-[#10251B]"
      >
        <View style={{ position: 'absolute', top: 40, right: 40, bottom: 40, left: 40, borderRadius: 22, borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.35)' }} />
        <View className="items-center gap-2.5 px-14">
          <View className="h-16 w-16 items-center justify-center rounded-[22px] bg-white/10">
            {photos.uploading ? <ActivityIndicator color="#FFFFFF" /> : <Camera size={28} color="#FFFFFF" strokeWidth={1.9} />}
          </View>
          <T className="text-center font-display text-xl text-white">{photos.uploading ? 'Uploading…' : 'Snap your product'}</T>
          <T className="text-center text-sm leading-5 text-[#B8CCC1]">Good light, plain background. Nina will write the name, price and description.</T>
        </View>
        <View className="absolute left-4 top-4 flex-row items-center gap-1.5 rounded-full bg-gold px-2.5 py-1.5">
          <SparkleIcon size={12} color="#2A1B05" />
          <T className="font-sans-bold text-xs text-[#2A1B05]">AI on</T>
        </View>
      </Pressable>
      <View className="flex-row items-center gap-3">
        <Pressable accessibilityRole="button" onPress={() => photos.addFrom('library')} disabled={photos.uploading} className="h-[52px] min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-line bg-surface">
          <ImageIcon size={18} color="#0E1A15" strokeWidth={2} />
          <T className="font-sans-bold text-sm">Gallery</T>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Take photo" onPress={() => photos.addFrom('camera')} disabled={photos.uploading} className="h-[72px] w-[72px] items-center justify-center rounded-full border-[5px] border-green bg-surface">
          <View className="h-[50px] w-[50px] rounded-full bg-green" />
        </Pressable>
        <Pressable accessibilityRole="button" onPress={photos.skip} className="h-[52px] min-w-0 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border border-line bg-surface">
          <Type size={18} color="#0E1A15" strokeWidth={2} />
          <T className="font-sans-bold text-sm">Type it</T>
        </Pressable>
      </View>
      {photos.error ? <T className="text-center text-sm text-danger">{photos.error}</T> : null}
    </View>
  );
}

const inputBox = 'rounded-[14px] border border-line bg-surface';

function FilledForm({ product: p, update, onRedo, aiError }: { product: AiProduct; update: Flow['update']; onRedo: () => void; aiError: string | null }) {
  const [sizesOpen, setSizesOpen] = useState(p.sizes.length > 0);
  const [stockOpen, setStockOpen] = useState(p.stock.length > 0);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const categories = useCategories();

  const setPrice = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 9);
    update({ price: digits ? Number(digits).toLocaleString('en-NG') : '' });
  };
  const toggleSize = (s: string) =>
    update({ sizes: p.sizes.includes(s) ? p.sizes.filter((x) => x !== s) : [...p.sizes, s] });

  return (
    <View className="gap-3.5">
      <View className="flex-row items-center justify-between gap-2 rounded-[14px] bg-mint px-3.5 py-3">
        <View className="shrink flex-row items-center gap-2">
          <SparkleIcon size={15} color="#14532D" />
          <T className="shrink text-[13px] leading-[19px] text-[#14532D]">{aiError ?? (p.name ? 'Nina filled this in. Check it, then publish.' : 'Fill in the details.')}</T>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onRedo}
          hitSlop={{ top: 6, bottom: 6 }}
          className="h-8 justify-center rounded-full bg-surface px-3"
        >
          <T className="font-sans-bold text-xs text-green">Read again</T>
        </Pressable>
      </View>

      <View className="gap-1.5">
        <FieldLabel label="Product name" tag="AI" />
        <TextInput
          value={p.name}
          onChangeText={(v) => update({ name: v })}
          accessibilityLabel="Product name"
          placeholderTextColor="#8A948F"
          className={cx(inputBox, 'h-[50px] px-3.5 font-sans-semibold text-base text-ink')}
        />
      </View>

      <View className="flex-row gap-2.5">
        <View className="min-w-0 flex-1 gap-1.5">
          <FieldLabel label="Price" tag="AI" />
          <View className={cx(inputBox, 'h-[50px] flex-row items-center gap-1.5 px-3.5')}>
            <T className="font-sans-bold text-base">₦</T>
            <TextInput
              value={p.price}
              onChangeText={setPrice}
              keyboardType="number-pad"
              accessibilityLabel="Price"
              className="h-full flex-1 font-sans-semibold text-base text-ink"
            />
          </View>
        </View>
        <View className="min-w-0 flex-1 gap-1.5">
          <FieldLabel label="Category" tag="AI" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Category: ${categories.nameOf(p.categoryId) || 'not set'}`}
            onPress={() => setCategoryModalOpen(true)}
            className={cx(inputBox, 'h-[50px] flex-row items-center justify-between px-3')}
          >
            <T className="flex-1 font-sans-semibold text-base" numberOfLines={1}>{categories.nameOf(p.categoryId) || 'Select'}</T>
            <ChevronDown size={16} color="#5F6B65" strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <SearchableSelectModal
        visible={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Select Category"
        subtitle="Choose the best category for this item"
        placeholder="Search categories..."
        items={categories.items}
        selectedId={p.categoryId}
        onSelect={(item) => update({ categoryId: item.id })}
      />
      {p.priceRange ? <T className="-mt-1.5 text-xs text-muted">Similar items in Nigeria: {p.priceRange}</T> : null}

      <View className="gap-1.5">
        <FieldLabel label="Description" tag="AI" />
        <TextInput
          value={p.description}
          onChangeText={(v) => update({ description: v })}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          accessibilityLabel="Description"
          className={cx(inputBox, 'min-h-[88px] px-3.5 py-2.5 font-sans text-[15px] leading-[22px] text-ink')}
        />
      </View>

      <View className="gap-2">
        <FieldLabel label="Colour" tag="AI" />
        <ColourChips value={p.colours} onChange={(colours) => update({ colours })} />
      </View>

      <View className="gap-2.5 rounded-2xl border border-line bg-surface p-3.5">
        <T className="font-sans-bold text-sm">Add what a photo can’t show</T>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: sizesOpen }}
            onPress={() => setSizesOpen(!sizesOpen)}
            className="rounded-xl border border-dashed border-line-2 bg-bg px-3 py-[9px]"
          >
            <T className="font-sans-bold text-sm text-ink">{p.sizes.length ? `Sizes: ${p.sizes.join(', ')}` : '+ Sizes'}</T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: stockOpen }}
            onPress={() => setStockOpen(!stockOpen)}
            className="flex-1 rounded-xl border border-dashed border-line-2 bg-bg px-3 py-[9px]"
          >
            <T className="font-sans-bold text-sm text-ink">{p.stock ? `${p.stock} in stock` : '+ How many in stock'}</T>
          </Pressable>
        </View>
        {sizesOpen ? (
          <View className="flex-row gap-2">
            {SIZES.map((s) => {
              const on = p.sizes.includes(s);
              return (
                <Pressable
                  key={s}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: on }}
                  onPress={() => toggleSize(s)}
                  className={cx('h-11 min-w-[44px] items-center justify-center rounded-xl px-3', on ? 'bg-ink' : 'border border-line bg-surface')}
                >
                  <T className={cx('font-sans-bold text-sm', on ? 'text-white' : 'text-ink')}>{s}</T>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {stockOpen ? (
          <TextInput
            value={p.stock}
            onChangeText={(v) => update({ stock: v.replace(/\D/g, '').slice(0, 5) })}
            keyboardType="number-pad"
            placeholder="How many in stock"
            placeholderTextColor="#8A948F"
            accessibilityLabel="How many in stock"
            className="h-11 rounded-xl border border-line bg-surface px-3 font-sans text-base text-ink"
          />
        ) : null}
      </View>
    </View>
  );
}

/** The photo-first flow: camera stage, Nina reading, then the filled form. Render inside a ScrollView. */
export function AiProductFlow({ flow }: { flow: Flow }) {
  const { stage, product, update, photos } = flow;
  if (stage === 'empty' && photos.photos.length === 0) return <Snap flow={flow} />;
  if (stage === 'reading') return <Reading uri={photos.photos[0]?.uri} onSkip={photos.skip} />;
  return (
    <>
      <View className="flex-row gap-2">
        {photos.photos.map((ph, k) => (
          <Pressable
            key={ph.uri}
            accessibilityRole="button"
            accessibilityLabel={`${k === 0 ? 'Cover photo' : `Photo ${k + 1}`}. Long press to remove.`}
            onLongPress={() => photos.remove(ph.uri)}
            className="h-[92px] w-[92px] overflow-hidden rounded-[18px] bg-sand"
          >
            <Image source={{ uri: ph.uri }} className="h-full w-full" resizeMode="cover" />
            {k === 0 ? (
              <View className="absolute bottom-1.5 left-1.5 rounded-md bg-black/55 px-1.5 py-0.5">
                <T className="font-sans-bold text-[10px] text-white">COVER</T>
              </View>
            ) : null}
          </Pressable>
        ))}
        {photos.canAddMore ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add photo"
            onPress={photos.pick}
            disabled={photos.uploading}
            className="h-[92px] w-[92px] items-center justify-center rounded-[18px] border-[1.5px] border-dashed border-[#BFC7C1]"
          >
            {photos.uploading ? <ActivityIndicator color="#1E5E3A" /> : <Camera size={22} color="#5F6B65" strokeWidth={2} />}
          </Pressable>
        ) : null}
      </View>
      <FilledForm product={product} update={update} onRedo={photos.reread} aiError={photos.error} />
    </>
  );
}
