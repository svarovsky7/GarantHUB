import React, { useState, useMemo, useCallback } from "react";
import {
  Card,
  Collapse,
  Table,
  Space,
  Typography,
  Tag,
  Button,
  Tooltip,
  Popconfirm,
  message,
  Empty,
  Input,
} from "antd";
import {
  FolderOutlined,
  GlobalOutlined,
  FileOutlined,
  DownloadOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
} from "@ant-design/icons";
import { useDocumentFolders } from "@/entities/documentFolder";
import { useDocumentsByFolder, useDeleteDocument, useDownloadDocument, useUpdateDocument } from "@/entities/document";
import { useProjects } from "@/entities/project";
import type { DocumentWithAuthor } from "@/shared/types/document";
import type { DocumentFolderWithAuthor } from "@/shared/types/documentFolder";
import { formatFileSize } from "@/shared/utils/formatFileSize";
import DocumentPreviewModal from "@/widgets/DocumentPreviewModal";
import dayjs from "dayjs";

const { Text } = Typography;

interface Props {
  canDelete?: boolean;
  canEditDescription?: boolean;
  projectId?: number | null;
}

interface FolderContentProps {
  folder: DocumentFolderWithAuthor;
  canDelete: boolean;
  canEditDescription: boolean;
  editingId: number | null;
  editingDescription: string;
  onEditDescription: (document: DocumentWithAuthor) => void;
  onSaveDescription: (id: number, description: string) => void;
  onCancelEdit: () => void;
  onPreview: (document: DocumentWithAuthor) => void;
  onDownload: (storagePath: string, fileName: string) => void;
  onDelete: (id: number) => void;
  onDescriptionChange: (value: string) => void;
  isUpdating: boolean;
  isDownloading: boolean;
  isDeleting: boolean;
}

const getFileIcon = (mimeType: string | null | undefined) => {
  if (!mimeType) return "📎";
  if (mimeType.includes("pdf")) return "📄";
  if (mimeType.includes("word") || mimeType.includes("document")) return "📝";
  if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
  if (mimeType.includes("image")) return "🖼️";
  return "📎";
};

