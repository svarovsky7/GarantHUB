export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  /** Массив проектов, назначенных пользователю */
  project_ids: number[];
}
