import React, { useState } from "react";
import {
  Table,
  Button,
  Space,
  Typography,
  Tooltip,
  Popconfirm,
  message,
  Tag,
} from "antd";
import {
  DownloadOutlined,
  DeleteOutlined,
  FileOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import { useDeleteDocument, useDownloadDocument } from "@/entities/document";
import type { DocumentWithAuthor } from "@/shared/types/document";
import { formatFileSize } from "@/shared/utils/formatFileSize";
import DocumentPreviewModal from "./DocumentPreviewModal";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  documents: DocumentWithAuthor[];
  loading?: boolean;
  canDelete?: boolean;
}

export default function DocumentsTable({ documents, loading, canDelete = false }: Props) {
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();
  const [previewDocument, setPreviewDocument] = useState<DocumentWithAuthor | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const handleDownload = async (storagePath: string, fileName: string) => {
    try {
      const url = await downloadDocument.mutateAsync(storagePath);
      
      // Используем fetch + blob для принудительного скачивания
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName || "document";
      link.style.display = "none";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Освобождаем память
      URL.revokeObjectURL(objectUrl);
      
    } catch (error) {
      message.error("Ошибка при скачивании файла");
      console.error(error);
    }
  };

  const handlePreview = (document: DocumentWithAuthor) => {
    setPreviewDocument(document);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewDocument(null);
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteDocument.mutateAsync(id);
      message.success("Документ удален");
    } catch (error) {
      message.error("Ошибка при удалении документа");
      console.error(error);
    }
  };

  const getFileIcon = (mimeType: string | null | undefined) => {
    if (!mimeType) return "📎";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("image")) return "🖼️";
    return "📎";
  };

  const columns = [
    {
      title: "Файл",
      dataIndex: "file_name",
      key: "file_name",
      width: 300,
      render: (fileName: string, record: DocumentWithAuthor) => (
        <Space>
          <span style={{ fontSize: 16 }}>
            {getFileIcon(record.mime_type || record.file_type)}
          </span>
          <div>
            <Text strong>{record.title}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {fileName || record.original_name || "Без имени"}
            </Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Описание",
      dataIndex: "description",
      key: "description",
      render: (description: string) => (
        description ? (
          <Text style={{ maxWidth: 300, display: "block" }}>
            {description}
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        )
      ),
    },
    {
      title: "Размер",
      dataIndex: "file_size",
      key: "file_size",
      width: 100,
      render: (size: number | null, record: DocumentWithAuthor) => {
        if (record.file_size) {
          return (
            <Text type="secondary">
              {formatFileSize(record.file_size)}
            </Text>
          );
        }
        return (
          <Text type="secondary">
            —
          </Text>
        );
      },
    },
    {
      title: "Автор",
      dataIndex: "authorName",
      key: "authorName",
      width: 150,
      render: (authorName: string) => (
        <Text>{authorName || "—"}</Text>
      ),
    },
    {
      title: "Дата загрузки",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      render: (createdAt: string) => (
        <Text type="secondary">
          {dayjs(createdAt).format("DD.MM.YYYY HH:mm")}
        </Text>
      ),
    },
    {
      title: "Действия",
      key: "actions",
      width: 160,
      render: (_: unknown, record: DocumentWithAuthor) => (
        <Space size="small">
          <Tooltip title="Просмотр">
            <Button
              size="small"
              type="text"
              icon={<EyeOutlined />}
              onClick={() => handlePreview(record)}
            />
          </Tooltip>
          
          <Tooltip title="Скачать">
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => handleDownload(record.storage_path, record.original_name || record.title)}
              loading={downloadDocument.isPending}
            />
          </Tooltip>
          
          {canDelete && (
            <Popconfirm
              title="Удалить документ?"
              description="Это действие нельзя отменить"
              okText="Да"
              cancelText="Нет"
              onConfirm={() => handleDelete(record.id)}
            >
              <Tooltip title="Удалить">
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={deleteDocument.isPending}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <Table
        columns={columns}
        dataSource={documents}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => 
            `${range[0]}-${range[1]} из ${total} документов`,
        }}
        locale={{
          emptyText: "Нет документов",
        }}
      />
      
      <DocumentPreviewModal
        open={showPreview}
        document={previewDocument}
        onClose={handleClosePreview}
      />
    </>
  );
}