import { useEffect, useState } from 'react';
import { Image, Linking, Pressable, ScrollView, View } from 'react-native';
import { router, type Href } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeftRight, ChevronRight, CircleHelp, KeyRound, Link2, LogOut, Mail, Palette, QrCode, ReceiptText, Truck, Wallet, X, type LucideIcon } from 'lucide-react-native';
import { IconTile, Toggle } from '@/features/seller/parts';
import { WhatsAppIcon } from '@/features/setup/parts';
import { Button, Screen, Skeleton, T, cx } from '@/components/ui';
import { BottomSheet, SheetField } from '@/features/buyer/account';
import { PrivacyActions } from '@/features/account/PrivacyActions';
import { AppearancePicker } from '@/features/account/AppearancePicker';
import { ContactEditSheet, type ContactKind } from '@/features/account/ContactEditSheet';
import { PasswordSheet } from '@/features/account/PasswordSheet';
import { naira } from '@/lib/format';
import { getMe } from '@/api/auth';
import { getStore } from '@/api/store';
import { getWalletBalance } from '@/api/orders';
import { apiGet } from '@/api/client';
import { planName, signOut, updateStore } from '@/api/account';
import { C } from '@/lib/theme';

type Row = { label: string; sub?: string; Icon?: LucideIcon | React.ComponentType<{ size?: number; color?: string; strokeWidth?: number }>; value?: string; loading?: boolean; href?: Href; onPress?: () => void; danger?: boolean };

const fmtDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

function Section({ title }: { title: string }) {
  return <T className="px-1 font-sans-bold text-xs uppercase tracking-[0.96px] text-muted">{title}</T>;
}

function Rows({ rows }: { rows: Row[] }) {
  return (
    <View className="overflow-hidden rounded-[20px] border border-line bg-surface">
      {rows.map((r, i) => (
        <Pressable
          key={r.label}
          accessibilityRole="button"
          accessibilityLabel={[r.label, r.sub, r.value].filter(Boolean).join(', ')}
          disabled={!r.href && !r.onPress}
          onPress={() => (r.href ? router.push(r.href) : r.onPress?.())}
          className={cx('min-h-[52px] flex-row items-center gap-3 px-3.5 py-[13px]', i > 0 && 'border-t border-line')}
        >
          {r.Icon ? (
            <IconTile tone={r.danger ? 'danger' : 'green'} size={36}>
              <r.Icon size={18} color={r.danger ? C.danger : C.accent} strokeWidth={2} />
            </IconTile>
          ) : null}
          <View className="min-w-0 flex-1">
            <T numberOfLines={1} className={cx('font-sans-bold text-[15px]', r.danger && 'text-danger')}>{r.label}</T>
            {r.sub ? <T numberOfLines={1} className="text-xs text-muted">{r.sub}</T> : null}
          </View>
          {r.loading ? <Skeleton className="h-3.5 w-14" /> : r.value ? <T numberOfLines={1} className="max-w-[45%] text-sm text-muted">{r.value}</T> : null}
          {(r.href || r.onPress) && !r.danger ? <ChevronRight size={18} color={C['faint-2']} strokeWidth={2} /> : null}
        </Pressable>
      ))}
    </View>
  );
}

/** WhatsApp logo sized like the other row icons. */
function WhatsAppGlyph({ size = 18 }: { size?: number }) {
  return <WhatsAppIcon size={size} color={C.accent} />;
}

