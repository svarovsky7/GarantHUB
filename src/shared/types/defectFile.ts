/** Вложение дефекта, загруженное на сервер */
export interface RemoteDefectFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  url: string;
  mime_type: string;
  /** Описание файла */
  description?: string | null;
}

/** Новый файл для вложения дефекта */
export interface NewDefectFile {
  file: File;
  description?: string;
}
