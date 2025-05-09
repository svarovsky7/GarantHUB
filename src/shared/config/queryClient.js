// src/shared/config/queryClient.js
import { QueryClient } from '@tanstack/react-query';

/** Глобальный клиент React Query v5 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5_000
        }
    }
});
