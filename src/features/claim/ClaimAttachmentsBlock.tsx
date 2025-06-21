import React from "react";
import { Form, Row, Col, Upload, Skeleton, notification } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import ClaimAttachmentsTable from "./ClaimAttachmentsTable";
import type { RemoteClaimFile } from "@/shared/types/claimFile";

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
  /** Показывать скелетон во время загрузки */
  loading?: boolean;
}

export default function ClaimAttachmentsBlock({
  remoteFiles = [],
  newFiles = [],
  onFiles,
  onRemoveRemote,
  onRemoveNew,
  showUpload = true,
  getSignedUrl,
  loading,
}: ClaimAttachmentsBlockProps) {
  const handleChange = (info: any) => {
    const files = info.fileList
      .map((f: any) => f.originFileObj as File)
      .filter(Boolean);
    if (info.file.size > 50 * 1024 * 1024) {
      notification.error({ message: "Файл слишком большой" });
      return;
    }
    onFiles?.(files);
  };

  return (
    <Form.Item label="Файлы">
      <Row gutter={16} align="top">
        {showUpload && (
          <Col flex="auto">
            <Upload.Dragger
              multiple
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleChange}
              style={{ height: 120 }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">Перетащите файлы (до 50 MB)</p>
            </Upload.Dragger>
          </Col>
        )}
        <Col flex="auto">
          {loading ? (
            <Skeleton active paragraph={{ rows: 2 }} />
          ) : (
            <ClaimAttachmentsTable
              remoteFiles={remoteFiles}
              newFiles={newFiles}
              onRemoveRemote={onRemoveRemote}
              onRemoveNew={onRemoveNew}
              getSignedUrl={getSignedUrl}
            />
          )}
        </Col>
      </Row>
    </Form.Item>
  );
}
