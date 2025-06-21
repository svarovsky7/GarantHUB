import React from 'react';
import { Form } from 'antd';
import FileDropZone from '@/shared/ui/FileDropZone';
import ClaimAttachmentsTable from './ClaimAttachmentsTable';
import type { RemoteClaimFile } from '@/shared/types/claimFile';

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
  /** Получить подписанную ссылку */
  getSignedUrl?: (path: string, name: string) => Promise<string>;
}

export default function ClaimAttachmentsBlock({
  remoteFiles = [],
  newFiles = [],
  onFiles,
  onRemoveRemote,
  onRemoveNew,
  showUpload = true,
  getSignedUrl,
}: ClaimAttachmentsBlockProps) {
  return (
    <Form.Item label="Файлы">
      {showUpload && <FileDropZone onFiles={onFiles ?? (() => {})} />}
      <ClaimAttachmentsTable
        remoteFiles={remoteFiles}
        newFiles={newFiles}
        onRemoveRemote={onRemoveRemote}
        onRemoveNew={onRemoveNew}
        getSignedUrl={getSignedUrl}
      />
    </Form.Item>
  );
}
