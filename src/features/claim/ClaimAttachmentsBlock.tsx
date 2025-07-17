import React from 'react';
import { Form } from 'antd';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import type { RemoteClaimFile, NewClaimFile } from '@/shared/types/claimFile';
import type { PreviewFile } from '@/shared/types/previewFile';

/**
 * Блок загрузки и отображения файлов претензии.
 * Используется как в форме создания претензии, так и в просмотре.
 */
export interface ClaimAttachmentsBlockProps {
  /** Файлы, уже загруженные на сервер */
  remoteFiles?: RemoteClaimFile[];
  /** Новые файлы, выбранные пользователем */
  newFiles?: NewClaimFile[];
  /** Обработчик добавления новых файлов */
  onFiles?: (files: File[]) => void;
  /** Удалить файл с сервера */
  onRemoveRemote?: (id: string) => void;
  /** Удалить локально выбранный файл */
  onRemoveNew?: (index: number) => void;
  /** Изменить описание локального файла */
  onDescNew?: (index: number, description: string) => void;
  /** Изменить описание загруженного файла */
  onDescRemote?: (id: string, description: string) => void;
  /** Показывать ли область загрузки */
  showUpload?: boolean;
  /** Получить подписанную ссылку */
  getSignedUrl?: (path: string, name: string) => Promise<string>;
  /** Получить подписанную ссылку для просмотра */
  getSignedUrlForPreview?: (path: string) => Promise<string>;
  /** Открыть предпросмотр */
  onPreview?: (file: PreviewFile) => void;
}

export default function ClaimAttachmentsBlock({
  remoteFiles = [],
  newFiles = [],
  onFiles,
  onRemoveRemote,
  onRemoveNew,
  onDescNew,
  onDescRemote,
  showUpload = true,
  getSignedUrl,
  getSignedUrlForPreview,
  onPreview,
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
          description: f.description ?? '',
          url: f.url,
        }))}
        newFiles={newFiles.map((f) => ({
          file: f.file,
          mime: f.file.type,
          description: f.description,
        }))}
        onRemoveRemote={onRemoveRemote}
        onRemoveNew={onRemoveNew}
        onDescRemote={onDescRemote}
        onDescNew={onDescNew}
        getSignedUrl={getSignedUrl}
        getSignedUrlForPreview={getSignedUrlForPreview}
        showDetails
        onPreview={onPreview}
      />
    </Form.Item>
  );
}
