export interface User {
  id: string;
  name: string | null;
  email: string | null;
  role: string | null;
  /** Дата регистрации пользователя */
  created_at?: string | null;
  /** Массив проектов, назначенных пользователю */
  project_ids: number[];
}
