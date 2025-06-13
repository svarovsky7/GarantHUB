import { useState, useEffect } from 'react';
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
      return {
        id: file.id,
        name: file.original_name || file.storage_path.split('/').pop() || 'file',
        path: file.storage_path,
        url: file.file_url,
        type: file.file_type,
        attachment_type_id: file.attachment_type_id ?? null,
        attachment_type_name: typeObj?.name || file.file_type || '—',
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

  const addFiles = (files: File[]) =>
    setNewFiles((p) => [...p, ...files.map((f) => ({ file: f, type_id: null }))]);
  const removeNew = (idx: number) => setNewFiles((p) => p.filter((_, i) => i !== idx));
  const removeRemote = (id: string) => {
    setRemoteFiles((p) => p.filter((f) => String(f.id) !== String(id)));
    setRemovedIds((p) => [...p, id]);
  };
  const changeRemoteType = (id: string, type: number | null) =>
    setChangedTypes((p) => ({ ...p, [id]: type }));
  const changeNewType = (idx: number, type: number | null) =>
    setNewFiles((p) => p.map((f, i) => (i === idx ? { ...f, type_id: type } : f)));

  const appendRemote = (files: RemoteTicketFile[]) => {
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
  };

  const markPersisted = () => {
    setNewFiles([]);
    setRemovedIds([]);
    setInitialTypes((prev) => ({ ...prev, ...changedTypes }));
  };

  const attachmentsChanged =
    newFiles.length > 0 ||
    removedIds.length > 0 ||
    Object.keys(changedTypes).some((id) => changedTypes[id] !== initialTypes[id]);

  const resetAll = () => {
    setNewFiles([]);
    setRemoteFiles([]);
    setChangedTypes({});
    setInitialTypes({});
    setRemovedIds([]);
  };

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

