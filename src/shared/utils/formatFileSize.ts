export function formatFileSize(bytes: number | null | undefined): string {
  if (bytes === null || bytes === undefined) return '';
  const units = ['Б', 'КБ', 'МБ', 'ГБ'];
  let size = bytes;
  let i = 0;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}
