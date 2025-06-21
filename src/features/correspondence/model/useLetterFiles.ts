import { useState } from 'react';

export interface LetterFile { file: File }

/** Хук управления файлами письма */
export function useLetterFiles() {
  const [files, setFiles] = useState<LetterFile[]>([]);

  const addFiles = (fs: File[]) =>
    setFiles((p) => [...p, ...fs.map((f) => ({ file: f }))]);
  const setType = (_idx: number, _val: number | null) => {};
  const removeFile = (idx: number) =>
    setFiles((p) => p.filter((_, i) => i !== idx));
  const reset = () => setFiles([]);

  return { files, addFiles, setType, removeFile, reset };
}
