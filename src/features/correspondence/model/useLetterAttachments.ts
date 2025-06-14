import { useState, useEffect, useCallback } from 'react';
import type { AttachmentType } from '@/shared/types/attachmentType';
import type { CorrespondenceLetter } from '@/shared/types/correspondence';
import type { RemoteLetterFile, NewLetterFile } from '@/shared/types/letterFile';

/** Хук управления вложениями письма. */
export function useLetterAttachments(options: {
  letter?: CorrespondenceLetter | null;
  attachmentTypes: AttachmentType[];
}) {
  const { letter, attachmentTypes } = options;

  const [remoteFiles, setRemoteFiles] = useState<RemoteLetterFile[]>([]);
  const [changedTypes, setChangedTypes] = useState<Record<string, number | null>>({});
  const [initialTypes, setInitialTypes] = useState<Record<string, number | null>>({});
  const [newFiles, setNewFiles] = useState<NewLetterFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!letter) return;
    const attachments = (letter.attachments || []).map((file) => {
      const typeObj = attachmentTypes.find((t) => t.id === file.attachment_type_id);
      return {
        id: file.id,
        name: file.name,
        original_name: (file as any).original_name ?? null,
        path: file.storage_path,
        url: file.file_url,
        type: file.file_type,
        attachment_type_id: file.attachment_type_id ?? null,
        attachment_type_name: typeObj?.name || file.file_type || '',
      } as RemoteLetterFile;
    });
    setRemoteFiles(attachments);
    const map: Record<string, number | null> = {};
    attachments.forEach((f) => {
      map[f.id as string] = f.attachment_type_id ?? null;
    });
    setChangedTypes(map);
    setInitialTypes(map);
  }, [letter, attachmentTypes]);

  const addFiles = useCallback(
    (files: File[]) =>
      setNewFiles((p) => [...p, ...files.map((f) => ({ file: f, type_id: null }))]),
    [],
  );
  const removeNew = useCallback((idx: number) => setNewFiles((p) => p.filter((_, i) => i !== idx)), []);
  const removeRemote = useCallback((id: string) => {
    setRemoteFiles((p) => p.filter((f) => String(f.id) !== String(id)));
    setRemovedIds((p) => [...p, id]);
  }, []);
  const changeRemoteType = useCallback(
    (id: string, type: number | null) => setChangedTypes((p) => ({ ...p, [id]: type })),
    [],
  );
  const changeNewType = useCallback(
    (idx: number, type: number | null) =>
      setNewFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: type } : f))),
    [],
  );
  const appendRemote = useCallback((files: RemoteLetterFile[]) => {
    setRemoteFiles((p) => [...p, ...files]);
    setChangedTypes((prev) => {
      const copy = { ...prev };
      files.forEach((f) => {
        copy[f.id as string] = f.attachment_type_id ?? null;
      });
      return copy;
    });
    setInitialTypes((prev) => {
      const copy = { ...prev };
      files.forEach((f) => {
        copy[f.id as string] = f.attachment_type_id ?? null;
      });
      return copy;
    });
  }, []);
  const markPersisted = useCallback(() => {
    setNewFiles([]);
    setRemovedIds([]);
    setInitialTypes((prev) => ({ ...prev, ...changedTypes }));
  }, [changedTypes]);

  const attachmentsChanged =
    newFiles.length > 0 ||
    removedIds.length > 0 ||
    Object.keys(changedTypes).some((id) => changedTypes[id] !== initialTypes[id]);

  const resetAll = useCallback(() => {
    setNewFiles([]);
    setRemoteFiles([]);
    setChangedTypes({});
    setInitialTypes({});
    setRemovedIds([]);
  }, []);

  return {
    remoteFiles,
    newFiles,
    changedTypes,
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
