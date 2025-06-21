import React from 'react';
import { Form, Row, Col } from 'antd';
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
      <Row gutter={16} align="top">
        {showUpload && (
          <Col flex="auto">
            <FileDropZone onFiles={onFiles ?? (() => {})} />
          </Col>
        )}
        <Col>
          <ClaimAttachmentsTable
            remoteFiles={remoteFiles}
            newFiles={newFiles}
            onRemoveRemote={onRemoveRemote}
            onRemoveNew={onRemoveNew}
          />
        </Col>
      </Row>
    </Form.Item>
  );
}
