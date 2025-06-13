import JSZip from 'jszip';
import { saveAs } from 'file-saver';

export interface ZipSource {
  /** Имя файла в архиве */
  name: string;
  /** Функция, возвращающая содержимое файла */
  getFile: () => Promise<Blob>;
}

/**
 * Сформировать zip-архив из набора файлов и скачать его.
 * @param files список файлов
 * @param zipName имя архива
 */
export async function downloadZip(files: ZipSource[], zipName: string) {
  const zip = new JSZip();
  for (const f of files) {
    const blob = await f.getFile();
    zip.file(f.name, blob);
  }
  const content = await zip.generateAsync({ type: 'blob' });
  saveAs(content, zipName);
}
