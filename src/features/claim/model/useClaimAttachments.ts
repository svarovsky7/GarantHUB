import { useState, useEffect, useCallback, useRef } from 'react';
import type { Claim } from '@/shared/types/claim';
import type { RemoteClaimFile, NewClaimFile } from '@/shared/types/claimFile';

/**
 * Хук управления вложениями претензии.
 */
export function useClaimAttachments(options: { claim?: (Claim & { attachments?: any[] }) | null }) {
  const { claim } = options;

  const [remoteFiles, setRemoteFiles] = useState<RemoteClaimFile[]>([]);
  const [newFiles, setNewFiles] = useState<NewClaimFile[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);

  const lastIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (!claim) {
      setRemoteFiles([]);
      setNewFiles([]);
      setRemovedIds([]);
      lastIdRef.current = null;
      return;
    }
    if (lastIdRef.current === claim.id) return;
    lastIdRef.current = claim.id;

    const attachments = (claim.attachments || []).map((file: any) => {
      const storagePath = file.storage_path ?? file.path;
      const fileUrl = file.file_url ?? file.url ?? '';
      const fileType = file.file_type ?? file.mime_type ?? file.type ?? '';
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
        description: (file as any).description ?? null,
      } as RemoteClaimFile;
    });
    setRemoteFiles(attachments);
    setNewFiles([]);
    setRemovedIds([]);
  }, [claim]);

  const addFiles = useCallback((files: File[]) => {
    setNewFiles((p) => [...p, ...files.map((f) => ({ file: f, description: '' }))]);
  }, []);

  const removeNew = useCallback((idx: number) => {
    setNewFiles((p) => p.filter((_, i) => i !== idx));
  }, []);
  const setDescription = useCallback((idx: number, val: string) => {
    setNewFiles((p) => p.map((f, i) => (i === idx ? { ...f, description: val } : f)));
  }, []);

  const removeRemote = useCallback((id: string) => {
    setRemoteFiles((p) => p.filter((f) => String(f.id) !== String(id)));
    setRemovedIds((p) => [...p, id]);
  }, []);

  const appendRemote = useCallback((files: RemoteClaimFile[]) => {
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
    setDescription,
    appendRemote,
    markPersisted,
    attachmentsChanged,
    reset: resetAll,
  };
}
