import { useState } from 'react';
import { View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, T } from '@/components/ui';
import { BottomSheet, LinkRow, SheetField, SwitchRow } from '@/features/buyer/account';
import { changePassword, getMe, setPasswordLogin } from '@/api/auth';

/**
 * "Log in with a password" switch and the set/change password sheet.
 * Off means the account can only sign in with a one-time code.
 * Used on both settings screens.
 */
export function PasswordLogin() {
  const queryClient = useQueryClient();
  const { data: me } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const user = me?.user;
  const hasPassword = !!user?.has_password;
  const enabled = hasPassword && user?.password_login_enabled !== false;

  const [sheetOpen, setSheetOpen] = useState(false);
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');

  const toggle = useMutation({
    mutationFn: setPasswordLogin,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['me'] }),
  });

  const save = useMutation({
    mutationFn: () =>
      changePassword({
        new_password: next,
        new_password_confirmation: confirm,
        current_password: hasPassword ? current : undefined,
      }),
    onSuccess: async () => {
      // A new password is only useful if it can be used
      if (!enabled) await setPasswordLogin(true);
      queryClient.invalidateQueries({ queryKey: ['me'] });
      close();
    },
  });

  const close = () => {
    setSheetOpen(false);
    setCurrent('');
    setNext('');
    setConfirm('');
    save.reset();
  };

  const onSwitch = (v: boolean) => {
    // No password yet: set one first, which also switches it on
    if (v && !hasPassword) {
      setSheetOpen(true);
      return;
    }
    toggle.mutate(v);
  };

  const matches = next.length >= 8 && next === confirm;
  const ready = matches && (!hasPassword || current.length > 0);
  const error = (toggle.error ?? save.error) as Error | null;

  if (!user) return null;

  return (
    <>
      <SwitchRow
        label="Log in with a password"
        sub={enabled ? 'On: password or a one-time code' : 'Off: we send a one-time code instead'}
        value={enabled}
        onChange={onSwitch}
      />
      <LinkRow label={hasPassword ? 'Change password' : 'Set a password'} onPress={() => setSheetOpen(true)} />
      {error && !sheetOpen ? (
        <View className="px-[18px] py-2">
          <T className="text-sm text-danger">{error.message}</T>
        </View>
      ) : null}

      <BottomSheet visible={sheetOpen} onClose={close}>
        <View className="gap-3 py-1">
          <T className="font-display text-xl">{hasPassword ? 'Change password' : 'Set a password'}</T>
          {hasPassword ? (
            <SheetField label="Current password" secureTextEntry autoComplete="current-password" value={current} onChangeText={setCurrent} />
          ) : null}
          <SheetField label="New password" secureTextEntry autoComplete="new-password" value={next} onChangeText={setNext} placeholder="At least 8 characters" />
          <SheetField label="Confirm new password" secureTextEntry autoComplete="new-password" value={confirm} onChangeText={setConfirm} />
          {confirm && next !== confirm ? <T className="text-sm text-danger">Passwords don’t match.</T> : null}
          {save.error ? <T className="text-sm text-danger">{(save.error as Error).message}</T> : null}
          <Button
            title={save.isPending ? 'Saving...' : 'Save password'}
            className="h-[50px]"
            disabled={!ready || save.isPending}
            onPress={() => save.mutate()}
          />
        </View>
      </BottomSheet>
    </>
  );
}
