import { useState, useEffect, useCallback } from 'react';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import type { RemoteLetterFile, NewLetterFile } from '@/shared/types/letterFile';

/** Хук управления вложениями письма */
export function useLetterAttachments(options: {
  letter?: CorrespondenceLetter | null;
}) {
  const { letter } = options;

  const [remoteFiles, setRemoteFiles] = useState<RemoteLetterFile[]>([]);
  const [newFiles, setNewFiles] = useState<NewLetterFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!letter) return;
    const attachments = (letter.attachments || []).map((file: any) => {
      const storagePath = file.storage_path ?? file.path;
      const fileUrl = file.path ?? file.url ?? '';
      const fileType = file.mime_type ?? file.type ?? '';
      const originalName = file.original_name ?? null;
      const name =
        originalName ||
        (storagePath ? storagePath.split('/').pop() : file.name) ||
        'file';
      return {
        id: file.id,
        name,
        original_name: originalName,
        path: storagePath ?? '',
        url: fileUrl,
        mime_type: fileType,
      } as RemoteLetterFile;
    });
    setRemoteFiles(attachments);
  }, [letter]);

  const addFiles = useCallback((files: File[]) => {
    setNewFiles((p) => [...p, ...files.map((f) => ({ file: f, type_id: null }))]);
  }, []);
  const removeNew = useCallback((idx: number) => {
    setNewFiles((p) => p.filter((_, i) => i !== idx));
  }, []);
  const removeRemote = useCallback((id: string) => {
    setRemoteFiles((p) => p.filter((f) => String(f.id) !== String(id)));
    setRemovedIds((p) => [...p, id]);
  }, []);
  const changeRemoteType = useCallback((_id: string, _type: number | null) => {}, []);
  const changeNewType = useCallback((_idx: number, _type: number | null) => {}, []);
  const appendRemote = useCallback((files: RemoteLetterFile[]) => {
    setRemoteFiles((p) => [...p, ...files]);
  }, []);
  const markPersisted = useCallback(() => {
    setNewFiles([]);
    setRemovedIds([]);
  }, []);
  const attachmentsChanged =
    newFiles.length > 0 ||
    removedIds.length > 0;
  const resetAll = useCallback(() => {
    setNewFiles([]);
    setRemoteFiles([]);
    setRemovedIds([]);
  }, []);

  return {
    remoteFiles,
    newFiles,
    removedIds,
    addFiles,
    removeNew,
    removeRemote,
    changeRemoteType,
    changeNewType,
    appendRemote,
    markPersisted,
    attachmentsChanged,
    reset: resetAll,
  };
}
