// src/shared/config/queryClient.js
import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-persist-client-core';

/**
 * Клиент для работы с React Query.
 * Настроен на краткое кэширование и
 * сохранение данных в localStorage.
 */
export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 5_000,
        },
    },
});

// --- Query cache persistence in localStorage ---
if (typeof window !== 'undefined') {
    /**
     * Сохраняем кэш запросов в localStorage
     * на сутки для ускорения повторных обращений.
     */
    const persister = createSyncStoragePersister({ storage: window.localStorage });
    persistQueryClient({
        queryClient,
        persister,
        maxAge: 24 * 60 * 60 * 1000, // 24 часа
    });
}

