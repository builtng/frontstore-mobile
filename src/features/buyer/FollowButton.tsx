import { ActivityIndicator, Alert, Pressable } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { T, cx } from '@/components/ui';
import { getFollowedStores, toggleFollowStore } from '@/api/buyer';

/** Follow / Following pill for a store row; followed stores show on the Saved tab. */
export function FollowButton({ storeId, storeName }: { storeId: number | string; storeName: string }) {
  const queryClient = useQueryClient();
  const { data: followed = [] } = useQuery({ queryKey: ['followed-stores'], queryFn: getFollowedStores });
  const on = followed.some((s) => String(s.id) === String(storeId));

  const toggle = useMutation({
    mutationFn: () => toggleFollowStore(storeId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['followed-stores'] }),
    onError: (err: any) => Alert.alert(`Couldn’t ${on ? 'unfollow' : 'follow'} ${storeName}`, err.message),
  });

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={on ? `Unfollow ${storeName}` : `Follow ${storeName}`}
      accessibilityState={{ selected: on }}
      hitSlop={6}
      disabled={toggle.isPending}
      onPress={() => toggle.mutate()}
      className={cx('h-9 min-w-[88px] items-center justify-center rounded-full px-3.5', on ? 'border border-line-2 bg-surface' : 'bg-green')}
    >
      {toggle.isPending ? (
        <ActivityIndicator size="small" color={on ? '#0B6E4F' : '#FFFFFF'} />
      ) : (
        <T className={cx('font-sans-bold text-[13px]', on ? 'text-ink' : 'text-white')}>{on ? 'Following' : 'Follow'}</T>
      )}
    </Pressable>
  );
}
