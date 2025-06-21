/** Вложение дефекта, загруженное на сервер */
export interface RemoteDefectFile {
  id: string | number;
  name: string;
  original_name?: string | null;
  path: string;
  mime_type: string;
}

/** Новый файл для вложения дефекта */
export interface NewDefectFile {
  file: File;
}
