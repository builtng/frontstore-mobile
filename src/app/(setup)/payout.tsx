import { useEffect, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { Check, ChevronDown, Lock } from 'lucide-react-native';
import { Button, Screen, T, cx } from '@/components/ui';
import { BottomBar, Heading, Labelled, Progress, RingInput, StepHeader } from '@/features/setup/parts';
import { getBanks, resolveAccount } from '@/api/store';
import { Bank } from '@/api/types';
import { updateDraft, useDraft } from '@/features/setup/draft';

export default function Payout() {
  const draft = useDraft();
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<Bank | null>(null);
  const [open, setOpen] = useState(false);
  const [account, setAccount] = useState('');
  const [resolving, setResolving] = useState(false);
  const [accountName, setAccountName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    getBanks()
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setBanks(data);
          setSelectedBank(data[0]);
        }
      })
      .catch(() => {
        // Fallback default banks
        const defaults: Bank[] = [
          { code: '058', name: 'GTBank' },
          { code: '011', name: 'First Bank of Nigeria' },
          { code: '033', name: 'United Bank for Africa (UBA)' },
          { code: '057', name: 'Zenith Bank' },
          { code: '044', name: 'Access Bank' },
          { code: '50515', name: 'Moniepoint Microfinance Bank' },
          { code: '090110', name: 'OPay Digital Services' },
          { code: '090267', name: 'Kuda Microfinance Bank' },
        ];
        setBanks(defaults);
        setSelectedBank(defaults[0]);
      });
  }, []);

  useEffect(() => {
    if (account.length !== 10 || !selectedBank) {
      setAccountName(null);
      setErrorMsg(null);
      return;
    }

    setResolving(true);
    setErrorMsg(null);
    resolveAccount(account, selectedBank.code)
      .then((res) => {
        if (res.account_name) {
          setAccountName(res.account_name);
          updateDraft({
            payout: {
              bank: selectedBank.name,
              bankCode: selectedBank.code,
              account,
              accountName: res.account_name,
            },
          });
        }
      })
      .catch((err) => {
        setAccountName(null);
        setErrorMsg(err.message || 'Could not resolve account name. Check details.');
      })
      .finally(() => {
        setResolving(false);
      });
  }, [account, selectedBank]);

  const complete = account.length === 10 && !!accountName;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <StepHeader fallback="/store-style" label="Step 4 of 5" right={{ title: 'Later', href: '/first-product' }} />
        <Progress pct={80} />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-[18px] px-5 pt-6 pb-6">
          <Heading title="Where should we send your money?" sub="Customer payments are paid out to this account." />
          <Labelled label="Bank">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Bank: ${selectedBank?.name || 'Select bank'}`}
              onPress={() => setOpen(!open)}
              className="h-[54px] flex-row items-center justify-between rounded-[14px] border border-line-2 bg-surface px-4"
            >
              <T className="text-base">{selectedBank?.name || 'Select bank'}</T>
              <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
                <ChevronDown size={18} color="#5B6660" strokeWidth={2} />
              </View>
            </Pressable>
            {open ? (
              <View className="max-h-60 overflow-hidden rounded-[14px] border border-line-2 bg-surface mt-1">
                <ScrollView nestedScrollEnabled>
                  {banks.map((b, k) => (
                    <Pressable
                      key={b.code}
                      onPress={() => {
                        setSelectedBank(b);
                        setOpen(false);
                      }}
                      className={cx('h-12 flex-row items-center justify-between px-4', k > 0 && 'border-t border-line')}
                    >
                      <T className={selectedBank?.code === b.code ? 'font-sans-bold text-base' : 'text-base'}>{b.name}</T>
                      {selectedBank?.code === b.code ? <Check size={16} color="#0B6E4F" strokeWidth={2.6} /> : null}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            ) : null}
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
              <T className="text-sm text-muted">Verifying account number...</T>
            </View>
          ) : accountName ? (
            <View className="flex-row items-center gap-3 rounded-[14px] bg-mint px-4 py-3.5" accessibilityLiveRegion="polite">
              <View className="h-8 w-8 items-center justify-center rounded-full bg-green">
                <Check size={16} color="#FFFFFF" strokeWidth={3} />
              </View>
              <View>
                <T className="text-xs text-[#33403A]">Account name</T>
                <T className="font-sans-bold text-base">{accountName}</T>
              </View>
            </View>
          ) : errorMsg ? (
            <T className="text-xs font-sans-medium text-red-600">{errorMsg}</T>
          ) : null}

          <View className="flex-row items-start gap-2.5">
            <View className="mt-0.5">
              <Lock size={16} color="#4A524E" strokeWidth={2} />
            </View>
            <T className="flex-1 text-[13px] leading-5 text-muted-2">
              Payments are processed by Paystack. Payouts arrive next business day at 10:00am.
            </T>
          </View>
        </ScrollView>
        <BottomBar>
          <Button title="Save account" href="/first-product" disabled={!complete} />
        </BottomBar>
      </KeyboardAvoidingView>
    </Screen>
  );
}
