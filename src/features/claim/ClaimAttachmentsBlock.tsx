import React from 'react';
import { Form } from 'antd';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import type { RemoteClaimFile } from '@/shared/types/claimFile';
import { signedUrl } from '@/entities/claim';

/**
 * Блок загрузки и отображения файлов претензии.
 * Используется как в форме создания претензии, так и в просмотре.
 */
export interface ClaimAttachmentsBlockProps {
  /** Файлы, уже загруженные на сервер */
  remoteFiles?: RemoteClaimFile[];
  /** Новые файлы, выбранные пользователем */
  newFiles?: File[];
  /** Обработчик добавления новых файлов */
  onFiles?: (files: File[]) => void;
  /** Удалить файл с сервера */
  onRemoveRemote?: (id: string) => void;
  /** Удалить локально выбранный файл */
  onRemoveNew?: (index: number) => void;
  /** Показывать ли область загрузки */
  showUpload?: boolean;
}

export default function ClaimAttachmentsBlock({
  remoteFiles = [],
  newFiles = [],
  onFiles,
  onRemoveRemote,
  onRemoveNew,
  showUpload = true,
}: ClaimAttachmentsBlockProps) {
  return (
    <Form.Item label="Файлы">
      {showUpload && <FileDropZone onFiles={onFiles ?? (() => {})} />}
      <AttachmentEditorTable
        remoteFiles={remoteFiles.map((f) => ({
          id: String(f.id),
          name: f.original_name ?? f.name,
          path: f.path,
          mime: f.mime_type,
        }))}
        newFiles={newFiles.map((f) => ({ file: f, mime: f.type }))}
        onRemoveRemote={onRemoveRemote}
        onRemoveNew={onRemoveNew}
        getSignedUrl={(path, name) => signedUrl(path, name)}
        showMime={false}
      />
    </Form.Item>
  );
}
