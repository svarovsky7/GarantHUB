// -----------------------------------------------------------------------------
// Zustand-хранилище профиля + переключение проекта
// -----------------------------------------------------------------------------
import { create } from 'zustand';
import type { User } from '@/shared/types/user';

interface AuthState {
  /** undefined → ещё грузится; null → гость; object → авторизован */
  profile: User | null | undefined;
  /** Сохраняем весь профиль, полученный с сервера */
  setProfile: (profile: User | null) => void;
  /** Очистка при выходе */
  clearProfile: () => void;
  /** Обновление project_id без перезагрузки профиля */
  setProjectId: (project_id: string | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: undefined,
  setProfile: (profile) => set({ profile }),
  clearProfile: () => set({ profile: null }),
  setProjectId: (project_id) =>
    set((s) => (s.profile ? { profile: { ...s.profile, project_id } } : {})),
}));

/** Селектор project_id (null, если пользователь гость либо проект не назначен) */
export const useProjectId = () =>
  useAuthStore((s) => s.profile?.project_id ?? null);
