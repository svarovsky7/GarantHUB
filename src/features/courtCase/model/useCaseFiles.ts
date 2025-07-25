import { useState } from 'react';

export interface CaseFile { file: File; type_id: number | null; description?: string; }

/** Хук для управления файлами судебного дела */
export function useCaseFiles() {
  const [caseFiles, setCaseFiles] = useState<CaseFile[]>([]);

  const addFiles = (files: File[]) =>
    setCaseFiles((p) => [...p, ...files.map((f) => ({ file: f, type_id: null, description: '' }))]);
  const setType = (idx: number, val: number | null) =>
    setCaseFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: val } : f)));
  const setDescription = (idx: number, val: string) =>
    setCaseFiles((p) => p.map((f, i) => (i === idx ? { ...f, description: val } : f)));
  const removeFile = (idx: number) =>
    setCaseFiles((p) => p.filter((_, i) => i !== idx));
  const reset = () => setCaseFiles([]);

  return { caseFiles, addFiles, setType, setDescription, removeFile, reset };
}
