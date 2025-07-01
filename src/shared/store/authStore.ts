// -----------------------------------------------------------------------------
// Zustand-хранилище профиля + переключение проекта
// -----------------------------------------------------------------------------
import { create } from 'zustand';
import type { User } from '@/shared/types/user';
import {
  LS_ACTIVE_PROJECT,
  LS_STRUCTURE_PAGE_SELECTION,
} from '@/shared/constants/storageKeys';


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

/**
 * При изменении активного проекта также обновляем состояние
 * страницы структуры, если оно сохранено в `localStorage`.
 */
const syncStructureSelection = (projectId: number | null) => {
  try {
    const raw = localStorage.getItem(LS_STRUCTURE_PAGE_SELECTION);
    if (!raw) return;
    const data = JSON.parse(raw);
    localStorage.setItem(
      LS_STRUCTURE_PAGE_SELECTION,
      JSON.stringify({ ...data, projectId: projectId ?? '' }),
    );
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
      const saved = loadActiveProject();
      const id =
        saved && profile?.project_ids?.includes(saved)
          ? saved
          : profile?.project_ids?.[0] ?? null;
      saveActiveProject(id);
      syncStructureSelection(id);
      return { profile, projectId: id };
    }),
  clearProfile: () => {
    saveActiveProject(null);
    syncStructureSelection(null);
    set({ profile: null, projectId: null });
  },
  setProjectId: (project_id) => {
    saveActiveProject(project_id ?? null);
    syncStructureSelection(project_id ?? null);
    set({ projectId: project_id ?? null });
  },
  setProjectIds: (project_ids) =>
    set((s) => {
      const current =
        s.projectId && project_ids.includes(s.projectId)
          ? s.projectId
          : project_ids[0] ?? null;
      saveActiveProject(current);
      syncStructureSelection(current);
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
