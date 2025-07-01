// -----------------------------------------------------------------------------
// Zustand-хранилище профиля + переключение проекта
// -----------------------------------------------------------------------------
import { create } from 'zustand';
import type { User } from '@/shared/types/user';

/**
 * Ключ localStorage для сохранения выбранного проекта.
 * Требуется для восстановления выбора после перезагрузки страницы.
 */
const LS_PROJECT_ID = 'activeProjectId';

const readSavedProjectId = (): number | null => {
  if (typeof localStorage === 'undefined') return null;
  const val = localStorage.getItem(LS_PROJECT_ID);
  return val ? Number(val) : null;
};

const saveProjectId = (id: number | null) => {
  if (typeof localStorage === 'undefined') return;
  if (id == null) localStorage.removeItem(LS_PROJECT_ID);
  else localStorage.setItem(LS_PROJECT_ID, String(id));
};

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
  projectId: readSavedProjectId(),
  setProfile: (profile) =>
    set(() => {
      const saved = readSavedProjectId();
      const proj =
        saved && profile?.project_ids?.includes(saved)
          ? saved
          : profile?.project_ids?.[0] ?? null;
      saveProjectId(proj);
      return { profile, projectId: proj };
    }),
  clearProfile: () => {
    saveProjectId(null);
    set({ profile: null, projectId: null });
  },
  setProjectId: (project_id) => {
    saveProjectId(project_id);
    set({ projectId: project_id ?? null });
  },
  setProjectIds: (project_ids) =>
    set((s) => {
      const saved = readSavedProjectId();
      const proj =
        saved && project_ids.includes(saved)
          ? saved
          : s.projectId && project_ids.includes(s.projectId)
            ? s.projectId
            : project_ids[0] ?? null;
      saveProjectId(proj);
      return s.profile
        ? { profile: { ...s.profile, project_ids }, projectId: proj }
        : {};
    }),
}));

/** Селектор project_id (null, если пользователь гость либо проект не назначен) */
export const useProjectId = () => useAuthStore((s) => s.projectId);

/** Селектор project_ids */
export const useProjectIds = () => {
  const ids = useAuthStore((s) => s.profile?.project_ids);
  return ids ?? [];
};
