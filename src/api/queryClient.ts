import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { QueryClient } from '@tanstack/react-query';

const WEEK = 1000 * 60 * 60 * 24 * 7;
export const CACHE_MAX_AGE = WEEK;

/** Shared so logging out or deleting an account can clear every cached screen. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: WEEK, // must outlast the saved copy, or restored data is thrown away
    },
  },
});

/** Keeps the last data on the phone, so screens open filled in instead of loading. */
export const queryPersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'frontstore_query_cache',
  throttleTime: 1000,
});

/** Forget this account's data on the phone. */
export async function clearQueryCache(): Promise<void> {
  queryClient.clear();
  await queryPersister.removeClient();
}
