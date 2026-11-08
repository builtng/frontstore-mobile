import { useState } from 'react';
import { ActivityIndicator, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen, T, cx } from '@/components/ui';
import { BackHeader, Segmented } from '@/features/seller/parts';
import { DateTimeField } from '@/components/DateTimeField';
import { createProduct, uploadProductImage } from '@/api/products';
import { formatNaira } from '@/lib/format';
import { C } from '@/lib/theme';

const box = 'h-[50px] rounded-[14px] border border-line bg-surface px-3.5 font-sans-semibold text-base text-ink';

function Label({ children }: { children: string }) {
  return <T className="font-sans-bold text-[13px] text-muted">{children}</T>;
}

/** New event: a ticket product with a date, place, price (or free) and how many tickets. */
export default function NewEvent() {
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date | null>(null);
  const [place, setPlace] = useState('');
  const [paid, setPaid] = useState<'paid' | 'free'>('paid');
  const [price, setPrice] = useState('');
  const [count, setCount] = useState('');
  const [about, setAbout] = useState('');
  const [cover, setCover] = useState<{ uri: string; url: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

  const priceN = paid === 'free' ? 0 : Number(price) || 0;
  const countN = parseInt(count, 10) || 0;
  const ready = !!name.trim() && !!date && date.getTime() > Date.now() && (paid === 'free' || priceN > 0) && countN > 0 && !uploading;

  const pickCover = async () => {
    setPhotoError(null);
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8, allowsEditing: true, aspect: [16, 9] });
    if (res.canceled || !res.assets?.[0]) return;
    setUploading(true);
    try {
      const { url } = await uploadProductImage(res.assets[0].uri);
      setCover({ uri: res.assets[0].uri, url });
    } catch (e: any) {
      setPhotoError(e?.message || 'That photo didn’t upload. Try again.');
    } finally {
      setUploading(false);
    }
  };

  const save = useMutation({
    mutationFn: () => createProduct({
      type: 'ticket',
      name: name.trim(),
      price_kobo: Math.round(priceN * 100),
      stock_count: countN,
      event_date: date!.toISOString(),
      event_location: place.trim() || null,
      description: about.trim(),
      images: cover ? [cover.url] : [],
      status: 'live',
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ticket-events'] });
      qc.invalidateQueries({ queryKey: ['products'] });
      router.back();
    },
  });

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <BackHeader title="New event" fallback="/tickets" />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3.5 px-5 pb-6 pt-1.5" showsVerticalScrollIndicator={false}>
          <Pressable accessibilityRole="button" accessibilityLabel={cover ? 'Change cover photo' : 'Add a cover photo'} onPress={pickCover} disabled={uploading} className="h-[150px] items-center justify-center overflow-hidden rounded-[22px] border-[1.5px] border-dashed border-rule">
            {cover ? <Image source={{ uri: cover.uri }} className="h-full w-full" resizeMode="cover" /> : uploading ? <ActivityIndicator color={C.accent} /> : (
              <View className="items-center gap-1.5">
                <Camera size={22} color={C.muted} strokeWidth={2} />
                <T className="font-sans-semibold text-[13px] text-muted">Add a cover photo (optional)</T>
              </View>
            )}
            {cover ? (
              <Pressable accessibilityRole="button" accessibilityLabel="Remove cover photo" onPress={() => setCover(null)} className="absolute right-2 top-2 h-8 w-8 items-center justify-center rounded-full bg-black/60">
                <X size={15} color="#FFFFFF" strokeWidth={2.4} />
              </Pressable>
            ) : null}
          </Pressable>
          {photoError ? <T className="text-[13px] text-danger">{photoError}</T> : null}

          <View className="gap-1.5">
            <Label>Event name</Label>
            <TextInput value={name} onChangeText={setName} placeholder="e.g. Àdìrẹ dyeing class" placeholderTextColor={C.placeholder} maxLength={255} accessibilityLabel="Event name" className={box} />
          </View>
          <DateTimeField label="Date and time" value={date} onChange={setDate} />
          <View className="gap-1.5">
            <Label>Where (optional)</Label>
            <TextInput value={place} onChangeText={setPlace} placeholder="e.g. Mama V studio, Bodija, Ibadan" placeholderTextColor={C.placeholder} maxLength={255} accessibilityLabel="Where, optional" className={box} />
          </View>

          <Segmented value={paid} onChange={setPaid} options={[['paid', 'Paid tickets'], ['free', 'Free']] as const} />
          <View className="flex-row gap-2.5">
            {paid === 'paid' ? (
              <View className="min-w-0 flex-1 gap-1.5">
                <Label>Price per ticket</Label>
                <View className="h-[50px] flex-row items-center gap-1 rounded-[14px] border border-line bg-surface px-3.5">
                  <T className="font-sans-semibold text-base text-muted">₦</T>
                  <TextInput value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, '').slice(0, 9))} keyboardType="number-pad" placeholder="15000" placeholderTextColor={C.placeholder} accessibilityLabel="Price per ticket" className="h-full flex-1 font-sans-semibold text-base text-ink" />
                </View>
              </View>
            ) : null}
            <View className="min-w-0 flex-1 gap-1.5">
              <Label>Number of tickets</Label>
              <TextInput value={count} onChangeText={(v) => setCount(v.replace(/\D/g, '').slice(0, 6))} keyboardType="number-pad" placeholder="50" placeholderTextColor={C.placeholder} accessibilityLabel="Number of tickets" className={box} />
            </View>
          </View>

          <View className="gap-1.5">
            <Label>About the event (optional)</Label>
            <TextInput value={about} onChangeText={setAbout} multiline textAlignVertical="top" placeholder="What to expect, what to bring" placeholderTextColor={C.placeholder} accessibilityLabel="About the event, optional" className="min-h-[90px] rounded-[14px] border border-line bg-surface px-3.5 py-3 font-sans text-[15px] text-ink" />
          </View>
          <T className="text-[13px] leading-5 text-muted">Buyers get a ticket with a code and QR after paying. Scan it at the door from Event tickets.</T>
        </ScrollView>

        <View style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }} className="gap-2 px-5 pt-3">
          {save.error ? <T className="text-center text-[13px] text-danger">{(save.error as Error).message || 'Couldn’t create the event. Try again.'}</T> : null}
          <Pressable accessibilityRole="button" disabled={!ready || save.isPending} onPress={() => save.mutate()} className={cx('h-[54px] flex-row items-center justify-center gap-2 rounded-2xl', ready ? 'bg-green' : 'bg-disabled')}>
            {save.isPending ? <ActivityIndicator color="#FFFFFF" size="small" /> : null}
            <T className="font-sans-bold text-base text-white">
              {save.isPending ? 'Creating…' : countN ? `Start selling ${countN} ticket${countN === 1 ? '' : 's'}${paid === 'paid' && priceN ? ` at ${formatNaira(priceN)}` : paid === 'free' ? ', free' : ''}` : 'Create event'}
            </T>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
