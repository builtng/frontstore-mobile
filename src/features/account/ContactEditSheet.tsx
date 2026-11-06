import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Button, T } from '@/components/ui';
import { BottomSheet, SheetField } from '@/features/buyer/account';
import { apiPost } from '@/api/client';

export type ContactKind = 'whatsapp' | 'email';

const COPY = {
  whatsapp: {
    title: 'WhatsApp number',
    field: 'New WhatsApp number',
    placeholder: '0803 123 4567',
    keyboard: 'phone-pad',
    send: '/store/whatsapp-phone/send-otp',
    verify: '/store/whatsapp-phone/verify-otp',
    param: 'whatsapp_phone',
    sub: 'Orders and customer messages go to this number. We send a code to it on WhatsApp to confirm it’s yours.',
  },
  email: {
    title: 'Email',
    field: 'Email address',
    placeholder: 'you@example.com',
    keyboard: 'email-address',
    send: '/user/email/send-otp',
    verify: '/user/email/verify-otp',
    param: 'email',
    sub: 'Use it to log in and get order emails. We send a code to confirm it.',
  },
} as const;

/** Add or change the WhatsApp number or email: enter it, then confirm with a code. */
export function ContactEditSheet({ kind, onClose }: { kind: ContactKind | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue('');
    setCode('');
    setCodeSent(false);
    setError(null);
  }, [kind]);

  if (!kind) return null;
  const c = COPY[kind];

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const send = () => run(async () => {
    await apiPost(c.send, { [c.param]: value.trim() });
    setCodeSent(true);
  });

  const verify = () => run(async () => {
    await apiPost(c.verify, { [c.param]: value.trim(), otp: code });
    await Promise.all([
      qc.invalidateQueries({ queryKey: ['me'] }),
      qc.invalidateQueries({ queryKey: ['seller-store'] }),
    ]);
    onClose();
  });

  return (
    <BottomSheet visible onClose={() => !busy && onClose()}>
      <View className="gap-3 py-1">
        <T className="font-display text-xl">{c.title}</T>
        {codeSent ? (
          <>
            <T className="text-sm text-muted-2">Enter the 6-digit code we sent to {value.trim()}{kind === 'whatsapp' ? ' on WhatsApp' : ''}.</T>
            <SheetField label="Code" keyboardType="number-pad" maxLength={6} value={code} onChangeText={(v) => setCode(v.replace(/\D/g, ''))} />
            {error ? <T accessibilityLiveRegion="polite" className="text-[13px] text-danger">{error}</T> : null}
            <Button title={busy ? 'Confirming…' : 'Confirm'} className="h-[50px]" disabled={busy || code.length !== 6} onPress={verify} />
            <Button title="Use a different one" kind="ghost" className="h-[44px]" disabled={busy} onPress={() => { setCodeSent(false); setCode(''); setError(null); }} />
          </>
        ) : (
          <>
            <T className="text-sm text-muted-2">{c.sub}</T>
            <SheetField label={c.field} placeholder={c.placeholder} keyboardType={c.keyboard} autoCapitalize="none" autoCorrect={false} value={value} onChangeText={setValue} />
            {error ? <T accessibilityLiveRegion="polite" className="text-[13px] text-danger">{error}</T> : null}
            <Button title={busy ? 'Sending…' : 'Send code'} className="h-[50px]" disabled={busy || !value.trim()} onPress={send} />
          </>
        )}
      </View>
    </BottomSheet>
  );
}
