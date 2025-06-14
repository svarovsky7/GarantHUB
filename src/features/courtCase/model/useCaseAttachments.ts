import { useState, useEffect, useCallback } from 'react';
import type { AttachmentType } from '@/shared/types/attachmentType';
import type { CourtCase } from '@/shared/types/courtCase';
import type { RemoteCaseFile, NewCaseFile } from '@/shared/types/caseFile';

/** Хук управления вложениями судебного дела. */
export function useCaseAttachments(options: {
  courtCase?: CourtCase | null;
  attachmentTypes: AttachmentType[];
}) {
  const { courtCase, attachmentTypes } = options;

  const [remoteFiles, setRemoteFiles] = useState<RemoteCaseFile[]>([]);
  const [changedTypes, setChangedTypes] = useState<Record<string, number | null>>({});
  const [initialTypes, setInitialTypes] = useState<Record<string, number | null>>({});
  const [newFiles, setNewFiles] = useState<NewCaseFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!courtCase) return;
    const attachmentsWithType = (courtCase.attachment_ids || []).map((id, idx) => {
      const file = (courtCase as any).attachments?.[idx];
      if (!file) return null;
      const typeObj = attachmentTypes.find((t) => t.id === file.attachment_type_id);
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
        attachment_type_id: file.attachment_type_id ?? null,
        attachment_type_name: typeObj?.name || fileType || '',
      } as RemoteCaseFile;
    }).filter(Boolean) as RemoteCaseFile[];
    console.log('[useCaseAttachments] parsed attachments', attachmentsWithType);
    setRemoteFiles(attachmentsWithType);
    console.log('[useCaseAttachments] setRemoteFiles', attachmentsWithType);
    console.log('[useCaseAttachments] remoteFiles state', attachmentsWithType);
    const map: Record<string, number | null> = {};
    attachmentsWithType.forEach((f) => {
      map[String(f.id)] = f.attachment_type_id ?? null;
    });
    setChangedTypes(map);
    setInitialTypes(map);
  }, [courtCase, attachmentTypes]);

  const addFiles = useCallback(
    (files: File[]) => {
      console.log('[useCaseAttachments] addFiles', files);
      setNewFiles((p) => [...p, ...files.map((f) => ({ file: f, type_id: null }))]);
    },
    [],
  );
  const removeNew = useCallback(
    (idx: number) => {
      setNewFiles((p) => p.filter((_, i) => i !== idx));
      console.log('[useCaseAttachments] removeNew', idx);
    },
    [],
  );
  const removeRemote = useCallback((id: string) => {
    setRemoteFiles((p) => p.filter((f) => String(f.id) !== String(id)));
    setRemovedIds((p) => [...p, id]);
    console.log('[useCaseAttachments] removeRemote', id);
  }, []);
  const changeRemoteType = useCallback(
    (id: string, type: number | null) =>
      setChangedTypes((p) => ({ ...p, [id]: type })),
    [],
  );
  const changeNewType = useCallback(
    (idx: number, type: number | null) =>
      setNewFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: type } : f))),
    [],
  );
  const appendRemote = useCallback((files: RemoteCaseFile[]) => {
    console.log('[useCaseAttachments] appendRemote', files);
    setRemoteFiles((p) => [...p, ...files]);
    setChangedTypes((prev) => {
      const copy = { ...prev };
      files.forEach((f) => {
        copy[String(f.id)] = f.attachment_type_id ?? null;
      });
      return copy;
    });
    setInitialTypes((prev) => {
      const copy = { ...prev };
      files.forEach((f) => {
        copy[String(f.id)] = f.attachment_type_id ?? null;
      });
      return copy;
    });
  }, []);
  const markPersisted = useCallback(() => {
    console.log('[useCaseAttachments] markPersisted');
    setNewFiles([]);
    setRemovedIds([]);
    setInitialTypes((prev) => ({ ...prev, ...changedTypes }));
  }, [changedTypes]);
  const attachmentsChanged =
    newFiles.length > 0 ||
    removedIds.length > 0 ||
    Object.keys(changedTypes).some((id) => changedTypes[id] !== initialTypes[id]);
  const resetAll = useCallback(() => {
    console.log('[useCaseAttachments] resetAll');
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
