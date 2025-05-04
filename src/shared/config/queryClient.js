import { QueryClient } from '@tanstack/react-query';

/** Глобальный клиент React Query для кеширования и управления серверными данными */
export const queryClient = new QueryClient({
    // Можно задать настройки (retry, cache time и пр.) при необходимости
});
