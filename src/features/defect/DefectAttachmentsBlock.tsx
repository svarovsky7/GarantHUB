import React from 'react';
import { Form } from 'antd';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import type { RemoteDefectFile } from '@/shared/types/defectFile';
import type { PreviewFile } from '@/shared/types/previewFile';

export interface DefectAttachmentsBlockProps {
  /** Загруженные файлы */
  remoteFiles: RemoteDefectFile[];
  /** Добавить файлы */
  onFiles: (files: File[]) => void;
  /** Удалить файл */
  onRemove: (id: string) => void;
  /** Получить подписанную ссылку */
  getSignedUrl: (path: string, name: string) => Promise<string>;
  /** Открыть предпросмотр */
  onPreview?: (file: PreviewFile) => void;
}

/** Блок отображения и загрузки файлов дефекта */
export default function DefectAttachmentsBlock({
  remoteFiles,
  onFiles,
  onRemove,
  getSignedUrl,
  onPreview,
}: DefectAttachmentsBlockProps) {
  return (
    <Form.Item label="Файлы">
      <FileDropZone onFiles={onFiles} />
      <AttachmentEditorTable
        remoteFiles={remoteFiles.map((f) => ({
          id: String(f.id),
          name: f.original_name ?? f.name,
          path: f.path,
          mime: f.mime_type,
          url: f.url,
        }))}
        onRemoveRemote={onRemove}
        getSignedUrl={getSignedUrl}
        onPreview={onPreview}
      />
    </Form.Item>
  );
}
