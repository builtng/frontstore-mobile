import { useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { AlertTriangle, Check, ChevronDown, ChevronUp, Plus, QrCode, Ticket, X } from 'lucide-react-native';
import { router } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { LoadError, Screen, SkeletonRows, T, cx } from '@/components/ui';
import { BackHeader } from '@/features/seller/parts';
import { checkInTicket, getTicketEvents, type CheckInResult, type TicketEvent } from '@/api/tickets';
import { C } from '@/lib/theme';
import { TicketScanner, canScan } from '@/features/seller/TicketScanner';

const when = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' }) : '';
const clock = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString('en-GB', { hour: 'numeric', minute: '2-digit' }) : '');

/** Result of the last check-in, big and coloured so it reads at a glance at the door. */
function Result({ r, onClear }: { r: CheckInResult; onClear: () => void }) {
  const ok = r.kind === 'ok';
  const a = r.kind === 'unknown' ? null : r.attendee;
  const tone = ok ? { bg: 'bg-mint', fg: 'text-accent', icon: C.accent } : r.kind === 'already' ? { bg: 'bg-warn-bg', fg: 'text-warn-fg', icon: C['warn-fg'] } : { bg: 'bg-danger-bg', fg: 'text-danger', icon: C.danger };
  const Icon = ok ? Check : r.kind === 'already' ? AlertTriangle : X;
  return (
    <View accessibilityLiveRegion="assertive" className={cx('flex-row items-center gap-3 rounded-[20px] p-4', tone.bg)}>
      <Icon size={28} color={tone.icon} strokeWidth={2.6} />
      <View className="min-w-0 flex-1">
        <T className={cx('font-display text-lg', tone.fg)}>{ok ? 'Checked in' : r.kind === 'already' ? 'Already checked in' : 'Not a valid ticket'}</T>
        {a ? <T numberOfLines={2} className={cx('text-sm', tone.fg)}>{a.name} · admits {a.admits} · {a.ticket}</T> : null}
        {!ok ? <T className={cx('text-[13px]', tone.fg)}>{r.message}</T> : null}
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="Clear" hitSlop={8} onPress={onClear}>
        <X size={18} color={tone.icon} strokeWidth={2} />
      </Pressable>
    </View>
  );
}

function EventCard({ e }: { e: TicketEvent }) {
  const [open, setOpen] = useState(false);
  const pct = e.sold ? Math.round((e.checkedIn / e.sold) * 100) : 0;
  return (
    <View className="overflow-hidden rounded-[22px] border border-line bg-surface">
      <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setOpen(!open)} className="gap-2.5 p-4">
        <View className="flex-row items-start gap-3">
          <View className="min-w-0 flex-1">
            <T numberOfLines={2} className="font-sans-bold text-[15px]">{e.name}{e.isDraft ? ' (hidden)' : ''}</T>
            <T numberOfLines={1} className="text-[13px] text-muted">{[when(e.eventDate), e.location].filter(Boolean).join(' · ') || 'No date set'}</T>
          </View>
          {open ? <ChevronUp size={18} color={C['faint-2']} /> : <ChevronDown size={18} color={C['faint-2']} />}
        </View>
        <View className="flex-row items-baseline justify-between">
          <T className="text-sm"><T className="font-display text-lg">{e.checkedIn}</T><T className="text-sm text-muted"> of {e.sold} in</T></T>
          <T className="text-xs text-muted">{e.sold} sold</T>
        </View>
        <View className="h-1.5 overflow-hidden rounded-full bg-sand">
          <View style={{ width: `${pct}%` }} className="h-1.5 rounded-full bg-green" />
        </View>
      </Pressable>
      {open ? (
        e.attendees.length ? e.attendees.map((a) => (
          <View key={a.code} className="flex-row items-center gap-3 border-t border-line px-4 py-3">
            <View className={cx('h-7 w-7 items-center justify-center rounded-full', a.checkedInAt ? 'bg-green' : 'border-2 border-line-2')}>
              {a.checkedInAt ? <Check size={14} color="#FFFFFF" strokeWidth={3} /> : null}
            </View>
            <View className="min-w-0 flex-1">
              <T numberOfLines={1} className="font-sans-bold text-sm">{a.name}{a.admits > 1 ? ` (+${a.admits - 1})` : ''}</T>
              <T numberOfLines={1} className="text-xs text-muted">{a.code}{a.order ? ` · #${a.order}` : ''}</T>
            </View>
            <T className="text-xs text-muted">{a.checkedInAt ? `In ${clock(a.checkedInAt)}` : 'Not in yet'}</T>
          </View>
        )) : <View className="border-t border-line px-4 py-3"><T className="text-sm text-muted">No tickets sold yet.</T></View>
      ) : null}
    </View>
  );
}

