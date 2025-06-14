import { useState, useEffect, useCallback } from 'react';
import type { AttachmentType } from '@/shared/types/attachmentType';
import type { Ticket } from '@/shared/types/ticket';
import type { RemoteTicketFile, NewTicketFile } from '@/shared/types/ticketFile';

/**
 * Хук управления списком вложений замечания.
 */
export function useTicketAttachments(options: {
  ticket?: Ticket | null;
  attachmentTypes: AttachmentType[];
}) {
  const { ticket, attachmentTypes } = options;

  const [remoteFiles, setRemoteFiles] = useState<RemoteTicketFile[]>([]);
  const [changedTypes, setChangedTypes] = useState<Record<string, number | null>>({});
  const [initialTypes, setInitialTypes] = useState<Record<string, number | null>>({});
  const [newFiles, setNewFiles] = useState<NewTicketFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!ticket) return;
    const attachmentsWithType = (ticket.attachments || []).map((file) => {
      const typeObj = attachmentTypes.find((t) => t.id === file.attachment_type_id);
      const storagePath = 'storage_path' in file ? (file as any).storage_path : (file as any).path;
      const fileUrl = (file as any).file_url ?? (file as any).url ?? '';
      const fileType = (file as any).file_type ?? (file as any).type ?? '';
      const name =
        (file as any).original_name ||
        (storagePath ? storagePath.split('/').pop() : (file as any).name) ||
        'file';
      return {
        id: (file as any).id,
        name,
        path: storagePath ?? '',
        url: fileUrl,
        type: fileType,
        attachment_type_id: file.attachment_type_id ?? null,
        attachment_type_name: typeObj?.name || fileType || '—',
      } as RemoteTicketFile;
    });
    setRemoteFiles(attachmentsWithType);
    const map: Record<string, number | null> = {};
    attachmentsWithType.forEach((f) => {
      map[f.id] = f.attachment_type_id ?? null;
    });
    setChangedTypes(map);
    setInitialTypes(map);
  }, [ticket, attachmentTypes]);

  const addFiles = useCallback(
    (files: File[]) =>
      setNewFiles((p) => [...p, ...files.map((f) => ({ file: f, type_id: null }))]),
    [],
  );

  const removeNew = useCallback(
    (idx: number) => setNewFiles((p) => p.filter((_, i) => i !== idx)),
    [],
  );

  const removeRemote = useCallback((id: string) => {
    setRemoteFiles((p) => p.filter((f) => String(f.id) !== String(id)));
    setRemovedIds((p) => [...p, id]);
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

  const appendRemote = useCallback((files: RemoteTicketFile[]) => {
    setRemoteFiles((p) => [...p, ...files]);
    setChangedTypes((prev) => {
      const copy = { ...prev };
      files.forEach((f) => {
        copy[f.id] = f.attachment_type_id ?? null;
      });
      return copy;
    });
    setInitialTypes((prev) => {
      const copy = { ...prev };
      files.forEach((f) => {
        copy[f.id] = f.attachment_type_id ?? null;
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

