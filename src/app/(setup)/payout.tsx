import { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { Check, ChevronDown, Landmark, Lock, RefreshCw } from 'lucide-react-native';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Labelled, Progress, RingInput, StepHeader, goBack } from '@/features/setup/parts';
import { getBanks, resolveAccount, updatePayoutAccount } from '@/api/store';
import { Bank } from '@/api/types';
import { updateDraft, useDraft } from '@/features/setup/draft';
import { SearchableSelectModal, SelectItem } from '@/components/SearchableSelectModal';

/**
 * Payout bank account. Two uses:
 * - store setup (default): saves into the setup draft, then on to the first product
 * - `?mode=edit` from Payouts / Home: saves straight to the existing store and goes back.
 *   It must never go through setup, which would overwrite the store.
 * Only a name the bank confirms is accepted; the backend treats it as verified.
 */
export default function Payout() {
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const editing = mode === 'edit';
  const draft = useDraft();
  const queryClient = useQueryClient();
  const saved = editing ? undefined : draft.payout;

  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [banksError, setBanksError] = useState(false);
  const [account, setAccount] = useState(saved?.account || '');
  const [resolving, setResolving] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(saved?.accountName || null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  // Only the latest lookup may set the name (an older one can finish last)
  const lookup = useRef(0);

  const loadBanks = () => {
    setLoadingBanks(true);
    setBanksError(false);
    getBanks()
      .then((data) => {
        if (!Array.isArray(data)) return;
        setBanks(data);
        // Restore a bank picked earlier in setup; otherwise the merchant chooses
        const existing = saved?.bankCode ? data.find((b) => b.code === saved.bankCode) : null;
        if (existing) setSelectedBank(existing);
      })
      .catch(() => setBanksError(true))
      .finally(() => setLoadingBanks(false));
  };

  useEffect(loadBanks, []); // eslint-disable-line react-hooks/exhaustive-deps

  const doResolve = (accNumber: string, bank: Bank) => {
    const id = ++lookup.current;
    setAccountName(null);
    setErrorMsg(null);
    if (accNumber.length !== 10) return;

    setResolving(true);
    resolveAccount(accNumber, bank.code)
      .then((res) => {
        if (id !== lookup.current) return;
        if (res.account_name) setAccountName(res.account_name);
        else setErrorMsg('The bank didn’t return a name for this account. Check the number and bank.');
      })
      .catch((err) => {
        if (id !== lookup.current) return;
        setErrorMsg(err.message || 'We couldn’t confirm this account with the bank.');
      })
      .finally(() => {
        if (id === lookup.current) setResolving(false);
      });
  };

  useEffect(() => {
    if (selectedBank) doResolve(account, selectedBank);
    else lookup.current++;
  }, [account, selectedBank]); // eslint-disable-line react-hooks/exhaustive-deps

  const bankSelectItems: SelectItem[] = useMemo(() => {
    const seen = new Set<string>();
    return banks
      .filter((b) => (seen.has(b.code) ? false : (seen.add(b.code), true)))
      .map((b) => ({
        id: b.code,
        title: b.name,
        icon: (
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-mint/50">
            <Landmark size={18} color="#0B6E4F" strokeWidth={2} />
          </View>
        ),
        metadata: b,
      }));
  }, [banks]);

  const canSave = account.length === 10 && !!selectedBank && !!accountName && !resolving && !saving;

  const handleSave = async () => {
    if (!canSave || !selectedBank || !accountName) return;
    const payout = { bank: selectedBank.name, bankCode: selectedBank.code, account, accountName };

    if (!editing) {
      updateDraft({ payout });
      router.push('/first-product');
      return;
    }

    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await updatePayoutAccount({
        bank_name: payout.bank,
        bank_code: payout.bankCode,
        account_number: payout.account,
        account_name: payout.accountName,
      });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['seller-store'] });
      Alert.alert(
        res.pending ? 'Change sent for approval' : 'Payout account saved',
        res.pending
          ? 'For your security, changes to a verified payout account are checked by our team before they apply. Payouts keep going to your current account until then.'
          : `Payouts will go to ${payout.accountName}.`,
        [{ text: 'OK', onPress: () => goBack('/payouts') }],
      );
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not save your payout account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        {editing ? (
          <StepHeader fallback="/payouts" label="Payout account" />
        ) : (
          <>
            <StepHeader fallback="/store-style" label="Step 4 of 5" right={{ title: 'Later', href: '/first-product' }} />
            <Progress pct={80} />
          </>
        )}
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-[18px] px-5 pt-6 pb-6">
          <Heading
            title={editing ? 'Change payout account' : 'Where should we send your money?'}
            sub="Customer payments are paid out directly to this account."
          />

          <Labelled label="Bank">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Bank: ${selectedBank?.name || 'Select bank'}`}
              onPress={() => (banksError ? loadBanks() : setModalOpen(true))}
              className="h-[54px] flex-row items-center justify-between rounded-[14px] border border-line-2 bg-surface px-4"
            >
              <View className="flex-1 flex-row items-center gap-2.5 pr-2">
                <Landmark size={18} color="#0B6E4F" strokeWidth={2} />
                <T className="flex-1 font-sans-medium text-base text-ink" numberOfLines={1}>
                  {selectedBank?.name || (loadingBanks ? 'Loading banks...' : banksError ? 'Couldn’t load banks. Tap to retry' : 'Select your bank')}
                </T>
              </View>
              <ChevronDown size={18} color="#5B6660" strokeWidth={2} />
            </Pressable>
          </Labelled>

          <Labelled label="Account number">
            <RingInput
              value={account}
              onChangeText={(v) => setAccount(v.replace(/\D/g, '').slice(0, 10))}
              keyboardType="number-pad"
              maxLength={10}
              placeholder="0123456789"
              accessibilityLabel="Account number"
              inputClassName="font-sans-semibold text-lg tracking-[1.4px]"
            />
          </Labelled>

          {resolving ? (
            <View className="flex-row items-center gap-2 py-2">
              <ActivityIndicator size="small" color="#0B6E4F" />
              <T className="text-sm text-muted">Checking the account with your bank...</T>
            </View>
          ) : accountName ? (
            <View className="flex-row items-center gap-3 rounded-[14px] bg-mint px-4 py-3.5" accessibilityLiveRegion="polite">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-green">
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
              </View>
              <View className="flex-1">
                <T className="text-xs text-[#33403A]">Verified account name</T>
                <T className="font-sans-bold text-base text-ink" numberOfLines={1}>{accountName}</T>
              </View>
            </View>
          ) : errorMsg ? (
            <View className="gap-1.5 rounded-[14px] border border-amber-200 bg-amber-50 p-3.5" accessibilityLiveRegion="polite">
              <T className="text-xs font-sans-medium text-amber-800">{errorMsg}</T>
              {selectedBank && account.length === 10 ? (
                <Pressable accessibilityRole="button" onPress={() => doResolve(account, selectedBank)} className="mt-1 flex-row items-center gap-1.5 self-start">
                  <RefreshCw size={13} color="#92400E" />
                  <T className="text-xs font-sans-bold text-amber-900 underline">Try again</T>
                </Pressable>
              ) : null}
              {!editing ? <T className="text-xs text-amber-800">You can also tap “Later” and add it from Payouts.</T> : null}
            </View>
          ) : null}

          <View className="flex-row items-start gap-2.5">
            <View className="mt-0.5">
              <Lock size={16} color="#4A524E" strokeWidth={2} />
            </View>
            <T className="flex-1 text-[13px] leading-5 text-muted-2">
              We only accept an account the bank confirms, so your money can’t go to the wrong name.
            </T>
          </View>
        </ScrollView>

        <SearchableSelectModal
          visible={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Select Bank"
          placeholder="Search bank name (e.g. GTB, Kuda, Zenith)..."
          items={bankSelectItems}
          selectedId={selectedBank?.code}
          loading={loadingBanks}
          onSelect={(item) => setSelectedBank(item.metadata as Bank)}
        />

        <BottomBar>
          <Button
            title={saving ? 'Saving...' : 'Save account'}
            disabled={!canSave}
            onPress={handleSave}
            left={saving ? <ActivityIndicator color="#FFFFFF" size="small" /> : undefined}
          />
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
