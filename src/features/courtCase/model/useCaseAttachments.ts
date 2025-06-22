import { useState, useEffect, useCallback } from 'react';
import type { CourtCase } from '@/shared/types/courtCase';
import type { RemoteCaseFile, NewCaseFile } from '@/shared/types/caseFile';

/** Хук управления вложениями судебного дела. */
export function useCaseAttachments(options: {
  courtCase?: CourtCase | null;
}) {
  const { courtCase } = options;

  const [remoteFiles, setRemoteFiles] = useState<RemoteCaseFile[]>([]);
  const [newFiles, setNewFiles] = useState<NewCaseFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!courtCase) return;
    const attachmentsWithType = (courtCase.attachment_ids || []).map((id, idx) => {
      const file = (courtCase as any).attachments?.[idx];
      if (!file) return null;
      const storagePath = (file as any).storage_path ?? file.path;
      const fileUrl = (file as any).file_url ?? file.url ?? '';
      const fileType = (file as any).file_type ?? file.type ?? '';
      const originalName = (file as any).original_name ?? null;
      const name =
        originalName ||
        (storagePath ? storagePath.split('/').pop() : (file as any).name) ||
        'file';
      return {
        id: (file as any).id,
        name,
        original_name: originalName,
        path: storagePath ?? '',
        url: fileUrl,
        type: fileType,
      } as RemoteCaseFile;
    }).filter(Boolean) as RemoteCaseFile[];
    setRemoteFiles(attachmentsWithType);
  }, [courtCase]);

  const addFiles = useCallback(
    (files: File[]) => {
      setNewFiles((p) => [...p, ...files.map((f) => ({ file: f }))]);
    },
    [],
  );
  const removeNew = useCallback(
    (idx: number) => {
      setNewFiles((p) => p.filter((_, i) => i !== idx));
    },
    [],
  );
  const removeRemote = useCallback((id: string) => {
    setRemoteFiles((p) => p.filter((f) => String(f.id) !== String(id)));
    setRemovedIds((p) => [...p, id]);
  }, []);
  const changeRemoteType = (_id: string, _type: number | null) => {};
  const changeNewType = (_idx: number, _type: number | null) => {};
  const appendRemote = useCallback((files: RemoteCaseFile[]) => {
    setRemoteFiles((p) => [...p, ...files]);
  }, []);
  const markPersisted = useCallback(() => {
    setNewFiles([]);
    setRemovedIds([]);
  }, []);
  const attachmentsChanged = newFiles.length > 0 || removedIds.length > 0;
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
    changeRemoteType: (_id: string, _t: number | null) => {},
    changeNewType: (_idx: number, _t: number | null) => {},
    appendRemote,
    markPersisted,
    attachmentsChanged,
    reset: resetAll,
  };
}
