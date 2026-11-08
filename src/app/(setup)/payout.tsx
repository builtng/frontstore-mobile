import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { router } from 'expo-router';
import { Check, ChevronDown, Landmark, Lock, RefreshCw } from 'lucide-react-native';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Labelled, Progress, RingInput, StepHeader } from '@/features/setup/parts';
import { getBanks, resolveAccount } from '@/api/store';
import { Bank } from '@/api/types';
import { updateDraft, useDraft } from '@/features/setup/draft';
import { SearchableSelectModal, SelectItem } from '@/components/SearchableSelectModal';
import { C } from '@/lib/theme';

export default function Payout() {
  const draft = useDraft();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [account, setAccount] = useState(draft.payout?.account || '');
  const [resolving, setResolving] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(draft.payout?.accountName || null);
  const [manualAccountName, setManualAccountName] = useState(draft.payout?.accountName || draft.owner_name || draft.name || '');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch real bank list from API
  useEffect(() => {
    setLoadingBanks(true);
    getBanks()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBanks(data);
          // Restore previously chosen bank or default to first
          const existing = draft.payout?.bankCode
            ? data.find((b) => b.code === draft.payout?.bankCode)
            : null;
          setSelectedBank(existing || data[0]);
        }
      })
      .catch((err) => {
        console.warn('Failed to load banks:', err);
      })
      .finally(() => {
        setLoadingBanks(false);
      });
  }, []);

  const doResolve = (accNumber: string, bank: Bank) => {
    if (accNumber.length !== 10) {
      setAccountName(null);
      setErrorMsg(null);
      return;
    }

    setResolving(true);
    setErrorMsg(null);
    resolveAccount(accNumber, bank.code)
      .then((res) => {
        if (res.account_name) {
          setAccountName(res.account_name);
          setManualAccountName(res.account_name);
          updateDraft({
            payout: {
              bank: bank.name,
              bankCode: bank.code,
              account: accNumber,
              accountName: res.account_name,
            },
          });
        }
      })
      .catch((err) => {
        setAccountName(null);
        const rawMsg = err.response?.data?.message || err.message || '';
        const isAuthOrNetwork =
          rawMsg.toLowerCase().includes('unauthenticated') ||
          rawMsg.toLowerCase().includes('network') ||
          err.response?.status === 401;

        const msg = isAuthOrNetwork
          ? 'Live name lookup is temporarily unavailable. Please enter your account name below.'
          : rawMsg || 'Could not verify account name automatically.';
        setErrorMsg(msg);
      })
      .finally(() => {
        setResolving(false);
      });
  };

  useEffect(() => {
    if (account.length === 10 && selectedBank) {
      doResolve(account, selectedBank);
    } else {
      setAccountName(null);
      setErrorMsg(null);
    }
  }, [account, selectedBank]);

  const bankSelectItems: SelectItem[] = useMemo(() => {
    const seen = new Set<string>();
    const uniqueBanks = banks.filter((b) => {
      if (seen.has(b.code)) return false;
      seen.add(b.code);
      return true;
    });

    return uniqueBanks.map((b) => ({
      id: b.code,
      title: b.name,
      subtitle: `Code: ${b.code}`,
      icon: (
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-mint/50">
          <Landmark size={18} color={C.accent} strokeWidth={2} />
        </View>
      ),
      metadata: b,
    }));
  }, [banks]);

  const handleSave = () => {
    if (!selectedBank || account.length !== 10) return;
    const finalAccountName = (accountName || manualAccountName || draft.owner_name || draft.name || 'Merchant Account').trim();
    updateDraft({
      payout: {
        bank: selectedBank.name,
        bankCode: selectedBank.code,
        account,
        accountName: finalAccountName,
      },
    });
    router.push('/first-product');
  };

  const canSave = account.length === 10 && !!selectedBank && !resolving;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/store-style" label="5 of 5" />
        <Progress pct={100} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-[18px] px-5 pt-[22px] pb-6">
          <Heading title="Where should we pay you?" sub="Sales go to your Frontstore wallet, then to this account." />

          <Labelled label="Bank">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Bank: ${selectedBank?.name || 'Select bank'}`}
              onPress={() => setModalOpen(true)}
              className="h-14 flex-row items-center justify-between rounded-2xl border-[1.5px] border-line bg-surface px-4"
            >
              <View className="flex-1 flex-row items-center gap-2.5 pr-2">
                <Landmark size={18} color={C.accent} strokeWidth={2} />
                <T className="flex-1 font-sans-semibold text-[17px] text-ink" numberOfLines={1}>
                  {selectedBank?.name || (loadingBanks ? 'Loading banks...' : 'Select bank')}
                </T>
              </View>
              <ChevronDown size={18} color={C.muted} strokeWidth={2} />
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
              <ActivityIndicator size="small" color={C.accent} />
              <T className="text-sm text-muted">Verifying account with bank...</T>
            </View>
          ) : accountName ? (
            <View accessibilityLabel={`Verified account name: ${accountName}`} className="flex-row items-center gap-2 rounded-[14px] bg-mint px-3.5 py-3" accessibilityLiveRegion="polite">
              <Check size={16} color={C['mint-fg']} strokeWidth={2.6} />
              <T className="flex-1 font-sans-bold text-sm uppercase text-mint-fg" numberOfLines={1}>
                {accountName}
              </T>
            </View>
          ) : (
            <View className="gap-2">
              <Labelled label="Account name">
                <RingInput
                  value={manualAccountName}
                  onChangeText={setManualAccountName}
                  placeholder="e.g. Account owner or business name"
                  accessibilityLabel="Account name"
                />
              </Labelled>

              {errorMsg ? (
                <View className="gap-1.5 rounded-[14px] bg-warn-bg p-3.5">
                  <T className="font-sans-medium text-xs text-warn-fg">{errorMsg}</T>
                  {selectedBank && account.length === 10 ? (
                    <Pressable
                      onPress={() => doResolve(account, selectedBank)}
                      className="flex-row items-center gap-1.5 self-start mt-1"
                    >
                      <RefreshCw size={13} color={C['warn-fg']} />
                      <T className="font-sans-bold text-xs text-warn-fg underline">Retry auto-lookup</T>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>
          )}

          <View className="flex-row items-start gap-2.5">
            <View className="mt-0.5">
              <Lock size={15} color={C.muted} strokeWidth={2} />
            </View>
            <T className="flex-1 text-[13px] leading-5 text-muted">
              Payouts arrive the next business day at 10:00am. To keep your money safe, changing this account later needs our team’s approval.
            </T>
          </View>
        </ScrollView>

        <SearchableSelectModal
          visible={modalOpen}
          onClose={() => setModalOpen(false)}
          title="Select Bank"
          subtitle="Search by bank name or code"
          placeholder="Search bank name (e.g. GTB, Kuda, Zenith)..."
          items={bankSelectItems}
          selectedId={selectedBank?.code}
          loading={loadingBanks}
          onSelect={(item) => {
            const bank = item.metadata as Bank;
            setSelectedBank(bank);
          }}
        />

        <BottomBar>
          <Button
            title="Save and continue"
            disabled={!canSave}
            onPress={handleSave}
          />
          <Pressable accessibilityRole="link" onPress={() => router.push('/first-product')} className="min-h-[44px] items-center justify-center">
            <T className="font-sans-bold text-sm text-muted">Do this later</T>
          </Pressable>
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
