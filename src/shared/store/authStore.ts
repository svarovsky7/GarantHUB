// -----------------------------------------------------------------------------
// Zustand-хранилище профиля + переключение проекта
// -----------------------------------------------------------------------------
import { create } from 'zustand';
import type { User } from '@/shared/types/user';

interface AuthState {
  /** undefined → ещё грузится; null → гость; object → авторизован */
  profile: User | null | undefined;
  /** Текущий выбранный проект */
  projectId: number | null;
  /** Сохраняем весь профиль, полученный с сервера */
  setProfile: (profile: User | null) => void;
  /** Очистка при выходе */
  clearProfile: () => void;
  /** Изменение выбранного проекта */
  setProjectId: (project_id: number | null) => void;
  /** Обновление списка проектов пользователя */
  setProjectIds: (project_ids: number[]) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  profile: undefined,
  projectId: null,
  setProfile: (profile) =>
    set({
      profile,
      projectId: profile?.project_ids?.[0] ?? null,
    }),
  clearProfile: () => set({ profile: null, projectId: null }),
  setProjectId: (project_id) => set({ projectId: project_id ?? null }),
  setProjectIds: (project_ids) =>
    set((s) =>
      s.profile
        ? {
            profile: { ...s.profile, project_ids },
            projectId: s.projectId ?? project_ids[0] ?? null,
          }
        : {},
    ),
}));

/** Селектор project_id (null, если пользователь гость либо проект не назначен) */
export const useProjectId = () => useAuthStore((s) => s.projectId);

/** Селектор project_ids */
export const useProjectIds = () => {
  const ids = useAuthStore((s) => s.profile?.project_ids);
  return ids ?? [];
};
