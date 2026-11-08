import { useState } from 'react';
import { TextInput, View } from 'react-native';
import { T } from '@/components/ui';
import { Labelled, RingInput } from '@/features/setup/parts';
import { Segmented } from '@/features/seller/parts';
import { sendEmailOtp, sendWhatsAppOtp } from '@/api/auth';

export type Way = 'wa' | 'em';

export const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
/** A Nigerian number typed after the +234 prefix: 803 000 0000 or 0803 000 0000. */
export const isLocalPhone = (v: string) => /^0?\d{10}$/.test(v.replace(/\D/g, ''));
export const fullPhone = (v: string) => '+234' + v.replace(/\D/g, '').replace(/^0/, '');

/** WhatsApp / Email switch with the matching input, as in the sign-up and log-in designs. */
export function ContactField({ way, onWay, value, onChange, onSubmit, autoFocus }: {
  way: Way;
  onWay: (w: Way) => void;
  value: string;
  onChange: (v: string) => void;
  onSubmit?: () => void;
  autoFocus?: boolean;
}) {
  return (
    <View className="gap-[18px]">
      <Segmented options={[['wa', 'WhatsApp'], ['em', 'Email']] as const} value={way} onChange={(w) => { onWay(w); onChange(''); }} />
      {way === 'wa' ? (
        <Labelled label="WhatsApp number">
          <RingInput
            key="wa"
            autoFocus={autoFocus}
            value={value}
            onChangeText={onChange}
            placeholder="803 000 0000"
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            accessibilityLabel="WhatsApp number"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
            left={
              <View className="border-r border-line pr-2.5">
                <T className="font-sans-bold text-[17px] text-muted">+234</T>
              </View>
            }
          />
        </Labelled>
      ) : (
        <Labelled label="Email">
          <RingInput
            key="em"
            autoFocus={autoFocus}
            value={value}
            onChangeText={onChange}
            placeholder="you@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            accessibilityLabel="Email"
            returnKeyType="go"
            onSubmitEditing={onSubmit}
          />
        </Labelled>
      )}
    </View>
  );
}

/** Email box shown when a phone number has no email on file yet (the code is always emailed). */
export function NeedsEmail({ value, onChange, onSubmit }: { value: string; onChange: (v: string) => void; onSubmit?: () => void }) {
  return (
    <View className="gap-2 rounded-[18px] border border-line bg-surface p-4">
      <T className="font-sans-bold text-[15px]">Add your email to get your code</T>
      <T className="text-[13px] leading-5 text-muted">This number has no email yet. We send your 6-digit code by email, and use it for payout codes too.</T>
      <RingInput
        autoFocus
        value={value}
        onChangeText={onChange}
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        accessibilityLabel="Email for your code"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
    </View>
  );
}

/**
 * Sends the 6-digit code for an email or a phone number. Phone codes go to the
 * account's email; if there isn't one, `needsEmail` turns on and the next send
 * includes the email the person typed.
 */
export function useSendCode() {
  const [needsEmail, setNeedsEmail] = useState(false);
  const [extraEmail, setExtraEmail] = useState('');

  const reset = () => { setNeedsEmail(false); setExtraEmail(''); };

  /** Returns where the code went, or null when an email is still needed. */
  const send = async (way: Way, value: string, name?: string): Promise<{ to: string; sentTo: string } | null> => {
    if (way === 'em') {
      await sendEmailOtp(value.trim(), name);
      return { to: value.trim(), sentTo: value.trim() };
    }
    const phone = fullPhone(value);
    const res = await sendWhatsAppOtp(phone, needsEmail && isEmail(extraEmail) ? extraEmail.trim() : undefined);
    if (res?.needs_email) {
      setNeedsEmail(true);
      return null;
    }
    return { to: phone, sentTo: res?.email || extraEmail.trim() };
  };

  return { needsEmail, extraEmail, setExtraEmail, reset, send, emailReady: !needsEmail || isEmail(extraEmail) };
}

