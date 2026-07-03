import { useQuery } from '@tanstack/react-query';
import { publicApi } from '@/services/publicApi';

export type ModuleStatus = 'live' | 'coming_soon';

export function useModuleStatuses(): Record<string, ModuleStatus> {
  const { data } = useQuery({
    queryKey: ['public-settings'],
    queryFn: publicApi.getPublicSettings,
    staleTime: 5 * 60 * 1000,
  });
  return data?.modules ?? {};
}

export function useModuleStatus(key: string): ModuleStatus {
  const statuses = useModuleStatuses();
  return statuses[key] ?? 'live';
}
