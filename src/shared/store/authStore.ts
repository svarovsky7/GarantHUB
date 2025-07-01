// -----------------------------------------------------------------------------
// Zustand-хранилище профиля + переключение проекта
// -----------------------------------------------------------------------------
import { create } from 'zustand';
import type { User } from '@/shared/types/user';

/**
 * Ключ для хранения активного проекта в `localStorage`.
 */
const LS_ACTIVE_PROJECT = 'activeProjectId';

/** Возвращает ID активного проекта из `localStorage`. */
const loadActiveProject = (): number | null => {
  try {
    const v = localStorage.getItem(LS_ACTIVE_PROJECT);
    return v ? Number(v) : null;
  } catch {
    return null;
  }
};

/** Сохраняет ID активного проекта в `localStorage`. */
const saveActiveProject = (id: number | null) => {
  try {
    if (id) localStorage.setItem(LS_ACTIVE_PROJECT, String(id));
    else localStorage.removeItem(LS_ACTIVE_PROJECT);
  } catch {
    /* ignore */
  }
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
  projectId: loadActiveProject(),
  setProfile: (profile) =>
    set(() => {
      // Сохраняем ранее выбранный проект без ограничений по списку profile.project_ids.
      // Это позволяет администратору выбрать любой доступный проект и сохранить
      // его между сессиями.
      const saved = loadActiveProject();
      const id = saved ?? profile?.project_ids?.[0] ?? null;
      saveActiveProject(id);
      return { profile, projectId: id };
    }),
  clearProfile: () => {
    saveActiveProject(null);
    set({ profile: null, projectId: null });
  },
  setProjectId: (project_id) => {
    saveActiveProject(project_id ?? null);
    set({ projectId: project_id ?? null });
  },
  setProjectIds: (project_ids) =>
    set((s) => {
      // Не сбрасываем выбранный проект, даже если он отсутствует в новом списке
      // назначенных. Это полезно, если администратор работает с чужим проектом.
      const current = s.projectId ?? project_ids[0] ?? null;
      saveActiveProject(current);
      return s.profile
        ? { profile: { ...s.profile, project_ids }, projectId: current }
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
