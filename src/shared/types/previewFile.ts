/** Данные файла, который можно предварительно просмотреть */
export interface PreviewFile {
  /** Подписанный или локальный URL файла */
  url: string;
  /** Название файла */
  name: string;
  /** MIME-тип файла */
  mime?: string;
}

