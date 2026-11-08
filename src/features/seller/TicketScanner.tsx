import { useRef, useState } from 'react';
import { Linking, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AlertTriangle, Check, X } from 'lucide-react-native';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { T, cx } from '@/components/ui';
import type { CheckInResult } from '@/api/tickets';

/**
 * The camera only exists in app builds made after expo-camera was added. Older
 * builds can still get this JavaScript as an over-the-air update, so check for
 * the native module before touching expo-camera at all.
 */
export const canScan = !!requireOptionalNativeModule('ExpoCamera');
// Loaded only when the native side is there, so older builds never import it.
const Camera: typeof import('expo-camera') | null = canScan ? require('expo-camera') : null;

const PAUSE_MS = 2500;

/**
 * Full-screen QR scanner for the door: it keeps scanning, checks each code in,
 * shows the result over the camera, and ignores the same code for a moment so
 * one ticket isn't read twice.
 */
export function TicketScanner({ visible, onClose, onCode }: {
  visible: boolean;
  onClose: () => void;
  onCode: (code: string) => Promise<CheckInResult>;
}) {
  if (!Camera) return null;
  return <Scanner visible={visible} onClose={onClose} onCode={onCode} />;
}

function Scanner({ visible, onClose, onCode }: { visible: boolean; onClose: () => void; onCode: (code: string) => Promise<CheckInResult> }) {
  const { CameraView, useCameraPermissions } = Camera!;
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [result, setResult] = useState<CheckInResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const busy = useRef(false);
  const last = useRef<{ code: string; at: number } | null>(null);

  const onScanned = async ({ data }: { data: string }) => {
    const code = String(data || '').trim();
    if (!code || busy.current) return;
    const now = Date.now();
    if (last.current && last.current.code === code && now - last.current.at < PAUSE_MS * 2) return;
    busy.current = true;
    last.current = { code, at: now };
    setError(null);
    try {
      setResult(await onCode(code));
    } catch (e: any) {
      setError(e?.message || 'Couldn’t check that ticket. Check your connection.');
    } finally {
      setTimeout(() => { busy.current = false; }, PAUSE_MS);
    }
  };

  const ok = result?.kind === 'ok';
  const a = result && result.kind !== 'unknown' ? result.attendee : null;
  const bg = !result ? '' : ok ? 'bg-[#1E5E3A]' : result.kind === 'already' ? 'bg-[#8A4A06]' : 'bg-[#9A2C14]';
  const Icon = ok ? Check : result?.kind === 'already' ? AlertTriangle : X;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View className="flex-1 bg-black">
        {permission?.granted ? (
          <CameraView
            style={{ flex: 1 }}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={visible ? onScanned : undefined}
          />
        ) : (
          <View className="flex-1 items-center justify-center gap-4 px-8">
            <T className="text-center font-display text-xl text-white">Allow the camera to scan tickets</T>
            <T className="text-center text-sm text-[#9FB3A9]">Point it at the QR code on a guest’s ticket and they’re checked in.</T>
            {permission && !permission.canAskAgain ? (
              <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()} className="h-[52px] items-center justify-center rounded-2xl bg-[#F3C77A] px-6">
                <T className="font-sans-bold text-base text-[#2A1B05]">Open Settings</T>
              </Pressable>
            ) : (
              <Pressable accessibilityRole="button" onPress={requestPermission} className="h-[52px] items-center justify-center rounded-2xl bg-[#F3C77A] px-6">
                <T className="font-sans-bold text-base text-[#2A1B05]">Allow camera</T>
              </Pressable>
            )}
          </View>
        )}

        {/* Frame to aim at */}
        {permission?.granted ? (
          <View pointerEvents="none" className="absolute inset-0 items-center justify-center">
            <View className="h-64 w-64 rounded-[28px] border-[3px] border-white/80" />
            <T className="mt-4 font-sans-bold text-sm text-white">Point at the ticket’s QR code</T>
          </View>
        ) : null}

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close scanner"
          onPress={onClose}
          style={{ top: insets.top + 10 }}
          className="absolute right-4 h-11 w-11 items-center justify-center rounded-full bg-black/50"
        >
          <X size={22} color="#FFFFFF" strokeWidth={2.2} />
        </Pressable>

        {result || error ? (
          <View accessibilityLiveRegion="assertive" style={{ bottom: insets.bottom + 20 }} className={cx('absolute left-4 right-4 flex-row items-center gap-3 rounded-[22px] p-4', error ? 'bg-[#9A2C14]' : bg)}>
            {error ? <X size={28} color="#FFFFFF" strokeWidth={2.6} /> : <Icon size={28} color="#FFFFFF" strokeWidth={2.6} />}
            <View className="min-w-0 flex-1">
              <T className="font-display text-lg text-white">{error ? 'Couldn’t check' : ok ? 'Checked in' : result!.kind === 'already' ? 'Already checked in' : 'Not a valid ticket'}</T>
              {a ? <T numberOfLines={2} className="text-sm text-white">{a.name} · admits {a.admits}</T> : null}
              {error ? <T className="text-[13px] text-white">{error}</T> : result && !ok ? <T className="text-[13px] text-white">{result.message}</T> : null}
            </View>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}
