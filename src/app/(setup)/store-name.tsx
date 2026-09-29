import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Check, ChevronDown, X } from 'lucide-react-native';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomBar, Heading, Labelled, Progress, RingInput, StepHeader } from '@/features/setup/parts';
import { toSlug, updateDraft, useDraft } from '@/features/setup/draft';
import { checkSubdomainAvailable } from '@/api/store';

const CITIES = ['Yaba, Lagos', 'Lekki, Lagos', 'Ikeja, Lagos', 'Surulere, Lagos', 'Abuja', 'Port Harcourt', 'Ibadan'];

export default function StoreName() {
  const { name, city } = useDraft();
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState<boolean | null>(null);

  const slug = toSlug(name);
  const ok = name.trim().length > 0 && available !== false;

  useEffect(() => {
    if (!slug || slug.length < 3) {
      setAvailable(null);
      setChecking(false);
      return;
    }

    setChecking(true);
    const timer = setTimeout(async () => {
      try {
        const isAvail = await checkSubdomainAvailable(slug);
        setAvailable(isAvail);
      } catch {
        setAvailable(true); // fallback
      } finally {
        setChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [slug]);

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/choose-mode" label="Step 2 of 5" />
        <Progress pct={40} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pt-7 pb-6">
          <Heading title="Name your store" sub="This is what customers see. You can change it later." />
          <Labelled label="Store name">
            <RingInput
              autoFocus
              value={name}
              onChangeText={(v) => updateDraft({ name: v })}
              accessibilityLabel="Store name"
              autoCapitalize="words"
              maxLength={60}
            />
          </Labelled>
          <Labelled label="Store link">
            <View
              accessible
              accessibilityLabel={`Store link: ${slug || 'yourstore'}.frontstore.app`}
              className="h-[54px] flex-row items-center rounded-[14px] border border-line-2 bg-surface pl-4 pr-3.5"
            >
              <T numberOfLines={1} className="shrink text-base">
                <T className="font-sans-bold text-base">{slug || 'yourstore'}</T>
                <T className="text-base text-muted">.frontstore.app</T>
              </T>
            </View>
            {checking ? (
              <View className="flex-row items-center gap-1.5">
                <ActivityIndicator size="small" color="#0B6E4F" />
                <T className="font-sans-medium text-[13px] text-muted">Checking availability...</T>
              </View>
            ) : available === true && slug.length >= 3 ? (
              <View className="flex-row items-center gap-1.5">
                <Check size={14} color="#0B6E4F" strokeWidth={3} />
                <T className="font-sans-bold text-[13px] text-green">Available</T>
              </View>
            ) : available === false ? (
              <View className="flex-row items-center gap-1.5">
                <X size={14} color="#DC2626" strokeWidth={3} />
                <T className="font-sans-bold text-[13px] text-red-600">Already taken</T>
              </View>
            ) : null}
          </Labelled>
          <View className="gap-2.5">
            <T className="font-sans-bold text-sm">Where are you based?</T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Location: ${city}`}
              accessibilityState={{ expanded: open }}
              onPress={() => setOpen(!open)}
              className="h-[54px] flex-row items-center justify-between rounded-[14px] border border-line-2 bg-surface px-4"
            >
              <T className="text-base">{city}</T>
              <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
                <ChevronDown size={18} color="#5B6660" strokeWidth={2} />
              </View>
            </Pressable>
            {open ? (
              <View className="overflow-hidden rounded-[14px] border border-line-2 bg-surface">
                {CITIES.map((c, k) => (
                  <Pressable
                    key={c}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: c === city }}
                    onPress={() => { updateDraft({ city: c }); setOpen(false); }}
                    className={cx('h-12 flex-row items-center justify-between px-4', k > 0 && 'border-t border-line')}
                  >
                    <T className={c === city ? 'font-sans-bold text-base' : 'text-base'}>{c}</T>
                    {c === city ? <Check size={16} color="#0B6E4F" strokeWidth={2.6} /> : null}
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>
        </ScrollView>
        <BottomBar>
          <Button title="Continue" href="/store-style" disabled={!ok || checking} />
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