// Move FolderContent outside to prevent recreation
const FolderContent = React.memo<FolderContentProps>(({ 
  folder, 
  canDelete, 
  canEditDescription,
  editingId,
  editingDescription,
  onEditDescription,
  onSaveDescription,
  onCancelEdit,
  onPreview,
  onDownload,
  onDelete,
  onDescriptionChange,
  isUpdating,
  isDownloading,
  isDeleting
}) => {
  const { data: documents = [], isLoading: documentsLoading } = useDocumentsByFolder(folder.id);

  const columns = useMemo(() => [
    {
      title: "Файл",
      dataIndex: "file_name",
      key: "file_name",
      width: 300,
      sorter: (a: DocumentWithAuthor, b: DocumentWithAuthor) => {
        const nameA = a.title || a.original_name || "";
        const nameB = b.title || b.original_name || "";
        return nameA.localeCompare(nameB);
      },
      render: (fileName: string, record: DocumentWithAuthor) => {
        const displayName = record.title || fileName || record.original_name || "Без имени";
        const originalName = record.original_name || fileName || "";
        const showOriginalName = originalName && originalName !== record.title;
        
        return (
          <Space>
            <span style={{ fontSize: 16 }}>
              {getFileIcon(record.mime_type || record.file_type)}
            </span>
            <div>
              <Text strong>{displayName}</Text>
              {showOriginalName && (
                <>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {originalName}
                  </Text>
                </>
              )}
            </div>
          </Space>
        );
      },
    },
    {
      title: "Описание",
      dataIndex: "description",
      key: "description",
      sorter: (a: DocumentWithAuthor, b: DocumentWithAuthor) => {
        const descA = a.description || "";
        const descB = b.description || "";
        return descA.localeCompare(descB);
      },
      render: (description: string, record: DocumentWithAuthor) => {
        if (editingId === record.id) {
          return (
            <div style={{ width: "100%" }}>
              <Input.TextArea
                value={editingDescription}
                onChange={(e) => onDescriptionChange(e.target.value)}
                placeholder="Введите описание..."
                autoSize={{ minRows: 1, maxRows: 3 }}
                style={{ width: "100%", marginBottom: 8 }}
                autoFocus
              />
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <Button
                  size="small"
                  type="primary"
                  onClick={() => onSaveDescription(record.id, editingDescription)}
                  loading={isUpdating}
                >
                  ✓
                </Button>
                <Button
                  size="small"
                  onClick={onCancelEdit}
                >
                  ✕
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div style={{ width: "100%", position: "relative" }}>
            {description ? (
              <Text style={{ width: "100%", display: "block", paddingRight: canEditDescription ? "32px" : "0" }}>
                {description}
              </Text>
            ) : (
              <Text type="secondary" style={{ paddingRight: canEditDescription ? "32px" : "0" }}>—</Text>
            )}
            {canEditDescription && (
              <Tooltip title="Редактировать описание">
                <Button
                  size="small"
                  type="text"
                  icon={<EditOutlined />}
                  onClick={() => onEditDescription(record)}
                  style={{ 
                    position: "absolute", 
                    top: "0", 
                    right: "0", 
                    minWidth: "auto", 
                    padding: "4px" 
                  }}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
    {
      title: "Размер",
      dataIndex: "file_size",
      key: "file_size",
      width: 100,
      sorter: (a: DocumentWithAuthor, b: DocumentWithAuthor) => {
        const sizeA = a.file_size || 0;
        const sizeB = b.file_size || 0;
        return sizeA - sizeB;
      },
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
      sorter: (a: DocumentWithAuthor, b: DocumentWithAuthor) => {
        const authorA = a.authorName || "";
        const authorB = b.authorName || "";
        return authorA.localeCompare(authorB);
      },
      render: (authorName: string) => (
        <Text>{authorName || "—"}</Text>
      ),
    },
    {
      title: "Дата загрузки",
      dataIndex: "created_at",
      key: "created_at",
      width: 120,
      sorter: (a: DocumentWithAuthor, b: DocumentWithAuthor) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateA - dateB;
      },
      defaultSortOrder: "descend",
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
              onClick={() => onPreview(record)}
            />
          </Tooltip>
          
          <Tooltip title="Скачать">
            <Button
              size="small"
              type="text"
              icon={<DownloadOutlined />}
              onClick={() => onDownload(record.storage_path, record.original_name || record.title)}
              loading={isDownloading}
            />
          </Tooltip>
          
          {canDelete && (
            <Popconfirm
              title="Удалить документ?"
              description="Это действие нельзя отменить"
              okText="Да"
              cancelText="Нет"
              onConfirm={() => onDelete(record.id)}
            >
              <Tooltip title="Удалить">
                <Button
                  size="small"
                  type="text"
                  danger
                  icon={<DeleteOutlined />}
                  loading={isDeleting}
                />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ], [
    editingId, 
    editingDescription, 
    canEditDescription, 
    canDelete, 
    onEditDescription, 
    onSaveDescription, 
    onCancelEdit, 
    onPreview, 
    onDownload, 
    onDelete,
    onDescriptionChange,
    isUpdating,
    isDownloading,
    isDeleting
  ]);

  if (documentsLoading) {
    return <div style={{ padding: 16, textAlign: "center" }}>Загрузка документов...</div>;
  }

  if (documents.length === 0) {
    return (
      <div style={{ padding: 16 }}>
        <Empty 
          image={<FileOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
          description="В папке нет документов"
          style={{ margin: 0 }}
        />
      </div>
    );
  }

  return (
    <Table
      columns={columns}
      dataSource={documents}
      rowKey="id"
      pagination={false}
      size="small"
    />
  );
});

FolderContent.displayName = 'FolderContent';

export default function FoldersWithDocuments({ canDelete = false, canEditDescription = false, projectId }: Props) {
  const { data: folders = [], isLoading: foldersLoading } = useDocumentFolders();
  const { data: projects = [] } = useProjects();
  const deleteDocument = useDeleteDocument();
  const downloadDocument = useDownloadDocument();
  const updateDocument = useUpdateDocument();
  
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [previewDocument, setPreviewDocument] = useState<DocumentWithAuthor | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingDescription, setEditingDescription] = useState<string>("");

  // Фильтруем папки по проекту если нужно
  const filteredFolders = projectId 
    ? folders.filter(folder => folder.project_id === projectId || folder.project_id === null)
    : folders;

  const handleDownload = useCallback(async (storagePath: string, fileName: string) => {
    try {
      const url = await downloadDocument.mutateAsync(storagePath);
      
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
      
      URL.revokeObjectURL(objectUrl);
      
    } catch (error) {
      message.error("Ошибка при скачивании файла");
      console.error(error);
    }
  }, [downloadDocument]);

  const handlePreview = useCallback((document: DocumentWithAuthor) => {
    setPreviewDocument(document);
    setShowPreview(true);
  }, []);

  const handleClosePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewDocument(null);
  }, []);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteDocument.mutateAsync(id);
      message.success("Документ удален");
    } catch (error) {
      message.error("Ошибка при удалении документа");
      console.error(error);
    }
  }, [deleteDocument]);

  const handleEditDescription = useCallback((document: DocumentWithAuthor) => {
    setEditingId(document.id);
    setEditingDescription(document.description || "");
  }, []);

  const handleSaveDescription = useCallback(async (id: number, description: string) => {
    try {
      await updateDocument.mutateAsync({ id, description });
      message.success("Описание обновлено");
      setEditingId(null);
      setEditingDescription("");
    } catch (error) {
      message.error("Ошибка при обновлении описания");
      console.error(error);
    }
  }, [updateDocument]);

  const handleCancelEdit = useCallback(() => {
    setEditingId(null);
    setEditingDescription("");
  }, []);

  const handleDescriptionChange = useCallback((value: string) => {
    setEditingDescription(value);
  }, []);

  const renderFolderHeader = useCallback((folder: DocumentFolderWithAuthor) => {
    const project = projects.find(p => p.id === folder.project_id);
    
    return (
      <Space>
        <FolderOutlined style={{ color: "#1890ff" }} />
        <Text strong>{folder.name}</Text>
        {folder.project_id ? (
          <Tag color="blue">
            {project?.name || "—"}
          </Tag>
        ) : (
          <Tag icon={<GlobalOutlined />} color="default">
            Общая
          </Tag>
        )}
        {folder.description && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            — {folder.description}
          </Text>
        )}
      </Space>
    );
  }, [projects]);

  if (filteredFolders.length === 0) {
    return (
      <Card size="small">
        <Empty 
          image={<FolderOutlined style={{ fontSize: 48, color: "#d9d9d9" }} />}
          description="Нет папок с документами"
        />
      </Card>
    );
  }

  return (
    <>
      <Card
        title="Папки с документами"
        size="small"
        loading={foldersLoading}
      >
        <Collapse
          activeKey={activeKeys}
          onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
          size="small"
          items={filteredFolders.map((folder) => ({
            key: folder.id.toString(),
            label: renderFolderHeader(folder),
            children: (
              <FolderContent 
                folder={folder}
                canDelete={canDelete}
                canEditDescription={canEditDescription}
                editingId={editingId}
                editingDescription={editingDescription}
                onEditDescription={handleEditDescription}
                onSaveDescription={handleSaveDescription}
                onCancelEdit={handleCancelEdit}
                onPreview={handlePreview}
                onDownload={handleDownload}
                onDelete={handleDelete}
                onDescriptionChange={handleDescriptionChange}
                isUpdating={updateDocument.isPending}
                isDownloading={downloadDocument.isPending}
                isDeleting={deleteDocument.isPending}
              />
            )
          }))}
        />
      </Card>

      <DocumentPreviewModal
        open={showPreview}
        document={previewDocument}
        onClose={handleClosePreview}
      />
    </>
  );
}