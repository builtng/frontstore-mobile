import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Labelled, RingInput, StepHeader } from '@/features/setup/parts';
import { ContactField, NeedsEmail, fullPhone, isEmail, isLocalPhone, useSendCode, type Way } from '@/features/auth/ContactField';
import { loginWithPassword } from '@/api/auth';

export default function Login() {
  const [way, setWay] = useState<Way>('wa');
  const [value, setValue] = useState('');
  const [pw, setPw] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const code = useSendCode();

  const okContact = way === 'em' ? isEmail(value) : isLocalPhone(value);
  const ready = okContact && (pw ? password.length > 0 : code.emailReady);
  const cta = pw ? 'Log in' : 'Send me a code';

  const submit = async () => {
    if (!ready || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (pw) {
        const res = await loginWithPassword(way === 'em' ? value.trim() : fullPhone(value), password);
        router.replace(res.store ? '/home' : '/shop');
        return;
      }
      const sent = await code.send(way, value);
      if (!sent) return; // the number needs an email first; the box is now showing
      router.push({ pathname: '/login-code', params: { channel: way === 'em' ? 'email' : 'whatsapp', to: sent.to, sent_to: sent.sentTo } });
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/welcome" onBack={() => router.replace('/welcome')} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-[18px] px-5 pt-[22px] pb-6">
          <Heading title="Welcome back" sub="Log in with the WhatsApp number or email on your store." />
          {errorMsg ? (
            <View className="rounded-2xl border border-danger/20 bg-danger-bg p-3.5">
              <T className="font-sans-medium text-sm text-danger">{errorMsg}</T>
            </View>
          ) : null}
          <ContactField autoFocus way={way} onWay={(w) => { setWay(w); code.reset(); }} value={value} onChange={(v) => { setValue(v); code.reset(); }} onSubmit={submit} />
          {code.needsEmail && !pw ? <NeedsEmail value={code.extraEmail} onChange={code.setExtraEmail} onSubmit={submit} /> : null}
          {pw ? (
            <Labelled label="Password">
              <RingInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="current-password"
                textContentType="password"
                accessibilityLabel="Password"
                returnKeyType="go"
                onSubmitEditing={submit}
              />
            </Labelled>
          ) : null}
          <Pressable accessibilityRole="button" onPress={() => setPw(!pw)} className="h-11 justify-center self-start">
            <T className="font-sans-bold text-[15px] text-accent">{pw ? 'Use a one-time code instead' : 'Log in with password'}</T>
          </Pressable>
        </ScrollView>
        <BottomBar>
          <Button
            title={loading ? 'Please wait...' : cta}
            disabled={!ready || loading}
            onPress={submit}
            left={loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
          />
          <Link href="/signup" asChild>
            <Pressable accessibilityRole="link" className="min-h-[44px] items-center justify-center">
              <T className="text-center font-sans-semibold text-sm text-muted">
                New here? <T className="font-sans-semibold text-sm text-accent">Create a free store</T>
              </T>
            </Pressable>
          </Link>
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
