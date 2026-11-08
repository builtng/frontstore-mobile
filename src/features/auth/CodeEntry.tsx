import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomBar, Heading, Progress, StepHeader, WhatsAppIcon, goBack } from '@/features/setup/parts';
import { verifyOtp, sendEmailOtp, sendWhatsAppOtp } from '@/api/auth';

export type Flow = 'signup' | 'login';
export type Channel = 'email' | 'whatsapp';

const LEN = 6;
const RESEND_SECONDS = 60;

/** Mask a phone number like "+234 803 *** 4521". */
function maskPhone(raw: string) {
  const d = raw.replace(/\D/g, '');
  const local = d.startsWith('234') ? d.slice(3) : d.replace(/^0/, '');
  if (local.length < 7) return raw;
  return `+234 ${local.slice(0, 3)} *** ${local.slice(-4)}`;
}

/** "Check your email / WhatsApp" 6-digit code screen, shared by /verify (signup) and /login-code. */
/** `sentTo` is the email the code actually went to (phone codes are emailed to the account's address). */
export function CodeEntry({ flow, channel: initialChannel, to, sentTo }: { flow: Flow; channel: Channel; to?: string; sentTo?: string }) {
  const signup = flow === 'signup';
  const [channel, setChannel] = useState<Channel>(initialChannel);
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
  }, [to]);

  useEffect(() => {
    if (left <= 0) return;
    const t = setTimeout(() => setLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [left]);

  const phone = channel === 'whatsapp';
  const targetIdentifier = to || '';
  const dest = phone ? (targetIdentifier.includes('@') ? targetIdentifier : maskPhone(targetIdentifier)) : targetIdentifier;
  const alt = phone ? 'Wrong phone number? Change it' : 'Wrong email? Change it';

  const onResend = async () => {
    setLeft(RESEND_SECONDS);
    setCode('');
    setErrorMsg(null);
    try {
      if (phone) {
        // Pass the email along: a new number has none on file until it is verified.
        await sendWhatsAppOtp(to || dest, sentTo && sentTo.includes('@') ? sentTo : undefined);
      } else {
        await sendEmailOtp(to || dest);
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
      const targetIdentifier = to || dest;
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
        <StepHeader fallback={fallback} label={signup ? '2 of 5' : undefined} />
        {signup ? <Progress pct={40} /> : null}
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-[18px] px-5 pt-[22px] pb-6">
          <Heading
            title="Enter the code"
            sub={
              <T className="text-base leading-6 text-muted">
                {/* Phone codes are emailed to the account, so say where it really went. */}
                We sent it to <T className="text-base leading-6 text-ink">{sentTo || dest}</T>
                {phone && sentTo && sentTo !== dest ? <T className="text-base leading-6 text-muted">, the email on {maskPhone(targetIdentifier)}</T> : null}.
              </T>
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
                  <View key={k} className={cx('h-[60px] flex-1 items-center justify-center rounded-[14px] border-2 bg-surface', active ? 'border-green' : code[k] ? 'border-[#BFD3C6]' : 'border-line')}>
                    <T className="font-display-x text-[26px]">{code[k] ?? ''}</T>
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
            <T className="text-sm text-muted" accessibilityLiveRegion="polite">
              Didn’t get it? <T className="text-sm text-ink">Resend in {`${Math.floor(left / 60)}:${String(left % 60).padStart(2, '0')}`}</T>
            </T>
          ) : (
            <Pressable accessibilityRole="button" onPress={onResend} className="-my-3 h-11 justify-center self-start">
              <T className="font-sans-bold text-[15px] text-green">Resend code</T>
            </Pressable>
          )}
          <Pressable accessibilityRole="button" onPress={onAlt} className="-my-3 h-11 justify-center self-start">
            <T className="font-sans-bold text-[15px] text-green">{alt}</T>
          </Pressable>
          <View className="flex-row gap-2 rounded-[14px] bg-mint px-3.5 py-3">
            <Mail size={16} color="#14532D" strokeWidth={2} />
            <T className="flex-1 text-[13px] leading-[19px] text-[#14532D]">Tip: open the email from Frontstore and copy the code. Your keyboard may offer to fill it in.</T>
          </View>
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
