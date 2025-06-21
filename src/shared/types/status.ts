/**
 * Универсальный тип статуса для различных сущностей.
 */
export interface Status {
  /** Уникальный идентификатор */
  id: number;
  /** Тип сущности, которой принадлежит статус */
  entity: string;
  /** Название статуса */
  name: string;
  /** HEX цвет метки или null */
  color: string | null;
}
