/**
 * Представление файла в архиве объекта.
 */
export interface ArchiveFile {
  /** Идентификатор файла */
  id: string;
  /** Имя файла */
  name: string;
  /** Путь в хранилище */
  path: string;
  /** MIME-тип */
  mime: string;
  /** Идентификатор связанной сущности */
  entityId?: number;
}
