export interface RegisterFormValues {
  /** Полное имя пользователя */
  name: string;
  /** Адрес электронной почты */
  email: string;
  /** Пароль нового аккаунта */
  password: string;
  /** Выбранная роль */
  role: import('./rolePermission').RoleName;
  /** Проекты, назначенные пользователю */
  project_ids: number[];
}
