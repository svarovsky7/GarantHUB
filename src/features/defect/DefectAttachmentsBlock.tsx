import React from 'react';
import { Form, Card, Typography, Empty, Space } from 'antd';
import FileDropZone from '@/shared/ui/FileDropZone';
import AttachmentEditorTable from '@/shared/ui/AttachmentEditorTable';
import type { RemoteDefectFile, NewDefectFile } from '@/shared/types/defectFile';
import type { PreviewFile } from '@/shared/types/previewFile';

export interface DefectAttachmentsBlockProps {
  /** Загруженные файлы */
  remoteFiles: RemoteDefectFile[];
  /** Новые файлы */
  newFiles?: NewDefectFile[];
  /** Добавить файлы */
  onFiles?: (files: File[]) => void;
  /** Удалить удаленный файл */
  onRemove?: (id: string) => void;
  /** Удалить новый файл */
  onRemoveNew?: (index: number) => void;
  /** Изменить описание удаленного файла */
  onDescRemote?: (id: string, desc: string) => void;
  /** Изменить описание нового файла */
  onDescNew?: (index: number, desc: string) => void;
  /** Получить подписанную ссылку */
  getSignedUrl: (path: string, name: string) => Promise<string>;
  /** Предпросмотр файла */
  onPreview?: (file: PreviewFile) => void;
  /** Только для чтения */
  readOnly?: boolean;
}

/** Блок отображения и загрузки файлов дефекта */
export default function DefectAttachmentsBlock({
  remoteFiles,
  newFiles = [],
  onFiles,
  onRemove,
  onRemoveNew,
  onDescRemote,
  onDescNew,
  getSignedUrl,
  onPreview,
  readOnly = false,
}: DefectAttachmentsBlockProps) {
  const hasFiles = remoteFiles.length > 0 || newFiles.length > 0;

  const handlePreview = async (file: any) => {
    if (!onPreview) return;
    
    if (file.isNew) {
      // Новый файл
      const reader = new FileReader();
      reader.onload = (e) => {
        onPreview({
          name: file.name,
          url: e.target?.result as string,
          type: file.mime || file.file?.type || 'application/octet-stream',
        });
      };
      reader.readAsDataURL(file.file);
    } else {
      // Удаленный файл
      const url = await getSignedUrl(file.path, file.name);
      onPreview({
        name: file.name,
        url,
        type: file.mime || 'application/octet-stream',
      });
    }
  };

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      {!readOnly && onFiles && (
        <FileDropZone onFiles={onFiles} />
      )}
      
      {hasFiles ? (
        <AttachmentEditorTable
          remoteFiles={remoteFiles.map((f) => ({
            id: String(f.id),
            name: f.original_name ?? f.name,
            path: f.path,
            mime: f.mime_type,
            description: f.description,
          }))}
          newFiles={newFiles.map((f, index) => ({
            index,
            name: f.file.name,
            file: f.file,
            mime: f.file.type,
            description: f.description,
            isNew: true,
          }))}
          onRemoveRemote={readOnly ? undefined : onRemove}
          onRemoveNew={readOnly ? undefined : onRemoveNew}
          onDescRemote={readOnly ? undefined : onDescRemote}
          onDescNew={readOnly ? undefined : onDescNew}
          getSignedUrl={getSignedUrl}
          onPreview={handlePreview}
          readOnly={readOnly}
        />
      ) : (
        <Card>
          <Empty description="Файлы не загружены" />
        </Card>
      )}
    </Space>
  );
}
