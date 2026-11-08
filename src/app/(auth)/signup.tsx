import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, View } from 'react-native';
import { Link, router } from 'expo-router';
import { ShieldCheck } from 'lucide-react-native';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Labelled, Progress, RingInput, StepHeader } from '@/features/setup/parts';
import { ContactField, NeedsEmail, isEmail, isLocalPhone, useSendCode, type Way } from '@/features/auth/ContactField';

export default function Signup() {
  const [name, setName] = useState('');
  const [way, setWay] = useState<Way>('wa');
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const code = useSendCode();

  const valid = (way === 'em' ? isEmail(value) : isLocalPhone(value)) && code.emailReady;

  const next = async () => {
    if (!valid || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const sent = await code.send(way, value, name.trim() || undefined);
      if (!sent) return; // the number needs an email first; the box is now showing
      router.push({ pathname: '/verify', params: { flow: 'signup', channel: way === 'em' ? 'email' : 'whatsapp', to: sent.to, sent_to: sent.sentTo } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not send your code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/welcome" label="1 of 5" />
        <Progress pct={20} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-[18px] px-5 pt-[22px] pb-6">
          <Heading title="Create your store" sub="Free to start. Use your WhatsApp number or email." />
          {errorMsg ? (
            <View className="rounded-2xl border border-danger/20 bg-danger-bg p-3.5">
              <T className="font-sans-medium text-sm text-danger">{errorMsg}</T>
            </View>
          ) : null}
          <Labelled label="Your name">
            <RingInput value={name} onChangeText={setName} placeholder="e.g. Ifeoma Okafor" autoComplete="name" textContentType="name" accessibilityLabel="Your name" />
          </Labelled>
          <ContactField way={way} onWay={(w) => { setWay(w); code.reset(); }} value={value} onChange={(v) => { setValue(v); code.reset(); }} onSubmit={next} />
          {code.needsEmail ? <NeedsEmail value={code.extraEmail} onChange={code.setExtraEmail} onSubmit={next} /> : null}
          <View className="flex-row items-center gap-2">
            <ShieldCheck size={16} color="#1E5E3A" strokeWidth={2} />
            <T className="flex-1 text-[13px] text-muted">We send a 6-digit code. No password to remember.</T>
          </View>
        </ScrollView>
        <BottomBar>
          <Button
            title={loading ? 'Sending code...' : 'Continue'}
            disabled={!valid || loading}
            onPress={next}
            left={loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
          />
          <Link href="/login" asChild>
            <Pressable accessibilityRole="link" className="min-h-[44px] items-center justify-center">
              <T className="text-center font-sans-semibold text-sm text-muted">
                Already have a store? <T className="font-sans-semibold text-sm text-green">Log in</T>
              </T>
            </Pressable>
          </Link>
          <T className="text-center text-xs leading-[18px] text-muted">
            By continuing you agree to the{' '}
            <T accessibilityRole="link" onPress={() => Linking.openURL('https://frontstore.app/terms')} className="font-sans-bold text-xs text-ink underline">Terms</T>
            {' '}and{' '}
            <T accessibilityRole="link" onPress={() => Linking.openURL('https://frontstore.app/privacy')} className="font-sans-bold text-xs text-ink underline">Privacy policy</T>.
          </T>
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
