import { useEffect, useState, useMemo } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Check, ChevronDown, Landmark, Lock, RefreshCw } from 'lucide-react-native';
import { Button, Screen, T } from '@/components/ui';
import { BottomBar, Heading, Labelled, Progress, RingInput, StepHeader } from '@/features/setup/parts';
import { getBanks, resolveAccount } from '@/api/store';
import { Bank } from '@/api/types';
import { updateDraft, useDraft } from '@/features/setup/draft';
import { SearchableSelectModal, SelectItem } from '@/components/SearchableSelectModal';

export default function Payout() {
  const draft = useDraft();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingBanks, setLoadingBanks] = useState(false);
  const [account, setAccount] = useState(draft.payout?.account || '');
  const [resolving, setResolving] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(draft.payout?.accountName || null);
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
        const msg = err.response?.data?.message || err.message || 'Could not verify account name. Check the number and bank.';
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
          <Landmark size={18} color="#0B6E4F" strokeWidth={2} />
        </View>
      ),
      metadata: b,
    }));
  }, [banks]);

  const complete = account.length === 10 && !!accountName;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/store-style" label="Step 4 of 5" right={{ title: 'Later', href: '/first-product' }} />
        <Progress pct={80} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-[18px] px-5 pt-6 pb-6">
          <Heading title="Where should we send your money?" sub="Customer payments are paid out directly to this account." />

          <Labelled label="Bank">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Bank: ${selectedBank?.name || 'Select bank'}`}
              onPress={() => setModalOpen(true)}
              className="h-[54px] flex-row items-center justify-between rounded-[14px] border border-line-2 bg-surface px-4"
            >
              <View className="flex-1 flex-row items-center gap-2.5 pr-2">
                <Landmark size={18} color="#0B6E4F" strokeWidth={2} />
                <T className="text-base font-sans-medium text-ink flex-1" numberOfLines={1}>
                  {selectedBank?.name || (loadingBanks ? 'Loading banks...' : 'Select bank')}
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
              <T className="text-sm text-muted">Verifying account with bank...</T>
            </View>
          ) : accountName ? (
            <View className="flex-row items-center gap-3 rounded-[14px] bg-mint px-4 py-3.5" accessibilityLiveRegion="polite">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-green">
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
              </View>
              <View className="flex-1">
                <T className="text-xs text-[#33403A]">Account name</T>
                <T className="font-sans-bold text-base text-ink" numberOfLines={1}>
                  {accountName}
                </T>
              </View>
            </View>
          ) : errorMsg ? (
            <View className="rounded-[14px] bg-red-50 p-3.5 border border-red-200 gap-1.5">
              <T className="text-xs font-sans-medium text-red-700">{errorMsg}</T>
              {selectedBank && account.length === 10 ? (
                <Pressable
                  onPress={() => doResolve(account, selectedBank)}
                  className="flex-row items-center gap-1.5 self-start mt-1"
                >
                  <RefreshCw size={13} color="#B91C1C" />
                  <T className="text-xs font-sans-bold text-red-700 underline">Retry verification</T>
                </Pressable>
              ) : null}
            </View>
          ) : null}

          <View className="flex-row items-start gap-2.5">
            <View className="mt-0.5">
              <Lock size={16} color="#4A524E" strokeWidth={2} />
            </View>
            <T className="flex-1 text-[13px] leading-5 text-muted-2">
              Payments are processed securely via regulated payment rails. Payouts arrive next business day at 10:00am.
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
            title="Save account"
            href="/first-product"
            disabled={!complete && account.length > 0 && resolving}
            onPress={() => {
              if (selectedBank && account) {
                updateDraft({
                  payout: {
                    bank: selectedBank.name,
                    bankCode: selectedBank.code,
                    account,
                    accountName: accountName || '',
                  },
                });
              }
            }}
          />
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
