import { useLocalSearchParams } from 'expo-router';
import { CodeEntry } from '@/features/auth/CodeEntry';

/** /verify?flow=signup|login&channel=email|whatsapp&to=... */
export default function Verify() {
  const { flow, channel, to } = useLocalSearchParams<{ flow?: string; channel?: string; to?: string }>();
  return (
    <CodeEntry
      flow={flow === 'login' ? 'login' : 'signup'}
      channel={channel === 'whatsapp' ? 'whatsapp' : 'email'}
      to={to}
    />
  );
}
