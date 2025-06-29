import { useState } from 'react';

export interface LetterFile { file: File; description?: string }

/** Хук управления файлами письма */
export function useLetterFiles() {
  const [files, setFiles] = useState<LetterFile[]>([]);

  const addFiles = (fs: File[]) =>
    setFiles((p) => [...p, ...fs.map((f) => ({ file: f, description: '' }))]);
  const setType = (_idx: number, _val: number | null) => {};
  const setDescription = (idx: number, val: string) =>
    setFiles((p) => p.map((f, i) => (i === idx ? { ...f, description: val } : f)));
  const removeFile = (idx: number) =>
    setFiles((p) => p.filter((_, i) => i !== idx));
  const reset = () => setFiles([]);

  return { files, addFiles, setType, setDescription, removeFile, reset };
}
