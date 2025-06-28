/**
 * Значения формы личного кабинета пользователя.
 */
export interface ProfileFormValues {
  /** Полное имя пользователя */
  name: string | null;
  /** Новый пароль (необязательно) */
  password?: string;
  /** Проекты пользователя */
  project_ids: number[];
}

