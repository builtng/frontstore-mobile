import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomBar, Heading, Progress, StepHeader, goBack } from '@/features/setup/parts';
import { verifyOtp, sendEmailOtp, sendPhoneOtp } from '@/api/auth';

export type Flow = 'signup' | 'login';
/** How the account is identified. Codes always arrive by email. */
export type Channel = 'email' | 'phone';

const LEN = 6;
const RESEND_SECONDS = 60;

/** Mask a phone number like "+234 803 *** 4521". */
function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, '');
  const local = d.startsWith('234') ? d.slice(3) : d.replace(/^0/, '');
  if (local.length < 7) return raw;
  return `+234 ${local.slice(0, 3)} *** ${local.slice(-4)}`;
}

/** Mask an email like "ch***@gmail.com". */
function maskEmail(raw: string) {
  const [user, domain] = raw.split('@');
  if (!domain) return raw;
  return `${user.slice(0, 2)}***@${domain}`;
}

/**
 * "Check your email" 6-digit code screen, shared by /verify (signup) and /login-code.
 * For phone logins the backend emails the code to the account's address (`sentTo`),
 * or to `email` when the account had none.
 */
export function CodeEntry({
  flow,
  channel,
  to,
  sentTo,
  email,
}: {
  flow: Flow;
  channel: Channel;
  to?: string;
  sentTo?: string;
  email?: string;
}) {
  const signup = flow === 'signup';
  const [code, setCode] = useState('');
  const [focused, setFocused] = useState(true);
  const [left, setLeft] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const input = useRef<TextInput>(null);

  const fallback = signup ? '/signup' : '/login';

  useEffect(() => {
    if (!to) {
      router.replace(fallback as any);
    }
  }, [to, fallback]);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const phone = channel === 'phone';
  const targetIdentifier = to || '';
  const inbox = sentTo || email;
  const alt = phone ? 'Wrong phone number? Change it' : 'Wrong email? Change it';

  const onResend = async () => {
    setLeft(RESEND_SECONDS);
    setCode('');
    setErrorMsg(null);
    try {
      if (phone) {
        await sendPhoneOtp(targetIdentifier, email);
      } else {
        await sendEmailOtp(targetIdentifier);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not resend code. Please try again.');
    }
  };

  const onAlt = () => {
    goBack(fallback);
  };

  const verify = async () => {
    if (code.length !== LEN || loading) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await verifyOtp({
        [phone ? 'phone_number' : 'email']: targetIdentifier,
        otp: code,
      });

      if (res.is_new_user && res.setup_token) {
        // New user setup token -> choose whether to shop or sell
        router.replace({
          pathname: '/choose-mode',
          params: { setup_token: res.setup_token },
        });
      } else {
        // Existing user who already has an account
        const store = res.store || (res as any).data?.store;
        if (store) {
          router.replace('/home');
        } else {
          router.replace('/shop');
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid verification code. Please check and try again.');
    } finally {
      setLoading(false);
    }
  };

  const complete = code.length === LEN;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback={fallback} label={signup ? 'Step 1 of 5' : 'Log in'} />
        {signup ? <Progress pct={20} /> : null}
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-6 px-5 pt-8 pb-6">
          <View className="h-[60px] w-[60px] items-center justify-center rounded-[18px] bg-green">
            <Mail size={28} color="#FFFFFF" strokeWidth={1.9} />
          </View>
          <Heading
            title="Check your email"
            sub={
              phone ? (
                <T className="text-[15px] leading-[22px] text-muted-2">
                  Enter the 6-digit code we emailed to{' '}
                  <T className="font-sans-bold text-[15px]">{inbox ? maskEmail(inbox) : 'the address on your account'}</T>
                  {' '}for <T className="font-sans-bold text-[15px]">{maskPhone(targetIdentifier)}</T>
                </T>
              ) : (
                <T className="text-[15px] leading-[22px] text-muted-2">
                  Enter the 6-digit code we sent to <T className="font-sans-bold text-[15px]">{targetIdentifier}</T>
                </T>
              )
            }
          />

          {errorMsg ? (
            <View className="rounded-xl bg-red-100 p-3.5 border border-red-200">
              <T className="text-sm font-sans-medium text-red-800">{errorMsg}</T>
            </View>
          ) : null}

          {/* Code boxes over a hidden input */}
          <Pressable
            accessibilityRole="none"
            accessibilityLabel={`Verification code, ${code.length} of ${LEN} digits entered`}
            onPress={() => input.current?.focus()}
          >
            <View className="flex-row gap-2">
              {Array.from({ length: LEN }, (_, k) => {
                const active = focused && (k === code.length || (complete && k === LEN - 1));
                return (
                  <View key={k} className={cx('flex-1 rounded-[17px] border-[3px]', active ? 'border-mint-2' : 'border-transparent')} style={{ margin: -3 }}>
                    <View className={cx('h-[60px] items-center justify-center rounded-[14px] bg-surface', active ? 'border-2 border-green' : 'border border-line-2')}>
                      <T className="font-sans-bold text-[26px]">{code[k] ?? ''}</T>
                    </View>
                  </View>
                );
              })}
            </View>
            <TextInput
              ref={input}
              value={code}
              onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, LEN))}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoFocus
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              autoComplete="one-time-code"
              maxLength={LEN}
              caretHidden
              accessibilityLabel="Verification code"
              style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, opacity: 0.011, color: 'transparent' }}
            />
          </Pressable>

          {left > 0 ? (
            <T className="text-[15px] text-muted-2" accessibilityLiveRegion="polite">
              Resend code in <T className="font-sans-bold text-[15px]">{`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}</T>
            </T>
          ) : (
            <Pressable accessibilityRole="button" onPress={onResend} className="-my-3 h-11 justify-center self-start">
              <T className="font-sans-bold text-[15px] text-green">Resend code</T>
            </Pressable>
          )}
          <Pressable accessibilityRole="button" onPress={onAlt} className="-my-3 h-11 justify-center self-start">
            <T className="font-sans-bold text-[15px] text-green">{alt}</T>
          </Pressable>
        </ScrollView>
        <BottomBar>
          <Button
            title={loading ? 'Verifying...' : 'Verify'}
            disabled={!complete || loading}
            onPress={verify}
            left={loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
          />
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
