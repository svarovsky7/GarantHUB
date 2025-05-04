import { create } from 'zustand';

/** Zustand-хранилище для информации о текущем пользователе (профиле) */
export const useAuthStore = create((set) => ({
    // Профиль пользователя: undefined до загрузки, null если не авторизован, объект если вошел
    profile: undefined,
    // Установить профиль (объект или null)
    setProfile: (profile) => set({ profile }),
    // Очистить профиль (выход из системы)
    clearProfile: () => set({ profile: null })
}));
