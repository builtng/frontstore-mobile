import { Linking, View } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { Button, LoadError, T } from '@/components/ui';
import { C } from '@/lib/theme';

/** True when the server refused because the feature needs a higher plan. */
export const isPlanLocked = (err: unknown) => (err as any)?.status === 403;

/**
 * Shown instead of a list when it couldn't load: an upgrade note for plan
 * limits (plans are changed on the website, there are no in-app purchases),
 * otherwise the normal "couldn't load" with a retry.
 */
export function LockedOrError({ error, what, feature, onRetry }: { error: unknown; what: string; feature: string; onRetry: () => void }) {
  if (!isPlanLocked(error)) return <LoadError what={what} onRetry={onRetry} />;
  return (
    <View className="items-center gap-3 rounded-[22px] border border-line bg-surface px-5 py-7">
      <View className="h-14 w-14 items-center justify-center rounded-[18px] bg-warn-bg">
        <Sparkles size={24} color={C['warn-fg']} strokeWidth={2} />
      </View>
      <T className="text-center font-display text-xl">{feature} are on Pro</T>
      <T className="text-center text-sm leading-5 text-muted">Upgrade your plan on the Frontstore website, then come back here to use them.</T>
      <Button title="See plans" kind="dark" className="mt-1 h-12 self-stretch" onPress={() => Linking.openURL('https://frontstore.app/pricing')} />
    </View>
  );
}
