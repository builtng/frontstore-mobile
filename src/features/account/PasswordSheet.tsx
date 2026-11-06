import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useQueryClient } from '@tanstack/react-query';
import { Button, T } from '@/components/ui';
import { BottomSheet, SheetField } from '@/features/buyer/account';
import { apiPatch, apiPost } from '@/api/client';

/** Turn on logging in with a password, set or change it, or turn it off. */
export function PasswordSheet({ visible, onClose, hasPassword, enabled, canLogIn }: {
  visible: boolean;
  onClose: () => void;
  hasPassword: boolean;
  enabled: boolean;
  /** False when the account has no email or confirmed phone to log in with. */
  canLogIn: boolean;
}) {
  const qc = useQueryClient();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setCurrent('');
    setNext('');
    setConfirm('');
    setError(null);
  }, [visible]);

  const run = async (work: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await work();
      await qc.invalidateQueries({ queryKey: ['me'] });
      onClose();
    } catch (e: any) {
      setError(e.message || 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const savePassword = () => {
    if (next.length < 6) return setError('Use at least 6 characters.');
    if (next !== confirm) return setError('The two passwords don’t match.');
    return run(async () => {
      await apiPost('/auth/change-password', {
        current_password: hasPassword ? current : undefined,
        new_password: next,
        new_password_confirmation: confirm,
      });
      if (!enabled) await apiPatch('/user/password-login', { enabled: true });
    });
  };

  const setEnabled = (on: boolean) => run(async () => {
    await apiPatch('/user/password-login', { enabled: on });
  });

  const on = hasPassword && enabled;
  const showForm = !hasPassword || on;

  return (
    <BottomSheet visible={visible} onClose={() => !busy && onClose()}>
      <View className="gap-3 py-1">
        <T className="font-display text-xl">Log in with password</T>
        <T className="text-sm text-muted-2">
          {on
            ? 'This is on. You can log in with your password or a code.'
            : hasPassword
              ? 'This is off. You log in with a code only.'
              : 'You log in with a code right now. Set a password to use either one.'}
        </T>
        {!canLogIn ? (
          <T className="text-[13px] text-danger">Add your email or WhatsApp number first, so you have something to log in with.</T>
        ) : null}
        {showForm ? (
          <>
            {hasPassword ? <SheetField label="Current password" secureTextEntry autoCapitalize="none" value={current} onChangeText={setCurrent} /> : null}
            <SheetField label={hasPassword ? 'New password' : 'Password'} placeholder="At least 6 characters" secureTextEntry autoCapitalize="none" value={next} onChangeText={setNext} />
            <SheetField label="Type it again" secureTextEntry autoCapitalize="none" value={confirm} onChangeText={setConfirm} />
          </>
        ) : null}
        {error ? <T accessibilityLiveRegion="polite" className="text-[13px] text-danger">{error}</T> : null}
        {showForm ? (
          <Button
            title={busy ? 'Saving…' : hasPassword ? 'Change password' : 'Set password and turn on'}
            className="h-[50px]"
            disabled={busy || !next || !confirm || (hasPassword && !current) || !canLogIn}
            onPress={savePassword}
          />
        ) : (
          <Button title={busy ? 'Saving…' : 'Turn on'} className="h-[50px]" disabled={busy || !canLogIn} onPress={() => setEnabled(true)} />
        )}
        {on ? <Button title="Turn off password login" kind="ghost" className="h-[44px]" disabled={busy} onPress={() => setEnabled(false)} /> : null}
      </View>
    </BottomSheet>
  );
}
