import { QueryClient } from '@tanstack/react-query';

/** One cache for the app; cleared whenever the signed-in account changes. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});
