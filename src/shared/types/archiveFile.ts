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
  /** Описание файла */
  description?: string | null;
  /** Идентификатор связанной сущности */
  entityId?: number;
  /** Размер файла в байтах */
  size?: number | null;
  /** Дата создания файла */
  createdAt?: string | null;
  /** Автор создания (id профиля) */
  createdBy?: string | null;
}
