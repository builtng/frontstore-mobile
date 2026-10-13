import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Labelled, RingInput, StepHeader, WhatsAppIcon } from '@/features/setup/parts';
import { loginWithPassword, sendEmailOtp, sendPhoneOtp } from '@/api/auth';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Login() {
  const [raw, setRaw] = useState('');
  const [pw, setPw] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  // Phone accounts with no email on file: codes go by email, so ask for one
  const [askEmail, setAskEmail] = useState(false);
  const [email, setEmail] = useState('');

  const v = raw.trim();
  const isEmail = EMAIL.test(v);
  const isPhone = !isEmail && /^\d{10,14}$/.test(v.replace(/[\s+()-]/g, ''));
  const emailOk = EMAIL.test(email.trim());

  let hint = 'Enter the email or WhatsApp number on your store.';
  if (isEmail && !pw) hint = `We’ll email a 6-digit code to ${v}.`;
  if (isPhone && !pw) hint = 'We’ll email a 6-digit code to the address on this account.';
  const cta = pw ? 'Log in' : isEmail || isPhone ? 'Email me a code' : 'Continue';
  const ready = pw
    ? (isEmail || isPhone) && password.length > 0
    : isEmail || (isPhone && (!askEmail || emailOk));

  const onChangeId = (text: string) => {
    setRaw(text);
    setAskEmail(false);
  };

  const submit = async () => {
    if (!ready || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (pw) {
        const res = await loginWithPassword(v, password);
        router.replace(res.store ? '/home' : '/shop');
      } else {
        if (isEmail) {
          await sendEmailOtp(v);
          router.push({ pathname: '/login-code', params: { channel: 'email', to: v } });
        } else {
          const sent = await sendPhoneOtp(v, askEmail ? email.trim() : undefined);
          if (sent?.needs_email) {
            // Nothing was sent: new numbers sign up, existing ones need an email for the code
            if (sent.is_new_user) {
              setErrorMsg('No store uses this number yet. Log in with your email, or create a store.');
            } else {
              setAskEmail(true);
            }
            return;
          }
          router.push({
            pathname: '/login-code',
            params: { channel: 'phone', to: v, sent_to: sent?.email ?? '', email: askEmail ? email.trim() : '' },
          });
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/welcome" hideBack />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-[18px] px-5 pt-5 pb-6">
          <Heading title="Welcome back" sub="Log in with your email or WhatsApp number." />
          {errorMsg ? (
            <View className="rounded-xl bg-red-100 p-3.5 border border-red-200">
              <T className="text-sm font-sans-medium text-red-800">{errorMsg}</T>
            </View>
          ) : null}
          <Labelled label="Email or WhatsApp number">
            <RingInput
              autoFocus
              value={raw}
              onChangeText={onChangeId}
              placeholder="you@email.com or 0803…"
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType={isPhone ? 'phone-pad' : 'email-address'}
              accessibilityLabel="Email or WhatsApp number"
              returnKeyType="go"
              onSubmitEditing={submit}
              left={
                isEmail ? <Mail size={20} color="#0B6E4F" strokeWidth={2} /> : isPhone ? <WhatsAppIcon size={20} color="#0B6E4F" /> : undefined
              }
            />
            <T className="text-sm leading-5 text-muted-2" accessibilityLiveRegion="polite">{hint}</T>
          </Labelled>
          {askEmail && !pw ? (
            <Labelled label="Email for your login code">
              <RingInput
                autoFocus
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                accessibilityLabel="Email for your login code"
                returnKeyType="go"
                onSubmitEditing={submit}
                left={<Mail size={18} color="#0B6E4F" strokeWidth={2} />}
              />
              <T className="text-sm leading-5 text-muted-2">
                This account has no email yet. We’ll send the code there and save it to your account.
              </T>
            </Labelled>
          ) : null}
          {pw ? (
            <Labelled
              label={
                <View className="flex-row items-center justify-between">
                  <T className="font-sans-bold text-sm">Password</T>
                  <Pressable
                    accessibilityRole="link"
                    hitSlop={12}
                    onPress={() => {
                      // A one-time code is the way back in without a password
                      setPw(false);
                      setPassword('');
                      setErrorMsg(null);
                    }}
                  >
                    <T className="font-sans-semibold text-sm text-green">Forgot?</T>
                  </Pressable>
                </View>
              }
            >
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
            <T className="font-sans-bold text-[15px] text-green">{pw ? 'Use a one-time code instead' : 'Log in with password'}</T>
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
              <T className="text-center text-[15px] text-muted-2">
                New here? <T className="font-sans-bold text-[15px] text-green">Create a store</T>
              </T>
            </Pressable>
          </Link>
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
