import type { RoleName } from './rolePermission';

/**
 * Запись из справочника `roles`.
 */
export interface Role {
  /** Уникальный идентификатор роли. */
  id: number;
  /** Системное имя роли. */
  name: RoleName;
}