/** Check guests in at the door with the code on their ticket, and see who's arrived. */
export default function Tickets() {
  const qc = useQueryClient();
  const input = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [scanning, setScanning] = useState(false);
  // Each scan checks in straight away; the list catches up when the scanner closes.
  const scanCode = async (c: string) => {
    const r = await checkInTicket(c);
    setResult(r);
    if (r.kind === 'ok') qc.invalidateQueries({ queryKey: ['ticket-events'] });
    return r;
  };
  const { data: events, isLoading, isError, refetch } = useQuery({ queryKey: ['ticket-events'], queryFn: getTicketEvents });

  const check = useMutation({
    mutationFn: (c: string) => checkInTicket(c),
    onSuccess: (r) => {
      setResult(r);
      setCode('');
      if (r.kind === 'ok') qc.invalidateQueries({ queryKey: ['ticket-events'] });
      input.current?.focus();
    },
  });
  const submit = () => { const c = code.trim(); if (c && !check.isPending) check.mutate(c); };

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <BackHeader
          title="Event tickets"
          fallback="/settings"
          right={
            <Pressable accessibilityRole="button" accessibilityLabel="New event" onPress={() => router.push('/ticket/new')} hitSlop={6} className="h-10 w-10 items-center justify-center rounded-full bg-green">
              <Plus size={20} color="#FFFFFF" strokeWidth={2.4} />
            </Pressable>
          }
        />
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-3.5 px-5 pb-8 pt-1" showsVerticalScrollIndicator={false}>
          <View className="gap-3 rounded-[24px] bg-panel p-4">
            <T className="font-display text-lg text-white">Check someone in</T>
            {canScan ? (
              <Pressable accessibilityRole="button" onPress={() => setScanning(true)} className="h-[52px] flex-row items-center justify-center gap-2 rounded-2xl bg-gold">
                <QrCode size={20} color="#2A1B05" strokeWidth={2} />
                <T className="font-sans-bold text-base text-[#2A1B05]">Scan QR code</T>
              </Pressable>
            ) : null}
            <T className="text-[13px] text-on-dark-2">{canScan ? 'Or type the code on their ticket, e.g. TKT-8F3K2Q.' : 'Type the code on their ticket, e.g. TKT-8F3K2Q. Most phone cameras can read the QR and show it.'}</T>
            <View className="flex-row gap-2">
              <TextInput
                ref={input}
                value={code}
                onChangeText={(v) => setCode(v.toUpperCase())}
                autoCapitalize="characters"
                autoCorrect={false}
                placeholder="TKT-…"
                placeholderTextColor="#7A847F"
                returnKeyType="go"
                onSubmitEditing={submit}
                accessibilityLabel="Ticket code"
                className="h-[52px] min-w-0 flex-1 rounded-2xl bg-white/10 px-4 font-display text-lg tracking-[1px] text-white"
              />
              <Pressable accessibilityRole="button" disabled={!code.trim() || check.isPending} onPress={submit} className={cx('h-[52px] items-center justify-center rounded-2xl px-5', canScan ? 'border-[1.5px] border-white/30' : 'bg-gold', !code.trim() && 'opacity-50')}>
                {check.isPending ? <ActivityIndicator color={canScan ? '#FFFFFF' : '#2A1B05'} /> : <T className={cx('font-sans-bold text-base', canScan ? 'text-white' : 'text-[#2A1B05]')}>Check in</T>}
              </Pressable>
            </View>
            {check.error ? <T className="text-[13px] text-[#FFB4A8]">{(check.error as Error).message || 'Couldn’t check that code. Try again.'}</T> : null}
          </View>

          {result ? <Result r={result} onClear={() => setResult(null)} /> : null}

          {isLoading ? (
            <SkeletonRows count={2} />
          ) : isError ? (
            <LoadError what="your events" onRetry={() => refetch()} />
          ) : events?.length ? (
            events.map((e) => <EventCard key={e.id} e={e} />)
          ) : (
            <View className="items-center gap-2 rounded-[22px] border border-line bg-surface px-6 py-8">
              <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-mint"><Ticket size={24} color={C.accent} strokeWidth={2} /></View>
              <T className="text-center font-sans-bold text-base">No events yet</T>
              <T className="text-center text-sm leading-5 text-muted">Sell tickets for a class, show or pop-up. Buyers get a code and QR, and you scan them in here.</T>
              <Pressable accessibilityRole="button" onPress={() => router.push('/ticket/new')} className="mt-1 h-11 justify-center rounded-xl bg-ink px-5"><T className="font-sans-bold text-sm text-bg">Create an event</T></Pressable>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      <TicketScanner visible={scanning} onClose={() => setScanning(false)} onCode={scanCode} />
    </Screen>
  );
}