export default function Settings() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState<ContactKind | null>(null);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);
  const [flatFee, setFlatFee] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const [openError, setOpenError] = useState('');

  const { data: me, isLoading: meLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });
  const { data: store, isLoading: storeLoading } = useQuery({ queryKey: ['seller-store'], queryFn: getStore });
  const { data: wallet, isLoading: walletLoading } = useQuery({ queryKey: ['seller-wallet'], queryFn: getWalletBalance });
  const { data: platform } = useQuery({
    queryKey: ['public-settings'],
    queryFn: () => apiGet<{ support_email?: string; support_whatsapp?: string }>('/public/settings'),
    staleTime: 1000 * 60 * 60,
  });

  const s: any = store ?? me?.store ?? (me?.user as any)?.store ?? {};
  const user: any = me?.user ?? {};
  const storeName = s.store_name || s.name || 'My Store';
  const storeSlug = s.username || s.slug || '';
  const storeColor = s.primary_color || '#0F172A';
  const savedFee = s.shipping_flat_fee != null ? String(Math.round(Number(s.shipping_flat_fee))) : '';

  useEffect(() => {
    setFlatFee(savedFee);
  }, [savedFee]);

  // Real plan from the server. No in-app purchases: plans are managed in the seller's Frontstore account.
  const plan = planName(user.plan);
  const planLine =
    user.plan_source === 'trial' && user.plan_expires_at
      ? `Free trial until ${fmtDate(user.plan_expires_at)}`
      : user.plan_expires_at
        ? `Paid until ${fmtDate(user.plan_expires_at)}`
        : plan === 'Free'
          ? 'No monthly fee'
          : 'Renews automatically';

  const supportWa = (platform?.support_whatsapp || '').replace(/\D/g, '');
  const supportEmail = platform?.support_email || 'hello@frontstore.ng';

  const saveFee = async () => {
    setSaving(true);
    setSaveError('');
    try {
      await updateStore({ shipping_flat_fee: flatFee.trim() === '' ? null : Number(flatFee) });
      await qc.invalidateQueries({ queryKey: ['seller-store'] });
      setDeliveryOpen(false);
    } catch (e: any) {
      setSaveError(e?.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const isOpen = s.is_active !== false;
  // Open / closed straight from here; the switch moves at once and goes back if saving fails.
  const setOpen = async (open: boolean) => {
    setOpenError('');
    const prev = qc.getQueryData(['seller-store']);
    qc.setQueryData(['seller-store'], (cur: any) => (cur ? { ...cur, is_active: open } : cur));
    try {
      await updateStore({ is_active: open });
      qc.invalidateQueries({ queryKey: ['seller-store'] });
      qc.invalidateQueries({ queryKey: ['me'] });
    } catch (e: any) {
      qc.setQueryData(['seller-store'], prev);
      setOpenError(e?.message || 'Couldn’t change that. Try again.');
    }
  };

  const bankLine = wallet?.bank_name ? `${wallet.bank_name}${wallet.account_number ? ` •••• ${String(wallet.account_number).slice(-4)}` : ''}` : 'Add your bank';
  const storeRows: Row[] = [
    { label: 'Look and logo', sub: 'Name, colour, logo and bio', Icon: Palette, href: '/store-edit' },
    { label: 'Delivery fee', sub: savedFee ? `${naira(Number(savedFee))} flat fee` : 'Not set', Icon: Truck, onPress: () => setDeliveryOpen(true) },
    { label: 'Share store and QR code', sub: storeSlug ? `frontstore.app/${storeSlug}` : undefined, Icon: QrCode, href: '/share' },
    { label: 'Payment links', sub: 'Get paid without a product', Icon: Link2, href: '/payment-links' },
    { label: 'Invoices', sub: 'Bill a customer and track payment', Icon: ReceiptText, href: '/invoices' },
  ];
  const passwordOn = Boolean(user.has_password) && user.password_login_enabled !== false;
  const moneyRows: Row[] = [
    { label: 'Payouts', sub: bankLine, Icon: Wallet, value: wallet ? naira(wallet.balance) : undefined, loading: walletLoading, href: '/payouts' },
    { label: 'WhatsApp number', sub: s.whatsapp_phone || 'Add your number for order alerts', Icon: WhatsAppGlyph, onPress: () => setEditing('whatsapp') },
    { label: 'Email', sub: user.email || 'Add an email', Icon: Mail, onPress: () => setEditing('email') },
    { label: 'Log in with password', sub: passwordOn ? 'On' : 'Off', Icon: KeyRound, onPress: () => setPasswordOpen(true) },
    { label: 'Switch to shopping', sub: 'Browse and buy as a customer', Icon: ArrowLeftRight, href: '/switch' },
  ];

  if (meLoading || storeLoading) {
    return (
      <Screen>
        <View className="gap-4 px-5 pt-1.5">
          <T className="font-display-x text-[30px] tracking-[-0.6px]">Store</T>
          <Skeleton className="h-[150px] rounded-[22px]" />
          <Skeleton className="h-52 rounded-[20px]" />
        </View>
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView contentContainerClassName="gap-3.5 px-5 pb-8 pt-1.5" showsVerticalScrollIndicator={false}>
        <T accessibilityRole="header" className="pb-1 font-display-x text-[30px] tracking-[-0.6px]">Store</T>

        <View className="gap-3.5 rounded-[22px] border border-line bg-surface p-4">
          <View className="flex-row items-center gap-3">
            <View style={{ backgroundColor: storeColor }} className="h-[54px] w-[54px] items-center justify-center overflow-hidden rounded-2xl">
              {s.logo_url ? (
                <Image source={{ uri: s.logo_url }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <T className="font-display-x text-[22px] text-white">{storeName[0] || 'S'}</T>
              )}
            </View>
            <View className="min-w-0 flex-1">
              <T numberOfLines={1} className="font-display text-lg">{storeName}</T>
              {storeSlug ? <T numberOfLines={1} className="text-[13px] text-muted">frontstore.app/{storeSlug}</T> : null}
            </View>
            {storeSlug ? (
              <Pressable accessibilityRole="link" accessibilityLabel="View your store" onPress={() => Linking.openURL(`https://frontstore.app/${storeSlug}`)} className="h-9 justify-center rounded-full bg-mint px-3">
                <T className="font-sans-bold text-[13px] text-accent">View</T>
              </Pressable>
            ) : null}
          </View>
          <View className="flex-row items-center gap-3 border-t border-line pt-3.5">
            <View className="min-w-0 flex-1">
              <T className="font-sans-bold text-[15px]">{isOpen ? 'Store is open' : 'Store is closed'}</T>
              <T className="text-xs text-muted">{isOpen ? 'Customers can order now' : 'Customers can look but not order'}</T>
            </View>
            <Toggle label="Store is open" value={isOpen} onChange={setOpen} />
          </View>
          {openError ? <T className="text-[13px] text-danger">{openError}</T> : null}
          <View className="flex-row items-center justify-between rounded-[14px] bg-bg px-3.5 py-2.5">
            <T className="font-sans-bold text-sm">{plan} plan</T>
            <T className="text-[13px] text-muted">{planLine}</T>
          </View>
        </View>

        <Section title="Your store" />
        <Rows rows={storeRows} />

        <Section title="Money and account" />
        <Rows rows={moneyRows} />

        <AppearancePicker />

        <Section title="Privacy" />
        <View className="overflow-hidden rounded-[20px] border border-line bg-surface">
          <PrivacyActions />
        </View>

        <Section title="Help" />
        <Rows
          rows={[
            { label: 'Help and support', sub: supportWa ? 'Chat with us on WhatsApp' : supportEmail, Icon: CircleHelp, onPress: () => Linking.openURL(supportWa ? `https://wa.me/${supportWa}` : `mailto:${supportEmail}`) },
            { label: loggingOut ? 'Logging out…' : 'Log out', Icon: LogOut, danger: true, onPress: async () => { if (loggingOut) return; setLoggingOut(true); await signOut(); } },
          ]}
        />
      </ScrollView>

      <BottomSheet visible={deliveryOpen} onClose={() => !saving && setDeliveryOpen(false)}>
        <View className="gap-3 py-1">
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <Truck size={20} color={C.accent} />
              <T className="font-display text-xl">Delivery fee</T>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" hitSlop={8} onPress={() => setDeliveryOpen(false)}>
              <X size={20} color={C.ink} />
            </Pressable>
          </View>
          <T className="text-sm text-muted">One flat fee added to every delivery order at checkout. Leave it empty for no fee. Set fees by area on the web dashboard.</T>
          <SheetField label="Flat delivery fee (₦)" keyboardType="numeric" value={flatFee} onChangeText={(v) => setFlatFee(v.replace(/[^\d]/g, ''))} placeholder="e.g. 2500" />
          {saveError ? <T className="text-[13px] text-danger">{saveError}</T> : null}
          <Button title={saving ? 'Saving…' : 'Save delivery fee'} className="h-[50px]" disabled={saving || flatFee === savedFee} onPress={saveFee} />
        </View>
      </BottomSheet>
      <ContactEditSheet kind={editing} onClose={() => setEditing(null)} />
      <PasswordSheet
        visible={passwordOpen}
        onClose={() => setPasswordOpen(false)}
        hasPassword={Boolean(user.has_password)}
        enabled={user.password_login_enabled !== false}
        canLogIn={Boolean(user.email || (user as any).phone_verified_at)}
      />
    </Screen>
  );
}
