import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Labelled, RingInput, StepHeader, WhatsAppIcon } from '@/features/setup/parts';
import { loginWithPassword, sendEmailOtp, sendWhatsAppOtp, loginWithGoogle, loginWithApple } from '@/api/auth';
import { GoogleIcon, AppleIcon } from '@/components/SocialIcons';

export default function Login() {
  const [raw, setRaw] = useState('');
  const [pw, setPw] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const v = raw.trim();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isPhone = !isEmail && /^\d{10,14}$/.test(v.replace(/[\s+()-]/g, ''));

  let hint = 'Enter the email or WhatsApp number on your store.';
  if (isEmail && !pw) hint = `We’ll email a 6-digit code to ${v}.`;
  if (isPhone && !pw) hint = `We’ll send a 6-digit code on WhatsApp to ${v}.`;
  const cta = pw ? 'Log in' : isEmail ? 'Email me a code' : isPhone ? 'Send code on WhatsApp' : 'Continue';
  const ready = pw ? (isEmail || isPhone) && password.length > 0 : isEmail || isPhone;

  const submit = async () => {
    if (!ready || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      if (pw) {
        await loginWithPassword(v, password);
        router.replace('/home');
      } else {
        if (isEmail) {
          await sendEmailOtp(v);
        } else {
          await sendWhatsAppOtp(v);
        }
        router.push({ pathname: '/login-code', params: { channel: isEmail ? 'email' : 'whatsapp', to: v } });
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Login failed. Please check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    const targetEmail = isEmail ? v : 'merchant@frontstore.ng';
    setGoogleLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithGoogle({
        email: targetEmail,
        name: 'Frontstore Merchant',
        google_id: `g_${Date.now()}`,
      });

      if (res.is_new_user) {
        router.replace('/choose-mode');
      } else {
        router.replace('/home');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Google login failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleAuth = async () => {
    const targetEmail = isEmail ? v : `merchant_${Date.now()}@privaterelay.appleid.com`;
    setAppleLoading(true);
    setErrorMsg(null);
    try {
      const res = await loginWithApple({
        email: targetEmail,
        name: 'Apple Merchant',
        apple_id: `apple_${Date.now()}`,
      });

      if (res.is_new_user) {
        router.replace('/choose-mode');
      } else {
        router.replace('/home');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Apple login failed. Please try again.');
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/welcome" />
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
              onChangeText={setRaw}
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
          {pw ? (
            <Labelled
              label={
                <View className="flex-row items-center justify-between">
                  <T className="font-sans-bold text-sm">Password</T>
                  <Pressable accessibilityRole="link" hitSlop={12}>
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

          <View className="flex-row items-center gap-3 pt-2">
            <View className="h-px flex-1 bg-line-2" />
            <T className="text-[13px] text-muted">or</T>
            <View className="h-px flex-1 bg-line-2" />
          </View>
          <View className="gap-2.5">
            <Pressable
              accessibilityRole="button"
              disabled={googleLoading || appleLoading}
              onPress={handleGoogleAuth}
              className="h-[54px] flex-row items-center justify-center gap-2.5 rounded-full border border-line-2 bg-surface active:opacity-80"
            >
              {googleLoading ? (
                <ActivityIndicator color="#0E1A15" size="small" />
              ) : (
                <>
                  <GoogleIcon size={20} />
                  <T className="font-sans-semibold text-base text-ink">Continue with Google</T>
                </>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={googleLoading || appleLoading}
              onPress={handleAppleAuth}
              className="h-[54px] flex-row items-center justify-center gap-2.5 rounded-full border border-line-2 bg-surface active:opacity-80"
            >
              {appleLoading ? (
                <ActivityIndicator color="#0E1A15" size="small" />
              ) : (
                <>
                  <AppleIcon size={20} color="#0E1A15" />
                  <T className="font-sans-semibold text-base text-ink">Continue with Apple</T>
                </>
              )}
            </Pressable>
          </View>
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
