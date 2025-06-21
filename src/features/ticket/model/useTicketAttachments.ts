import { useState, useEffect, useCallback } from 'react';
import type { Ticket } from '@/entities/ticket';
import type { RemoteTicketFile, NewTicketFile } from '@/shared/types/ticketFile';

/**
 * Хук управления списком вложений замечания.
 */
export function useTicketAttachments(options: {
  ticket?: Ticket | null;
}) {
  const { ticket } = options;

  const [remoteFiles, setRemoteFiles] = useState<RemoteTicketFile[]>([]);
  const [newFiles, setNewFiles] = useState<NewTicketFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!ticket) return;
    const attachmentsWithType = (ticket.attachments || []).map((file) => {
      const storagePath = 'storage_path' in file ? (file as any).storage_path : (file as any).path;
      const fileUrl = (file as any).file_url ?? (file as any).url ?? '';
      const fileType = (file as any).file_type ?? (file as any).type ?? '';
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
      } as RemoteTicketFile;
    });
    setRemoteFiles(attachmentsWithType);
  }, [ticket]);

  const addFiles = useCallback(
    (files: File[]) =>
      setNewFiles((p) => [...p, ...files.map((f) => ({ file: f }))]),
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

  const changeRemoteType = (_id: string, _type: number | null) => {};
  const changeNewType = (_idx: number, _type: number | null) => {};

  const appendRemote = useCallback((files: RemoteTicketFile[]) => {
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
    changeRemoteType,
    changeNewType,
    appendRemote,
    markPersisted,
    attachmentsChanged,
    reset: resetAll,
  };
}

