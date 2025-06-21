import { useState } from 'react';

export interface LetterFile { file: File; type_id: number | null; }

/** Хук управления файлами письма */
export function useLetterFiles() {
  const [files, setFiles] = useState<LetterFile[]>([]);

  const addFiles = (fs: File[]) =>
    setFiles((p) => [...p, ...fs.map((f) => ({ file: f, type_id: null }))]);
  const setType = (idx: number, val: number | null) =>
    setFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));
  const removeFile = (idx: number) =>
    setFiles((p) => p.filter((_, i) => i !== idx));
  const reset = () => setFiles([]);

  return { files, addFiles, setType, removeFile, reset };
}
