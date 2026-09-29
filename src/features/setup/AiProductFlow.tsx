import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, TextInput, View } from 'react-native';
import { Camera, ChevronDown, Lock } from 'lucide-react-native';
import { T, cx } from '@/components/ui';
import { SparkleIcon } from './parts';

export type AiStage = 'empty' | 'reading' | 'filled';

const READ_MS = 2200;
const PHOTOS = ['#E9A23B', '#D48E2A', '#F0B861'];
const GHOST = ['Product name', 'Price', 'Category', 'Description'];
const SIZES = ['S', 'M', 'L', 'XL'];

export type AiProduct = {
  name: string; price: string; category: string; description: string; colours: string[]; sizes: string[]; stock: string;
};

const AI_RESULT: AiProduct = {
  name: 'Àdìrẹ two-piece set',
  price: '18,500',
  category: 'Two-piece',
  description: 'Hand-dyed àdìrẹ-style two-piece in warm saffron. Relaxed top with matching wide-leg trousers.',
  colours: ['Saffron'],
  sizes: [],
  stock: '',
};

/**
 * Photo-first "Nina AI" product flow: empty -> reading (auto after ~2.2s, or Skip) -> filled.
 * State lives in the parent (`useAiProduct`) so the screen can gate its bottom button.
 */
export function useAiProduct(initial: AiStage = 'empty') {
  const [stage, setStage] = useState<AiStage>(initial);
  const [product, setProduct] = useState<AiProduct>(AI_RESULT);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = (st: AiStage) => {
    if (timer.current) clearTimeout(timer.current);
    setStage(st);
    if (st === 'reading') {
      setProduct(AI_RESULT);
      timer.current = setTimeout(() => setStage('filled'), READ_MS);
    }
  };

  useEffect(() => {
    if (initial === 'reading') go('reading');
    return () => { if (timer.current) clearTimeout(timer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (patch: Partial<AiProduct>) => setProduct((p) => ({ ...p, ...patch }));
  return { stage, product, go, update };
}

type Flow = ReturnType<typeof useAiProduct>;

function Tag({ label }: { label: string }) {
  return (
    <View className="rounded-md bg-mint px-[7px] py-0.5">
      <T className="font-sans-bold text-[11px] text-green">{label}</T>
    </View>
  );
}

function FieldLabel({ label, tag }: { label: string; tag: string }) {
  return (
    <View className="flex-row items-center gap-2">
      <T className="font-sans-bold text-sm">{label}</T>
      <Tag label={tag} />
    </View>
  );
}

function ReadingCard({ onSkip }: { onSkip: () => void }) {
  const progress = useRef(new Animated.Value(0.1)).current;
  useEffect(() => {
    const a = Animated.timing(progress, { toValue: 1, duration: READ_MS, easing: Easing.out(Easing.quad), useNativeDriver: false });
    a.start();
    return () => a.stop();
  }, [progress]);
  const width = progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View className="gap-2.5 rounded-[20px] bg-ink p-4" accessibilityLiveRegion="polite">
      <View className="flex-row items-center gap-2">
        <SparkleIcon size={16} />
        <T className="font-sans-bold text-[15px] text-bg">Nina AI is reading your photos…</T>
      </View>
      <View className="h-1.5 overflow-hidden rounded-full bg-[#33504A]">
        <Animated.View style={{ width }} className="h-1.5 rounded-full bg-leaf" />
      </View>
      <T className="text-sm text-on-dark">✓ Two-piece: top + wide-leg trousers</T>
      <T className="text-sm text-on-dark">✓ Àdìrẹ-style print, saffron colour</T>
      <T className="text-sm text-on-dark-2">… Checking prices in Lagos</T>
      <Pressable
        accessibilityRole="button"
        onPress={onSkip}
        hitSlop={{ top: 4, bottom: 4 }}
        className="h-[38px] justify-center self-start rounded-full border border-bg/30 px-3.5"
      >
        <T className="font-sans-semibold text-[13px] text-bg">Skip - fill in myself</T>
      </Pressable>
    </View>
  );
}

function Ghost({ stage }: { stage: AiStage }) {
  const bar = stage === 'reading' ? '#DCE9E2' : '#ECE8DF';
  return (
    <View className="gap-2.5">
      {GHOST.map((g) => (
        <View key={g} className="gap-2 rounded-[14px] border border-sand bg-surface px-3.5 py-3">
          <T className="font-sans-bold text-[11px] uppercase tracking-[0.9px] text-[#A7ADA9]">{g}</T>
          <View style={{ backgroundColor: bar }} className="h-[9px] w-[55%] rounded-full" />
        </View>
      ))}
      <View className="flex-row items-center justify-center gap-2">
        <Lock size={15} color="#0B6E4F" strokeWidth={2} />
        <T className="font-sans-semibold text-sm text-muted">
          {stage === 'reading' ? 'Filling in from your photos…' : 'Add a photo to unlock the form'}
        </T>
      </View>
    </View>
  );
}

const inputBox = 'rounded-[14px] border border-line-2 bg-surface';

function FilledForm({ product: p, update, onRedo }: { product: AiProduct; update: Flow['update']; onRedo: () => void }) {
  const [sizesOpen, setSizesOpen] = useState(p.sizes.length > 0);
  const [stockOpen, setStockOpen] = useState(p.stock.length > 0);

  const setPrice = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 9);
    update({ price: digits ? Number(digits).toLocaleString('en-NG') : '' });
  };
  const toggleSize = (s: string) =>
    update({ sizes: p.sizes.includes(s) ? p.sizes.filter((x) => x !== s) : [...p.sizes, s] });

  return (
    <View className="gap-3.5">
      <View className="flex-row items-center justify-between gap-2 rounded-[14px] bg-mint px-3 py-2.5">
        <View className="shrink flex-row items-center gap-2">
          <SparkleIcon size={15} color="#0B6E4F" />
          <T className="shrink font-sans-semibold text-[13px] text-deep">Filled in by Nina AI. Check it.</T>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={onRedo}
          hitSlop={{ top: 6, bottom: 6 }}
          className="h-8 justify-center rounded-full border border-[#9CC7B2] bg-surface px-3"
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
          placeholderTextColor="#8A928E"
          className={cx(inputBox, 'h-[50px] px-3.5 font-sans text-base text-ink')}
        />
      </View>

      <View className="flex-row gap-2.5">
        <View className="flex-1 gap-1.5">
          <FieldLabel label="Price" tag="Suggested" />
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
        <View className="w-[140px] gap-1.5">
          <FieldLabel label="Category" tag="AI" />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Category: ${p.category}`}
            // TODO: category picker
            className={cx(inputBox, 'h-[50px] flex-row items-center justify-between px-3')}
          >
            <T className="text-[15px]">{p.category}</T>
            <ChevronDown size={16} color="#5B6660" strokeWidth={2} />
          </Pressable>
        </View>
      </View>
      <T className="-mt-1.5 text-xs text-muted">Similar items in Lagos: ₦16,000 - ₦22,000</T>

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
        <View className="flex-row flex-wrap gap-2">
          {p.colours.map((c) => (
            <View key={c} className="rounded-xl bg-ink px-3.5 py-[9px]">
              <T className="font-sans-bold text-sm text-bg">{c}</T>
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add colour"
            // TODO: colour picker
            className="rounded-xl border border-dashed border-[#B9B1A0] px-3.5 py-[9px]"
          >
            <T className="font-sans-bold text-sm text-muted">+ Add</T>
          </Pressable>
        </View>
      </View>

      <View className="gap-2.5 rounded-2xl bg-peach p-3.5">
        <T className="font-sans-bold text-sm text-[#3D2608]">Add what a photo can't show</T>
        <View className="flex-row gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: sizesOpen }}
            onPress={() => setSizesOpen(!sizesOpen)}
            className="rounded-xl border border-dashed border-[#C9A56A] bg-surface px-3 py-[9px]"
          >
            <T className="font-sans-bold text-sm text-[#3D2608]">{p.sizes.length ? `Sizes: ${p.sizes.join(', ')}` : '+ Sizes'}</T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: stockOpen }}
            onPress={() => setStockOpen(!stockOpen)}
            className="flex-1 rounded-xl border border-dashed border-[#C9A56A] bg-surface px-3 py-[9px]"
          >
            <T className="font-sans-bold text-sm text-[#3D2608]">{p.stock ? `${p.stock} in stock` : '+ How many in stock'}</T>
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
                  className={cx('h-11 min-w-[44px] items-center justify-center rounded-xl px-3', on ? 'bg-ink' : 'border border-[#C9A56A] bg-surface')}
                >
                  <T className={cx('font-sans-bold text-sm', on ? 'text-bg' : 'text-[#3D2608]')}>{s}</T>
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
            placeholderTextColor="#8A928E"
            accessibilityLabel="How many in stock"
            className="h-11 rounded-xl border border-[#C9A56A] bg-surface px-3 font-sans text-base text-ink"
          />
        ) : null}
      </View>
    </View>
  );
}

/** The photo tile row + AI states. Render inside a ScrollView. */
export function AiProductFlow({ flow }: { flow: Flow }) {
  const { stage, product, go, update } = flow;
  return (
    <>
      {stage === 'empty' ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Take a photo or choose from gallery"
          // TODO: open camera / gallery once an image picker is added; for now simulate an upload
          onPress={() => go('reading')}
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
          {PHOTOS.map((c, k) => (
            <View key={c} accessibilityLabel={k === 0 ? 'Cover photo' : `Photo ${k + 1}`} style={{ backgroundColor: c }} className="h-[92px] w-[92px] rounded-2xl">
              {k === 0 ? (
                <View className="absolute bottom-1.5 left-1.5 rounded-full bg-surface px-[7px] py-0.5">
                  <T className="font-sans-bold text-[10px]">Cover</T>
                </View>
              ) : null}
            </View>
          ))}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add photo"
            // TODO: add another photo
            className="h-[92px] flex-1 items-center justify-center rounded-2xl border-[1.5px] border-dashed border-[#B9B1A0] bg-surface"
          >
            <T className="text-[22px] text-muted">+</T>
          </Pressable>
        </View>
      )}

      {stage === 'reading' ? <ReadingCard onSkip={() => go('filled')} /> : null}
      {stage === 'filled' ? <FilledForm product={product} update={update} onRedo={() => go('reading')} /> : <Ghost stage={stage} />}
    </>
  );
}
